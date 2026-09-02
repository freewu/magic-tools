// 条形码格式列表 (value 与 jsbarcode 的 format 名称一致)
export type BarcodeFormatItem = {
  value: string,
  label: string,
  hint: string,
}

const barcodeFormatList: BarcodeFormatItem[] = [
  { value: 'CODE128', label: 'CODE128', hint: '自动切换 A/B/C 子集, 支持全部可打印 ASCII 字符' },
  { value: 'CODE128A', label: 'CODE128 A', hint: '数字、大写字母与常用符号 (ASCII 32-95)' },
  { value: 'CODE128B', label: 'CODE128 B', hint: 'ASCII 32-127 (含小写字母)' },
  { value: 'CODE128C', label: 'CODE128 C', hint: '仅数字且位数必须为偶数' },
  { value: 'EAN13', label: 'EAN-13', hint: '输入 12 位自动补校验位, 或输入完整 13 位' },
  { value: 'EAN8', label: 'EAN-8', hint: '输入 7 位自动补校验位, 或输入完整 8 位' },
  { value: 'UPC', label: 'UPC-A', hint: '输入 11 位自动补校验位, 或输入完整 12 位' },
  { value: 'CODE39', label: 'CODE39', hint: '0-9 A-Z 及 - . 空格 $ / + %' },
  { value: 'ITF14', label: 'ITF-14', hint: '输入 13 位自动补校验位, 或输入完整 14 位' },
  { value: 'ITF', label: 'ITF 交错 2/5', hint: '仅数字且位数必须为偶数' },
  { value: 'MSI', label: 'MSI', hint: 'MSI (Mod 10 校验)' },
  { value: 'MSI10', label: 'MSI 10', hint: 'Mod 10 校验位' },
  { value: 'MSI11', label: 'MSI 11', hint: 'Mod 11 校验位' },
  { value: 'MSI1010', label: 'MSI 1010', hint: '双 Mod 10 校验位' },
  { value: 'MSI1110', label: 'MSI 1110', hint: 'Mod 11 + Mod 10 校验位' },
  { value: 'pharmacode', label: 'Pharmacode', hint: '取值范围 3-131070' },
];

export {
  barcodeFormatList,
}
