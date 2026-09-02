// jest 测试环境全局补丁
// jsdom 环境下缺少 TextEncoder / TextDecoder (部分 jsdom 版本不会暴露这两个全局对象)
// 浏览器与 Node 环境中均可用, 这里仅为让 ts-jest 单元测试正常运行
import { TextEncoder, TextDecoder } from 'util';

declare const global: any;
if(typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if(typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
// jsdom 未实现 window.matchMedia (主题 / 响应式组件需要)
if(typeof global.matchMedia === 'undefined') {
  global.matchMedia = (query :string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
