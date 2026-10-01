//! LocalDock — Tauri shell.
//!
//! One crate, two shells:
//!   * Desktop (Windows): spawns/monitors the bundled LocalDock server,
//!     owns the system tray, autostart sync, firewall rules and mDNS
//!     presence, and navigates the webview onto the product UI.
//!   * Mobile (Android): a serverless companion. The host PC remains the
//!     server — the app discovers LocalDock hosts on the LAN, claims
//!     pairing codes and opens the host UI in the webview.
//!
//! Shared: LAN discovery (`discovery`) + mDNS helpers (`mdns`).

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;
#[cfg(desktop)]
mod server;

mod discovery;
mod mdns;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(desktop)]
    desktop::run();
    #[cfg(mobile)]
    mobile::run();
}
