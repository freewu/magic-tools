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
