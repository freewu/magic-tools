<div align="center">

# 🧰 Magic Tools

**An all-in-one developer toolbox — 160 utilities in 10 categories, cross-platform desktop & Web.**

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

![version](https://img.shields.io/badge/magic--tools-v2.25.0-007EC6?style=flat-square&labelColor=24292F) ![ci](https://img.shields.io/github/actions/workflow/status/freewu/magic-tools/ci.yml?style=flat-square&label=CI&labelColor=24292F&logo=githubactions&logoColor=fff) ![Tauri](https://img.shields.io/badge/Tauri-2-0E7490?style=flat-square&labelColor=24292F&logo=tauri&logoColor=fff) ![React](https://img.shields.io/badge/React-18-087EA4?style=flat-square&labelColor=24292F&logo=react&logoColor=fff) ![Ant Design](https://img.shields.io/badge/Ant_Design-5-0170FE?style=flat-square&labelColor=24292F&logo=antdesign&logoColor=fff) ![MIT License](https://img.shields.io/badge/license-MIT-4F46E5?style=flat-square&labelColor=24292F)

[Download Desktop](#-download) &nbsp;·&nbsp; [Try Online](https://freewu.github.io/magic-tools/) &nbsp;·&nbsp; [Report Issue](https://github.com/freewu/magic-tools/issues/new)

</div>

---

## ✨ Highlights

- **100+ everyday developer tools** organized into 10 categories: codecs, converters, cryptography, hashing, formatters, image tools, generators, webmaster tools, games and utilities.
- **Full cryptography suite** — symmetric (AES / DES / 3DES / SM4 / ChaCha20 / Blowfish / Rabbit / RC2–RC6 / TEA / XTEA / XXTEA / ZUC), asymmetric (RSA / SM2), classical ciphers (Caesar / Rail Fence / Vigenère / Hill) plus Cisco Type 7.
- **Hashing & MACs** — MD5, SHA-1, SHA-2, SHA-3, Keccak, SM3, BCrypt, Scrypt, PBKDF2, HKDF, HMAC, CMAC, KMAC and BCC / LRC / CRC checksums.
- **Batch QR / barcode** generation — create many codes at once and export every PNG to a folder in one click on desktop.
- **Local & private** — all computation happens in your browser / device; nothing is uploaded. Dark mode included, and the sidebar width is drag-resizable.
- **Works everywhere** — native desktop app for Windows / macOS / Linux and a pure Web build for instant access.

## 🧰 Feature Overview

> Click the language switcher at the top to read this document in **简体中文** or **繁體中文**.

### 🔐 Cryptography *(23)*
AES · DES · 3DES · RSA · SM2 · SM4 · SM9 · ChaCha20 · Blowfish · Rabbit · RC2 · RC4 · RC5 · RC6 · TEA · XTEA · XXTEA · Caesar · Rail Fence · Vigenère · Hill · Cisco Type 7 Encrypt / Decrypt · ZUC sequence cipher (Zu Chongzhi)

### 🧮 Hash, MAC & Value Calculators *(15)*
Hash (MD5/SHA1/SHA2/SM3/…) · HMAC · SHA-3 · Keccak · BCrypt · Scrypt · PBKDF2 · CMAC · HKDF · KMAC · PPI · Complement (sign-magnitude / 1's / 2's) · BCC checksum · LRC checksum · CRC checksum (30+ parameterised standards)

### 🔄 Codecs & Encoders *(13)*
Base64 · URL · Unicode · Punycode · UUencode · XXencode · BCD · Morse code (with audio/WAV) · JWT decoder & encoder · HTTP Basic Auth · BaseX · Base58 · Gzip

### ⚖️ Converters *(20)*
Unix timestamp · Color format · Radix (BIN/OCT/DEC/HEX) · Tree ↔ path · GPS coordinates · Lat/long format · IP converter (IPv4/IPv6 ↔ decimal/hex/binary) · Download-link converter · JSONL · RMB uppercase (CNY) · Byte units · Chinese Pinyin · Temperature · Distance · Config (INI/JSON/YAML/TOML/properties) · Subtitle (SRT/ASS/…) · Speed · Volume · Area · Weight

### 🛠️ Formatters & Editors *(12)*
Markdown editor (live preview + LaTeX subset) · Instant-render Markdown editor (Vditor: instant / split / WYSIWYG modes, KaTeX math, export .md and styled .html) · Mermaid editor (live preview, 30+ built-in diagram samples, export SVG/PNG/WebP) · Mind map (Markdown outline → interactive markmap: fold levels, zoom / pan, palettes, font size, export SVG / PNG / WebP) · JSON · JSON5 · JavaScript (beautify / minify / obfuscate / deobfuscate) · SQL · XML · HTML · SVG · CN/EN typography spacing

### 🖼️ Image Tools *(19)*
Base64 image · ASCII image · Code screenshot · ICO icon · App icon · Dominant-color palette (merge similar colors + share) · Image split (2/3/4/6/9) · Image adjust (resize percent / pixels, rotate 90°·180°·270°, PNG·JPEG·WebP) · Image watermark (text / logo, nine-grid · tiled, rotation + opacity) · Placeholder image · Shield badge (PNG export ×1–10) · Image negative (blendable invert) · Black & white (gray / binarize, auto Otsu threshold) · Sharpen (USM radius / amount / threshold) · Color picker (magnifier + HEX / RGB / HSL, history) · Raster to SVG (trace bitmaps into vector SVG with VTracer: color layers / black & white, 13 parameters + 7 presets) · Pixel art (image → pixel art; presets for portrait photo / game asset / abstract art, block-size average + grayscale + palette quantization with 4×4 Bayer dithering; adaptive 16–256 colors and classic console palettes: NES · PICO-8 · Game Boy · C64 · CGA · ZX Spectrum · SMS · Mega Drive · SNES) · GIF split (load a .gif and inspect it frame by frame: animation preview with play / pause / speed, frame list with select-all and invert, export the selected frames as one PNG each (desktop writes them into a folder as “gif name / frame index”) or stitch them into a sprite sheet with adjustable columns and gap) · GIF generator (combine several images into animation frames in the order they were added — move up / move down / reverse to reorder; canvas width / height sizing mode, per-frame delay with apply-to-all, loop count (0 = forever), max colours, dithering, transparent background; encode locally with modern-gif, preview then save — nothing is uploaded)

### 🎲 Generators *(15)*
QR code (batch, logo/label) · Barcode (CODE128/EAN/UPC/CODE39/ITF/MSI/Pharmacode) · Password generator (strength analysis) · OTP (TOTP/HOTP, QR export) · htpasswd · Mock data (JSON/CSV/SQL) · Dot-matrix font · Sudoku generator (4×4 / 6×6 / 9×9, unique solution, A4 print) · Copybook generator (mi / tian / hui / essay grids, A4 print) · Cron rules (parse + next runs) · .gitignore generator (60+ ready-made templates for languages / frameworks / editors / operating systems, stack presets, custom lines, cross-template dedupe) · Whiteboard (Excalidraw infinite canvas: shapes / arrows / text / freehand, autosaved locally, export PNG / SVG / file — no network, no collaboration) · Chat generator (9 platform styles — WeChat / QQ / Slack / Telegram / Discord / WhatsApp / LINE / DingTalk / Feishu; phone or desktop window preview, text / image / voice / time-divider messages (WeChat also supports red packet / transfer cards), global chat title, nicknames, avatars, mute toggle and phone status bar, export PNG) · Bead pattern (upload an image → chart of real bead colors: 6 brand palettes (MARD / COCO / Artkal / Artkal Mini / Perler / Hama), target width in beads, color-count limit, CIEDE2000 perceptual matching, optional dithering, automatic background removal, brightness / contrast / saturation, brush / eraser / recolor / magic-wand editing with undo & redo, mirror preview for ironing, bead count + finished size + pegboard stats, export printable PNG and code / usage CSV) · Fake meeting (three meeting-app skins — Tencent Meeting / Zoom / Microsoft Teams: fake participants with avatars and name tags, a speaking tile that moves around, ticking clock, chat panel where messages arrive over time, participant list, fake screen-share slide, immersive full screen with Esc to exit, your own tile from the camera or an uploaded photo, and a WebAudio-synthesised background murmur so it sounds busy)

### 🎮 Games *(6)*
2048 (merge numbers on a 4×4 / 5×5 / 6×6 board, arrow keys / WASD / swipe, undo up to 20 moves, per-board best score, keeps playing after reaching the goal — playable both in the desktop app and the Web version) · Tetris (10×20 falling-block classic: arrow keys / WASD / X·Z rotation / Space hard drop / C hold, 7-bag randomiser with 3-piece preview, ghost piece, wall kicks, soft & hard drop scoring, 1–4 line clears multiplied by level (level rises every 10 lines, faster gravity), best score, fullscreen — desktop and Web) · Minesweeper (classic mine-hunting: beginner 9×9/10, intermediate 16×16/40, expert 30×16/99 or any custom board, first click and its 3×3 area are always mine-free, flag → question → blank marking, chord (double click / middle click) to open neighbours, long-press flagging on touch, per-board fastest-clear records, three cell sizes, timer, fullscreen — desktop and Web) · NES Emulator (runs .nes ROMs locally with the jsnes core: drag & drop or pick a file, per-cartridge info (mapper / PRG / CHR / region / mirroring / battery), on-screen D-pad, USB & Bluetooth gamepads, rebindable keys, F5/F8 quick save-load plus .nesstate export/import, PNG screenshot, 0.5×–2× speed, volume, pause/reset, fullscreen with a translucent on-screen pad (toggleable, adjustable opacity, press animation)) · FreeCell (classic solitaire: 52 cards dealt face-up into 8 columns, 4 free cells and 4 foundations, descending alternating-colour runs, supermove as many cards as the free cells allow, safe-card auto-collect, hint, undo, fullscreen, shareable game numbers (same number = same deal), per-deal best time / moves) · Spider Solitaire (two decks / 104 cards in 10 columns: build same-suit King-to-Ace runs and clear 8 of them to win, one / two / four-suit difficulty, deal 5 rows from the stock (classic rule: not while a column is empty), drag or click to move, double-click auto-move, hint, undo, fullscreen, shareable deal numbers, best time / moves) · GameBoy Emulator (runs .gb / .gbc cartridges locally with the Rust + WebAssembly boytacean core: drop anywhere or pick a file, DMG / CGB mode detected from the cartridge header, cartridge info (title / type / size / RAM / battery), on-screen D-pad, USB & Bluetooth gamepads, rebindable keys, F5/F8 quick save-load plus .gbstate export/import, automatic battery saves (SRAM) per ROM name, PNG screenshot, 0.5×–2× speed, volume, pause/reset/fullscreen, fullscreen with a translucent on-screen pad (toggleable, adjustable opacity, press animation) — desktop and Web) · Sega Emulator (runs Mega Drive / Genesis, Master System and Game Gear games locally with the Genesis Plus GX WebAssembly core driven by EmulatorJS 4.2.3: pick a ROM or drop it on the screen, .md / .bin / .gen / .smd / .sms / .gg plus .zip / .7z archives, console picked from the extension, per-file info, default volume and auto-fullscreen settings, save states, battery saves kept in the browser, rebindable keyboard keys (click a button, press a new key, saved locally, applies mid-game), a translucent pad over the game layer (adjustable opacity, buttons light up on press), gamepad support, fullscreen, fully offline — desktop and Web) · Snake (classic 20×20 snake: four speeds and four board sizes, score and settings kept in a top bar, wrap-around, a fixed 12-cell obstacle layout, a golden apple worth 30 points that lasts only 9 seconds, arrow keys / WASD steering with a turn queue, swipe or D-pad on touch screens, sound effects synthesised live with Web Audio, best score stored locally, fullscreen — desktop and Web)

### 🌐 Webmaster Tools *(16)*
HTML stripper · Browser fingerprint · CSR request generator (WebCrypto RSA + PKCS#10, SAN, key + CSR download) · URL extractor · Cookie analyzer · User-Agent parser · Sitemap checker · Keyword density · TDK checker · DNS lookup (desktop only) · Whois lookup (desktop only) · MTR trace — traceroute + ping per-hop loss / RTT / jitter (desktop only) · robots.txt generator · iptables rule parser / generator (one-click scenarios — open port / block IP / block subnet / port forwarding — plus parse &amp; generate, iptables-save support) · tc traffic-control rule generator (HTB / TBF / netem, ingress via ifb) · nginx config generator (static / SPA / PHP / reverse proxy, TLS, gzip, static caching, rate limiting, hotlink protection — vhost-ready file)

### 🧩 Utilities *(18)*
CSS colors · Line counter · Regex tester (17 presets) · File diff · Keyboard key info · Chmod calculator · ASCII text art · CIDR calculator · WebSocket debugger · Teleprompter (speed / fade / line focus / a reading guide line you can toggle, colour and move up or down / fullscreen, countdown before it starts, Space to play·pause·cancel countdown, defaults editable in Settings / saveable from the page) · BOM inspector (detect / strip / add a UTF-8·UTF-16·UTF-32 BOM, encoding guess and text preview) · Metronome (20–300 BPM, time signature + beat subdivision, 3 click timbres, volume, count-in beats before the beat starts, fullscreen flashing dot, tap tempo) · Screen recorder (Web-only: capture screen / window / tab, optional system audio + microphone, frame rate · bitrate · resolution, one-click save as WebM / MP4) · QR code decoder (read a QR image with jsQR: URL / WiFi / vCard / mailto / tel / SMS / geo / OTP, structured fields, code located on the preview, editable inversion strategy, history) · Sensitive word check (Aho–Corasick scan with General / Xiaohongshu / WeChat word lists: risk levels, matched positions and rewrites, one-click masking plus report export, loose matching that still catches 「微 信」-style bypasses) · Pomodoro timer (focus / short / long break cycles, 5 built-in synth alert sounds or your own audio file, repeatable alerts, system notification — native on desktop, browser Notification on Web, adjustable clock background (solid colour or your own image — one shared image or separate focus / break images) and per-phase digit colours; Space / Enter start·pause in fullscreen) · Zip compress (drag in files or folders keeping the folder structure, compression level 0–9, custom archive name, automatic renumbering on duplicates, before / after size) · Zip extract (entry list with size and time, select all / invert, inline preview of text and images, extract into a folder keeping the archive hierarchy or download a single entry, Chinese filename encoding auto / UTF-8 / GBK / Big5)

> Plus built-in app pages: **App Center** (search by app or category name, plus category filter), **My Favorites** (keep your favourite tools in one place; the floating shortcut can be dragged anywhere), **Help & changelog**, **Settings**.

## 💻 Download

| Platform | Package | Note |
| --- | --- | --- |
| Windows | `MagicTools_x64.exe` | Single portable exe (WebView2 required, built-in on Win10/11) |
| Windows | `MagicTools_x64-setup.exe` | NSIS installer with the full WebView2 runtime embedded (works on machines without WebView2) |
| macOS | `MagicTools_macOS-universal.zip` | Universal (Apple Silicon + Intel) |
| Linux | `MagicTools_amd64.AppImage` | AppImage |

👉 **[Download the latest release](https://github.com/freewu/magic-tools/releases/latest)**

**Web version:** no install needed — try it at [freewu.github.io/magic-tools/tools](https://freewu.github.io/magic-tools/tools/). Append `?lang=` to preselect the UI language for deep links (e.g. `?lang=zh-CN` from Simplified-Chinese docs, `?lang=en` from English docs; `cn` / `tw` / `en` short forms also work).

## 🛠 Tech Stack

| Layer | Choice |
| --- | --- |
| Desktop shell | [Tauri 2](https://tauri.app/) (Rust) |
| Frontend UI | [React 18](https://react.dev/) |
| Component library | [Ant Design 5](https://ant.design/) |
| Renderer build | Vite 8 (Rolldown) |
| Task runner | [just](https://github.com/casey/just) |

Other components: CryptoJS, js-base64, color-convert, SQL Formatter, highlight.js, base-x, pinyin-pro, js-ini, yaml, toml-patch, deepmerge.

## 📦 Repository Layout

```
magic-tools
├── src-tauri/            # Tauri 2 main process (Rust): window, tray, links, config
├── src/                  # React frontend
│   ├── App/              # tools + shell: add a folder, then register it (see below)
│   │   ├── index.tsx         # tool registry (`list`) + shell: sidebar menu (genMenuList) / content area
│   │   ├── app-modules.ts    # build-time collection via import.meta.glob (replaces webpack context)
│   │   ├── app-i18n.ts       # app registry: appNameOf() trilingual names for tools & fixed pages
│   │   ├── lang-packs.ts     # aggregates every tool's default language pack (lang.ts default export)
│   │   └── <Tool>/           # one folder per tool (160, grouped list below) — 2-step registration
│   │       ├── define.tsx    # registration metadata: AppName (zh-CN default) / Icon / Type (category)
│   │       ├── index.tsx     # tool page component (default export; lazy-loaded)
│   │       ├── lang.ts       # default language pack + rows (zh phrase = key → [zh-TW, en]) + lookup helpers
│   │       ├── lib.ts        # pure logic shared by the page and its unit tests (most tools)
│   │       ├── lib.test.ts   # jest unit tests (147 tools; 开发时用 `npm test -- src/App/<工具>` 只跑该工具)
│   │       ├── data.ts       # option tables / constants / types (79 tools)
│   │       ├── setting.tsx   # this tool's panel inside the Settings center (77 tools)
│   │       └── intro.tsx     # About / instructions content, trilingual (59 tools)
│   ├── layout/           # main frame: sidebar / content
│   ├── hook/             # global state: theme / app context
│   └── lib/              # shared utilities
├── docs/                 # official website (EN / zh-CN / zh-TW) + screenshots
├── dist/                 # Web build output (deployed to GitHub Pages)
└── justfile              # build / release / publish recipes
```

### Existing tools under `src/App/`

160 tool folders live under [`src/App/`](src/App/) and each holds one tool declared by its `define.tsx`. **Adding a tool takes two steps:** (1) append the folder name to the `list` array in [`src/App/index.tsx`](src/App/index.tsx) — that hand-maintained registry drives the sidebar / App Center menu order and routing, while `import.meta.glob` only discovers the page component; (2) add its `lang.ts` default export to [`src/App/lang-packs.ts`](src/App/lang-packs.ts) so names/UI strings can be translated. Grouped below by the `Type` registered in `define.tsx` (same categories as the sidebar / [feature overview](#-feature-overview)). Some tools add tool-specific files besides the common ones (e.g. `AESCrypto/gcm.ts`, `Hash/sm3.ts`+`keccak.ts`, `CronRules/parse.tsx`, `Setting/setting-*.tsx`):

**🔐 Cryptography *(23)*** — `AESCrypto` · `BlowfishCrypto` · `CaesarCrypto` · `ChaCha20Crypto` · `CiscoType7` · `DESCrypto` · `HillCrypto` · `RC2Crypto` · `RC4Crypto` · `RC5Crypto` · `RC6Crypto` · `RSACrypto` · `RabbitCrypto` · `RailFenceCrypto` · `SM2Crypto` · `SM4Crypto` · `SM9Crypto` · `TEACrypto` · `TripleDESCrypto` · `VigenereCrypto` · `XTEACrypto` · `XXTEACrypto` · `ZucCrypto`

**🧮 Hash, MAC & Value Calculators *(15)*** — `BCCCheck` · `BcryptCalc` · `CMACCalc` · `CRCCheck` · `ComplementCalc` · `HKDFCalc` · `Hash` · `HmacHash` · `KMACCalc` · `KeccakHash` · `LRCCheck` · `PBKDF2Calc` · `PPICalc` · `SHA3Hash` · `ScryptCalc`

**🔄 Codecs & Encoders *(13)*** — `BCDCodec` · `Base58Codec` · `Base64` · `BaseXCodec` · `BasicAuthCodec` · `GzipCodec` · `JWTDecoder` · `MorseCodec` · `Punycode` · `URL` · `UUencode` · `Unicode` · `XXencode`

**⚖️ Converters *(20)*** — `AreaConvert` · `ByteConvert` · `ColorConvert` · `ConfigConvert` · `DistanceConvert` · `DownloadLinkConvert` · `GPSConvert` · `LatLngConvert` · `IPConvert` · `JSONLConvert` · `NumberConvert` · `PinyinConvert` · `RMBConvert` · `SpeedConvert` · `SubtitleConvert` · `TemperatureConvert` · `Time` · `TreePathConvert` · `VolumeConvert` · `WeightConvert`

**🛠️ Formatters & Editors *(12)*** — `CnEnSpacing` · `HtmlFormat` · `JSON5Formatter` · `JsFormatter` · `JsonFormatter` · `MarkdownEditor` · `MermaidEditor` · `MindMap` · `SQLFormatter` · `SvgFormat` · `VditorMarkdown` · `XmlFormatter`

**🖼️ Image Tools *(19)*** — `AppIconGenerator` · `AsciiImageGenerator` · `Base64Image` · `CodeShot` · `GifGenerator` · `GifSplit` · `IcoGenerator` · `ImageColor` · `ImageColorPicker` · `ImageGrayscale` · `ImageNegative` · `ImageResize` · `ImageSharpen` · `ImageSplit` · `ImageToSvg` · `ImageWatermark` · `PixelArt` · `PlaceholderImage` · `ShieldBadgeGenerator`

**🎲 Generators *(15)*** — `BarcodeGenerator` · `BeadPatternGenerator` · `ChatGenerator` · `CopybookGenerator` · `CronRules` · `DotMatrixFont` · `FakeMeeting` · `GitignoreGenerator` · `HtpasswdGenerator` · `MockData` · `OTPGenerator` · `PasswordGenerator` · `QRCodeGenerator` · `SudokuGenerator` · `Whiteboard`

**🌐 Webmaster Tools *(16)*** — `BrowserFingerprint` · `CSRGenerator` · `CookieAnalyzer` · `DnsQuery` · `HtmlStripText` · `IptablesRules` · `KeywordDensity` · `MtrQuery` · `NginxConfig` · `RobotsTxtGenerator` · `SitemapCheck` · `TcRules` · `UrlExtract` · `UserAgentParser` · `WebTDKCheck` · `WhoisQuery`

**🎮 Games *(9)*** — `Game2048` · `Tetris` · `Minesweeper` · `NesEmulator` · `GameBoy` · `FreeCell` · `SpiderSolitaire` · `SegaEmulator` · `Snake`

**🧩 Utilities *(18)*** — `AsciiTextArt` · `BOMCheck` · `CIDRCalc` · `Chmod` · `Color` · `FileDiff` · `KeyboardKeyInfo` · `LineCount` · `Metronome` · `Pomodoro` · `QrDecode` · `RegexTester` · `ScreenRecorder` · `SensitiveWord` · `Teleprompter` · `WebSocketDebug` · `ZipCompress` · `ZipExtract`

> Built-in pages `AppStore`（App Center）/ `Favorites`（My Favorites）/ `Help` / `Setting` also live in `src/App/` (registered with `Type = 'misc'`), but are fixed pages rather than tools.

## 🚀 Development

Prerequisites: Node.js 18+, Rust, and the [just](https://github.com/casey/just) command runner (every command below uses it).

**Install `just` first:**

| Platform | Install command |
| --- | --- |
| Windows | `winget install --id Casey.Just` (or `scoop install just`, `choco install just`) |
| macOS | `brew install just` |
| Linux | download from [just releases](https://github.com/casey/just/releases), or `cargo install just` |

Then clone the repo and initialize the dev environment. `just dev-init` checks every required component and automatically installs whatever is missing (frontend deps via `npm ci` / `npm install`, Rust toolchain via `rustup`, backend deps via `cargo fetch`); components that are already ready are skipped and shown with a **green ✓**. It is idempotent, so you can re-run it any time:

```bash
git clone https://github.com/freewu/magic-tools.git
cd magic-tools
just dev-init
```

Start developing:

```bash
just dev
```

| Task | Command |
| --- | --- |
| Initialize / check dev env (idempotent, ✓ when ready) | `just dev-init` |
| Run in Tauri window (dev) | `just dev` |
| Browser dev server | `just dev-renderer` → http://localhost:1212 |
| Preview production build | `just preview` → http://localhost:4173 |
| Unit tests | `just test` |
| Lint | `just lint` |
| Build desktop app | `just build` |
| Build single portable exe → `release/` | `just release` |
| Bundle installers | `just bundle nsis` / `appimage` / `dmg` |
| Check Tauri environment | `just doctor` |

> ℹ️ Vite output uses ES-module code splitting — don't double-click `dist/index.html` directly (`file://` can't load modules); use `just preview` instead.

## 🌐 Website

The three-language official site lives in [`docs/`](docs/):

- English: [`docs/index.html`](docs/index.html)
- 简体中文: [`docs/zh-CN.html`](docs/zh-CN.html)
- 繁體中文: [`docs/zh-TW.html`](docs/zh-TW.html)

## 📝 Maintainers' Guide

### Bump the version (before every release)

Update **all** of these to the same version number:

1. `package.json` — `"version"` (auto-read by the UI via `src/version.ts`)
2. `src-tauri/Cargo.toml` — package `version` (shown in the tray menu)
3. `src-tauri/tauri.conf.json` — `"version"` (bundler / installer)
4. `justfile` — default of `version := env_var_or_default("VERSION", "...")`
5. `src/App/Help/data.tsx` — prepend a new `Vx.y.z Release` entry to `eventList`
6. `update.md` — prepend a `# MagicTools vX.Y.Z` section (the release-notes source for Actions)

Verify with: `just test && just build:renderer && cargo check`.

### Release process

```bash
just tag 1.3.1
# git add -A && git commit -m "chore: release v1.3.1"
# && git tag v1.3.1 && git push && git push origin v1.3.1
```

Pushing a `v*` tag triggers GitHub Actions (`.github/workflows/build-release.yml`) to build the three platforms and publish to GitHub Releases, with notes taken from the **first** section at the top of `update.md`. Pushing a tag also re-deploys the Web version to GitHub Pages (`.github/workflows/deploy-pages.yml`).

## ❓ FAQ

- **Desktop app keeps closing to tray instead of exiting?** Clicking the window close button hides the app to the system tray (same as the old Electron build); choose **Exit** in the tray menu to quit.
- **Opening an external link?** On desktop the system browser is opened via the Tauri opener plugin; in a plain browser the link simply opens in a new tab.
- **Auto-update?** The Tauri build doesn't ship an updater yet — download new versions from the Releases page.

## 📄 License

[MIT](LICENSE) © 2023 Bluefrog
