#!/usr/bin/env node
/**
 * just dev-init — 初始化/检查开发环境 (幂等)
 *
 * 逐项检查所需组件, 缺失的自动安装, 已就绪的跳过并打印 绿色 ✓:
 *   1. Node.js 版本 (>= 18)
 *   2. 前端依赖 node_modules (.package-lock.json 标记已装; 缺失则 npm ci / npm install)
 *   3. Rust 工具链 (cargo/rustc; 有 rustup 时自动装 stable, 再 cargo fetch 拉取依赖)
 *
 * 用法: 仓库根目录执行 `node scripts/dev-init.mjs` (一般通过 `just dev-init` 调用)
 * 可重复运行; 输出着色仅在终端支持时启用 (NO_COLOR/非 TTY 自动关闭)。
 */
import { existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

// ---- 着色 (NO_COLOR 或非 TTY 时关闭, CI 日志保持纯文本) ----
const useColor = !process.env.NO_COLOR && !!process.stdout.isTTY;
const paint = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const ok = s => paint(32, s);   // 绿
const warn = s => paint(33, s); // 黄
const err = s => paint(31, s);  // 红
const dim = s => paint(2, s);
const cyan = s => paint(36, s);

/** 运行命令 (继承 stdio, 输出实时可见); 失败返回 false */
function run(cmd, args = [], opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, cwd: root, ...opts });
  return r.status === 0;
}
/** 检查命令是否存在 */
function has(cmd) {
  return run(cmd === 'npm' ? 'npm --version' : cmd, [], { stdio: 'ignore' });
}

let problems = [];

console.log(cyan('MagicTools 开发环境初始化: 检查/安装所需组件 (已就绪的显示绿色 ✓)\n'));

// ---- 1. Node.js ----
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 18) {
  console.log(err(`✗ Node.js ${process.versions.node} 过旧, 需要 18+ (请升级: https://nodejs.org/)`));
  problems.push('Node.js >= 18');
} else {
  console.log(ok(`✓ Node.js ${process.versions.node} (>= 18 满足)`));
}
if (!has('npm')) {
  console.log(err('✗ 未检测到 npm (随 Node.js 一起安装)'));
  problems.push('npm');
}

// ---- 2. 前端依赖 (node_modules) ----
const nm = join(root, 'node_modules');
const frontReady = existsSync(join(nm, '.package-lock.json'));
if (frontReady) {
  const n = existsSync(nm) ? readdirSync(nm).length : 0;
  console.log(ok(`✓ 前端依赖已安装 (node_modules, ${n} 个包)`));
} else {
  console.log(warn('… 未检测到前端依赖, 开始安装 (首次需要几分钟)'));
  const useCi = existsSync(join(root, 'package-lock.json'));
  const cmd = useCi ? 'npm ci' : 'npm install';
  if (!run(cmd)) {
    console.log(err(`✗ 前端依赖安装失败 (${cmd}), 请检查网络后重试`));
    problems.push('前端依赖 (npm)');
  } else {
    console.log(ok(`✓ 前端依赖安装完成 (${cmd})`));
  }
}

// ---- 3. Rust 工具链 + 后端依赖 ----
const cargoOk = has('cargo');
const rustupOk = has('rustup');
if (cargoOk) {
  console.log(ok('✓ Rust 工具链已安装 (cargo)'));
} else if (rustupOk) {
  console.log(warn('… 未检测到 cargo, 通过 rustup 安装 stable 工具链'));
  if (run('rustup toolchain install stable --profile minimal') && run('rustup default stable')) {
    console.log(ok('✓ Rust stable 工具链安装完成 (rustup)'));
  } else {
    console.log(err('✗ rustup 安装 stable 失败, 请手动执行: rustup toolchain install stable'));
    problems.push('Rust 工具链 (rustup stable)');
  }
} else {
  console.log(err('✗ 未检测到 Rust/cargo。请先安装: https://rustup.rs/ (Windows 用户装好后需重开终端)'));
  problems.push('Rust 工具链 (rustup)');
}

// cargo fetch 预下载 Tauri 后端依赖 (不编译, 较快)
if (has('cargo')) {
  if (run('cargo fetch --manifest-path src-tauri/Cargo.toml')) {
    console.log(ok('✓ Rust 后端依赖已就绪 (cargo fetch)'));
  } else {
    console.log(err('✗ cargo fetch 失败, 请检查网络/镜像配置后重试'));
    problems.push('Rust 后端依赖 (cargo fetch)');
  }
}

// ---- 汇总 ----
console.log('');
if (problems.length === 0) {
  console.log(ok('✓ 开发环境已就绪!'));
  console.log(dim('  运行 just dev 启动开发模式; 全部命令见 just --list (或 README)。'));
} else {
  console.log(err(`✗ 仍有 ${problems.length} 项未就绪: ${problems.join(' / ')}`));
  console.log(dim('  修复后重新执行 just dev-init 即可 (已就绪的组件会跳过)。'));
  process.exitCode = 1;
}
