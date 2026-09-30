import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// ---------------- Vditor 运行时资源 (仅「即时渲染 Markdown」使用) ----------------
// Vditor 把 lute 引擎 / 图标 / 语言包 / 代码高亮 / katex / 内容主题 / 表情图 都放在运行期
// 通过 cdn 选项按 URL 拉取 (默认指向 unpkg, 桌面端离线不可用)。这里把用到的子集在构建时拷到
// dist/vditor, 开发服务器直接用中间件从 node_modules 读取; 仓库不提交这批大文件 (~5MB)。
// 资源子路径与 src/App/VditorMarkdown/lib.ts 的 vditorCdn/MARKDOWN 前缀一一对应。
const VDITOR_ROOT = resolve(process.cwd(), 'node_modules/vditor');

const VDITOR_FILES = [
  // 内容主题 (浅色 / 深色, 与 setTheme 的 contentTheme 参数对应)
  'dist/css/content-theme/light.css',
  'dist/css/content-theme/dark.css',
  // 界面语言包
  'dist/js/i18n/zh_CN.js',
  'dist/js/i18n/zh_TW.js',
  'dist/js/i18n/en_US.js',
  // 工具栏图标 + lute 引擎 (3.6MB, 缺它编辑器无法渲染)
  'dist/js/icons/ant.js',
  'dist/js/lute/lute.min.js',
  // 代码高亮核心 + 按需语言包 + 当前使用的两个代码主题
  'dist/js/highlight.js/highlight.min.js',
  'dist/js/highlight.js/third-languages.js',
  'dist/js/highlight.js/styles/github.min.css',
  'dist/js/highlight.js/styles/github-dark.min.css',
  // 公式渲染 (KaTeX)
  'dist/js/katex/katex.min.js',
  'dist/js/katex/katex.min.css',
  'dist/js/katex/mhchem.min.js',
];

// 整目录拷贝: 表情图很小直接全拷; KaTeX 字体只保留 woff2 (省掉 ttf/woff 约 800KB)
const VDITOR_DIRS: { path: string; keep?: (name: string) => boolean }[] = [
  { path: 'dist/images/emoji' },
  { path: 'dist/js/katex/fonts', keep: (name) => name.endsWith('.woff2') },
];

const VDITOR_MIME: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const copyDir = (from: string, to: string, keep?: (name: string) => boolean) => {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const src = join(from, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, join(to, entry.name), keep);
    } else if (!keep || keep(entry.name)) {
      cpSync(src, join(to, entry.name));
    }
  }
};

const copyVditorAssets = (dest: string) => {
  if (!existsSync(VDITOR_ROOT)) return;
  for (const rel of VDITOR_FILES) {
    const src = join(VDITOR_ROOT, rel);
    if (!existsSync(src)) continue;
    const out = join(dest, rel);
    mkdirSync(dirname(out), { recursive: true });
    cpSync(src, out);
  }
  for (const dir of VDITOR_DIRS) {
    const src = join(VDITOR_ROOT, dir.path);
    if (!existsSync(src)) continue;
    copyDir(src, join(dest, dir.path), dir.keep);
  }
};

/** 构建时把 Vditor 运行时资源拷进产物, 开发时用中间件从 node_modules 直接读取 */
const vditorAssets = (): Plugin => {
  let outDir = resolve(process.cwd(), 'dist');
  return {
    name: 'magictools-vditor-assets',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0].split('#')[0];
        if (!path.startsWith('/vditor/')) {
          next();
          return;
        }
        const file = resolve(VDITOR_ROOT, decodeURIComponent(path.slice('/vditor/'.length)));
        if (!file.startsWith(VDITOR_ROOT) || !existsSync(file) || !statSync(file).isFile()) {
          next();
          return;
        }
        res.setHeader('Content-Type', VDITOR_MIME[extname(file).toLowerCase()] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(readFileSync(file));
      });
    },
    closeBundle() {
      copyVditorAssets(join(outDir, 'vditor'));
    },
  };
};

// 渲染进程 (前端) 构建: 替代原 webpack, 产物输出到 dist/ (tauri.conf.json frontendDist)
// - 入口 src/index.html + src/index.tsx, root 设为 src
// - dev server 端口 1212, 与 tauri.conf.json build.devUrl (http://localhost:1212) 对齐
// - base './' 相对路径, 适配 Tauri 自定义协议与 GitHub Pages 子路径部署 (publicPath './' 同策略)
export default defineConfig({
  root: 'src',
  base: './',
  // 静态资源目录 (src/public): 存放 favicon 等无需打包处理、原样拷入产物的文件
  publicDir: 'public',
  plugins: [react(), vditorAssets()],
  server: {
    port: 1212,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Tauri WebView2 / 现代浏览器, 不转译到过低目标
    target: 'chrome105',
    sourcemap: false,
    // 入口 bundle 含 antd 等依赖体积较大, 提高告警阈值避免 CI 噪音
    // antd 主包 (antd+rc-*+@ant-design/icons) 约 1.0M, 随工具页增多持续增长; 拆成
    // antd/rc/icons 多包只会增加请求数与缓存碎片 (碎片实验曾把 chunk 数从 ~30 拆到 299),
    // 且 icons 依赖 rc-util、antd 又引用 icons 会形成 chunk 循环, 故 icons 与 antd 同包;
    // 属桌面工具多页共享 UI 框架的固有成本, 阈值提到 1100 留余量
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // 手动分包: 主入口 (layout/App 注册表) 只留业务骨架,
        // 框架/UI/工具依赖拆成独立 vendor chunk, 供懒加载页面按需复用
        manualChunks(id) {
          // Vite 注入的 __vitePreload 助手 (\0vite/preload-helper.js) 被入口与所有按需 chunk 共享:
          // 必须固定到入口已预载的小 chunk, 否则打包器会把它并入某个大按需 chunk
          // (Rollup 实测并入 vendor-mermaid), 使该 chunk 变成入口静态依赖 → 首屏被全量预载
          // (Vite 8 / Rolldown 同样会下发该模块, 规则继续生效)
          if (id.includes('vite/preload-helper')) {
            return 'vendor-react';
          }
          // 各工具的 lang.ts 被入口注册表 (lang-packs) 静态引用, 同时也是对应工具页的依赖:
          // Rolldown (Vite 8) 会为每个这类共享模块单独出包, 使入口 modulepreload 从十几个
          // 涨到 150+, 首屏变成上百个并发小请求 (碎片化); 固定成一个 chunk 后仅多一次请求,
          // 与 Vite 5/Rollup 把 lang 并入入口的行为等价
          if (/[\\/]src[\\/]App[\\/][^\\/]+[\\/]lang\.ts$/.test(id)) {
            return 'app-lang';
          }
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(?:react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store|@remix-run|object-assign|loose-envify|prop-types)\//.test(id)) {
            return 'vendor-react';
          }
          // @ant-design/icons 与 antd 同 chunk: icons 依赖 rc-util (antd 组) 而 antd 主又 import icons,
          // 分两 chunk 会产生 vendor-antd-icons -> vendor-antd 双向循环
          if (/node_modules\/(?:antd|rc-[^/]+|@rc-component|dayjs|classnames|@ant-design)\//.test(id)) {
            return 'vendor-antd';
          }
          if (/node_modules\/(?:sql-formatter|nearley|moo|discontinuous-range|ret|railroad-diagrams)\//.test(id)) {
            return 'vendor-sql';
          }
          if (/node_modules\/highlight\.js\//.test(id)) {
            return 'vendor-highlight';
          }
          if (/node_modules\/yaml\//.test(id)) {
            return 'vendor-yaml';
          }
          if (/node_modules\/(?:crypto-js|bcryptjs)\//.test(id)) {
            return 'vendor-crypto';
          }
          if (/node_modules\/jsbarcode\//.test(id)) {
            return 'vendor-barcode';
          }
          if (/node_modules\/pinyin-pro\//.test(id)) {
            return 'vendor-pinyin';
          }
          // Excalidraw (白板画布, ~2.5MB): 保持独立的动态 chunk, 只在打开「白板」页时拉取。
          // 不能命名成固定 vendor chunk: 入口与 excalidraw 会共享个别小模块, 命名后共享模块
          // 被并入该 chunk → 入口静态依赖 → 整包被 modulepreload 预载, 懒加载失去意义
          // (实测首屏预载 1.4MB gzip)。return undefined 交给打包器自动拆分: 共享小模块抽到
          // 独立 chunk, excalidraw 主体留在按需 chunk。roughjs 等与 mermaid 共享的依赖仍由
          // 下方 mermaid 规则收纳 (vendor-mermaid 本就随入口预载, 无额外下载)
          if (/node_modules\/(?:@excalidraw|@radix-ui|jotai|jotai-scope|fractional-indexing|image-blob-reduce|open-color|perfect-freehand|pako|browser-fs-access|es6-promise-pool|fuzzy|canvas-roundrect-polyfill|i18next|@babel\/runtime|points-on-curve|tunnel-rat|png-chunk-text|png-chunks-encode|png-chunks-extract|use-isomorphic-layout-effect|react-is)\//.test(id)) {
            return undefined;
          }
          // mermaid 与其图形依赖 (d3 / cytoscape / katex 等, 合计约 2MB): 独立 chunk 按需加载,
          // 只在打开「Mermaid 编辑器」页时拉取; 混入 vendor-misc 会拖大其余页面的预载体积
          // (注意此规则必须在 vendor-antd 之后: stylis 同时被 @ant-design/cssinjs 使用)
          if (/node_modules\/(?:mermaid|@mermaid-js|@braintree|@iconify|@upsetjs|cytoscape|cytoscape-[^/]+|d3|d3-[^/]+|dagre-d3-es|dompurify|es-toolkit|fastdom|katex|khroma|marked|roughjs|ts-dedent|uuid)\//.test(id)) {
            return 'vendor-mermaid';
          }
          // Vditor (即时渲染 Markdown 的编辑器, 约 700KB): 必须独立成 chunk, 混入 vendor-misc
          // 会被入口静态引用, 首屏直接多下 700KB, 失去懒加载意义
          if (/node_modules\/(?:vditor|diff-match-patch)\//.test(id)) {
            return 'vendor-vditor';
          }
          // Shiki 语言语法包: 保持独立 dynamic chunk (import.meta.glob 按需加载),
          // 不并入 vendor-misc, 否则代码截图首次打开会拉取全部语言 (gzip ~1.7MB)
          if (id.includes('node_modules/@shikijs/langs')) {
            return undefined;
          }
          // svgo/browser (~780kB, 仅 SVG 格式化页使用): 独立 chunk 按需加载,
          // 避免拖大 vendor-misc (混入后 misc 超 1.1MB 且其它杂项页无谓预载)
          if (id.includes('node_modules/svgo/dist/svgo.browser.js')) {
            return undefined;
          }
          // vtracer-wasm (图片转 SVG 的 WASM 包装, 仅该页动态 import): 同样独立按需加载,
          // 混入 vendor-misc 会被入口静态预载
          if (id.includes('node_modules/vtracer-wasm/')) {
            return undefined;
          }
          return 'vendor-misc';
        },
      },
    },
  },
});
