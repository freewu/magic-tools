// 蜘蛛纸牌 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '蜘蛛紙牌' },
  en: { appName: 'Spider Solitaire' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺省回退 zh)
const rows: Record<string, [string, string]> = {
  // 标题 / 面板
  '蜘蛛纸牌': ['蜘蛛紙牌', 'Spider Solitaire'],
  '蜘蛛纸牌说明': ['蜘蛛紙牌說明', 'About Spider Solitaire'],
  '局号': ['局號', 'Deal'],
  '发牌': ['發牌', 'Deal'],
  '新局 (N)': ['新局 (N)', 'New deal (N)'],
  '重开本局 (R)': ['重開本局 (R)', 'Redeal (R)'],
  '撤销 (Z)': ['復原 (Z)', 'Undo (Z)'],
  '提示 (H)': ['提示 (H)', 'Hint (H)'],
  '发一轮牌 (D)': ['發一輪牌 (D)', 'Deal a row (D)'],
  '收牌 (C)': ['收牌 (C)', 'Collect (C)'],
  '全屏': ['全螢幕', 'Fullscreen'],
  '退出全屏': ['退出全螢幕', 'Exit fullscreen'],
  'Esc 退出全屏': ['Esc 退出全螢幕', 'Esc exits fullscreen'],
  // 难度
  '难度': ['難度', 'Difficulty'],
  '一花色 (简单)': ['一花色 (簡單)', 'One suit (easy)'],
  '两花色 (中等)': ['兩花色 (中等)', 'Two suits (medium)'],
  '四花色 (困难)': ['四花色 (困難)', 'Four suits (hard)'],
  // 统计
  '用时': ['用時', 'Time'],
  '步数': ['步數', 'Moves'],
  '已收牌': ['已收牌', 'Completed'],
  '牌堆': ['牌堆', 'Stock'],
  '还剩 {n} 张': ['還剩 {n} 張', '{n} cards left'],
  '还能发 {n} 轮': ['還能發 {n} 輪', '{n} deals left'],
  '胜利 {n} 次': ['勝利 {n} 次', '{n} wins'],
  '最快 {t}': ['最快 {t}', 'Best {t}'],
  '最少 {n} 步': ['最少 {n} 步', 'Fewest {n} moves'],
  '暂无记录': ['暫無記錄', 'No record yet'],
  // 操作提示 / 反馈
  '拖动牌到目标列, 或选中牌后点击目标列即可移动': [
    '拖動牌到目標列, 或選中牌後點擊目標列即可移動',
    'Drag a card onto a column, or pick it and click the column',
  ],
  '拖动时会高亮可放下的位置, 无效位置会弹回': [
    '拖動時會高亮可放下的位置, 無效位置會彈回',
    'Valid targets light up while dragging; invalid drops bounce back',
  ],
  '只能移动同花色的降序连牌': ['只能移動同花色的降序連牌', 'Only same-suit descending runs can move'],
  '这张牌上方压着不成连牌的牌, 只能移动同花色的降序连牌': [
    '這張牌上方壓著不成連牌的牌, 只能移動同花色的降序連牌',
    'Cards on top of this one break the run — only same-suit descending runs can move',
  ],
  '这里接不上: 只能放到比它大 1 的牌上': [
    '這裡接不上: 只能放到比它大 1 的牌上',
    'No fit here — it only goes on a card one rank higher',
  ],
  '双击一张牌可自动移到能接住它的列': [
    '雙擊一張牌可自動移到能接住它的列',
    'Double-click a card to send it to a column that accepts it',
  ],
  '键盘: N 新局 · R 重开本局 · Z 撤销 · H 提示 · D 发一轮牌 · C 收牌': [
    '鍵盤: N 新局 · R 重開本局 · Z 復原 · H 提示 · D 發一輪牌 · C 收牌',
    'Keys: N new deal · R redeal · Z undo · H hint · D deal a row · C collect',
  ],
  '凑齐 K 到 A 的同花顺会自动收走, 收满 8 组即通关': [
    '湊齊 K 到 A 的同花順會自動收走, 收滿 8 組即通關',
    'A same-suit run from King down to Ace is collected automatically — 8 runs win the deal',
  ],
  '有空列时不能发牌, 先把空列填上': [
    '有空列時不能發牌, 先把空列填上',
    'You cannot deal while a column is empty — fill it first',
  ],
  '牌堆已经空了': ['牌堆已經空了', 'The stock is empty'],
  '已收 {n} 组': ['已收 {n} 組', '{n} runs collected'],
  '还没有能收的同花顺': ['還沒有能收的同花順', 'No completed run yet'],
  '没有可走的牌': ['沒有可走的牌', 'No move found'],
  '没有可接的牌, 试试发一轮牌 (D)': [
    '沒有可接的牌, 試試發一輪牌 (D)',
    'Nothing accepts that card — try dealing a row (D)',
  ],
  '无路可走, 可撤销 (Z) 或重开本局 (R)': [
    '無路可走, 可復原 (Z) 或重開本局 (R)',
    'No moves left — undo (Z) or redeal (R)',
  ],
  // 通关
  '恭喜通关!': ['恭喜通關!', 'You win!'],
  '本局用时 {t}, 共 {n} 步': ['本局用時 {t}, 共 {n} 步', 'Finished in {t} with {n} moves'],
  '再玩一局': ['再玩一局', 'Play again'],
  '重玩本局': ['重玩本局', 'Replay this deal'],
  '已清空战绩记录': ['已清空戰績記錄', 'Records cleared'],
  '最快用时 / 最少步数清空后无法恢复': [
    '最快用時 / 最少步數清空後無法恢復',
    'Fastest time / fewest moves cannot be restored once cleared',
  ],
};

// 取词: 无命中回退 zh 原文
export const u = (locale: string, zh: string): string => {
  const hit = rows[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};

// 带占位符取词: {name} -> 值
export const uT = (locale: string, zhTpl: string, vars?: Record<string, string | number>): string => {
  let out = u(locale, zhTpl);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
  return out;
};
