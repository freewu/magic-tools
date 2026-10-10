import fs from 'fs';
import path from 'path';

// 回归保护: 版本号散落在多处 (见 AGENTS.md「版本号修改位置清单」),
// 历史上已两次漏改 —— v2.6.0 漏改 update.md (GitHub Release 说明沿用旧内容)、
// v2.20.0 前 README 顶部徽章长期停在 v2.7.0。这里把整张清单变成可执行的断言。
const ROOT = path.resolve(__dirname, '..', '..');
const read = (rel: string): string => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** 取第一个捕获组, 找不到直接报错 (避免正则失配被当成通过) */
const pick = (text: string, re: RegExp, rel: string): string => {
  const m = text.match(re);
  if (!m) throw new Error(`${rel} 中未匹配到版本号: ${re}`);
  return m[1];
};

const VERSION = JSON.parse(read('package.json')).version as string;
const TAG = `v${VERSION}`;

describe('版本号一致性 (发布清单逐一校验)', () => {
  test('package.json 为版本号唯一来源 (x.y.z)', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('Rust / Tauri / justfile 与 package.json 一致 (清单 2~4)', () => {
    expect(pick(read('src-tauri/Cargo.toml'), /^version = "([^"]+)"/m, 'src-tauri/Cargo.toml')).toBe(VERSION);
    expect(JSON.parse(read('src-tauri/tauri.conf.json')).version).toBe(VERSION);
    expect(pick(read('justfile'), /env_var_or_default\("VERSION", "([^"]+)"\)/, 'justfile')).toBe(VERSION);
  });

  test('两个 lockfile 顶层版本与 package.json 一致 (清单 9)', () => {
    const lock = JSON.parse(read('package-lock.json'));
    expect(lock.version).toBe(VERSION);
    expect(lock.packages[''].version).toBe(VERSION);
    expect(pick(read('src-tauri/Cargo.lock'), /name = "magic-tools"\nversion = "([^"]+)"/, 'src-tauri/Cargo.lock')).toBe(VERSION);
  });

  test('三语 README 顶部 shields.io 徽章版本一致 (清单 7)', () => {
    for (const rel of [ 'README.md', 'README.zh-CN.md', 'README.zh-TW.md' ]) {
      expect(pick(read(rel), /img\.shields\.io\/badge\/magic--tools-(v\d[\d.]*)-/, rel)).toBe(TAG);
    }
  });

  test('docs 三页版本徽章一致 (清单 8)', () => {
    for (const rel of [ 'docs/index.html', 'docs/zh-CN.html', 'docs/zh-TW.html' ]) {
      expect(pick(read(rel), /bv-blue">(v\d[\d.]*)</, rel)).toBe(TAG);
    }
  });

  test('客户端窗体标题带版本号 (清单 10)', () => {
    // 桌面端窗口标题: tauri.conf.json 的初始 title + Rust setup 里 set_title 兜底, 两处都不能漏
    const conf = JSON.parse(read('src-tauri/tauri.conf.json'));
    expect(conf.app.windows[0].title).toBe(`Magic Tools ${TAG}`);
    const rust = read('src-tauri/src/lib.rs');
    expect(rust).toContain('set_title');
    expect(rust).toContain('format!("Magic Tools v{version}")');
    // Web 版页面标题 (Tauri 里 document.title 亦随之同步) 由 src/Main.tsx 生成, 无需手改
    expect(read('src/Main.tsx')).toContain('`Magic Tools v${getVersion()}`');
  });

  test('update.md 顶部版本节与 Help 时间线最新条目一致 (清单 5~6)', () => {
    // update.md 是 GitHub Release 说明的唯一来源, 取顶部第一个版本节
    expect(pick(read('update.md'), /^# MagicTools (v\d[\d.]*)$/m, 'update.md')).toBe(TAG);
    // Help/data.tsx 的 eventList 顶部为最新版本 (标题里的 V 为大写)
    expect(pick(read('src/App/Help/data.tsx'), /title: tri\("\d{4}-\d{2}-\d{2} (V\d[\d.]*) Release"/, 'src/App/Help/data.tsx'))
      .toBe(TAG.toUpperCase());
  });
});
