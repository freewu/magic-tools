// 分类图标: 侧边栏(尤其折叠时)展示用
import { SwapOutlined, CodeOutlined, LockOutlined, CalculatorOutlined, GlobalOutlined, EllipsisOutlined } from '@ant-design/icons';

const list = [
  'Hash',
  'HmacHash',
  'SHA3Hash',
  'KeccakHash',
  'Base64',
  'URL',
  'Time',
  'Color',
  'ColorConvert',
  'NumberConvert',
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
  'SQLFormatter',
  'LineCount',
  'Unicode',
  'Punycode',
  'UUencode',
  'XXencode',
  'MorseCodec',
  'JWTDecoder',
  'DESCrypto',
  'RabbitCrypto',
  'RC4Crypto',
  'TripleDESCrypto',
  'TEACrypto',
  'XTEACrypto',
  'XXTEACrypto',
  'Base58Codec',
  'PBKDF2Calc',
  'BCCCheck',
  'LRCCheck',
  'CRCCheck',
  //'BaseXCodec',
  'Base64Image',
  //'ImageColor',
  'GPSConvert',
  'RMBConvert',
  'ByteConvert',
  'PinyinConvert',
  'TemperatureConvert',
  'DistanceConvert',
  'ConfigConvert',
  'SpeedConvert',
  'VolumeConvert',
  'AreaConvert',
  'WeightConvert',
  'HtpasswdGenerator',
  'WebTDKCheck',
  'RobotsTxtGenerator',
];

// 加载 App 的定义 名称 / icon 
type DefineModule = { AppName :string; Icon :string; Type :string };
const loadAppDefine = async (app :string) :Promise<DefineModule | null> => {
  try {
    const m = await import(`./${app}/define`);
    return { AppName: m.AppName, Icon: m.Icon, Type: m.Type };
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
  // 菜单分组 key/icon 与 App define 中的 Type 对应
  let menuList = new Map([
    ["convert", { key: 'convert',  label: '类型转换',  icon: <SwapOutlined />, children: new Array<AppItem> }],
    ["codec", { key: 'codec',  label: '编解码',  icon: <CodeOutlined />, children: new Array<AppItem> }],
    ["crypto", { key: 'crypto',  label: '加解密',  icon: <LockOutlined />, children: new Array<AppItem> }],
    ["value-calc", { key: 'value-calc',  label: '值计算',  icon: <CalculatorOutlined />, children: new Array<AppItem> }],
    //["formatter", { key: 'formatter',  label: '格式化',  icon: '', children: new Array<AppItem> }],
    ["webmaster", { key: 'webmaster',  label: '站长工具',  icon: <GlobalOutlined />, children:[] }],
    ["misc", { key: 'misc',  label: '其它',  icon: <EllipsisOutlined />, children:[] }],
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
