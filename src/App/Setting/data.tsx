
import { SettingSystem } from "./setting-system"
import { SettingCrypto } from "./setting-crypto"
import { SettingValueCalc } from "./setting-value-calc"
import { SettingConvert } from "./setting-convert"
import { SettingCodec } from "./setting-codec"
import { SettingMisc } from "./setting-misc"
import { SettingWebmaster } from "./setting-webmaster"
import { SettingFormatter } from "./setting-formatter"

export const itemList = [
  {
    key : 'system',
    label : '系统设置',
    children: <SettingSystem />
  },
  {
    key : 'convert',
    label : '类型转换',
    children: <SettingConvert />
  },
  {
    key : 'codec',
    label : '编解码',
    children: <SettingCodec />
  },
  {
    key : 'crypto',
    label : '加解密',
    children: <SettingCrypto />
  },
  {
    key : 'value-calc',
    label : '值计算',
    children: <SettingValueCalc />
  },
  {
    key : 'formatter',
    label : '格式化',
    children: <SettingFormatter />
  },
  {
    key : 'webmaster',
    label : '站长工具',
    children: <SettingWebmaster />
  },
  {
    key : 'misc',
    label : '其它',
    children: <SettingMisc />
  },
];