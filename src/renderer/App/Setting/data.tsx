
import { SettingSystem } from "./setting-system"
import { SettingCrypto } from "./setting-crypto"
import { SettingValueCalc } from "./setting-value-calc"
import { SettingConvert } from "./setting-convert"
import { SettingMisc } from "./setting-misc"

export const itemList = [
  {
    key : 'system',
    label : '系统设置',
    children: <SettingSystem />
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
    key : 'convert',
    label : '类型转换',
    children: <SettingConvert />
  },
  {
    key : 'misc',
    label : '其它',
    children: <SettingMisc />
  },
];