// 代码截图 - canonical 语言 id 集合 (单独文件承载对 @shikijs/langs 的静态导入,
// 避免与 engine.ts 的 import.meta.glob 动态依赖同一模块导致 vite 混合加载提示)
import { languageNames } from '@shikijs/langs';

export const CANONICAL_LANG_SET: ReadonlySet<string> = new Set(languageNames);
