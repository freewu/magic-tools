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

// fast-xml-parser: CJS (src/fxp.js) 无自带类型; 镜像无 @types, 此处按实际使用面声明
// (Vite 对 CJS 做 named-export interop, XMLParser/XMLBuilder 可直接具名导入)
declare module 'fast-xml-parser' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type XmlParserOptions = Record<string, any>;
  export class XMLParser {
    constructor(options?: XmlParserOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parse(xml: string): any;
  }
  export class XMLBuilder {
    constructor(options?: XmlParserOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    build(obj: any): string | boolean;
  }
  export class XMLValidator {
    static validate(xmlData: string, options?: Record<string, unknown>): true | { err: { code?: string; msg: string; line?: number; col?: number } };
  }
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


// svgo: 浏览器分支子路径 (svgo 自身类型仅覆盖主入口; moduleResolution=node 下子路径无类型)
// 实际实现为 ESM 的 svgo/dist/svgo.browser.js (无 node 内建依赖), 由 vite exports 映射解析
declare module 'svgo/browser' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function optimize(source: string, config?: any): Promise<{ data?: string; error?: string }>;
}

// ---- Shiki (代码截图): 浏览器按需语言/主题模块 ----
// shiki v4 仅提供 exports 子路径/ESM 类型; 项目 moduleResolution=node 无法解析子路径类型,
// 运行时由 vite 依据 package exports 映射, 此处仅保证 tsc/jest 类型面可用 (实现见 node_modules/@shikijs)
declare module 'shiki/core' {
  export function createHighlighterCore(options?: Record<string, unknown>): Promise<Highlighter>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Highlighter = any;
}
declare module 'shiki/engine/javascript' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createJavaScriptRegexEngine(): any;
}
declare module '@shikijs/langs/*' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lang: any;
  export default lang;
}
declare module '@shikijs/themes/*' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const theme: any;
  export default theme;
}
