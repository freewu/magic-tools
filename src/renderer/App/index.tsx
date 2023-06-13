const list = [
  'Hash',
  'HmacHash',
  'Base64',
  'URL',
  'Time',
  'Color',
  'ColorConvert',
  'NumberConvert',
  'QRCodeGenerator',
  //'AESCrypto',
  'SQLFormatter',
  'LineCount',
  'Unicode',
  'DESCrypto',
];

// 加载 App 的定义 名称 / icon 
const loadApp = (app :string,callback :Function) => {
  return import(`./${app}/define`)
    .then( ({ AppName, Icon, Type }) => { callback({ AppName, Icon, Type }) })
    .catch( (err:any) => console.log(err) );
}

export type AppItem = {
  key: string, // app 编号 也是导航的 url 地址
  icon: any, //  app icon 图标
  "label": string, // app 名称
  type: string, // app 类型 
}

// 获取 App 列表
const getAppList = async () => {
  let result:Array<AppItem> = [];
  let p;
  list.forEach( item => {
    p = loadApp(item,({ AppName, Icon, Type } : any) => {
      //const img = (Icon === "")? '' : <Icon component={ Icon } />;
      result.push({ key: item, icon: Icon, label: AppName, type: Type });
    });
  })
  await p;
  return result;
}

const appList = await getAppList();


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