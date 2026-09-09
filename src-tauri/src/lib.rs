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

mod web_fetch;

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

/// 同步托盘菜单中三个界面语言(简体中文/繁體中文/English)的勾选状态
fn set_locale_check(
    zh_cn: &CheckMenuItem<tauri::Wry>,
    zh_tw: &CheckMenuItem<tauri::Wry>,
    en: &CheckMenuItem<tauri::Wry>,
    locale: &str,
) {
    let _ = zh_cn.set_checked(locale == "zh-CN");
    let _ = zh_tw.set_checked(locale == "zh-TW");
    let _ = en.set_checked(locale == "en");
}

/// 托盘菜单三语文案 (zh-CN 与构建时默认字符串保持一致)
struct TrayTexts {
    show: &'static str,
    setting: &'static str,
    help: &'static str,
    appstore: &'static str,
    theme: &'static str,
    light: &'static str,
    dark: &'static str,
    system: &'static str,
    locale: &'static str,
    quit: &'static str,
}

impl TrayTexts {
    fn for_locale(locale: &str) -> Self {
        match locale {
            "zh-TW" => Self {
                show: "顯示視窗",
                setting: "設定",
                help: "說明",
                appstore: "應用列表",
                theme: "顯示模式",
                light: "淺色",
                dark: "深色",
                system: "跟隨系統",
                locale: "語言",
                quit: "退出",
            },
            "en" => Self {
                show: "Show Window",
                setting: "Settings",
                help: "Help",
                appstore: "App List",
                theme: "Theme",
                light: "Light",
                dark: "Dark",
                system: "System",
                locale: "Language",
                quit: "Quit",
            },
            _ => Self {
                show: "展示窗口",
                setting: "设置",
                help: "帮助",
                appstore: "应用列表",
                theme: "显示模式",
                light: "浅色",
                dark: "深色",
                system: "系统跟随",
                locale: "语言",
                quit: "退出",
            },
        }
    }
}

/// 按当前界面语言重设托盘菜单全部文案, 并同步「语言」子菜单勾选状态
#[allow(clippy::too_many_arguments)]
fn apply_tray_locale(
    locale: &str,
    show_item: &MenuItem<tauri::Wry>,
    setting_item: &MenuItem<tauri::Wry>,
    help_item: &MenuItem<tauri::Wry>,
    appstore_item: &MenuItem<tauri::Wry>,
    quit_item: &MenuItem<tauri::Wry>,
    theme_submenu: &Submenu<tauri::Wry>,
    light_item: &CheckMenuItem<tauri::Wry>,
    dark_item: &CheckMenuItem<tauri::Wry>,
    system_item: &CheckMenuItem<tauri::Wry>,
    locale_submenu: &Submenu<tauri::Wry>,
    zh_cn_item: &CheckMenuItem<tauri::Wry>,
    zh_tw_item: &CheckMenuItem<tauri::Wry>,
    en_item: &CheckMenuItem<tauri::Wry>,
) {
    let texts = TrayTexts::for_locale(locale);
    let _ = show_item.set_text(texts.show);
    let _ = setting_item.set_text(texts.setting);
    let _ = help_item.set_text(texts.help);
    let _ = appstore_item.set_text(texts.appstore);
    let _ = quit_item.set_text(texts.quit);
    let _ = theme_submenu.set_text(texts.theme);
    let _ = light_item.set_text(texts.light);
    let _ = dark_item.set_text(texts.dark);
    let _ = system_item.set_text(texts.system);
    let _ = locale_submenu.set_text(texts.locale);
    set_locale_check(zh_cn_item, zh_tw_item, en_item, locale);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 打开外部链接插件 (对应原 ipcMain 'open-url')
        .plugin(tauri_plugin_opener::init())
        // 单实例运行: 重复启动时不再创建新窗口, 只唤起并聚焦已存在的实例
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app);
        }))
        // 系统保存对话框 + 文件读写 (条形码/二维码保存图片)
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        // 网页 TDK 检测: Rust 侧抓取网页源码 (绕过浏览器 CORS)
        .invoke_handler(tauri::generate_handler![web_fetch::fetch_url_body])
        .setup(|app| {
            let version = app.package_info().version.to_string();

            // 托盘菜单: [展示窗口, 设置, 帮助, 应用列表, 显示模式▸, 语言▸, MagicTools V{version}, 退出]
            let show_item =
                MenuItem::with_id(app, "show", "展示窗口", true, None::<&str>)?;
            let open_setting_item = MenuItem::with_id(
                app,
                "open-setting",
                "设置",
                true,
                None::<&str>,
            )?;
            let open_help_item = MenuItem::with_id(
                app,
                "open-help",
                "帮助",
                true,
                None::<&str>,
            )?;
            let open_appstore_item = MenuItem::with_id(
                app,
                "open-appstore",
                "应用列表",
                true,
                None::<&str>,
            )?;
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

            // 语言子菜单: 简体中文 / 繁體中文 / English (单选勾选, 默认简体中文)
            // 前端语言包位于每个应用目录 lang.ts (default 为该包回退语言)
            let zh_cn_item = CheckMenuItem::with_id(
                app,
                "locale-zh-CN",
                "简体中文",
                true,
                true,
                None::<&str>,
            )?;
            let zh_tw_item = CheckMenuItem::with_id(
                app,
                "locale-zh-TW",
                "繁體中文",
                true,
                false,
                None::<&str>,
            )?;
            let en_item = CheckMenuItem::with_id(
                app,
                "locale-en",
                "English",
                true,
                false,
                None::<&str>,
            )?;
            let locale_submenu = Submenu::with_items(
                app,
                "语言",
                true,
                &[&zh_cn_item, &zh_tw_item, &en_item],
            )?;

            let menu = Menu::with_items(
                app,
                &[
                    &show_item,
                    &open_setting_item,
                    &open_help_item,
                    &open_appstore_item,
                    &theme_submenu,
                    &locale_submenu,
                    &about_item,
                    &quit_item,
                ],
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
                    // 托盘页面跳转: 设置 / 帮助 / 应用列表 -> 唤起窗口并广播给前端路由
                    "open-setting" | "open-help" | "open-appstore" => {
                        show_main_window(app);
                        let page = match event.id.as_ref() {
                            "open-setting" => "Setting",
                            "open-help" => "Help",
                            _ => "AppStore",
                        };
                        let _ = app.emit("open-page", page);
                    }
                    // 托盘切换显示模式: 广播给前端应用主题
                    "theme-light" | "theme-dark" | "theme-system" => {
                        let mode = match event.id.as_ref() {
                            "theme-light" => "light",
                            "theme-dark" => "dark",
                            _ => "system",
                        };
                        let _ = app.emit("theme-mode-set", mode);
                    }
                    // 托盘切换界面语言: 广播给前端 (locale-context)
                    "locale-zh-CN" | "locale-zh-TW" | "locale-en" => {
                        let locale = match event.id.as_ref() {
                            "locale-zh-CN" => "zh-CN",
                            "locale-zh-TW" => "zh-TW",
                            _ => "en",
                        };
                        let _ = app.emit("locale-set", locale);
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

            // 监听前端(设置页/左下角)切换界面语言:
            // 按 locale 重设托盘菜单全部文案 + 同步「语言」菜单勾选状态
            // (前端 LocaleProvider 挂载后也会立即广播一次已保存语言, 启动即按保存语言显示)
            let locale_show_handle = show_item.clone();
            let locale_setting_handle = open_setting_item.clone();
            let locale_help_handle = open_help_item.clone();
            let locale_appstore_handle = open_appstore_item.clone();
            let locale_quit_handle = quit_item.clone();
            let locale_theme_handle = theme_submenu.clone();
            let locale_light_handle = light_item.clone();
            let locale_dark_handle = dark_item.clone();
            let locale_system_handle = system_item.clone();
            let locale_menu_handle = locale_submenu.clone();
            let locale_zh_cn_handle = zh_cn_item.clone();
            let locale_zh_tw_handle = zh_tw_item.clone();
            let locale_en_handle = en_item.clone();
            app.listen("locale-changed", move |event| {
                if let Ok(locale) = serde_json::from_str::<String>(event.payload()) {
                    apply_tray_locale(
                        locale.as_str(),
                        &locale_show_handle,
                        &locale_setting_handle,
                        &locale_help_handle,
                        &locale_appstore_handle,
                        &locale_quit_handle,
                        &locale_theme_handle,
                        &locale_light_handle,
                        &locale_dark_handle,
                        &locale_system_handle,
                        &locale_menu_handle,
                        &locale_zh_cn_handle,
                        &locale_zh_tw_handle,
                        &locale_en_handle,
                    );
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
