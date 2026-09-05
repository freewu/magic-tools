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
