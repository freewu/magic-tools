import {
  AMOUNT_DEFAULT, AMOUNT_MAX, AVATAR_IN_DEFAULT, BATTERY_DEFAULT, CHARGING_DEFAULT, IMAGE_MAX_CHARS, MESSAGES_MAX,
  MUTE_DEFAULT, NAME_IN_DEFAULT, NAME_MAX, NAME_OUT_DEFAULT,
  NETWORK_DEFAULT, PLATFORMS, PLATFORM_DEFAULT, REDPACKET_TEXT_DEFAULT, REDPACKET_TEXT_MAX, SAMPLE_IMAGE,
  SCALE_DEFAULT, SHOW_INPUT_DEFAULT,
  SHOW_NAMES_DEFAULT, SIGNAL_DEFAULT, STATUS_TIME_DEFAULT, SUBTITLE_DEFAULT, SYSTEM_DEFAULT, TEXT_MAX,
  TIME_LABEL_MAX, TITLE_DEFAULT, TITLE_MAX,
  type ChatDoc, type ChatMessage,
} from './data';
import {
  DEFAULT_KEYS, BATTERY_COLOR_CHARGING, BATTERY_COLOR_LOW, BATTERY_COLOR_WARN, addMessage, avatarText,
  batteryColor, batteryText, clampInt, clampText, clearMessages, createMessage,
  docFromDefaults, getDefaultBattery, getDefaultCharging, getDefaultMute, getDefaultNameIn, getDefaultNameOut,
  getDefaultNetwork, getDefaultPlatform, getDefaultScale, getDefaultShowInputBar, getDefaultShowNames,
  getDefaultSignal, getDefaultStatusTime, getDefaultSubtitle, getDefaultSystem, getDefaultTitle, isAndroid,
  isPacketType, isTimeText,
  moveMessage, newId, normalizeBattery, normalizeDuration, normalizeMessage, normalizeMessageType,
  normalizeNetwork, normalizePlatform, normalizeScale, normalizeSide, normalizeSignal, normalizeSystem,
  normalizeTimeText, platformLabel, receiptMark, removeMessage, sampleMessages, setDefaultBattery,
  setDefaultCharging, setDefaultMute, setDefaultNameIn, setDefaultNameOut, setDefaultNetwork, setDefaultPlatform,
  setDefaultScale,
  setDefaultShowInputBar, setDefaultShowNames, setDefaultSignal, setDefaultStatusTime, setDefaultSubtitle,
  setDefaultSystem, setDefaultTitle, signalLevels, themeOf, updateMessage, voiceText,
} from './lib';

/** 造一个最小可用会话 (平台样式字段与真实值一致, 便于断言) */
const docOf = (patch: Partial<ChatDoc> = {}): ChatDoc => ({ ...docFromDefaults(), ...patch });

beforeEach(() => {
  localStorage.clear();
});

describe('聊天生成器 · 数值与枚举校验', () => {
  test('clampInt 取整并夹到区间, 非法值回退', () => {
    expect(clampInt(3.7, 1, 4, 1)).toBe(3);
    expect(clampInt('5', 1, 4, 1)).toBe(4);
    expect(clampInt(-2, 1, 4, 1)).toBe(1);
    expect(clampInt('abc', 1, 4, 2)).toBe(2);
    expect(clampInt(null, 1, 4, 2)).toBe(2);
    expect(clampInt(NaN, 1, 4, 2)).toBe(2);
  });

  test('clampText 按长度截断, 非字符串按空串处理', () => {
    expect(clampText('abcdef', 3)).toBe('abc');
    expect(clampText(undefined, 3)).toBe('');
    expect(clampText(null, 3)).toBe('');
    expect(clampText(123, 3)).toBe('123');
  });

  test('平台 / 倍率 / 系统 / 网络 非法值回退默认', () => {
    expect(normalizePlatform('telegram')).toBe('telegram');
    expect(normalizePlatform('nope')).toBe(PLATFORM_DEFAULT);
    expect(normalizeScale(3)).toBe(3);
    expect(normalizeScale(9)).toBe(3); // 数值越界按上限夹取
    expect(normalizeScale('')).toBe(SCALE_DEFAULT); // 空值回退默认
    expect(normalizeSystem('android')).toBe('android');
    expect(normalizeSystem('windows')).toBe(SYSTEM_DEFAULT);
    expect(normalizeNetwork('5G')).toBe('5G');
    expect(normalizeNetwork('6G')).toBe(NETWORK_DEFAULT);
  });

  test('电量 / 信号 / 语音时长 夹到合法区间', () => {
    expect(normalizeBattery(55)).toBe(55);
    expect(normalizeBattery(0)).toBe(0); // 允许 0% (低电量截图)
    expect(normalizeBattery(-5)).toBe(0);
    expect(normalizeBattery(1200)).toBe(100);
    expect(normalizeSignal(3)).toBe(3);
    expect(normalizeSignal(0)).toBe(1);
    expect(normalizeSignal(9)).toBe(4);
    expect(normalizeDuration(6)).toBe(6);
    expect(normalizeDuration(0)).toBe(1);
    expect(normalizeDuration(100)).toBe(99);
  });

  test('状态栏时间只接受 HH:MM', () => {
    expect(isTimeText('9:41')).toBe(true);
    expect(isTimeText('23:59')).toBe(true);
    expect(isTimeText(' 08:05 ')).toBe(true);
    expect(isTimeText('24:00')).toBe(false);
    expect(isTimeText('9:5')).toBe(false);
    expect(isTimeText('9点41')).toBe(false);
    expect(normalizeTimeText('18:20')).toBe('18:20');
    expect(normalizeTimeText('oops')).toBe(STATUS_TIME_DEFAULT);
    expect(normalizeTimeText('oops', '7:07')).toBe('7:07');
  });

  test('消息类型 / 方向 非法值回退', () => {
    expect(normalizeMessageType('voice')).toBe('voice');
    expect(normalizeMessageType('video')).toBe('text');
    expect(normalizeMessageType(undefined)).toBe('text');
    // 红包 / 转账是合法类型 (微信专属, 其他平台会退化为文字)
    expect(normalizeMessageType('redpacket')).toBe('redpacket');
    expect(normalizeMessageType('transfer')).toBe('transfer');
    expect(isPacketType('redpacket')).toBe(true);
    expect(isPacketType('transfer')).toBe(true);
    expect(isPacketType('text')).toBe(false);
    expect(isPacketType(undefined)).toBe(false);
    expect(normalizeSide('out')).toBe('out');
    expect(normalizeSide('x')).toBe('in');
  });

  test('平台标题栏差异: 微信居中且无副标题, 桌面临近平台靠左', () => {
    expect(themeOf('wechat').header.center).toBe(true);
    expect(themeOf('wechat').header.subtitle).toBe(false);
    expect(themeOf('qq').header.subtitle).toBe(true);
    expect(themeOf('line').header.center).toBe(true);
    expect(themeOf('dingtalk').header.center).toBe(true);
    expect(themeOf('feishu').header.center).toBe(true);
    for (const p of PLATFORMS.filter((x) => x.id === 'telegram' || x.id === 'whatsapp' || x.id === 'slack' || x.id === 'discord')) {
      expect(p.header.center).toBe(false);
    }
    // 手机屏都有返回箭头, 桌面端没有
    for (const p of PLATFORMS) expect(p.header.back).toBe(p.layout === 'mobile');
  });
});

describe('聊天生成器 · 平台样式表', () => {
  test('9 个平台与用户要求的顺序一致, 且样式字段完整', () => {
    expect(PLATFORMS.map((p) => p.id)).toEqual(
      ['wechat', 'qq', 'slack', 'telegram', 'discord', 'whatsapp', 'line', 'dingtalk', 'feishu']
    );
    for (const p of PLATFORMS) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.background).toBeTruthy();
      expect(p.incoming.bg).toBeTruthy();
      expect(p.outgoing.bg).toBeTruthy();
      // 手机屏必须有状态栏, 桌面窗口必须没有
      expect(!!p.statusBar).toBe(p.layout === 'mobile');
      expect(p.width).toBeGreaterThan(300);
    }
  });

  test('手机屏带状态栏与输入栏, Slack / Discord 为桌面消息流', () => {
    expect(themeOf('wechat').statusBar).not.toBeNull();
    expect(themeOf('wx' as never).id).toBe('wechat'); // 非法 id 回退第一个平台
    expect(themeOf('qq').inputBar?.pill).toBeTruthy();
    expect(themeOf('slack').layout).toBe('desktop');
    expect(themeOf('slack').bubble).toBe('plain');
    expect(themeOf('slack').sidebar).toBeTruthy();
    expect(themeOf('discord').titleBar?.dots).toHaveLength(3);
    expect(themeOf('discord').inputBar?.pill).toBe('#383a40');
    expect(platformLabel('dingtalk')).toBe('钉钉');
  });

  test('头像 / 电量 / 信号 / 语音 / 回执 等取值助手', () => {
    expect(avatarText('林小满')).toBe('林');
    expect(avatarText('alice')).toBe('A');
    expect(avatarText('   ')).toBe('?');
    expect(avatarText('😀 开心')).toBe('😀');
    expect(batteryText(82)).toBe('82%');
    expect(batteryText(999)).toBe('100%');
    expect(signalLevels(2)).toEqual([true, true, false, false]);
    expect(signalLevels(0)).toEqual([true, false, false, false]);
    expect(voiceText(6)).toBe('6"');
    expect(voiceText(0)).toBe('1"');
    expect(receiptMark('none')).toBe('');
    expect(receiptMark('double')).toBe('✓✓');
    expect(receiptMark('read')).toBe('✓✓');
  });

  test('电量配色: < 10% 红, < 20% 黄, 充电中始终绿', () => {
    const fallback = '#ffffff';
    // 阈值边界: 9 红 / 10 黄 / 19 黄 / 20 用平台色
    expect(batteryColor(0, false, fallback)).toBe(BATTERY_COLOR_LOW);
    expect(batteryColor(9, false, fallback)).toBe(BATTERY_COLOR_LOW);
    expect(batteryColor(10, false, fallback)).toBe(BATTERY_COLOR_WARN);
    expect(batteryColor(19, false, fallback)).toBe(BATTERY_COLOR_WARN);
    expect(batteryColor(20, false, fallback)).toBe(fallback);
    expect(batteryColor(82, false, fallback)).toBe(fallback);
    // 充电中无论电量高低都是绿色
    for (const n of [1, 9, 10, 19, 20, 100]) expect(batteryColor(n, true, fallback)).toBe(BATTERY_COLOR_CHARGING);
    // 非法电量先夹到区间再判色 (不会出现 NaN 比较)
    expect(batteryColor(Number.NaN, false, fallback)).toBe(fallback);
    expect(batteryColor(-5, false, fallback)).toBe(BATTERY_COLOR_LOW);
  });

  test('状态栏系统差异由 isAndroid 描述 (两种风格时钟都在左, 差异在灵动岛/挖孔与百分比位置)', () => {
    expect(isAndroid('android')).toBe(true);
    expect(isAndroid('ios')).toBe(false);
    // 与平台无关: 同一平台切换系统即可看到差异
    for (const p of PLATFORMS.filter((x) => x.layout === 'mobile')) {
      expect(p.statusBar).not.toBeNull();
    }
  });
});

describe('聊天生成器 · 消息增删改', () => {
  test('newId 唯一且以 m 开头', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id.startsWith('m')).toBe(true);
  });

  test('normalizeMessage 修正字段并截断超长内容', () => {
    const msg = normalizeMessage({
      type: 'text',
      side: 'out',
      name: 'x'.repeat(NAME_MAX + 5),
      text: 'y'.repeat(TEXT_MAX + 20),
      duration: 999,
      time: '16:20',
    });
    expect(msg.name).toHaveLength(NAME_MAX);
    expect(msg.text).toHaveLength(TEXT_MAX);
    expect(msg.side).toBe('out');
    expect(msg.duration).toBe(99);
    expect(msg.image).toBe('');
    // 时间分隔文案有独立上限
    expect(normalizeMessage({ type: 'time', text: 'z'.repeat(TIME_LABEL_MAX + 10) }).text).toHaveLength(TIME_LABEL_MAX);
    // 非图片消息不保留图片数据
    expect(normalizeMessage({ type: 'text', image: 'data:image/png;base64,AAAA' }).image).toBe('');
    // 超长图片数据被截断到上限
    expect(normalizeMessage({ type: 'image', image: 'a'.repeat(IMAGE_MAX_CHARS + 10) }).image).toHaveLength(IMAGE_MAX_CHARS);
    // 空输入也能得到一条合法消息
    const blank = normalizeMessage(null);
    expect(blank.type).toBe('text');
    expect(blank.side).toBe('in');
    expect(blank.id).toBeTruthy();
    expect(blank.amount).toBe(AMOUNT_DEFAULT);
  });

  test('红包 / 转账: 祝福语与金额的默认值 / 上限', () => {
    // 红包祝福语上限为 25 字 (与微信红包一致)
    const packet = normalizeMessage({ type: 'redpacket', text: 'x'.repeat(REDPACKET_TEXT_MAX + 10) });
    expect(packet.text).toHaveLength(REDPACKET_TEXT_MAX);
    // 普通文字仍用 TEXT_MAX
    expect(normalizeMessage({ type: 'text', text: 'y'.repeat(REDPACKET_TEXT_MAX + 10) }).text)
      .toHaveLength(REDPACKET_TEXT_MAX + 10);
    // 金额截断到 AMOUNT_MAX 且两端空白被去掉
    expect(normalizeMessage({ type: 'transfer', amount: 'z'.repeat(AMOUNT_MAX + 5) }).amount).toHaveLength(AMOUNT_MAX);
    expect(normalizeMessage({ type: 'transfer', amount: ' 12.50 ' }).amount).toBe('12.50');
    expect(normalizeMessage({ type: 'transfer', amount: undefined }).amount).toBe(AMOUNT_DEFAULT);
  });

  test('createMessage 按发送方取默认昵称, 时间为空', () => {
    const doc = docOf({ nameIn: '对方甲', nameOut: '我方乙' });
    const incoming = createMessage(doc, 'text', 'in');
    expect(incoming.name).toBe('对方甲');
    expect(incoming.side).toBe('in');
    expect(incoming.text).toBe('');
    expect(incoming.time).toBe('');
    expect(incoming.duration).toBe(5);
    expect(createMessage(doc, 'voice', 'out').name).toBe('我方乙');
    // 默认值为 'in'
    expect(createMessage(doc, 'image').side).toBe('in');
  });

  test('createMessage 给红包填好默认祝福语, 给转账填好默认金额', () => {
    const doc = docOf();
    const packet = createMessage(doc, 'redpacket');
    expect(packet.text).toBe(REDPACKET_TEXT_DEFAULT);
    expect(packet.type).toBe('redpacket');
    expect(packet.image).toBe('');
    const transfer = createMessage(doc, 'transfer');
    expect(transfer.amount).toBe(AMOUNT_DEFAULT);
    expect(transfer.text).toBe('');
  });

  test('addMessage 追加, 达到上限后不再增加', () => {
    let list: ChatMessage[] = [];
    for (let i = 0; i < MESSAGES_MAX; i++) list = addMessage(list, normalizeMessage({ text: `第${i}条` }));
    expect(list).toHaveLength(MESSAGES_MAX);
    const full = addMessage(list, normalizeMessage({ text: '溢出' }));
    expect(full).toBe(list);
    expect(full).toHaveLength(MESSAGES_MAX);
  });

  test('updateMessage 只改目标消息, 且不会丢掉 id', () => {
    const a = normalizeMessage({ text: 'a' });
    const b = normalizeMessage({ text: 'b' });
    const next = updateMessage([a, b], b.id, { text: 'b2', side: 'out' });
    expect(next[0]).toBe(a);
    expect(next[1].text).toBe('b2');
    expect(next[1].side).toBe('out');
    expect(next[1].id).toBe(b.id);
    // 未命中 id 时内容不变 (返回浅拷贝)
    const miss = updateMessage([a, b], 'nope', { text: 'x' });
    expect(miss).toEqual([a, b]);
    expect(miss).not.toBe([a, b]);
  });

  test('removeMessage / clearMessages', () => {
    const a = normalizeMessage({ text: 'a' });
    const b = normalizeMessage({ text: 'b' });
    expect(removeMessage([a, b], a.id)).toEqual([b]);
    expect(removeMessage([a, b], 'nope')).toHaveLength(2);
    expect(clearMessages()).toEqual([]);
  });

  test('moveMessage 上移下移, 越界顺序不变', () => {
    const list = ['a', 'b', 'c'].map((text) => normalizeMessage({ text }));
    const [a, b, c] = list;
    expect(moveMessage(list, b.id, 'up').map((m) => m.text)).toEqual(['b', 'a', 'c']);
    expect(moveMessage(list, b.id, 'down').map((m) => m.text)).toEqual(['a', 'c', 'b']);
    // 第一条上移 / 最后一条下移 / 不存在的 id 都不改变顺序
    expect(moveMessage(list, a.id, 'up').map((m) => m.text)).toEqual(['a', 'b', 'c']);
    expect(moveMessage(list, c.id, 'down').map((m) => m.text)).toEqual(['a', 'b', 'c']);
    expect(moveMessage(list, 'nope', 'up').map((m) => m.text)).toEqual(['a', 'b', 'c']);
    // 原列表不被修改
    expect(list.map((m) => m.text)).toEqual(['a', 'b', 'c']);
  });
});

describe('聊天生成器 · 示例对话', () => {
  test('示例包含时间 / 文字 / 图片 / 语音, 每条的 id 唯一', () => {
    const list = sampleMessages();
    const types = list.map((m) => m.type);
    expect(types).toContain('time');
    expect(types).toContain('text');
    expect(types).toContain('image');
    expect(types).toContain('voice');
    expect(new Set(list.map((m) => m.id)).size).toBe(list.length);
    expect(list[0].type).toBe('time');
    // 图片为内置 SVG 示例图 (data URL), 不引用任何外部资源
    const image = list.find((m) => m.type === 'image');
    expect(image?.image).toBe(SAMPLE_IMAGE);
    expect(SAMPLE_IMAGE.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
  });

  test('两次取示例互不影响 (深拷贝)', () => {
    const first = sampleMessages();
    first[1].text = '改过了';
    const second = sampleMessages();
    expect(second[1].text).not.toBe('改过了');
  });
});

describe('聊天生成器 · 默认值读写', () => {
  test('未设置时返回内置默认值', () => {
    expect(getDefaultPlatform()).toBe(PLATFORM_DEFAULT);
    expect(getDefaultTitle()).toBe(TITLE_DEFAULT);
    expect(getDefaultSubtitle()).toBe(SUBTITLE_DEFAULT);
    expect(getDefaultScale()).toBe(SCALE_DEFAULT);
    expect(getDefaultSystem()).toBe(SYSTEM_DEFAULT);
    expect(getDefaultStatusTime()).toBe(STATUS_TIME_DEFAULT);
    expect(getDefaultBattery()).toBe(BATTERY_DEFAULT);
    expect(getDefaultCharging()).toBe(CHARGING_DEFAULT);
    expect(getDefaultSignal()).toBe(SIGNAL_DEFAULT);
    expect(getDefaultNetwork()).toBe(NETWORK_DEFAULT);
    expect(getDefaultShowInputBar()).toBe(SHOW_INPUT_DEFAULT);
    expect(getDefaultShowNames()).toBe(SHOW_NAMES_DEFAULT);
    expect(getDefaultNameIn()).toBe(NAME_IN_DEFAULT);
    expect(getDefaultNameOut()).toBe(NAME_OUT_DEFAULT);
    expect(getDefaultMute()).toBe(MUTE_DEFAULT);
    // 对方昵称默认为 bluefrog, 默认头像为内置 Logo (由打包器生成 URL)
    expect(NAME_IN_DEFAULT).toBe('bluefrog');
    expect(AVATAR_IN_DEFAULT.length).toBeGreaterThan(0);
  });

  test('设置后能读回, 非法值写入时即被规范化', () => {
    setDefaultPlatform('discord');
    setDefaultTitle('群聊标题');
    setDefaultSubtitle('');
    setDefaultScale(3);
    setDefaultSystem('android');
    setDefaultStatusTime('18:20');
    setDefaultBattery(66);
    setDefaultCharging(true);
    setDefaultSignal(2);
    setDefaultNetwork('4G');
    setDefaultShowInputBar(false);
    setDefaultShowNames(true);
    setDefaultNameIn('甲');
    setDefaultNameOut('乙');
    setDefaultMute(true);

    expect(getDefaultPlatform()).toBe('discord');
    expect(getDefaultTitle()).toBe('群聊标题');
    expect(getDefaultSubtitle()).toBe('');
    expect(getDefaultScale()).toBe(3);
    expect(getDefaultSystem()).toBe('android');
    expect(getDefaultStatusTime()).toBe('18:20');
    expect(getDefaultBattery()).toBe(66);
    expect(getDefaultCharging()).toBe(true);
    expect(getDefaultSignal()).toBe(2);
    expect(getDefaultNetwork()).toBe('4G');
    expect(getDefaultShowInputBar()).toBe(false);
    expect(getDefaultShowNames()).toBe(true);
    expect(getDefaultNameIn()).toBe('甲');
    expect(getDefaultNameOut()).toBe('乙');
    expect(getDefaultMute()).toBe(true);

    // 非法值 / 超长值在写入时被修正
    setDefaultPlatform('unknown');
    setDefaultScale(99);
    setDefaultStatusTime('99:99');
    setDefaultBattery(0);
    setDefaultSignal(99);
    setDefaultTitle('t'.repeat(TITLE_MAX + 3));
    setDefaultNameIn('n'.repeat(NAME_MAX + 3));

    expect(getDefaultPlatform()).toBe(PLATFORM_DEFAULT);
    expect(getDefaultScale()).toBe(3); // 越界值写入时即按上限夹取
    expect(getDefaultStatusTime()).toBe(STATUS_TIME_DEFAULT);
    expect(getDefaultBattery()).toBe(0); // 0% 也是合法电量
    expect(getDefaultSignal()).toBe(4);
    expect(getDefaultTitle()).toHaveLength(TITLE_MAX);
    expect(getDefaultNameIn()).toHaveLength(NAME_MAX);
  });

  test('docFromDefaults 组装初始会话 (含示例消息, 会话字段取默认值)', () => {
    setDefaultPlatform('whatsapp');
    setDefaultTitle('假期计划');
    setDefaultBattery(48);
    setDefaultShowInputBar(false);
    const doc = docFromDefaults();
    expect(doc.platform).toBe('whatsapp');
    expect(doc.title).toBe('假期计划');
    expect(doc.battery).toBe(48);
    expect(doc.showInputBar).toBe(false);
    expect(doc.mute).toBe(MUTE_DEFAULT);
    expect(doc.avatarIn).toBe(AVATAR_IN_DEFAULT);
    expect(doc.avatarOut).toBe('');
    expect(doc.messages.length).toBeGreaterThan(0);
    expect(doc.messages[0].type).toBe('time');
  });

  test('DEFAULT_KEYS 覆盖全部默认值键名, 且读取时同样防御非法值', () => {
    expect(DEFAULT_KEYS.length).toBe(15);
    for (const key of DEFAULT_KEYS) expect(key.startsWith('chat-generator.')).toBe(true);
    // 全部键写入垃圾值 (模拟手工改写 / 旧版本残留)
    for (const key of DEFAULT_KEYS) localStorage.setItem(key, 'x'.repeat(200));
    expect(getDefaultPlatform()).toBe(PLATFORM_DEFAULT);
    expect(getDefaultScale()).toBe(SCALE_DEFAULT);
    expect(getDefaultSystem()).toBe(SYSTEM_DEFAULT);
    expect(getDefaultNetwork()).toBe(NETWORK_DEFAULT);
    expect(getDefaultStatusTime()).toBe(STATUS_TIME_DEFAULT);
    expect(getDefaultTitle()).toHaveLength(TITLE_MAX);
    expect(getDefaultNameOut()).toHaveLength(NAME_MAX);
  });
});
