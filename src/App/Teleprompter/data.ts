// 提词器: 选项范围 / 默认值 / 配色 / 示例脚本
// 说明: 数值范围集中在此, 校验与容错逻辑在 lib.ts, 页面只读取这里的常量

/** 滚动速度 (像素/秒): 字号越大, 同样的阅读节奏需要的像素速度越高 */
export const SPEED_MIN = 10;
export const SPEED_MAX = 240;
export const SPEED_STEP = 5;
export const SPEED_DEFAULT = 60;

/** 字号 (px) */
export const FONT_SIZE_MIN = 18;
export const FONT_SIZE_MAX = 96;
export const FONT_SIZE_DEFAULT = 40;

/** 行距倍率 */
export const LINE_HEIGHT_MIN = 1.2;
export const LINE_HEIGHT_MAX = 2.6;
export const LINE_HEIGHT_DEFAULT = 1.8;

/** 首尾留白占视口高度的比例: 让第一行从下方进入、最后一行停在视线位置 */
export const PAD_RATIO = 0.6;

/** 上下边缘淡入淡出 (渐隐) 默认开启 */
export const FADE_DEFAULT = true;

/** 逐行焦点高亮 (高亮当前阅读行并按阅读进度逐字点亮, 越远越淡) 默认开启 */
export const FOCUS_DEFAULT = true;

/** 阅读基准线: 视线停留位置占视口高度的比例 (略高于正中, 给下方留出预告行) */
export const READ_RATIO = 0.42;

/** 非当前行的最低可见度 / 每远离一行衰减到的比例 (越小衰减越快) */
export const FOCUS_MIN_OPACITY = 0.12;
export const FOCUS_DECAY = 0.62;

/** 滚动区域配色 (提词器惯例: 深底浅字, 长时间观看不刺眼) */
export const STAGE_BG = '#101114';
export const STAGE_FG = '#f2f3f5';
/** 当前阅读行的强调色 (其余行由透明度向下衰减) */
export const STAGE_FOCUS_FG = '#ffffff';
/** 当前阅读行里「还没读到」的部分: 逐字高亮从左侧点亮, 右侧保持这个暗淡色 */
export const STAGE_DIM_FG = 'rgba(242,243,245,0.5)';

/**
 * 默认设置 key (速度 / 字号 / 行距 / 淡入淡出 / 逐行高亮)
 * 修改入口: 设置中心「其它 → 提词器」, 或工具页的「保存为默认设置」按钮
 */
export const DEFAULTS_STORAGE_KEY = 'teleprompter-defaults';

// ==================== 示例脚本 ====================
// 打开页面 / 点「载入示例」时随机取一首 (中英文各两首示范诗);
// 换语言后的首次打开会随之切换, 已输入的稿件不会被覆盖

/** 中文示例 (简体): 沁园春·长沙 / 再别康桥 */
const SAMPLE_ZH_CN: readonly string[] = [
  [
    '独立寒秋, 湘江北去, 橘子洲头。',
    '看万山红遍, 层林尽染; 漫江碧透, 百舸争流。',
    '鹰击长空, 鱼翔浅底, 万类霜天竞自由。',
    '怅寥廓, 问苍茫大地, 谁主沉浮?',
    '',
    '携来百侣曾游。忆往昔峥嵘岁月稠。',
    '恰同学少年, 风华正茂; 书生意气, 挥斥方遒。',
    '指点江山, 激扬文字, 粪土当年万户侯。',
    '曾记否, 到中流击水, 浪遏飞舟?',
  ].join('\n'),
  [
    '轻轻的我走了,',
    '正如我轻轻的来;',
    '我轻轻的招手,',
    '作别西天的云彩。',
    '',
    '那河畔的金柳,',
    '是夕阳中的新娘;',
    '波光里的艳影,',
    '在我的心头荡漾。',
    '',
    '软泥上的青荇,',
    '油油的在水底招摇;',
    '在康河的柔波里,',
    '我甘心做一条水草!',
    '',
    '那榆荫下的一潭,',
    '不是清泉, 是天上虹;',
    '揉碎在浮藻间,',
    '沉淀着彩虹似的梦。',
    '',
    '寻梦? 撑一支长篙,',
    '向青草更青处漫溯;',
    '满载一船星辉,',
    '在星辉斑斓里放歌。',
    '',
    '但我不能放歌,',
    '悄悄是别离的笙箫;',
    '夏虫也为我沉默,',
    '沉默是今晚的康桥!',
    '',
    '悄悄的我走了,',
    '正如我悄悄的来;',
    '我挥一挥衣袖,',
    '不带走一片云彩。',
  ].join('\n'),
];

/** 中文示例 (繁體): 沁園春·長沙 / 再別康橋 */
const SAMPLE_ZH_TW: readonly string[] = [
  [
    '獨立寒秋, 湘江北去, 橘子洲頭。',
    '看萬山紅遍, 層林盡染; 漫江碧透, 百舸爭流。',
    '鷹擊長空, 魚翔淺底, 萬類霜天競自由。',
    '悵寥廓, 問蒼茫大地, 誰主沉浮?',
    '',
    '攜來百侶曾遊。憶往昔崢嶸歲月稠。',
    '恰同學少年, 風華正茂; 書生意氣, 揮斥方遒。',
    '指點江山, 激揚文字, 糞土當年萬戶侯。',
    '曾記否, 到中流擊水, 浪遏飛舟?',
  ].join('\n'),
  [
    '輕輕的我走了,',
    '正如我輕輕的來;',
    '我輕輕的招手,',
    '作別西天的雲彩。',
    '',
    '那河畔的金柳,',
    '是夕陽中的新娘;',
    '波光裡的豔影,',
    '在我的心頭蕩漾。',
    '',
    '軟泥上的青荇,',
    '油油的在水底招搖;',
    '在康河的柔波裡,',
    '我甘心做一條水草!',
    '',
    '那榆蔭下的一潭,',
    '不是清泉, 是天上虹;',
    '揉碎在浮藻間,',
    '沉澱著彩虹似的夢。',
    '',
    '尋夢? 撐一支長篙,',
    '向青草更青處漫溯;',
    '滿載一船星輝,',
    '在星輝斑斕裡放歌。',
    '',
    '但我不能放歌,',
    '悄悄是別離的笙簫;',
    '夏蟲也為我沉默,',
    '沉默是今晚的康橋!',
    '',
    '悄悄的我走了,',
    '正如我悄悄的來;',
    '我揮一揮衣袖,',
    '不帶走一片雲彩。',
  ].join('\n'),
];

/** 英文示例: Do not go gentle into that good night / When You Are Old */
const SAMPLE_EN: readonly string[] = [
  [
    'Do not go gentle into that good night,',
    'Old age should burn and rave at close of day;',
    'Rage, rage against the dying of the light.',
    '',
    'Though wise men at their end know dark is right,',
    'Because their words had forked no lightning they',
    'Do not go gentle into that good night.',
    '',
    'Good men, the last wave by, crying how bright',
    'Their frail deeds might have danced in a green bay,',
    'Rage, rage against the dying of the light.',
    '',
    'Wild men who caught and sang the sun in flight,',
    'And learn, too late, they grieved it on its way,',
    'Do not go gentle into that good night.',
    '',
    'Grave men, near death, who see with blinding sight',
    'Blind eyes could blaze like meteors and be gay,',
    'Rage, rage against the dying of the light.',
    '',
    'And you, my father, there on the sad height,',
    'Curse, bless, me now with your fierce tears, I pray.',
    'Do not go gentle into that good night.',
    'Rage, rage against the dying of the light.',
  ].join('\n'),
  [
    'When you are old and grey and full of sleep,',
    'And nodding by the fire, take down this book,',
    'And slowly read, and dream of the soft look',
    'Your eyes had once, and of their shadows deep;',
    '',
    'How many loved your moments of glad grace,',
    'And loved your beauty with love false or true,',
    'But one man loved the pilgrim soul in you,',
    'And loved the sorrows of your changing face;',
    '',
    'And bending down beside the glowing bars,',
    'Murmur, a little sadly, how Love fled',
    'And paced upon the mountains overhead',
    'And hid his face amid a crowd of stars.',
  ].join('\n'),
];

/** 按语言分组的示例脚本 (zh-CN / zh-TW / en 各一组, 组内随机取一首) */
export const SAMPLE_SCRIPTS: Record<'zh-CN' | 'zh-TW' | 'en', readonly string[]> = {
  'zh-CN': SAMPLE_ZH_CN,
  'zh-TW': SAMPLE_ZH_TW,
  en: SAMPLE_EN,
};
