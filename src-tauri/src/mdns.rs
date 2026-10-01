//! LocalDock — network presence (mDNS).
//!
//! The shell advertises two things on the local network:
//!  1. A service: `_localdock._tcp.local.` — so native clients (the planned
//!     Android app, any mDNS browser) can discover this server without an IP.
//!  2. The hostname `localdock.local.` — resolvable from devices whose OS
//!     resolves `.local` names (iOS, macOS, most Linux). Browsers without
//!     mDNS resolution (e.g. Android Chrome) keep working through the IP
//!     URLs shown in the UI and encoded in every QR code.
//!
//! All records are advertised ONLY on the local network — LocalDock never
//! opens a path to the internet.

#[cfg(desktop)]
use mdns_sd::ServiceInfo;
use mdns_sd::{ServiceDaemon, ServiceEvent};
#[cfg(desktop)]
use std::collections::HashMap;
use std::net::IpAddr;
use std::time::{Duration, Instant};

const SERVICE_TYPE: &str = "_localdock._tcp.local.";

#[cfg(desktop)]
const HOSTNAME: &str = "localdock.local.";

#[cfg(desktop)]
pub struct MdnsHandle {
    daemon: ServiceDaemon,
    /// Fully-qualified instance name needed for unregistration.
    fqdn: String,
}

/// Keep the mDNS instance name conservative: letters, digits, dashes.
#[cfg(desktop)]
fn safe_instance(name: &str) -> String {
    let clean: String = name
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == ' ' {
                c
            } else {
                '-'
            }
        })
        .collect::<String>()
        .replace(' ', "-")
        .trim_matches('-')
        .to_string();
    if clean.is_empty() {
        "LocalDock".to_string()
    } else {
        clean
    }
}

/// Start advertising this server on the LAN.
#[cfg(desktop)]
pub fn advertise(server_name: &str, port: u16) -> Result<MdnsHandle, String> {
    let daemon = ServiceDaemon::new().map_err(|e| format!("mdns daemon: {e}"))?;

    let instance = format!("{}.{}", safe_instance(server_name), SERVICE_TYPE);
    let mut props = HashMap::new();
    props.insert("app".to_string(), "localdock".to_string());
    props.insert("name".to_string(), server_name.to_string());
    props.insert("path".to_string(), "/".to_string());
    // Empty IP + enable_addr_auto: the responder announces every interface.
    let info = ServiceInfo::new(SERVICE_TYPE, &instance, HOSTNAME, "", port, Some(props))
        .map_err(|e| format!("mdns service info: {e}"))?
        .enable_addr_auto();

    daemon
        .register(info)
        .map_err(|e| format!("mdns register: {e}"))?;

    Ok(MdnsHandle {
        daemon,
        fqdn: instance,
    })
}

#[cfg(desktop)]
impl MdnsHandle {
    /// Stop advertising. Never panics; shutdown must always stay quiet.
    pub fn stop(&mut self) {
        let _ = self.daemon.unregister(&self.fqdn);
        // Give the daemon a moment to send the goodbye packet.
        std::thread::sleep(std::time::Duration::from_millis(150));
        let _ = self.daemon.shutdown();
    }
}

/// Browse the network for LocalDock servers for up to `timeout`.
///
/// Used by the Android companion (`discovery`). Multicast reception may be
/// silently blocked on some Android Wi-Fi stacks (a native app cannot
/// easily hold a MulticastLock), so callers must treat an empty result as
/// "unknown" — never as "definitely no servers". The TCP sweep in
/// `discovery` is the authoritative fallback.
#[allow(dead_code)]
pub fn browse(timeout: Duration) -> Vec<(IpAddr, u16, String)> {
    let Ok(daemon) = ServiceDaemon::new() else {
        return Vec::new();
    };
    let Ok(receiver) = daemon.browse(SERVICE_TYPE) else {
        let _ = daemon.shutdown();
        return Vec::new();
    };

    let deadline = Instant::now() + timeout;
    let mut out: Vec<(IpAddr, u16, String)> = Vec::new();
    loop {
        let now = Instant::now();
        if now >= deadline {
            break;
        }
        match receiver.recv_timeout(deadline - now) {
            Ok(ServiceEvent::ServiceResolved(info)) => {
                let name = info
                    .get_property_val_str("name")
                    .unwrap_or("LocalDock")
                    .to_string();
                let port = info.get_port();
                for ip in info.get_addresses() {
                    out.push((*ip, port, name.clone()));
                }
            }
            Ok(_) => {}
            Err(_) => break,
        }
    }

    let _ = daemon.shutdown();
    out
}
