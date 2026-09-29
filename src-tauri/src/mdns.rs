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

use mdns_sd::{ServiceDaemon, ServiceInfo};
use std::collections::HashMap;

const SERVICE_TYPE: &str = "_localdock._tcp.local.";
const HOSTNAME: &str = "localdock.local.";

pub struct MdnsHandle {
    daemon: ServiceDaemon,
    /// Fully-qualified instance name needed for unregistration.
    fqdn: String,
}

/// Keep the mDNS instance name conservative: letters, digits, dashes.
fn safe_instance(name: &str) -> String {
    let clean: String = name
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '-' || c == ' ' { c } else { '-' })
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

    Ok(MdnsHandle { daemon, fqdn: instance })
}

impl MdnsHandle {
    /// Stop advertising. Never panics; shutdown must always stay quiet.
    pub fn stop(&mut self) {
        let _ = self.daemon.unregister(&self.fqdn);
        // Give the daemon a moment to send the goodbye packet.
        std::thread::sleep(std::time::Duration::from_millis(150));
        let _ = self.daemon.shutdown();
    }
}
