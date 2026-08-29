//! MagicTools Tauri 2 主进程 (替代原 Electron main 进程)
//!
//! 原 Electron 功能迁移对照:
//! - `src/main/main.ts` 窗口创建/关闭隐藏 -> `tauri.conf.json` windows + `on_window_event`
//! - `src/main/tray.ts` 托盘图标/菜单   -> `TrayIconBuilder` + `Menu`
//! - `src/main/ipc` 打开默认浏览器       -> `tauri-plugin-opener` (前端 `@tauri-apps/plugin-opener`)
//! - `src/main/menu.ts` 应用菜单         -> 保持默认(无菜单栏), 与 Electron 行为一致
//! - `electron-updater` 自动更新         -> 见 README (需配置 tauri-plugin-updater 与签名)

use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Listener, Manager, WindowEvent,
};

/// 用系统默认浏览器打开项目主页
fn open_github() {
    let _ = tauri_plugin_opener::open_url(
        "https://github.com/freewu/magic-tools",
        None::<String>,
    );
}

/// 展示主窗口并聚焦 (托盘「展示窗口」菜单项与左键单击共用)
fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// 同步托盘菜单中三个显示模式(浅色/深色/系统跟随)的勾选状态
fn set_theme_check(
    light: &CheckMenuItem<tauri::Wry>,
    dark: &CheckMenuItem<tauri::Wry>,
    system: &CheckMenuItem<tauri::Wry>,
    mode: &str,
) {
    let _ = light.set_checked(mode == "light");
    let _ = dark.set_checked(mode == "dark");
    let _ = system.set_checked(mode == "system");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 打开外部链接插件 (对应原 ipcMain 'open-url')
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let version = app.package_info().version.to_string();

            // 托盘菜单: [展示窗口, 显示模式▸, MagicTools V{version}, 退出]
            let show_item =
                MenuItem::with_id(app, "show", "展示窗口", true, None::<&str>)?;
            let about_item = MenuItem::with_id(
                app,
                "about",
                format!("MagicTools V{version}"),
                true,
                None::<&str>,
            )?;
            let quit_item =
                MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

            // 显示模式子菜单: 浅色 / 深色 / 系统跟随 (单选勾选, 默认系统跟随)
            let light_item = CheckMenuItem::with_id(
                app,
                "theme-light",
                "浅色",
                true,
                false,
                None::<&str>,
            )?;
            let dark_item = CheckMenuItem::with_id(
                app,
                "theme-dark",
                "深色",
                true,
                false,
                None::<&str>,
            )?;
            let system_item = CheckMenuItem::with_id(
                app,
                "theme-system",
                "系统跟随",
                true,
                true,
                None::<&str>,
            )?;
            let theme_submenu = Submenu::with_items(
                app,
                "显示模式",
                true,
                &[&light_item, &dark_item, &system_item],
            )?;

            let menu = Menu::with_items(
                app,
                &[&show_item, &theme_submenu, &about_item, &quit_item],
            )?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("MagicTools")
                .menu(&menu)
                // 左键点击显示窗口, 右键弹出菜单 (与 Electron 行为一致)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "about" => open_github(),
                    "show" => show_main_window(app),
                    // 托盘切换显示模式: 广播给前端应用主题
                    "theme-light" | "theme-dark" | "theme-system" => {
                        let mode = match event.id.as_ref() {
                            "theme-light" => "light",
                            "theme-dark" => "dark",
                            _ => "system",
                        };
                        let _ = app.emit("theme-mode-set", mode);
                    }
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
                        show_main_window(app);
                    }
                })
                .build(app)?;

            // 监听前端(设置页)修改显示模式, 同步托盘菜单勾选状态
            let light_handle = light_item.clone();
            let dark_handle = dark_item.clone();
            let system_handle = system_item.clone();
            app.listen("theme-mode-changed", move |event| {
                if let Ok(mode) = serde_json::from_str::<String>(event.payload()) {
                    set_theme_check(&light_handle, &dark_handle, &system_handle, &mode);
                }
            });

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
