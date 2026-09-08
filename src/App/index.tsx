// 分类图标: 侧边栏(尤其折叠时)展示用
import { SwapOutlined, CodeOutlined, LockOutlined, CalculatorOutlined, GlobalOutlined, EllipsisOutlined, FormatPainterOutlined, PictureOutlined } from '@ant-design/icons';
import { Badge } from 'antd';
import type { ReactNode } from 'react';

const list = [
  'Hash',
  'HmacHash',
  'SHA3Hash',
  'KeccakHash',
  'BcryptCalc',
  'ScryptCalc',
  'Base64',
  'URL',
  'Time',
  'Color',
  'ColorConvert',
  'NumberConvert',
  'TreePathConvert',
  'QRCodeGenerator',
  'BarcodeGenerator',
  'AESCrypto',
  'RSACrypto',
  'SM2Crypto',
  'SM4Crypto',
  'CaesarCrypto',
  'RailFenceCrypto',
  'VigenereCrypto',
  'HillCrypto',
  'CiscoType7',
  'LineCount',
  'Unicode',
  'Punycode',
  'UUencode',
  'XXencode',
  'BCDCodec',
  'MorseCodec',
  'JWTDecoder',
  'BasicAuthCodec',
  'DESCrypto',
  'BlowfishCrypto',
  'RabbitCrypto',
  'RC2Crypto',
  'RC4Crypto',
  'RC5Crypto',
  'RC6Crypto',
  'ChaCha20Crypto',
  'TripleDESCrypto',
  'TEACrypto',
  'XTEACrypto',
  'XXTEACrypto',
  'BaseXCodec',
  'Base58Codec',
  'GzipCodec',
  'PBKDF2Calc',
  'CMACCalc',
  'HKDFCalc',
  'KMACCalc',
  'PPICalc',
  'ComplementCalc',
  'IPConvert',
  'BCCCheck',
  'LRCCheck',
  'CRCCheck',
  'Base64Image',
  //'ImageColor',
  'GPSConvert',
  'DownloadLinkConvert',
  'RMBConvert',
  'ByteConvert',
  'PinyinConvert',
  'TemperatureConvert',
  'DistanceConvert',
  'ConfigConvert',
  'SubtitleConvert',
  'SpeedConvert',
  'VolumeConvert',
  'AreaConvert',
  'WeightConvert',
  'HtpasswdGenerator',
  'RegexTester',
  'MarkdownEditor',
  'JsonFormatter',
  'JSON5Formatter',
  'SQLFormatter',
  'XmlFormatter',
  'HtmlFormat',
  'SvgFormat',
  'CnEnSpacing',
  'FileDiff',
  'DotMatrixFont',
  'KeyboardKeyInfo',
  'Chmod',
  'OTPGenerator',
  'AsciiImageGenerator',
  'AsciiTextArt',
  'CronRules',
  'HtmlStripText',
  'CodeShot',
  'IcoGenerator',
  'AppIconGenerator',
  'PlaceholderImage',
  'ShieldBadgeGenerator',
  'CIDRCalc',
  'PasswordGenerator',
  'BrowserFingerprint',
  'UrlExtract',
  'CookieAnalyzer',
  'UserAgentParser',
  'SitemapCheck',
  'KeywordDensity',
  'WebTDKCheck',
  'RobotsTxtGenerator',
];

import { defineLoader } from './app-modules';

// 加载 App 的定义 名称 / icon 
type DefineModule = { AppName :string; Icon :string; Type :string };
const loadAppDefine = async (app :string) :Promise<DefineModule | null> => {
  try {
    const m = await defineLoader(app)?.();
    if (!m) return null;
    return { AppName: String(m.AppName ?? ''), Icon: String(m.Icon ?? ''), Type: String(m.Type ?? '') };
  } catch (err) {
    console.log(err);
    return null;
  }
}

export type AppItem = {
  key: string, // app 编号 也是导航的 url 地址
  icon: any, //  app icon 图标
  "label": string, // app 名称
  type: string, // app 类型 
}

// 获取 App 列表: 并行加载所有 define, 全部就绪后按 list 顺序返回。
// (原实现只 await 最后一项的加载, 存在竞态: 靠后位置的 App 可能因加载完成晚于最后一项而丢失, 表现为菜单/页面打不开)
const getAppList = async () :Promise<Array<AppItem>> => {
  const mods = await Promise.all(list.map((item) => loadAppDefine(item)));
  const result:Array<AppItem> = [];
  mods.forEach((m, i) => {
    if(m) {
      //const img = (m.Icon === "")? '' : <Icon component={ m.Icon } />;
      result.push({ key: list[i], icon: m.Icon, label: m.AppName, type: m.Type });
    }
  });
  return result;
}

const appList = await getAppList();

// 生成 menu
export const genMenuList = (appList :Array<AppItem>) => {
  type MenuGroup = { key: string; label: ReactNode; icon: ReactNode; children: AppItem[]; name: string };
  // 菜单分组 key/icon 与 App define 中的 Type 对应
  // name: 分类纯文本名称 (供面包屑等非菜单场景使用, label 会在下方升级为含数量徽标的 ReactNode)
  let menuList = new Map<string, MenuGroup>([
    ["convert", { key: 'convert',  label: '类型转换',  name: '类型转换',  icon: <SwapOutlined />, children: new Array<AppItem>() }],
    ["codec", { key: 'codec',  label: '编解码',  name: '编解码',  icon: <CodeOutlined />, children: new Array<AppItem>() }],
    ["crypto", { key: 'crypto',  label: '加解密',  name: '加解密',  icon: <LockOutlined />, children: new Array<AppItem>() }],
    ["value-calc", { key: 'value-calc',  label: '值计算',  name: '值计算',  icon: <CalculatorOutlined />, children: new Array<AppItem>() }],
    ["formatter", { key: 'formatter',  label: '格式化',  name: '格式化',  icon: <FormatPainterOutlined />, children: new Array<AppItem>() }],
    ["image", { key: 'image',  label: '图片',  name: '图片',  icon: <PictureOutlined />, children: new Array<AppItem>() }],
    ["webmaster", { key: 'webmaster',  label: '站长工具',  name: '站长工具',  icon: <GlobalOutlined />, children: [] as AppItem[] }],
    ["misc", { key: 'misc',  label: '其它',  name: '其它',  icon: <EllipsisOutlined />, children: [] as AppItem[] }],
  ]);

  // todo 收藏
  // 按 app type 分类
  for(let item of appList) {
    if(menuList.has(item.type)) {
      let v = menuList.get(item.type);
      v?.children?.push(item)
      if(v !== undefined) menuList.set(item.type,v);
    }
  }
  // 分类应用数徽标: 菜单展开时各分类标题右侧显示所属应用数量
  for (const g of menuList.values()) {
    const count = g.children.length;
    g.label = (
      <span className="menu-group-label">
        <span>{ g.label }</span>
        { count > 0 && <Badge count={ count } size="small" overflowCount={ 999 } style={ { backgroundColor: '#1677ff' } } /> }
      </span>
    );
  }
  return Array.from(menuList.values());
}

// 定义 App
// const appList = [
//   {
//     key: 'Hash',
//     icon: "",
//     label: 'Hash 值计算',
//   },
//   {
//     key: 'Base64',
//     icon: "",
//     label: 'Base64 编解码',
//   },
//   {
//     key: 'URL',
//     icon: "",
//     label: 'URL 编解码',
//   },
//   {
//     key: 'Time',
//     icon: "",
//     label: '时间戳转换',
//   },
//   {
//     key: 'Color',
//     icon: "",
//     label: 'CSS 配色',
//   },
//   {
//     key: 'ColorConvert',
//     icon: "",
//     label: '颜色格式转换',
//   },
//   {
//     key: 'NumberConvert',
//     icon: "",
//     label: '进制转换',
//   },
//   {
//     key: 'QRCodeGenerator',
//     icon: "",
//     label: '二维码生成',
//   },
//   {
//     key: 'AESCrypto',
//     icon: "",
//     label: 'AES 加解密',
//   },
// ];

export {
  appList
}
