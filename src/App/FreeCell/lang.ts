// FreeCell 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '新接龍' },
  en: { appName: 'FreeCell' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺省回退 zh)
const rows: Record<string, [string, string]> = {
  // 标题 / 面板
  '空档接龙': ['新接龍', 'FreeCell'],
  '空档接龙说明': ['新接龍說明', 'About FreeCell'],
  '局号': ['局號', 'Deal'],
  '发牌': ['發牌', 'Deal'],
  '新局 (N)': ['新局 (N)', 'New deal (N)'],
  '重开本局 (R)': ['重開本局 (R)', 'Redeal (R)'],
  '撤销 (Z)': ['復原 (Z)', 'Undo (Z)'],
  '提示 (H)': ['提示 (H)', 'Hint (H)'],
  '自动收牌 (A)': ['自動收牌 (A)', 'Auto collect (A)'],
  '全屏': ['全螢幕', 'Fullscreen'],
  '退出全屏': ['退出全螢幕', 'Exit fullscreen'],
  'Esc 退出全屏': ['Esc 退出全螢幕', 'Esc exits fullscreen'],
  // 统计
  '用时': ['用時', 'Time'],
  '步数': ['步數', 'Moves'],
  '已收牌': ['已收牌', 'Collected'],
  '自由格': ['自由格', 'Free cells'],
  '收集区': ['收集區', 'Foundations'],
  '牌桌': ['牌桌', 'Tableau'],
  '胜利 {n} 次': ['勝利 {n} 次', '{n} wins'],
  '最快 {t}': ['最快 {t}', 'Best {t}'],
  '最少 {n} 步': ['最少 {n} 步', 'Fewest {n} moves'],
  '暂无记录': ['暫無記錄', 'No record yet'],
  // 操作提示 / 反馈
  '已收 {n} 张牌': ['已收 {n} 張牌', '{n} cards collected'],
  '暂无可自动收的牌': ['暫無可自動收的牌', 'Nothing to collect right now'],
  '没有可走的牌': ['沒有可走的牌', 'No move found'],
  '只能移动连续的降序异色牌组': ['只能移動連續的降序異色牌組', 'Only descending, alternating-color runs can move'],
  '无路可走, 可撤销 (Z) 或重开本局 (R)': [
    '無路可走, 可復原 (Z) 或重開本局 (R)',
    'No moves left — undo (Z) or redeal (R)',
  ],
  '拖动牌到目标位置, 或选中牌后点击目标位置即可移动': [
    '拖動牌到目標位置, 或選中牌後點擊目標位置即可移動',
    'Drag a card onto its target, or pick it and click where it should go',
  ],
  '拖动时会高亮可放下的位置, 无效位置会弹回': [
    '拖動時會高亮可放下的位置, 無效位置會彈回',
    'Valid targets light up while dragging; invalid drops bounce back',
  ],
  '双击一张牌可自动移动到收集区或牌桌': [
    '雙擊一張牌可自動移動到收集區或牌桌',
    'Double-click a card to send it to a foundation or tableau',
  ],
  '开局': ['開局', 'Deal opened'],
  '已重开本局': ['已重開本局', 'Deal restarted'],
  // 通关
  '恭喜通关!': ['恭喜通關!', 'You win!'],
  '本局用时 {t}, 共 {n} 步': ['本局用時 {t}, 共 {n} 步', 'Finished in {t} with {n} moves'],
  '再玩一局': ['再玩一局', 'Play again'],
  '重玩本局': ['重玩本局', 'Replay this deal'],
  '只要还有可移动的牌就能继续, 玩到四叠收集区都收满 K 即通关': [
    '只要還有可移動的牌就能繼續, 玩到四疊收集區都收滿 K 即通關',
    'Keep going while moves remain — you win when all four foundations reach King',
  ],
  '已清空战绩记录': ['已清空戰績記錄', 'Records cleared'],
  '最快用时 / 最少步数清空后无法恢复': [
    '最快用時 / 最少步數清空後無法恢復',
    'Fastest time / fewest moves cannot be restored once cleared',
  ],
  // 键盘说明
  '键盘: N 新局 · R 重开本局 · Z 撤销 · H 提示 · A 自动收牌': [
    '鍵盤: N 新局 · R 重開本局 · Z 復原 · H 提示 · A 自動收牌',
    'Keys: N new deal · R redeal · Z undo · H hint · A auto collect',
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
