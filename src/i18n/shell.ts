// 框架级语言包 (不归属单一应用): 分类名 / 侧栏 / 标签页 / 通用提示
// 结构: default = zh-CN; zh-CN 缺省词条在取词时回退 (此处完整三语)
import type { LangPack } from './lang';

const shell: LangPack = {
  default: 'zh-CN',
  'zh-CN': {
    // 菜单分类 (convert/codec/crypto/value-calc/formatter/image/webmaster/misc)
    'cat.convert': '类型转换',
    'cat.codec': '编解码',
    'cat.crypto': '加解密',
    'cat.value-calc': '值计算',
    'cat.formatter': '格式化',
    'cat.image': '图片',
    'cat.webmaster': '站长工具',
    'cat.misc': '其它',
    // 设置中心左侧「系统设置」分组
    system: '系统设置',
    // 侧栏收起/展开
    'sider.expand': '展开',
    'sider.collapse': '收起',
    // 界面语言切换入口 (左下设置旁 / 设置中心)
    lang: '界面语言',
    // 底部版本角标 (有新版本)
    'update.dot': '有新版 v{v} 可用, 点击查看更新内容并下载',
    // 标签页右键菜单
    'tabs.left': '关闭左侧',
    'tabs.right': '关闭右侧',
    'tabs.others': '关闭其他',
    // 懒加载页 fallback
    loading: '应用正在加载中...',
  },
  'zh-TW': {
    'cat.convert': '類型轉換',
    'cat.codec': '編解碼',
    'cat.crypto': '加解密',
    'cat.value-calc': '值計算',
    'cat.formatter': '格式化',
    'cat.image': '圖片',
    'cat.webmaster': '站長工具',
    'cat.misc': '其他',
    system: '系統設定',
    'sider.expand': '展開',
    'sider.collapse': '收起',
    lang: '介面語言',
    'update.dot': '有新版本 v{v} 可用，點擊查看更新內容並下載',
    'tabs.left': '關閉左側',
    'tabs.right': '關閉右側',
    'tabs.others': '關閉其他',
    loading: '應用載入中...',
  },
  en: {
    'cat.convert': 'Converters',
    'cat.codec': 'Codecs & Encoders',
    'cat.crypto': 'Cryptography',
    'cat.value-calc': 'Hash & Value Calculators',
    'cat.formatter': 'Formatters & Editors',
    'cat.image': 'Image Generators',
    'cat.webmaster': 'Webmaster Tools',
    'cat.misc': 'Utilities',
    system: 'System',
    'sider.expand': 'Expand',
    'sider.collapse': 'Collapse',
    lang: 'Language',
    'update.dot': 'New version v{v} available, click to view & download',
    'tabs.left': 'Close Left',
    'tabs.right': 'Close Right',
    'tabs.others': 'Close Others',
    loading: 'App loading...',
  },
};

export default shell;
