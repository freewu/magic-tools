// 无官方类型声明的 CJS 依赖声明 (Vite/ESM 构建下用 import 引入)
// base-x: module.exports = (alphabet) => ({ encode, decode })
declare module 'base-x' {
  interface BaseXCodec {
    encode(input: Uint8Array | string): string;
    decode(input: string): Uint8Array;
  }
  function baseX(alphabet: string): BaseXCodec;
  export default baseX;
}

// toml-patch: module.exports = { parse, patch, stringify } (ESM 构建解析到 dist/toml-patch.es.js 的 named 导出)
declare module 'toml-patch' {
  export function stringify(value: unknown, options?: unknown): string;
  // 返回 any 以兼容历史业务代码 (直接作为 json 对象返回给调用方)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function parse(text: string, options?: unknown): any;
  export function patch(source: string, ...rest: unknown[]): unknown;
}

// CompressionStream / DecompressionStream (TS 4.9 的 DOM lib 未收录; 运行时为 Chromium/WebView2/Node 18+ 全局 API)
// 本文件为 script (无 import/export), 顶层声明即全局; 使用方以 /// <reference> 引入
interface CompressionStream {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
}
declare var CompressionStream: {
  prototype: CompressionStream;
  new (format: 'gzip' | 'deflate' | 'deflate-raw'): CompressionStream;
};
interface DecompressionStream {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
}
declare var DecompressionStream: {
  prototype: DecompressionStream;
  new (format: 'gzip' | 'deflate' | 'deflate-raw'): DecompressionStream;
};

