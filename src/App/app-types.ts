// 应用分类 (App define 中的 Type) 的规范顺序与默认名称 (zh-CN)
//
// 单一来源: 侧边栏菜单分组 (App/index.tsx genMenuList) 与「我的收藏」按类型分组
// 均以此顺序展示; 各语言下的分类名由 i18n shell 词典的 cat.<key> 提供。
export type AppTypeDef = { key: string; name: string };

export const APP_TYPES: Array<AppTypeDef> = [
  { key: 'convert', name: '类型转换' },
  { key: 'codec', name: '编解码' },
  { key: 'crypto', name: '加解密' },
  { key: 'value-calc', name: '值计算' },
  { key: 'formatter', name: '格式化' },
  { key: 'image', name: '图片' },
  { key: 'generator', name: '生成器' },
  { key: 'webmaster', name: '站长工具' },
  { key: 'misc', name: '其它' },
];
