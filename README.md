<div align="center">

# 🧰 Magic Tools

**An all-in-one developer toolbox — 106 utilities in 8 categories, cross-platform desktop & Web.**

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

`v2.7.0` &nbsp;·&nbsp; Tauri 2 &nbsp;·&nbsp; React 18 &nbsp;·&nbsp; Ant Design 5 &nbsp;·&nbsp; MIT License

[Download Desktop](#-download) &nbsp;·&nbsp; [Try Online](https://freewu.github.io/magic-tools/) &nbsp;·&nbsp; [Report Issue](https://github.com/freewu/magic-tools/issues/new)

</div>

---

## ✨ Highlights

- **100+ everyday developer tools** organized into 8 categories: codecs, converters, cryptography, hashing, formatters, image generators, webmaster tools and utilities.
- **Full cryptography suite** — symmetric (AES / DES / 3DES / SM4 / ChaCha20 / Blowfish / Rabbit / RC2–RC6 / TEA / XTEA / XXTEA), asymmetric (RSA / SM2), classical ciphers (Caesar / Rail Fence / Vigenère / Hill) plus Cisco Type 7.
- **Hashing & MACs** — MD5, SHA-1, SHA-2, SHA-3, Keccak, SM3, BCrypt, Scrypt, PBKDF2, HKDF, HMAC, CMAC, KMAC and BCC / LRC / CRC checksums.
- **Batch QR / barcode** generation — create many codes at once and export every PNG to a folder in one click on desktop.
- **Local & private** — all computation happens in your browser / device; nothing is uploaded. Dark mode included.
- **Works everywhere** — native desktop app for Windows / macOS / Linux and a pure Web build for instant access.

## 🧰 Feature Overview

> Click the language switcher at the top to read this document in **简体中文** or **繁體中文**.

### 🔐 Cryptography *(21)*
AES · DES · 3DES · RSA · SM2 · SM4 · ChaCha20 · Blowfish · Rabbit · RC2 · RC4 · RC5 · RC6 · TEA · XTEA · XXTEA · Caesar · Rail Fence · Vigenère · Hill · Cisco Type 7

### 🧮 Hash, MAC & Value Calculators *(16)*
Hash (MD5/SHA1/SHA2/SM3/…) · HMAC · SHA-3 · Keccak · BCrypt · Scrypt · PBKDF2 · CMAC · HKDF · KMAC · PPI · Complement (sign-magnitude / 1's / 2's) · IP converter · BCC checksum · LRC checksum · CRC checksum (30+ parameterised standards)

### 🔄 Codecs & Encoders *(13)*
Base64 · URL · Unicode · Punycode · UUencode · XXencode · BCD · Morse code (with audio/WAV) · JWT decoder · HTTP Basic Auth · BaseX · Base58 · Gzip

### ⚖️ Converters *(17)*
Unix timestamp · Color format · Radix (BIN/OCT/DEC/HEX) · Tree ↔ path · GPS coordinates · Download-link converter · RMB uppercase (CNY) · Byte units · Chinese Pinyin · Temperature · Distance · Config (INI/JSON/YAML/TOML/properties) · Subtitle (SRT/ASS/…) · Speed · Volume · Area · Weight

### 🛠️ Formatters & Editors *(8)*
Markdown editor (live preview + LaTeX subset) · JSON · JSON5 · SQL · XML · HTML · SVG · CN/EN typography spacing

### 🖼️ Image Generators *(9)*
QR code · Barcode (CODE128/EAN/UPC/CODE39/ITF/MSI/Pharmacode) · Base64 image · ASCII image · Code screenshot · ICO icon · App icon · Placeholder image · Shield badge (PNG export ×1–10)

### 🌐 Webmaster Tools *(9)*
HTML stripper · Browser fingerprint · URL extractor · Cookie analyzer · User-Agent parser · Sitemap checker · Keyword density · TDK checker · robots.txt generator

### 🧩 Utilities *(14)*
CSS colors · Line counter · htpasswd generator · Regex tester (17 presets) · File diff · Dot-matrix font · Keyboard key info · Chmod calculator · OTP generator · ASCII text art · Cron rules (parse + next runs) · CIDR calculator · Password generator (strength analysis) · Image color palette

> Plus built-in app pages: **App Center**, **Help & changelog**, **Settings**.

## 💻 Download

| Platform | Package | Note |
| --- | --- | --- |
| Windows | `MagicTools_x64.exe` | Single portable exe (WebView2 required, built-in on Win10/11) |
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
| Renderer build | Vite 5 |
| Task runner | [just](https://github.com/casey/just) |

Other components: CryptoJS, js-base64, color-convert, SQL Formatter, highlight.js, base-x, pinyin-pro, js-ini, yaml, toml-patch, deepmerge.

## 📦 Repository Layout

```
magic-tools
├── src-tauri/            # Tauri 2 main process (Rust): window, tray, links, config
├── src/                  # React frontend
│   ├── App/              # auto-registered tools + shell: drop in a folder → a new tool appears
│   │   ├── index.tsx         # app shell: sidebar menu (genMenuList) + content area
│   │   ├── app-modules.ts    # build-time collection via import.meta.glob (replaces webpack context)
│   │   ├── app-i18n.ts       # app registry: appNameOf() trilingual names for tools & fixed pages
│   │   ├── lang-packs.ts     # aggregates every tool's default language pack (lang.ts default export)
│   │   └── <Tool>/           # one folder per tool — auto-registered (110, grouped list below)
│   │       ├── define.tsx    # registration metadata: AppName (zh-CN default) / Icon / Type (category)
│   │       ├── index.tsx     # tool page component (default export; lazy-loaded)
│   │       ├── lang.ts       # default language pack + rows (zh phrase = key → [zh-TW, en]) + lookup helpers
│   │       ├── lib.ts        # pure logic shared by the page and its unit tests (most tools)
│   │       ├── lib.test.ts   # jest unit tests (78 tools)
│   │       ├── data.ts       # option tables / constants / types (45 tools)
│   │       ├── setting.tsx   # this tool's panel inside the Settings center (56 tools)
│   │       └── intro.tsx     # About / instructions content, trilingual (29 tools)
│   ├── layout/           # main frame: sidebar / content
│   ├── hook/             # global state: theme / app context
│   └── lib/              # shared utilities
├── docs/                 # official website (EN / zh-CN / zh-TW) + screenshots
├── dist/                 # Web build output (deployed to GitHub Pages)
└── justfile              # build / release / publish recipes
```

### Existing tools under `src/App/`

110 tool folders live under [`src/App/`](src/App/) and are registered automatically (a folder = one tool, from its `define.tsx`). Grouped below by the `Type` registered in `define.tsx` (same categories as the sidebar / [feature overview](#-feature-overview)). Some tools add tool-specific files besides the common ones (e.g. `AESCrypto/gcm.ts`, `Hash/sm3.ts`+`keccak.ts`, `CronRules/parse.tsx`, `Setting/setting-*.tsx`):

**🔐 Cryptography *(21)*** — `AESCrypto` · `BlowfishCrypto` · `CaesarCrypto` · `ChaCha20Crypto` · `CiscoType7` · `DESCrypto` · `HillCrypto` · `RC2Crypto` · `RC4Crypto` · `RC5Crypto` · `RC6Crypto` · `RSACrypto` · `RabbitCrypto` · `RailFenceCrypto` · `SM2Crypto` · `SM4Crypto` · `TEACrypto` · `TripleDESCrypto` · `VigenereCrypto` · `XTEACrypto` · `XXTEACrypto`

**🧮 Hash, MAC & Value Calculators *(16)*** — `BCCCheck` · `BcryptCalc` · `CMACCalc` · `CRCCheck` · `ComplementCalc` · `HKDFCalc` · `Hash` · `HmacHash` · `IPConvert` · `KMACCalc` · `KeccakHash` · `LRCCheck` · `PBKDF2Calc` · `PPICalc` · `SHA3Hash` · `ScryptCalc`

**🔄 Codecs & Encoders *(13)*** — `BCDCodec` · `Base58Codec` · `Base64` · `BaseXCodec` · `BasicAuthCodec` · `GzipCodec` · `JWTDecoder` · `MorseCodec` · `Punycode` · `URL` · `UUencode` · `Unicode` · `XXencode`

**⚖️ Converters *(17)*** — `AreaConvert` · `ByteConvert` · `ColorConvert` · `ConfigConvert` · `DistanceConvert` · `DownloadLinkConvert` · `GPSConvert` · `NumberConvert` · `PinyinConvert` · `RMBConvert` · `SpeedConvert` · `SubtitleConvert` · `TemperatureConvert` · `Time` · `TreePathConvert` · `VolumeConvert` · `WeightConvert`

**🛠️ Formatters & Editors *(8)*** — `CnEnSpacing` · `HtmlFormat` · `JSON5Formatter` · `JsonFormatter` · `MarkdownEditor` · `SQLFormatter` · `SvgFormat` · `XmlFormatter`

**🖼️ Image Generators *(9)*** — `AppIconGenerator` · `AsciiImageGenerator` · `BarcodeGenerator` · `Base64Image` · `CodeShot` · `IcoGenerator` · `PlaceholderImage` · `QRCodeGenerator` · `ShieldBadgeGenerator`

**🌐 Webmaster Tools *(9)*** — `BrowserFingerprint` · `CookieAnalyzer` · `HtmlStripText` · `KeywordDensity` · `RobotsTxtGenerator` · `SitemapCheck` · `UrlExtract` · `UserAgentParser` · `WebTDKCheck`

**🧩 Utilities *(14)*** — `AsciiTextArt` · `CIDRCalc` · `Chmod` · `Color` · `CronRules` · `DotMatrixFont` · `FileDiff` · `HtpasswdGenerator` · `ImageColor` · `KeyboardKeyInfo` · `LineCount` · `OTPGenerator` · `PasswordGenerator` · `RegexTester`

> Built-in pages `AppStore`（App Center）/ `Help` / `Setting` also live in `src/App/` (registered with `Type = 'misc'`), but are fixed pages rather than tools.

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
