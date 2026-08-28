//! MagicTools Tauri 2 主进程 (替代原 Electron main 进程)
//!
//! 原 Electron 功能迁移对照:
//! - `src/main/main.ts` 窗口创建/关闭隐藏 -> `tauri.conf.json` windows + `on_window_event`
//! - `src/main/tray.ts` 托盘图标/菜单   -> `TrayIconBuilder` + `Menu`
//! - `src/main/ipc` 打开默认浏览器       -> `tauri-plugin-opener` (前端 `@tauri-apps/plugin-opener`)
//! - `src/main/menu.ts` 应用菜单         -> 保持默认(无菜单栏), 与 Electron 行为一致
//! - `electron-updater` 自动更新         -> 见 README (需配置 tauri-plugin-updater 与签名)

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

/// 用系统默认浏览器打开项目主页
fn open_github() {
    let _ = tauri_plugin_opener::open_url(
        "https://github.com/freewu/magic-tools",
        None::<String>,
    );
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 打开外部链接插件 (对应原 ipcMain 'open-url')
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 对应原托盘菜单: [退出, MagicTools V{version}]
            let version = app.package_info().version.to_string();

            let quit_item =
                MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let about_item = MenuItem::with_id(
                app,
                "about",
                format!("MagicTools V{version}"),
                true,
                None::<&str>,
            )?;
            let menu = Menu::with_items(app, &[&about_item, &quit_item])?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("MagicTools")
                .menu(&menu)
                // 左键点击显示窗口, 右键弹出菜单 (与 Electron 行为一致)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "about" => open_github(),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        // 关闭按钮 -> 隐藏到托盘 (对应 Electron mainWindow close -> hide)
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
