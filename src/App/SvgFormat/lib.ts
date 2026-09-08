// SVG 格式化/压缩 纯逻辑层 (基于 SVGO)
// - svgoConfigFor: 构建 SVGO 配置 (可单测)
// - optimizeSvgXml: 真实执行优化; node/jest 环境走 CJS 包, 浏览器走 svgo/browser (ESM 无 node 依赖)

import type { Config } from 'svgo';

export type SvgMode = 'pretty' | 'min';

export interface SvgResult {
  ok: boolean;
  data: string;
  /** 优化前后字节数变化 (有值时才准确) */
  beforeBytes?: number;
  afterBytes?: number;
  error?: string;
}

const nodeEnv = typeof process !== 'undefined' && !!process.versions?.node;

/** 依据模式构建 SVGO 配置 */
export function svgoConfigFor(mode: SvgMode, indent = 2): Config {
  return {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // 保留 viewBox 与 xml 声明以便通用
            removeViewBox: false,
            removeXMLNS: false,
            removeTitle: false,
            removeDesc: false,
          },
        },
      },
    ],
    js2svg: {
      pretty: mode === 'pretty',
      indent: mode === 'pretty' ? Math.max(1, Math.min(8, indent)) : 2,
    },
  };
}

function bytesOf(s: string): number {
  return new TextEncoder().encode(s).length;
}

async function loadSvgo(): Promise<{ optimize: (src: string, cfg: Config) => Promise<{ data?: string; error?: string }> }> {
  if (nodeEnv) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = await import('svgo');
    return mod as unknown as { optimize: (src: string, cfg: Config) => Promise<{ data?: string; error?: string }> };
  }
  const mod = await import('svgo/browser');
  return mod as unknown as { optimize: (src: string, cfg: Config) => Promise<{ data?: string; error?: string }> };
}

export async function optimizeSvgXml(source: string, mode: SvgMode, indent = 2): Promise<SvgResult> {
  const src = String(source ?? '');
  if (!src.trim()) return { ok: false, data: '', error: '请输入 SVG 内容' };
  try {
    const svgo = await loadSvgo();
    const ret = await svgo.optimize(src, svgoConfigFor(mode, indent));
    if (!ret || typeof ret.data !== 'string' || !ret.data) {
      return { ok: false, data: '', error: ret?.error || 'SVGO 优化失败' };
    }
    const beforeBytes = bytesOf(src);
    const afterBytes = bytesOf(ret.data);
    return { ok: true, data: ret.data, beforeBytes, afterBytes };
  } catch (e) {
    return { ok: false, data: '', error: e instanceof Error ? e.message : String(e) };
  }
}
