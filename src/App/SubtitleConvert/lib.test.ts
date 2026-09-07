import { parseSubtitle, toSubtitle, detectSubtitleFormat, msToSrt, srtToMs, msToCent, centToMs, msToLrc, lrcToMs, msToFrame, fmtDuration } from './lib';
import type { SubFormat, SubCue } from './lib';

const cueEq = (a: SubCue[], b: SubCue[]) => {
  expect(a.length).toBe(b.length);
  a.forEach((c, i) => {
    expect(c.start).toBe(b[i].start);
    expect(c.end).toBe(b[i].end);
    expect(c.text).toBe(b[i].text);
  });
};

describe('时间工具', () => {
  test('srt 时间 ms 互转', () => {
    expect(msToSrt(1000)).toBe('00:00:01,000');
    expect(msToSrt(3723456)).toBe('01:02:03,456');
    expect(msToSrt(3600000 + 60000 + 1000 + 5)).toBe('01:01:01,005');
    expect(srtToMs('01:02:03,456')).toBe(3723456);
    expect(srtToMs('00:00:01.500')).toBe(1500); // 容忍小数点
  });

  test('cent 百分秒互转', () => {
    expect(msToCent(1234567)).toBe('0:20:34.56');
    expect(centToMs('0:00:01.50')).toBe(1500);
    expect(centToMs('1:02:03.40')).toBe(3723400);
  });

  test('lrc 时间互转', () => {
    expect(msToLrc(61000 + 500)).toBe('01:01.50');
    expect(lrcToMs('01:02.5')).toBe(62500);
    expect(lrcToMs('1:02.05')).toBe(62050);
    expect(lrcToMs('00:12')).toBe(12000);
  });

  test('sub 帧号', () => {
    expect(msToFrame(1000, 25)).toBe(25);
    expect(msToFrame(40000, 23.976)).toBe(959);
  });

  test('fmtDuration', () => {
    expect(fmtDuration(5000)).toBe('5 秒 000 毫秒');
    expect(fmtDuration(65000)).toBe('1 分 5 秒');
    expect(fmtDuration(3700000)).toBe('1 小时 1 分 40 秒');
  });
});

describe('SRT', () => {
  const srt = `1
00:00:01,000 --> 00:00:04,500
你好
第二行

2
00:01:02,300 --> 01:00:00,000
<font color="yellow">带标签行</font>
长文本 a, b , c 含逗号`;

  test('解析 序号/多行/标签/含逗号', () => {
    const cues = parseSubtitle(srt, 'srt');
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ start: 1000, end: 4500, text: '你好\n第二行' });
    expect(cues[1].start).toBe(62300);
    expect(cues[1].end).toBe(3600000);
    expect(cues[1].text).toBe('带标签行\n长文本 a, b , c 含逗号');
  });

  test('序列化与往返', () => {
    const out = toSubtitle([{ start: 1000, end: 4500, text: '你好\n第二行' }], 'srt');
    expect(out).toBe('1\n00:00:01,000 --> 00:00:04,500\n你好\n第二行\n');
    cueEq(parseSubtitle(out, 'srt'), [{ start: 1000, end: 4500, text: '你好\n第二行' }]);
  });

  test('毫秒取整', () => {
    const cues = parseSubtitle('1\n00:00:01,999 --> 00:00:02,001\nx', 'srt');
    expect(cues[0].start).toBe(1999);
    expect(cues[0].end).toBe(2001);
  });
});

describe('VTT', () => {
  const vtt = `WEBVTT

cue-1
00:01.000 --> 00:03.000
<b>加粗</b> 你好

00:04.500 --> 00:05.000 align:start line:0%
第二段`;

  test('解析 cue id / 短时间 / 标签 / cue 设置', () => {
    const cues = parseSubtitle(vtt, 'vtt');
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ start: 1000, end: 3000, text: '加粗 你好' });
    expect(cues[1].start).toBe(4500);
  });

  test('输出与往返', () => {
    const out = toSubtitle([{ start: 1000, end: 3000, text: '你好' }], 'vtt');
    expect(out).toBe('WEBVTT\n\n00:00:01.000 --> 00:00:03.000\n你好\n');
    const parsed = parseSubtitle(out, 'vtt');
    expect(parsed[0]).toEqual({ start: 1000, end: 3000, text: '你好' });
  });

  test('非 VTT 头报错', () => {
    expect(() => parseSubtitle('00:01.000 --> 00:03.000\nx', 'vtt')).toThrow(/WEBVTT/);
  });
});

describe('SBV', () => {
  const sbv = `0:00:01.000,0:00:03.000
你好

0:00:04.000,0:00:05.500
<i>第二段</i>`;

  test('解析', () => {
    const cues = parseSubtitle(sbv, 'sbv');
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ start: 1000, end: 3000, text: '你好' });
    expect(cues[1].end).toBe(5500);
    expect(cues[1].text).toBe('第二段');
  });

  test('输出格式 H:MM:SS.mmm', () => {
    const out = toSubtitle([{ start: 1000, end: 3000, text: '你好' }], 'sbv');
    expect(out).toBe('0:00:01.000,0:00:03.000\n你好\n');
  });
});

describe('SUB (MicroDVD)', () => {
  test('默认 25fps 帧换算', () => {
    const cues = parseSubtitle('{25}{75}你好|再见', 'sub');
    expect(cues[0]).toEqual({ start: 1000, end: 3000, text: '你好\n再见' });
  });

  test('fps 头声明', () => {
    const cues = parseSubtitle('{1}{1}23.976\n{24}{72}嗨', 'sub');
    expect(cues[0].start).toBe(1001); // round(24 / 23.976 * 1000)
    expect(cues[0].end).toBe(3003);
  });

  test('样式 {y:..} 剥除与输出', () => {
    const cues = parseSubtitle('{25}{75}{y:i}斜体', 'sub');
    expect(cues[0].text).toBe('斜体');
    const out = toSubtitle([{ start: 1000, end: 3000, text: '你好\n再见' }], 'sub');
    expect(out).toBe('{1}{1}25.000\n{25}{75}你好|再见\n');
  });
});

describe('SSA / ASS', () => {
  const ass = `[Script Info]
ScriptType: v4.00+
Collisions: Normal

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.50,Default,,0,0,0,,第一行\\N第二行
Dialogue: 0,0:00:04.00,0:00:05.00,Default,,0,0,0,,带, 逗号{\\pos(100,200)}和样式`;

  test('解析 ASS (含 \\N 与逗号与覆盖块)', () => {
    const cues = parseSubtitle(ass, 'ass');
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ start: 1000, end: 3500, text: '第一行\n第二行' });
    expect(cues[1].text).toBe('带, 逗号和样式');
  });

  test('SSA v4 解析', () => {
    const ssa = `[Script Info]
ScriptType: v4.00

[V4 Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, TertiaryColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, AlphaLevel, Encoding
Style: Default,Arial,20,16777215,65535,65535,0,0,0,1,2,2,2,10,10,10,0,0

[Events]
Format: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: Marked=0,0:00:01.00,0:00:02.00,Default,,0,0,0,,ssa 文本`;
    const cues = parseSubtitle(ssa, 'ssa');
    expect(cues[0]).toEqual({ start: 1000, end: 2000, text: 'ssa 文本' });
  });

  test('ASS 序列化含转义并回读一致', () => {
    const src = [{ start: 1000, end: 3500, text: '第一行\n第二行' }, { start: 4000, end: 5000, text: '带, 逗号' }];
    const out = toSubtitle(src, 'ass');
    expect(out).toContain('[V4+ Styles]');
    expect(out).toContain('Dialogue: 0,0:00:01.00,0:00:03.50,Default,,0,0,0,,第一行\\N第二行');
    expect(out).toContain('\\,');
    cueEq(parseSubtitle(out, 'ass'), src);
  });

  test('SSA 序列化', () => {
    const out = toSubtitle([{ start: 1000, end: 2000, text: 'x' }], 'ssa');
    expect(out).toContain('[V4 Styles]');
    expect(out).toContain('Format: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text');
    expect(out).toContain('Dialogue: Marked=0,0:00:01.00,0:00:02.00,Default,,0,0,0,,x');
  });
});

describe('SMI (SAMI)', () => {
  const smi = `<SAMI>
<HEAD><TITLE>Test</TITLE></HEAD>
<BODY>
<SYNC Start=1000><P Class=UNCCN>第一句 &amp; 符号<br>第二行</P></SYNC>
<SYNC Start=5000><P>第二句</P></SYNC>
</BODY>
</SAMI>`;

  test('解析 (next sync 定 end / br / 实体)', () => {
    const cues = parseSubtitle(smi, 'smi');
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ start: 1000, end: 5000, text: '第一句 & 符号\n第二行' });
    expect(cues[1].start).toBe(5000);
    expect(cues[1].end).toBe(9000); // 最后一条 +4000
  });

  test('输出与回读', () => {
    const out = toSubtitle([{ start: 1000, end: 5000, text: 'a <b> & c' }], 'smi');
    expect(out).toContain('<SYNC Start=1000>');
    expect(out).toContain('a &lt;b&gt; &amp; c');
    const parsed = parseSubtitle(out, 'smi');
    expect(parsed[0].text).toBe('a <b> & c');
  });
});

describe('LRC', () => {
  test('解析 多标签 / 排序 / end 规则', () => {
    const lrc = `[ti:歌名]
[00:01.00]第一句
[00:03.50]第二句
[00:05.00][00:06.00]第三句`;
    const cues = parseSubtitle(lrc, 'lrc');
    expect(cues).toHaveLength(4);
    expect(cues[0]).toEqual({ start: 1000, end: 3500, text: '第一句' });
    expect(cues[1]).toEqual({ start: 3500, end: 5000, text: '第二句' });
    // 第三句两次出现, 后一条 end = start+5000
    expect(cues[2].text).toBe('第三句');
    expect(cues[3].text).toBe('第三句');
    expect(cues[3].end).toBe(11000);
  });

  test('输出与回读', () => {
    const out = toSubtitle([{ start: 62500, end: 63000, text: '1:02.5' }], 'lrc');
    expect(out).toBe('[01:02.50]1:02.5\n');
    const parsed = parseSubtitle(out, 'lrc');
    expect(parsed[0].start).toBe(62500);
  });
});

describe('JSON', () => {
  test('解析规范结构', () => {
    const cues = parseSubtitle('[{"start":1000,"end":2000,"text":"你好"}]', 'json');
    expect(cues[0]).toEqual({ start: 1000, end: 2000, text: '你好' });
  });

  test('兼容 startTime/content 与包裹对象', () => {
    const cues = parseSubtitle('{"cues":[{"startTime":1000,"endTime":2000,"content":"x"}]}', 'json');
    expect(cues[0]).toEqual({ start: 1000, end: 2000, text: 'x' });
  });

  test('输出与回读', () => {
    const src = [{ start: 1000, end: 2000, text: '你好' }];
    const out = toSubtitle(src, 'json');
    expect(JSON.parse(out)).toEqual([{ start: 1000, end: 2000, text: '你好' }]);
    cueEq(parseSubtitle(out, 'json'), src);
  });

  test('非法输入报错', () => {
    expect(() => parseSubtitle('not json', 'json')).toThrow(/JSON/);
    expect(() => parseSubtitle('[{"text":"x"}]', 'json')).toThrow(/start|end/);
  });
});

describe('跨格式转换', () => {
  const SRC_SRT = '1\n00:00:01,000 --> 00:00:04,500\n你好\n第二行\n';

  test('SRT -> 各格式 -> SRT 保持时间与文本', () => {
    const src = parseSubtitle(SRC_SRT, 'srt');
    for (const fmt of [ 'vtt', 'sbv', 'ass', 'ssa', 'smi', 'lrc', 'json' ] as SubFormat[]) {
      const out = toSubtitle(src, fmt);
      const back = parseSubtitle(out, fmt);
      expect(back).toHaveLength(1);
      expect(back[0].start).toBe(1000);
      // LRC/SMI 原生不表达结束时间, 回读 end 为推断值
      if (fmt !== 'lrc' && fmt !== 'smi') {
        expect(back[0].end).toBe(4500);
      }
      if (fmt === 'lrc') {
        // LRC 文本无换行语义, 文本以空格连接
        expect(back[0].text.replace(' ', '\n')).toBe('你好\n第二行');
      } else {
        expect(back[0].text).toBe('你好\n第二行');
      }
    }
  });

  test('SUB 需经帧率', () => {
    const src = parseSubtitle(SRC_SRT, 'srt');
    const subOut = toSubtitle(src, 'sub');
    expect(subOut).toContain('{25}{113}你好|第二行'); // round(4.5s*25fps)=113
  });
});

describe('格式检测', () => {
  const samples: Array<[string, SubFormat]> = [
    [ '1\n00:00:01,000 --> 00:00:02,000\nhi', 'srt' ],
    [ 'WEBVTT\n\n00:01.000 --> 00:02.000\nhi', 'vtt' ],
    [ '0:00:01.000,0:00:02.000\nhi', 'sbv' ],
    [ '{1}{1}25.000\n{25}{50}hi', 'sub' ],
    [ '[Script Info]\nScriptType: v4.00\n[V4 Styles]\n[Events]\nFormat: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: Marked=0,0:00:01.00,0:00:02.00,Default,,0,0,0,,hi', 'ssa' ],
    [ '[Script Info]\nScriptType: v4.00+\n[V4+ Styles]\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,hi', 'ass' ],
    [ '<SAMI><BODY><SYNC Start=1000><P>hi</P></SYNC></BODY></SAMI>', 'smi' ],
    [ '[00:01.00]hi', 'lrc' ],
    [ '[{"start":1,"end":2,"text":"x"}]', 'json' ],
  ];
  samples.forEach(([text, expectFmt]) => {
    test(`detect ${expectFmt}`, () => {
      expect(detectSubtitleFormat(text)).toBe(expectFmt);
    });
  });

  test('空/无法识别返回 null', () => {
    expect(detectSubtitleFormat('')).toBeNull();
    expect(detectSubtitleFormat('随便一段文字')).toBeNull();
  });
});
