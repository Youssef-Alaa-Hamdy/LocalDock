//! LocalDock — Windows desktop shell (Tauri v2).
//!
//! Responsibilities (and nothing more — the product logic lives in the
//! bundled Node server, so the shell stays small and boring on purpose):
//!   * Spawn/monitor the bundled LocalDock server on a free loopback port.
//!   * Navigate the webview from the branded loading page to the product.
//!   * System tray: open, open-in-browser, Start with Windows, Quit.
//!   * Closing the window hides to tray; the server keeps serving devices.
//!   * "Start with Windows" via the OS autostart entry, kept in sync with
//!     the product settings file (`%APPDATA%/LocalDock/data/settings.json`).
//!   * mDNS presence on the LAN (`_localdock._tcp` + `localdock.local`).
//!   * Native folder picker is exposed to the UI through plugin-dialog.

mod mdns;
mod server;

use std::sync::atomic::{AtomicU16, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, RunEvent, State, WindowEvent};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_opener::OpenerExt;

use mdns::MdnsHandle;
use server::ServerHandle;

/// Shared shell state.
struct ShellState {
    server: Mutex<Option<ServerHandle>>,
    mdns: Mutex<Option<MdnsHandle>>,
    port: AtomicU16,
}

impl ShellState {
    fn new() -> Self {
        Self {
            server: Mutex::new(None),
            mdns: Mutex::new(None),
            port: AtomicU16::new(0),
        }
    }
}

/* ------------------------- settings file access ------------------------- */

/// Patch one field of the product settings file. Creates a minimal file when
/// absent — the server merges it into its defaults on first run.
fn patch_settings_bool(field: &str, value: bool) {
    let dir = server::data_home().join("data");
    let file = dir.join("settings.json");
    let mut json: serde_json::Value = std::fs::read(&file)
        .ok()
        .and_then(|raw| serde_json::from_slice(&raw).ok())
        .unwrap_or_else(|| serde_json::json!({}));
    json[field] = serde_json::Value::Bool(value);
    let _ = std::fs::create_dir_all(&dir);
    let tmp = file.with_extension("json.shell-tmp");
    if std::fs::write(&tmp, serde_json::to_vec_pretty(&json).unwrap_or_default()).is_ok() {
        let _ = std::fs::rename(&tmp, &file);
    }
}

fn autostart_enabled(app: &AppHandle) -> bool {
    app.autolaunch().is_enabled().unwrap_or(false)
}

/* ------------------------------- tray ---------------------------------- */

fn build_tray_menu(
    app: &AppHandle,
    autostart_checked: bool,
) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let open = MenuItem::with_id(app, "open", "Open LocalDock", true, None::<&str>)?;
    let browser = MenuItem::with_id(app, "browser", "Open in Browser", true, None::<&str>)?;
    let announce = MenuItem::with_id(app, "announce", "Re-announce on Network", true, None::<&str>)?;
    let autostart = CheckMenuItem::with_id(
        app,
        "autostart",
        "Start with Windows",
        true,
        autostart_checked,
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app, "quit", "Quit LocalDock", true, None::<&str>)?;
    Menu::with_items(
        app,
        &[
            &open,
            &browser,
            &announce,
            &PredefinedMenuItem::separator(app)?,
            &autostart,
            &PredefinedMenuItem::separator(app)?,
            &quit,
        ],
    )
}

fn build_tray(app: &AppHandle) -> Result<(), tauri::Error> {
    let menu = build_tray_menu(app, autostart_enabled(app))?;
    TrayIconBuilder::with_id("localdock-tray")
        .icon(app.default_window_icon().expect("window icon").clone())
        .tooltip("LocalDock — Your Personal Local Cloud")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main(app),
            "browser" => open_in_default_browser(app),
            "announce" => {
                let state = app.state::<ShellState>();
                let port = state.port.load(Ordering::SeqCst);
                restart_mdns(app, port);
            }
            "autostart" => {
                let enable = !autostart_enabled(app);
                apply_autostart(app, enable);
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

/// Rebuild the tray menu so the "Start with Windows" checkbox stays truthful.
fn refresh_tray_menu(app: &AppHandle) {
    if let Some(tray) = app.tray_by_id("localdock-tray") {
        if let Ok(menu) = build_tray_menu(app, autostart_enabled(app)) {
            let _ = tray.set_menu(Some(menu));
        }
    }
}

fn apply_autostart(app: &AppHandle, enabled: bool) {
    let autolaunch = app.autolaunch();
    let result = if enabled {
        autolaunch.enable()
    } else {
        autolaunch.disable()
    };
    if result.is_ok() {
        patch_settings_bool("startWithWindows", enabled);
        refresh_tray_menu(app);
    } else {
        eprintln!("localdock: failed to update autostart entry");
    }
}

fn open_in_default_browser(app: &AppHandle) {
    let port = app.state::<ShellState>().port.load(Ordering::SeqCst);
    let url = format!("http://127.0.0.1:{port}");
    if let Err(e) = app.opener().open_url(url, None::<&str>) {
        eprintln!("localdock: open browser failed: {e}");
    }
}

/* ------------------------------ window --------------------------------- */

fn show_main(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
    }
}

/// Point the webview at the freshly booted bundled server.
fn navigate_main(app: &AppHandle, port: u16) {
    let deadline = std::time::Instant::now() + Duration::from_secs(10);
    loop {
        if let Some(win) = app.get_webview_window("main") {
            let js = format!("window.location.replace('http://127.0.0.1:{port}/')");
            if win.eval(&js).is_ok() {
                return;
            }
        }
        if std::time::Instant::now() > deadline {
            eprintln!("localdock: main window not found for navigation");
            return;
        }
        std::thread::sleep(Duration::from_millis(200));
    }
}

/* ------------------------------- mDNS ---------------------------------- */

fn restart_mdns(app: &AppHandle, port: u16) {
    let state = app.state::<ShellState>();
    if let Some(mut handle) = state.mdns.lock().unwrap().take() {
        handle.stop();
    }
    if port == 0 {
        return;
    }
    let name = server::server_name();
    match mdns::advertise(&name, port) {
        Ok(handle) => {
            *state.mdns.lock().unwrap() = Some(handle);
        }
        Err(e) => eprintln!("localdock: mdns unavailable ({e}) — IP links still work"),
    }
}

/* ------------------------------ commands ------------------------------- */

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopStatus {
    port: u16,
    url: String,
    lan_urls: Vec<String>,
    server_pid: Option<u32>,
    mdns_on: bool,
    start_with_windows: bool,
}

#[tauri::command]
fn desktop_status(app: AppHandle, state: State<ShellState>) -> Result<DesktopStatus, String> {
    let port = state.port.load(Ordering::SeqCst);
    let server_pid = state
        .server
        .lock()
        .unwrap()
        .as_ref()
        .map(|s| s.child.id());
    let mdns_on = state.mdns.lock().unwrap().is_some();
    let lan_urls = server::lan_ips()
        .into_iter()
        .map(|ip| format!("http://{ip}:{port}"))
        .collect();
    Ok(DesktopStatus {
        port,
        url: format!("http://127.0.0.1:{port}"),
        lan_urls,
        server_pid,
        mdns_on,
        start_with_windows: autostart_enabled(&app),
    })
}

#[tauri::command]
fn set_start_with_windows(enabled: bool, app: AppHandle) -> Result<bool, String> {
    apply_autostart(&app, enabled);
    Ok(enabled)
}

#[tauri::command]
fn open_in_browser(app: AppHandle) -> Result<bool, String> {
    open_in_default_browser(&app);
    Ok(true)
}

#[tauri::command]
fn announce_mdns(app: AppHandle) -> Result<bool, String> {
    let port = app.state::<ShellState>().port.load(Ordering::SeqCst);
    restart_mdns(&app, port);
    Ok(true)
}

/* -------------------------------- run ---------------------------------- */

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // Second launch: bring the running app to the front.
            show_main(app);
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(ShellState::new())
        .setup(|app| {
            // Converge the OS autostart entry with the user's saved pref.
            match server::start_with_windows_pref() {
                Some(true) => {
                    let _ = app.autolaunch().enable();
                }
                Some(false) => {
                    let _ = app.autolaunch().disable();
                }
                None => {}
            }

            build_tray(app.handle())?;

            if cfg!(debug_assertions) {
                // `tauri dev`: the Next dev server (beforeDevCommand) IS the server.
                let port = std::env::var("LOCALDOCK_PORT")
                    .ok()
                    .and_then(|p| p.parse::<u16>().ok())
                    .unwrap_or(3000);
                app.state::<ShellState>().port.store(port, Ordering::SeqCst);
                restart_mdns(app.handle(), port);
            } else {
                // Release: boot the bundled server in the background, then
                // move the webview from the loading page onto the product.
                let handle = app.handle().clone();
                std::thread::spawn(move || {
                    match server::spawn_server() {
                        Ok(srv) => {
                            let port = srv.port;
                            let state = handle.state::<ShellState>();
                            state.port.store(port, Ordering::SeqCst);
                            *state.server.lock().unwrap() = Some(srv);
                            drop(state);

                            if server::wait_healthy(port, Duration::from_secs(45)) {
                                navigate_main(&handle, port);
                                restart_mdns(&handle, port);
                            } else {
                                eprintln!("localdock: bundled server did not become healthy");
                                if let Some(win) = handle.get_webview_window("main") {
                                    let _ = win.eval(
                                        "var s=document.querySelector('.sub'); if(s){s.textContent='The LocalDock server failed to start. Restart the app from the tray icon.';}",
                                    );
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("localdock: {e}");
                        }
                    }
                });
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // UX contract: closing the window hides to tray, the server
                // keeps serving paired devices. Quit lives in the tray menu.
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            desktop_status,
            set_start_with_windows,
            open_in_browser,
            announce_mdns,
        ])
        .build(tauri::generate_context!())
        .expect("error while building LocalDock")
        .run(|app, event| {
            if let RunEvent::ExitRequested { .. } = event {
                // Full quit (tray menu): stop advertising, stop the server.
                let state = app.state::<ShellState>();
                if let Some(mut handle) = state.mdns.lock().unwrap().take() {
                    handle.stop();
                };
                if let Some(mut srv) = state.server.lock().unwrap().take() {
                    srv.kill();
                };
            }
        });
}
