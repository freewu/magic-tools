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

/** 滚动区域配色 (提词器惯例: 深底浅字, 长时间观看不刺眼) */
export const STAGE_BG = '#101114';
export const STAGE_FG = '#f2f3f5';

/** 选项记忆 key (速度 / 字号 / 行距 / 淡入淡出, 下次打开沿用) */
export const OPTIONS_STORAGE_KEY = 'teleprompter-options';

/** 示例脚本 (可直接改成自己的稿件) */
export const SAMPLE_SCRIPT = [
  '各位来宾, 大家好!',
  '',
  '欢迎来到 Magic Tools 线上分享会。今天我用大约五分钟, 向大家介绍这个开发者工具箱。',
  '',
  '它把日常开发里零散的小需求集中到一起: 编码解码、加解密、哈希校验、格式化、图片生成, 一共一百多个工具。',
  '全部计算都在本地完成, 不上传任何数据, 桌面端和网页端都能直接用。',
  '',
  '接下来我先演示三个最常用的功能, 再回答大家的提问。',
  '感谢观看, 祝大家工作顺利!',
].join('\n');
