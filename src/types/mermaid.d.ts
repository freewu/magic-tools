// mermaid 官方类型依赖 @types/d3 (含 TS 5 语法), 与本项目 TypeScript 4.9 不兼容;
// 这里用最小声明覆盖, 仅覆盖我们用到的 API (initialize / render / parse)
declare module 'mermaid' {
  export interface RenderResult { svg: string; bindFunctions?: (element: Element) => void; }
  export interface MermaidConfig {
    startOnLoad?: boolean;
    theme?: string;
    securityLevel?: string;
    fontFamily?: string;
    [key: string]: unknown;
  }
  export interface MermaidAPI {
    initialize: (config: MermaidConfig) => void;
    render: (id: string, text: string) => Promise<RenderResult>;
    parse: (text: string, options?: { suppressErrors?: boolean }) => Promise<boolean>;
  }
  const mermaid: MermaidAPI;
  export default mermaid;
}
