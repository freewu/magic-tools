import '@testing-library/jest-dom';
import {
  CHAT_LINES_MIN, PARTICIPANTS_MAX, PARTICIPANTS_MIN, SHARE_SLIDE, SKIN_CONTROLS, SKIN_DIVIDERS,
  SKIN_META, SKINS, chatLine, clockText, formatClock, gridColumns, initialOf, pickParticipants, trio,
} from './lib';

describe('假装开会 皮肤配置', () => {
  test('三种皮肤与元信息齐全, 会议号不重复', () => {
    expect(SKINS).toEqual([ 'tencent', 'zoom', 'teams' ]);
    const ids = SKINS.map((k) => SKIN_META[k].meetingId);
    expect(new Set(ids).size).toBe(SKINS.length);
    for (const k of SKINS) {
      expect(SKIN_META[k].key).toBe(k);
      expect(SKIN_META[k].accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(SKIN_META[k].name[2]).toBeTruthy();
    }
  });

  test('trio 按语言取值 (未知语言回落简体)', () => {
    const v = [ '简体', '繁體', 'EN' ] as [string, string, string];
    expect(trio(v, 'zh-CN')).toBe('简体');
    expect(trio(v, 'zh-TW')).toBe('繁體');
    expect(trio(v, 'en')).toBe('EN');
    expect(trio(v, 'fr')).toBe('简体');
  });

  test('各皮肤工具条都含「离开」且为危险色; 仅 Zoom 录制、仅 Teams 举手', () => {
    for (const k of SKINS) {
      const actions = SKIN_CONTROLS[k].map((c) => c.action);
      expect(actions).toContain('leave');
      expect(SKIN_CONTROLS[k].find((c) => c.action === 'leave')?.danger).toBe(true);
    }
    expect(SKIN_CONTROLS.zoom.some((c) => c.action === 'rec')).toBe(true);
    expect(SKIN_CONTROLS.tencent.some((c) => c.action === 'rec')).toBe(false);
    expect(SKIN_CONTROLS.teams.some((c) => c.action === 'hand')).toBe(true);
  });

  test('Teams 的麦克风/举手按钮带激活态文案, 共享按钮统一为「停止共享」', () => {
    const teamsMic = SKIN_CONTROLS.teams.find((c) => c.action === 'mic');
    expect(teamsMic?.label[0]).toBe('静音');
    expect(teamsMic?.labelActive?.[0]).toBe('取消静音');
    const teamsHand = SKIN_CONTROLS.teams.find((c) => c.action === 'hand');
    expect(teamsHand?.labelActive?.[0]).toBe('放手');
    for (const k of SKINS) {
      const share = SKIN_CONTROLS[k].find((c) => c.action === 'share');
      expect(share?.labelActive?.[0]).toBe('停止共享');
      expect(share?.icon).toBe('share');
      expect(share?.iconActive).toBe('shareOff');
    }
  });

  test('Zoom 工具条有分组分隔线, 其余皮肤没有', () => {
    expect(SKIN_DIVIDERS.zoom).toEqual([ 'people', 'share', 'leave' ]);
    expect(SKIN_DIVIDERS.tencent).toEqual([]);
    expect(SKIN_DIVIDERS.teams).toEqual([]);
  });
});

describe('假装开会 参会者', () => {
  test('生成的人数正确, 首位是主持人, 最后一位是「我」', () => {
    const list = pickParticipants(6, 'zh-CN', '我');
    expect(list).toHaveLength(6);
    expect(list.filter((p) => p.host)).toHaveLength(1);
    expect(list[0].host).toBe(true);
    expect(list[list.length - 1].isMe).toBe(true);
    expect(list[list.length - 1].name).toBe('我');
  });

  test('人数上下限被收敛, 且名字不重复', () => {
    expect(pickParticipants(0, 'zh-CN', '我')).toHaveLength(PARTICIPANTS_MIN);
    expect(pickParticipants(99, 'zh-CN', '我')).toHaveLength(PARTICIPANTS_MAX);
    const names = pickParticipants(12, 'zh-CN', '我').map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  test('相同输入产生相同结果 (便于复现同一个「会议」)', () => {
    expect(pickParticipants(5, 'zh-CN', '我')).toEqual(pickParticipants(5, 'zh-CN', '我'));
  });

  test('英文界面使用英文名, 头像首字符合规则', () => {
    const en = pickParticipants(4, 'en', 'Me');
    expect(en[0].name).toMatch(/^[A-Za-z]/);
    expect(initialOf('张伟')).toBe('张');
    expect(initialOf('Alex Chen')).toBe('AL');
    expect(initialOf('')).toBe('?');
  });

  test('网格列数按人数排版', () => {
    expect([ 1, 2, 3, 4, 5, 6, 9, 10, 12 ].map(gridColumns)).toEqual([ 1, 2, 2, 2, 3, 3, 3, 4, 4 ]);
  });
});

describe('假装开会 计时与聊天', () => {
  test('formatClock 输出 HH:MM:SS 并容错', () => {
    expect(formatClock(0)).toBe('00:00:00');
    expect(formatClock(9)).toBe('00:00:09');
    expect(formatClock(61)).toBe('00:01:01');
    expect(formatClock(3661)).toBe('01:01:01');
    expect(formatClock(-5)).toBe('00:00:00');
    expect(formatClock(Number.NaN)).toBe('00:00:00');
  });

  test('clockText: 仅 Teams 带「已过」前缀', () => {
    expect(clockText('tencent', 'zh-CN', 754)).toBe('00:12:34');
    expect(clockText('zoom', 'en', 754)).toBe('00:12:34');
    expect(clockText('teams', 'zh-CN', 754)).toBe('已过 00:12:34');
    expect(clockText('teams', 'zh-TW', 754)).toBe('已過 00:12:34');
    expect(clockText('teams', 'en', 754)).toBe('Elapsed 00:12:34');
  });

  test('假聊天按序号循环取值, 作者来自其他参会者', () => {
    const members = pickParticipants(4, 'zh-CN', '我');
    const first = chatLine(0, 'zh-CN', members);
    expect(first.text).toBeTruthy();
    expect(members.some((m) => m.name === first.author && !m.isMe)).toBe(true);
    expect(first.at).toMatch(/^\d{2}:\d{2}$/);
    expect(chatLine(3, 'zh-CN', members).text).not.toBe(first.text);
    expect(chatLine(CHAT_LINES_MIN + 10, 'en', members).text).toMatch(/[A-Za-z]/);
  });

  test('共享屏幕的假幻灯片: 标题/要点/柱状图数据有效', () => {
    expect(SHARE_SLIDE.title[0]).toBeTruthy();
    expect(SHARE_SLIDE.bullets.length).toBeGreaterThan(1);
    expect(SHARE_SLIDE.bars.length).toBeGreaterThan(2);
    for (const b of SHARE_SLIDE.bars) expect(b).toBeGreaterThan(0);
  });
});
