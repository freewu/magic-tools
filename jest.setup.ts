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
// jsdom 20 未实现 Blob.prototype.arrayBuffer / text (读取上传文件字节的用例需要, 浏览器原生支持)
if(typeof Blob.prototype.arrayBuffer === 'undefined') {
  // 以 FileReader 兜底实现 (jsdom 已实现 FileReader)
  Blob.prototype.arrayBuffer = function(this :Blob) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
      reader.readAsArrayBuffer(this);
    });
  };
}
if(typeof Blob.prototype.text === 'undefined') {
  Blob.prototype.text = function(this :Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
      reader.readAsText(this);
    });
  };
}

// React 18.3 起弃用 react-dom/test-utils 的 act, 而 @testing-library/react 内部仍经由
// act-compat 调用它 (开发构建在每次 mounted 渲染时打印 ReactDOMTestUtils.act 弃用警告)。
// 这是 testing-library 与 React 版本组合的已知噪音, 与测试正确性无关, 全局过滤该条消息
// (其余 console.error 原样透传)
const setupConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const first = typeof args[0] === 'string' ? args[0] : '';
  if (first.includes('ReactDOMTestUtils.act') || first.includes('react-dom/test-utils')) {
    return;
  }
  setupConsoleError(...args);
};

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
