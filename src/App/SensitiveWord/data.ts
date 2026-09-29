// 敏感词检测 数据: 词库 (通用 / 小红书 / 微信公众号) / 等级标签 / 参数候选 / 本地存储键
//
// 匹配引擎 (Aho-Corasick 多模式匹配) 在 lib.ts 中实现, 与 Java 的 sensitive-word /
// JS 的 mint-filter 同思路: 一次扫过文本即可判定全部命中位置。本工具还需要
// 「命中位置 + 风险等级 + 替换建议」, 因此词库以带元数据的表维护在这里。

/** 风险等级: 高危 / 中危 / 低危 */
export type Level = 'high' | 'mid' | 'low';

/** 词库编号: 通用 / 小红书 / 微信公众号 */
export type BankKey = 'common' | 'xhs' | 'gzh';

/** 词条: 敏感词 + 等级 + 替换建议 */
export interface WordMeta {
  /** 敏感词 (匹配不区分大小写, 并支持全角 / 间隔符绕过) */
  word: string;
  /** 风险等级 */
  level: Level;
  /** 替换建议 (zh, 明细表与导出报告直接展示) */
  tip: string;
}

/** 等级显示顺序 (高危 -> 低危) */
export const LEVEL_ORDER: readonly Level[] = [ 'high', 'mid', 'low' ];

/** 等级显示名 (经 lang.ts 翻译) */
export const LEVEL_LABELS: Record<Level, string> = {
  high: '高危',
  mid: '中危',
  low: '低危',
};

/** 等级说明 (图例 / 表格提示) */
export const LEVEL_DESC: Record<Level, string> = {
  high: '平台通常直接限流 / 删除 / 封号, 发布前务必改写',
  mid: '容易被判定为诱导、夸大宣传, 建议改写',
  low: '轻度营销夸张用词, 视平台风控宽严处理',
};

/** 等级对应的 antd Tag 颜色 */
export const LEVEL_COLOR: Record<Level, string> = {
  high: 'red',
  mid: 'orange',
  low: 'gold',
};

/** 词库显示名 (经 lang.ts 翻译) */
export const BANK_LABELS: Record<BankKey, string> = {
  common: '通用',
  xhs: '小红书',
  gzh: '微信公众号',
};

/** 词库展示顺序 (也是页签顺序) */
export const BANK_KEYS: readonly BankKey[] = [ 'common', 'xhs', 'gzh' ];

/** 默认设置的本地存储键 (设置中心与工具页共用) */
export const DEFAULTS_STORAGE_KEY = 'sensitive-word:defaults';

/** 打码字符候选 */
export const MASK_CHAR_OPTIONS = [ '*', '●', '×', '□', '○' ];

export const MASK_CHAR_DEFAULT = '*';

/**
 * 按唯一敏感词合并多个词库 (忽略大小写, 先出现者优先)
 */
export const unionBank = (...lists: WordMeta[][]): WordMeta[] => {
  const seen = new Set<string>();
  const out: WordMeta[] = [];
  lists.forEach((list) => {
    list.forEach((item) => {
      const key = item.word.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(item);
    });
  });
  return out;
};

/** 小红书敏感词库 */
export const XHS_BANK: WordMeta[] = [
  // ---- 广告法极限词 ----
  { word: '最', level: 'high', tip: '广告法禁用极限词, 改为「很 / 非常 / 超 / 我觉得」' },
  { word: '第一', level: 'high', tip: '广告法禁用极限词, 改为「靠前 / 领先 / 之一」' },
  { word: '唯一', level: 'high', tip: '广告法禁用极限词, 改为「少见 / 凤毛麟角」' },
  { word: '顶级', level: 'high', tip: '广告法禁用极限词, 改为「高品质 / 高端」' },
  { word: '极致', level: 'high', tip: '广告法禁用极限词, 改为「很用心 / 很细致」' },
  { word: '国家级', level: 'high', tip: '不得使用国家级背书, 删除或改为「正规厂家生产」' },
  { word: '世界级', level: 'high', tip: '不得使用世界级背书, 删除或改为「出口标准」' },
  { word: '全网第一', level: 'high', tip: '广告法禁用极限词, 改为「很多博主在用」' },
  { word: '独家', level: 'high', tip: '改为「自家 / 自营 / 原创」' },
  { word: '首家', level: 'high', tip: '改为「较早推出」' },
  { word: '首选', level: 'high', tip: '改为「常选 / 推荐」' },
  { word: '100%', level: 'high', tip: '绝对化数据, 改为「大多数情况下」; 有检测报告则注明来源' },
  { word: '绝对', level: 'high', tip: '改为「基本 / 通常 / 大概率」' },
  { word: '永久', level: 'high', tip: '改为「长期 / 持久」' },
  { word: '万能', level: 'high', tip: '改为「适用多种情况」' },
  { word: '史无前例', level: 'high', tip: '改为「少见 / 难得」' },
  { word: '绝无仅有', level: 'high', tip: '改为「很少见」' },
  // ---- 医疗 / 功效 ----
  { word: '治愈', level: 'high', tip: '医疗功效词, 普通商品禁止宣称, 改为「缓解不适感受」' },
  { word: '治疗', level: 'high', tip: '医疗功效词, 普通商品禁止宣称, 改为「日常护理」' },
  { word: '根治', level: 'high', tip: '医疗功效词, 改为「改善外观感受」' },
  { word: '消炎', level: 'high', tip: '医疗功效词, 改为「舒缓」' },
  { word: '祛斑', level: 'high', tip: '功效词, 平台审核严格, 改为「提亮肤色」' },
  { word: '美白', level: 'high', tip: '特殊化妆品功效, 无特证禁用, 改为「提亮 / 透亮」' },
  { word: '祛痘', level: 'high', tip: '功效词, 普通商品禁用, 改为「净肤 / 控油」' },
  { word: '祛疤', level: 'high', tip: '医疗功效词, 改为「淡纹 / 平滑」' },
  { word: '排毒', level: 'high', tip: '医疗功效词, 改为「清洁 / 舒缓」' },
  { word: '抗敏', level: 'high', tip: '医疗功效词, 改为「温和 / 适合敏感肌」' },
  { word: '医用', level: 'high', tip: '医疗器械用语, 普通商品禁用, 改为「院线同款成分」' },
  { word: '医疗级', level: 'high', tip: '医疗器械用语, 改为「高洁净标准」' },
  { word: '医美', level: 'high', tip: '医疗美容资质词, 无资质禁用, 改为「美容护理」' },
  { word: '速效', level: 'high', tip: '夸大功效, 改为「坚持使用感受更好」' },
  { word: '特效', level: 'high', tip: '夸大功效, 改为「使用感不错」' },
  { word: '7天见效', level: 'high', tip: '承诺见效时间, 改为「坚持使用一段时间」' },
  { word: '包好', level: 'high', tip: '承诺结果, 删除或改为「因人而异」' },
  { word: '永不反弹', level: 'high', tip: '承诺结果, 改为「注意日常护理」' },
  // ---- 站外导流 ----
  { word: '微信', level: 'high', tip: '站外引流词, 改为「站内私信 / 平台客服」' },
  { word: 'vx', level: 'high', tip: '微信号暗语, 改为「站内私信」' },
  { word: 'v', level: 'high', tip: '微信号暗语 (加 v), 改为「站内私信」' },
  { word: '加v', level: 'high', tip: '引导加微信, 改为「点头像私信我」' },
  { word: '手机号', level: 'high', tip: '站外联系方式, 删除或改为「站内私信」' },
  { word: 'qq', level: 'high', tip: '站外联系方式, 删除或改为「站内私信」' },
  { word: '二维码', level: 'high', tip: '站外导流载体, 删除, 需要物料可用平台商品卡' },
  { word: '扫码', level: 'high', tip: '站外导流引导, 改为「点商品卡 / 主页店铺」' },
  { word: '私我领福利', level: 'high', tip: '诱导私信, 改为「关注后查看置顶笔记」' },
  { word: '移步淘宝', level: 'high', tip: '引导到其它平台, 改为「详见主页商品」' },
  // ---- 诱导 / 夸大营销 ----
  { word: '万人疯抢', level: 'mid', tip: '制造哄抢氛围, 改为「很多人回购」' },
  { word: '最后一波', level: 'mid', tip: '紧迫感营销, 改为「本轮活动」' },
  { word: '仅限今日', level: 'mid', tip: '虚假紧迫感, 改为「活动期间」' },
  { word: '再不买就没了', level: 'mid', tip: '制造焦虑, 改为「活动库存有限」' },
  { word: '爆单', level: 'mid', tip: '销量夸大, 改为「近期订单较多」' },
  { word: '亏本清仓', level: 'mid', tip: '价格承诺易被判虚假, 改为「活动价」' },
  { word: '专家推荐', level: 'mid', tip: '需可查证资质, 改为「很多用户反馈」' },
  { word: '三甲同款', level: 'mid', tip: '借医疗机构背书, 改为「同类成分」' },
  { word: '国家免检', level: 'mid', tip: '已取消的称号, 删除' },
  { word: '特供', level: 'mid', tip: '不当背书用语, 删除或改为「专享装」' },
  { word: '专供', level: 'mid', tip: '不当背书用语, 改为「专享 / 限定」' },
  { word: '保本', level: 'mid', tip: '金融承诺, 改为「以产品说明为准」' },
  { word: '稳赚', level: 'mid', tip: '金融承诺, 删除' },
  { word: '零风险', level: 'mid', tip: '金融承诺, 删除' },
  { word: '高收益', level: 'mid', tip: '金融承诺, 删除' },
  { word: '投资回报', level: 'mid', tip: '金融承诺, 改为「详见官方说明书」' },
  // ---- 夸张网络用语 ----
  { word: '封神', level: 'low', tip: '夸张网络用语, 改为「很好用」' },
  { word: '必入', level: 'low', tip: '绝对化推荐, 改为「值得一试」' },
  { word: '闭眼买', level: 'low', tip: '绝对化推荐, 改为「不太挑人」' },
  { word: 'yyds', level: 'low', tip: '夸张网络用语, 平台可能限流, 改为「很好用」' },
  { word: '绝绝子', level: 'low', tip: '夸张网络用语, 改为「很惊艳」' },
];

/** 微信公众号敏感词库 */
export const GZH_BANK: WordMeta[] = [
  // ---- 广告法极限词 ----
  { word: '最', level: 'high', tip: '广告法禁用极限词, 改为「很 / 非常 / 超」' },
  { word: '第一', level: 'high', tip: '广告法禁用极限词, 改为「领先 / 之一」' },
  { word: '唯一', level: 'high', tip: '广告法禁用极限词, 改为「少见」' },
  { word: '顶级', level: 'high', tip: '广告法禁用极限词, 改为「高端」' },
  { word: '国家级', level: 'high', tip: '不得使用国家级背书, 删除' },
  { word: '世界级', level: 'high', tip: '不得使用世界级背书, 删除' },
  { word: '全网第一', level: 'high', tip: '广告法禁用极限词, 改为「同类中较受欢迎」' },
  { word: '独家', level: 'high', tip: '改为「自营 / 原创」' },
  { word: '首家', level: 'high', tip: '改为「较早」' },
  { word: '首选', level: 'high', tip: '改为「常选」' },
  { word: '100%', level: 'high', tip: '绝对化数据, 改为「绝大部分」' },
  { word: '绝对', level: 'high', tip: '改为「通常」' },
  { word: '永久', level: 'high', tip: '改为「长期」' },
  { word: '万能', level: 'high', tip: '改为「适用多种场景」' },
  { word: '史无前例', level: 'high', tip: '改为「少见」' },
  { word: '绝无仅有', level: 'high', tip: '改为「很少见」' },
  // ---- 医疗 / 功效 ----
  { word: '治愈', level: 'high', tip: '医疗功效宣称, 文章会被删除, 改为「不适感缓解」' },
  { word: '治疗', level: 'high', tip: '医疗功效宣称, 改为「日常护理」' },
  { word: '根治', level: 'high', tip: '医疗功效宣称, 改为「改善感受」' },
  { word: '消炎', level: 'high', tip: '医疗功效宣称, 改为「舒缓」' },
  { word: '祛斑', level: 'high', tip: '功效宣称需特证, 改为「提亮肤色」' },
  { word: '美白', level: 'high', tip: '特殊化妆品功效, 需特证, 改为「透亮」' },
  { word: '抗癌', level: 'high', tip: '严重违法医疗宣称, 直接删除' },
  { word: '降三高', level: 'high', tip: '严重违法医疗宣称, 直接删除' },
  { word: '包治百病', level: 'high', tip: '严重违法医疗宣称, 直接删除' },
  { word: '永不复发', level: 'high', tip: '承诺疗效, 直接删除' },
  // ---- 诱导分享 / 站外导流 ----
  { word: '集赞', level: 'high', tip: '禁止集赞诱导分享, 改为「欢迎留言交流」' },
  { word: '转发领', level: 'high', tip: '诱导分享, 改为「老用户可参与活动」' },
  { word: '分享到朋友圈', level: 'high', tip: '诱导分享, 删除' },
  { word: '扫码加微信', level: 'high', tip: '站外引流, 改为「关注公众号后回复关键词」' },
  { word: '加v', level: 'high', tip: '引导加微信, 删除' },
  { word: 'vx', level: 'high', tip: '微信号暗语, 删除' },
  { word: '微信', level: 'high', tip: '站外引流, 改为「公众号后台 / 在线客服」' },
  { word: 'QQ', level: 'high', tip: '站外联系方式, 删除' },
  { word: '手机号', level: 'high', tip: '站外联系方式, 删除' },
  { word: '移步淘宝', level: 'high', tip: '引导至其它平台, 改为「小程序下单」' },
  { word: '点击领取', level: 'high', tip: '诱导点击 / 领取, 改为「参与活动」' },
  // ---- 违法内容 ----
  { word: '赌博', level: 'high', tip: '违法内容, 直接删除 (涉赌会被封号)' },
  { word: '博彩', level: 'high', tip: '违法内容, 直接删除 (涉赌会被封号)' },
  // ---- 诱导 / 夸大营销 ----
  { word: '万人疯抢', level: 'mid', tip: '夸大抢购氛围, 改为「较多用户选择」' },
  { word: '最后一天', level: 'mid', tip: '虚假紧迫感, 改为「活动期内」' },
  { word: '仅限今日', level: 'mid', tip: '虚假紧迫感, 改为「活动期间」' },
  { word: '爆单', level: 'mid', tip: '夸大销量, 改为「订单较多」' },
  { word: '亏本清仓', level: 'mid', tip: '虚假价格承诺, 改为「活动价」' },
  { word: '专家推荐', level: 'mid', tip: '需可查证资质, 改为「用户反馈不错」' },
  { word: '三甲同款', level: 'mid', tip: '借医疗背书, 改为「同类成分」' },
  { word: '特供', level: 'mid', tip: '不当背书用语, 删除' },
  { word: '专供', level: 'mid', tip: '不当背书用语, 改为「专享」' },
  { word: '保本', level: 'mid', tip: '金融承诺, 删除' },
  { word: '稳赚', level: 'mid', tip: '金融承诺, 删除' },
  { word: '零风险', level: 'mid', tip: '金融承诺, 删除' },
  { word: '高收益', level: 'mid', tip: '金融承诺, 删除' },
  // ---- 夸张网络用语 ----
  { word: '封神', level: 'low', tip: '夸张网络用语, 改为「很好用」' },
  { word: '必入', level: 'low', tip: '绝对化推荐, 改为「值得一试」' },
  { word: '闭眼买', level: 'low', tip: '绝对化推荐, 改为「不太挑人」' },
];

/**
 * 通用词库: 小红书 + 微信公众号两个词库的并集 (忽略大小写去重, 保留先出现的建议)
 * 用于发布前的「通用自检」, 不针对某一平台的特有规则 (如集赞、扫码加微信) 也会命中。
 */
export const COMMON_BANK: WordMeta[] = unionBank(XHS_BANK, GZH_BANK);

/** 全部词库 (页签与扫描按此顺序) */
export const SENSITIVE_BANKS: Record<BankKey, WordMeta[]> = {
  common: COMMON_BANK,
  xhs: XHS_BANK,
  gzh: GZH_BANK,
};

/** 示例文案 (点「载入示例」填入, 覆盖极限词 / 医疗 / 导流 / 金融等多种命中) */
export const SAMPLE_TEXT = [
  '姐妹们! 这款祛斑精华真的绝绝子, 7天见效, 全网第一的效果, 我用了一个月美白又祛痘, 妥妥的 yyds, 闭眼买不踩雷!',
  '现在下单立减, 仅限今日, 万人疯抢, 最后一天亏本清仓!',
  '想要链接的加v: vx123456, 或者扫码加微信, 也可以私我领福利; 记得集赞 + 转发领小样 (分享到朋友圈再加送一份)',
  '成分党放心: 权威专家推荐, 三甲同款, 医用级配方; 另外还有保本稳赚零风险的投资项目了解一下~',
].join('\n');
