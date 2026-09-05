/// <reference types="vite/client" />
// 应用页面/定义的模块收集器 (替代原 webpack context 模板字符串动态导入)
//
// 背景: webpack 支持 import(`../App/${key}`) 目录 context 打包;
// Vite/Rollup 无法静态分析模板字符串动态导入, 会静默丢包。
// 这里改用 import.meta.glob 在构建期静态枚举 src/App/* 下全部页面与定义,
// 保持"新增工具目录即自动注册"的既有约定。
import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

// key: './MorseCodec/index.tsx' -> () => Promise<模块>
const pageGlob = import.meta.glob('./*/index.tsx');
// key: './MorseCodec/define.tsx' -> () => Promise<{ AppName, Icon, Type }>
const defineGlob = import.meta.glob<Record<string, unknown>>('./*/define.tsx');

/** 懒加载页面组件 (src/App/<key>/index.tsx 默认导出) */
const lazyCache = new Map<string, LazyExoticComponent<ComponentType<Record<string, never>>>>();
export function lazyPage(key: string): LazyExoticComponent<ComponentType<Record<string, never>>> {
  let comp = lazyCache.get(key);
  if (!comp) {
    const loader = pageGlob[`./${key}/index.tsx`];
    if (!loader) throw new Error('未知应用页面: ' + key);
    comp = lazy(loader as () => Promise<{ default: ComponentType<Record<string, never>> }>);
    lazyCache.set(key, comp);
  }
  return comp;
}

/** 应用定义加载器 (src/App/<app>/define.tsx 具名导出 AppName/Icon/Type) */
export function defineLoader(app: string): (() => Promise<Record<string, unknown>>) | undefined {
  return defineGlob[`./${app}/define.tsx`];
}
