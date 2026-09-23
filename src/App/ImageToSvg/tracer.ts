// 图片转 SVG: VTracer (WASM) 封装
//
// 只在「图片转 SVG」页面被动态 import (见 index.tsx 的 await import('./tracer')),
// 这样 vtracer 的 JS 包装与 wasm 都不会进首屏, 只在真正开始矢量化时才拉取。
//
// 说明: vtracer-wasm 的默认初始化路径写死了 vtracer_bg.wasm (包内实际文件名为 vtracer.wasm),
//       因此这里显式传入 wasm 资源 URL (由 Vite 以 ?url 形式处理, 构建产物带哈希)。
import init, { to_svg } from 'vtracer-wasm';
import wasmUrl from 'vtracer-wasm/vtracer.wasm?url';
import type { TraceRequest } from './lib';

let ready: Promise<unknown> | null = null;

/** 初始化 WASM 引擎 (幂等, 只做一次) */
export const initTracer = (): Promise<unknown> => {
  if (!ready) {
    ready = init({ module_or_path: wasmUrl }).catch((e) => {
      // 初始化失败时清空, 允许用户重试 (例如资源被拦截后的再次点击)
      ready = null;
      throw e;
    });
  }
  return ready;
};

/**
 * RGBA 像素 -> SVG 文本
 * @param rgba   宽 * 高 * 4 字节, 顺序 R G B A
 * @param width  宽 (像素)
 * @param height 高 (像素)
 * @param options VTracer 配置 (见 lib.ts toRequest, 11 个字段必须齐全)
 */
export const rasterToSvg = async (
  rgba: Uint8Array,
  width: number,
  height: number,
  options: TraceRequest,
): Promise<string> => {
  await initTracer();
  return to_svg(rgba, width, height, options);
};

/** 仅测试用: 重置初始化状态 */
export const resetTracer = (): void => { ready = null; };
