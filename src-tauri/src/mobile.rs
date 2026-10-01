//! LocalDock — Android companion shell.
//!
//! The host PC keeps running the real LocalDock server; this shell is a
//! thin, serverless launcher around it:
//!   * The bundled launcher UI (src-mobile) is the app frontend.
//!   * LAN host discovery + host probing are exposed as Tauri commands.
//!   * "Connect" simply navigates the webview to the host UI, where the
//!     normal web pairing flow (`?pair=CODE`) stores a device token in the
//!     webview's localStorage — from then on the app IS a paired device
//!     of that server, exactly like any browser on the network.
//!
//! No tray, no autostart, no bundled Node server, no firewall work — none
//! of that makes sense on a phone. The desktop-only plugins are not
//! compiled for mobile targets (see Cargo.toml).

use crate::discovery;

#[tauri::command]
pub async fn navigate_to(webview_window: tauri::WebviewWindow, url: String) -> Result<(), String> {
    let parsed: tauri::Url = url.parse().map_err(|e| format!("{e}"))?;
    webview_window.navigate(parsed).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            discovery::discover_hosts,
            discovery::probe_host,
            navigate_to,
        ])
        .run(tauri::generate_context!())
        .expect("error while running the LocalDock Android app");
}
