# Sega 模拟器运行时资源 (内置, 勿手改)

「Sega 模拟器」工具页 (`src/App/SegaEmulator/`) 把这里的 `player.html` 作为 `<iframe>` 载入,
由它驱动 EmulatorJS + Genesis Plus GX 核心。

## 来源与版本

| 内容 | 来源 | 版本 | 许可 |
| --- | --- | --- | --- |
| `data/src/*.js`、`data/emulator.css`、`data/compression/*`、`data/localization/*` | [`@emulatorjs/emulatorjs`](https://www.npmjs.com/package/@emulatorjs/emulatorjs) | 4.2.3 | GPL-3.0 (`LICENSE-EmulatorJS.txt`) |
| `data/cores/genesis_plus_gx*-wasm.data`、`data/cores/reports/genesis_plus_gx.json` | [`@emulatorjs/core-genesis_plus_gx`](https://www.npmjs.com/package/@emulatorjs/core-genesis_plus_gx) (由 [Genesis Plus GX](https://github.com/ekeeke/Genesis-Plus-GX) 编译为 wasm) | 4.2.3 | GPL-3.0 (许可文本打在 `.data` 包内) |
| `player.html` | 本项目自写 | — | 与本仓库一致 |

只保留了两份核心: `genesis_plus_gx-wasm.data` (WebGL2) 与 `genesis_plus_gx-legacy-wasm.data` (WebGL1 回退);
`-thread` 变体需要 `SharedArrayBuffer` (即 COOP/COEP 跨源隔离), 本应用没有该响应头, 故未内置。

## 为什么内置而不是装 npm 依赖

`@emulatorjs/emulatorjs` 通过依赖把**全部 40+ 个 libretro 核心**一起装进 `node_modules` (~296MB),
而这里只需要 Genesis Plus GX 这一个; 内置后 `npm ci` 不多装任何东西, 桌面端与 Web 版都能离线运行,
运行期也不会去 `cdn.emulatorjs.org` 拉核心。

## 升级步骤

```bash
npm pack @emulatorjs/emulatorjs@<新版本> @emulatorjs/core-genesis_plus_gx@<新版本>
# 解包后按上表覆盖 data/ 下对应文件 (localization 只需 zh-CN / en-US)
```

`data/src/emulator.js` 里的 `this.ejs_version` 与上表版本号需一致。
