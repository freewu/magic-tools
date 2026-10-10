// 高精度十进制计算封装 (基于 bignumber.js)
// 各类「转换」工具的单位换算统一走这里, 避免 JS 浮点误差:
//   例如 0.1 + 0.2 !== 0.3、500 / 15 这类除不尽的市制/温标换算
import BigNumber from 'bignumber.js';

// 除法保留 40 位小数: 足够覆盖 1/3、5/15000000 等无限循环小数, 又不至于让数字无限膨胀
BigNumber.config({ DECIMAL_PLACES: 40 });

export { BigNumber };

// 合法数字文本: 可选正负号 + 整数/小数 (不允许科学计数法与千分位)
const NUMBER_RE = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

/** 解析用户输入的文本; 空串 / 含非法字符 / 非有限数一律返回 null */
export const parseBN = (value :string | null | undefined) :BigNumber | null => {
  const text = (value ?? '').trim();
  if (text === '' || !NUMBER_RE.test(text)) return null;
  const n = new BigNumber(text);
  return n.isFinite() ? n : null;
};

/**
 * 把 BigNumber 格式化成便于阅读的普通十进制字符串:
 * - 最多保留 maxDecimals 位小数 (四舍五入), 并去掉末尾多余的 0
 * - 数值极小 (按 maxDecimals 舍入后为 0) 时退回完整精度, 避免直接显示成 0
 * - 始终使用定点表示, 不会出现 1e+21 / 1e-7 这类科学计数法
 */
export const formatBN = (n :BigNumber, maxDecimals = 10) :string => {
  if (!n || !n.isFinite()) return '';
  if (n.isZero()) return '0';
  let r = n.decimalPlaces(maxDecimals, BigNumber.ROUND_HALF_UP);
  if (r.isZero()) r = n; // 极小值: 用完整精度展示
  return r.toFixed();
};
