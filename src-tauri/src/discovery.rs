//! LocalDock — LAN host discovery for companion clients.
//!
//! The commands here power the Android launcher. Discovery is a union of
//! two independent, deliberately redundant strategies (deduped, then every
//! candidate verified with a real HTTP request):
//!
//!   1. **mDNS** browse of `_localdock._tcp.local.` — the service the
//!      desktop shell advertises. Instant and zero-traffic, but Android
//!      Wi-Fi stacks may silently drop multicast (no MulticastLock from
//!      native code), so it is never the only source.
//!   2. **TCP subnet sweep** — plain unicast `connect()` probes of the
//!      device's own /24 subnet(s) on the LocalDock port. Works on every
//!      Android device with ordinary INTERNET permissions. Each open port
//!      is verified against `GET /api/bootstrap` and matched on the
//!      LocalDock response signature (`serverId` + `serverName`).
//!
//! Manual entry and pairing codes are handled in the launcher UI on top
//! of `probe_host`.

// The Android shell registers these commands; the desktop shell keeps the
// module compiled (shared code stays exercised by one code path only) but
// never calls into it.
#![allow(dead_code)]

use std::collections::BTreeMap;
use std::io::{Read, Write};
use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpStream, ToSocketAddrs, UdpSocket};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};

use serde::Serialize;

/// The LAN port the desktop server prefers (`find_free_port(3000)` — it may
/// drift higher when busy, mDNS still finds those; the sweep covers the
/// common case).
const LAN_PORT: u16 = 3000;
/// Per-probe TCP budget. Wide enough for Wi-Fi, short enough for a sweep.
const CONNECT_TIMEOUT: Duration = Duration::from_millis(350);
/// Parallel sweep workers. 96 × 350 ms covers a /24 in well under 2 s.
const SWEEP_WORKERS: usize = 96;
/// Safety cap for one HTTP response body.
const MAX_BODY: usize = 256 * 1024;

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredHost {
    /// Ready-to-open origin, e.g. `http://192.168.1.3:3000`.
    pub base_url: String,
    pub host: String,
    pub port: u16,
    /// `serverName` from the host's bootstrap response.
    pub name: String,
    pub version: Option<String>,
    /// `"mdns"` or `"network-scan"` — surfaced in the UI as a badge.
    pub source: String,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveryResult {
    /// Human-readable subnet that was swept, e.g. `192.168.1.0/24`.
    pub subnet: Option<String>,
    /// False when the device has no routable LAN address (mobile data).
    pub scanned: bool,
    pub hosts: Vec<DiscoveredHost>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProbeResult {
    pub reachable: bool,
    pub name: Option<String>,
    pub server_id: Option<String>,
    pub version: Option<String>,
}

/* ------------------------------ commands -------------------------------- */

/// Discover LocalDock hosts on the LAN. Runs entirely off the UI thread.
#[tauri::command]
pub async fn discover_hosts(timeout_ms: Option<u64>) -> Result<DiscoveryResult, String> {
    let timeout = Duration::from_millis(timeout_ms.unwrap_or(4500).clamp(1500, 15_000));
    tauri::async_runtime::spawn_blocking(move || discover_blocking(timeout))
        .await
        .map_err(|e| format!("discovery task failed: {e}"))
}

/// Verify one host (`http://host[:port]`) is a live LocalDock server.
/// Used for manual entries and to refresh saved hosts.
#[tauri::command]
pub async fn probe_host(base_url: String) -> Result<ProbeResult, String> {
    tauri::async_runtime::spawn_blocking(move || probe_blocking(&base_url))
        .await
        .map_err(|e| format!("probe task failed: {e}"))?
}

/* ------------------------------ pipeline -------------------------------- */

fn discover_blocking(timeout: Duration) -> DiscoveryResult {
    let locals = local_ipv4_addrs();
    let subnet = locals.first().map(|v4| {
        let [a, b, c, _] = v4.octets();
        format!("{a}.{b}.{c}.0/24")
    });

    // 1) mDNS fast path — short budget; may legally return nothing.
    let mdns_budget = Duration::from_millis(timeout.as_millis().min(1_800) as u64);
    let mdns_hits = crate::mdns::browse(mdns_budget);

    // 2) TCP sweep of every /24 we have a route into.
    let mut open: Vec<(IpAddr, u16)> = Vec::new();
    let scanned = !locals.is_empty();
    if scanned {
        let subnets: Vec<Vec<Ipv4Addr>> = locals.iter().map(|v4| subnet_hosts(*v4)).collect();
        for ip in sweep(&subnets, LAN_PORT) {
            open.push((IpAddr::V4(ip), LAN_PORT));
        }
    }

    // Merge candidates (mDNS labels survive as fallback display names).
    let mut candidates: BTreeMap<(IpAddr, u16), Option<String>> = BTreeMap::new();
    for (ip, port, name) in mdns_hits {
        candidates.entry((ip, port)).or_insert(Some(name));
    }
    for (ip, port) in open {
        candidates.entry((ip, port)).or_insert(None);
    }

    // Verify every candidate with a real bootstrap request.
    let mut hosts = Vec::new();
    for ((ip, port), label) in candidates {
        let source = if label.is_some() {
            "mdns"
        } else {
            "network-scan"
        };
        if let Some(host) = verify_host(ip, port, source, label) {
            hosts.push(host);
        }
    }
    hosts.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    DiscoveryResult {
        subnet,
        scanned,
        hosts,
    }
}

fn probe_blocking(base_url: &str) -> Result<ProbeResult, String> {
    let (host, port) = parse_host_port(base_url)?;
    let addrs: Vec<SocketAddr> = format!("{host}:{port}")
        .to_socket_addrs()
        .map_err(|e| format!("cannot resolve {host}: {e}"))?
        .collect();
    for addr in addrs {
        if let Some(body) = http_get(addr, "/api/bootstrap", Duration::from_millis(1500)) {
            if let Some((id, name, version)) = parse_bootstrap(&body) {
                return Ok(ProbeResult {
                    reachable: true,
                    name: Some(name),
                    server_id: Some(id),
                    version,
                });
            }
        }
    }
    Ok(ProbeResult {
        reachable: false,
        name: None,
        server_id: None,
        version: None,
    })
}

/// One HTTP GET + signature check = a verified LocalDock host.
fn verify_host(
    ip: IpAddr,
    port: u16,
    source: &str,
    fallback_name: Option<String>,
) -> Option<DiscoveredHost> {
    let addr = SocketAddr::new(ip, port);
    let body = http_get(addr, "/api/bootstrap", Duration::from_millis(1200))?;
    let (_, name, version) = parse_bootstrap(&body)?;
    let name = if name.is_empty() {
        fallback_name.unwrap_or_else(|| "LocalDock".to_string())
    } else {
        name
    };
    Some(DiscoveredHost {
        base_url: format!("http://{ip}:{port}"),
        host: ip.to_string(),
        port,
        name,
        version,
        source: source.to_string(),
    })
}

/* --------------------------- network plumbing --------------------------- */

/// Best-effort local IPv4 addresses, one per routed interface, via the
/// connect-and-read-local-addr trick: no packet is ever sent and nothing
/// beyond a plain UDP socket is required (works identically on Android).
fn local_ipv4_addrs() -> Vec<Ipv4Addr> {
    let mut out = Vec::new();
    if let Ok(sock) = UdpSocket::bind("0.0.0.0:0") {
        for probe in [
            "8.8.8.8:80",
            "1.1.1.1:53",
            "192.168.255.255:9",
            "10.255.255.255:9",
            "172.16.255.255:9",
        ] {
            let Ok(target) = probe.parse::<SocketAddr>() else {
                continue;
            };
            if sock.connect(target).is_ok() {
                if let Ok(addr) = sock.local_addr() {
                    if let IpAddr::V4(v4) = addr.ip() {
                        if !v4.is_loopback() && !out.contains(&v4) {
                            out.push(v4);
                        }
                    }
                }
            }
        }
    }
    out
}

/// All 254 host addresses of the /24 the given address lives in.
fn subnet_hosts(v4: Ipv4Addr) -> Vec<Ipv4Addr> {
    let [a, b, c, _] = v4.octets();
    (1..=254).map(|n| Ipv4Addr::new(a, b, c, n)).collect()
}

/// Parallel TCP connect sweep. Returns the addresses that accepted a
/// connection within `CONNECT_TIMEOUT`.
fn sweep(subnets: &[Vec<Ipv4Addr>], port: u16) -> Vec<Ipv4Addr> {
    let mut targets: Vec<SocketAddr> = subnets
        .iter()
        .flatten()
        .map(|ip| SocketAddr::from((*ip, port)))
        .collect();
    targets.sort();
    targets.dedup();
    if targets.is_empty() {
        return Vec::new();
    }

    let (tx, rx) = mpsc::channel();
    let chunk_size = targets.len().div_ceil(SWEEP_WORKERS).max(1);
    let mut handles = Vec::new();
    for chunk in targets.chunks(chunk_size) {
        let chunk = chunk.to_vec();
        let tx = tx.clone();
        handles.push(thread::spawn(move || {
            for addr in &chunk {
                if TcpStream::connect_timeout(addr, CONNECT_TIMEOUT).is_ok() {
                    if let IpAddr::V4(v4) = addr.ip() {
                        let _ = tx.send(v4);
                    }
                }
            }
        }));
    }
    drop(tx);

    let mut open = Vec::new();
    for ip in rx {
        open.push(ip);
    }
    for handle in handles {
        let _ = handle.join();
    }
    open
}

/// Minimal blocking HTTP/1.0 GET. Requesting HTTP/1.0 keeps Node from
/// using chunked transfer encoding, so the body is close-delimited and
/// can be read without a transfer-decoding state machine.
fn http_get(addr: SocketAddr, path: &str, timeout: Duration) -> Option<String> {
    let mut stream = TcpStream::connect_timeout(&addr, timeout).ok()?;
    stream.set_read_timeout(Some(timeout)).ok()?;
    stream.set_write_timeout(Some(timeout)).ok()?;
    let request = format!(
        "GET {path} HTTP/1.0\r\nHost: {}\r\nUser-Agent: LocalDock-Discovery/1\r\nAccept: application/json\r\nConnection: close\r\n\r\n",
        addr
    );
    stream.write_all(request.as_bytes()).ok()?;

    let mut raw = Vec::with_capacity(4096);
    let mut buf = [0u8; 4096];
    let deadline = Instant::now() + timeout * 2;
    while raw.len() < MAX_BODY {
        if Instant::now() >= deadline {
            break;
        }
        match stream.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => raw.extend_from_slice(&buf[..n]),
            Err(_) => break,
        }
    }

    let text = String::from_utf8_lossy(&raw);
    let mut parts = text.splitn(2, "\r\n\r\n");
    let head = parts.next().unwrap_or("");
    let body = parts.next().unwrap_or("");
    let status_ok = head.starts_with("HTTP/1.0 200") || head.starts_with("HTTP/1.1 200");
    if !status_ok {
        return None;
    }
    Some(body.trim_end_matches('\0').to_string())
}

/// LocalDock signature: `/api/bootstrap` answers JSON carrying
/// `serverId` + `serverName`. Anything else is not a LocalDock server.
fn parse_bootstrap(body: &str) -> Option<(String, String, Option<String>)> {
    let value: serde_json::Value = serde_json::from_str(body.trim()).ok()?;
    let id = value.get("serverId").and_then(|v| v.as_str())?.to_string();
    let name = value
        .get("serverName")
        .and_then(|v| v.as_str())?
        .to_string();
    let version = value
        .get("version")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    Some((id, name, version))
}

/// Parse `http://host[:port]` (and bare `host[:port]`) into components.
/// IPv4 literals and LAN hostnames are the target input; IPv6 literals
/// are deliberately out of scope for the launcher.
fn parse_host_port(raw: &str) -> Result<(String, u16), String> {
    let trimmed = raw.trim();
    let rest = if let Some(r) = trimmed.strip_prefix("http://") {
        r
    } else if trimmed.starts_with("https://") {
        return Err("LocalDock servers are plain HTTP on the LAN — drop the https://".into());
    } else {
        trimmed
    };
    let hostport = rest.trim_matches('/').split('/').next().unwrap_or(rest);
    if hostport.is_empty() {
        return Err("missing host".into());
    }
    let (host, port) = match hostport.rsplit_once(':') {
        Some((h, p)) if !p.is_empty() && p.chars().all(|c| c.is_ascii_digit()) => (
            h.to_string(),
            p.parse::<u16>()
                .map_err(|_| "port out of range".to_string())?,
        ),
        _ => (hostport.to_string(), LAN_PORT),
    };
    if host.is_empty() {
        return Err("missing host".into());
    }
    Ok((host, port))
}
