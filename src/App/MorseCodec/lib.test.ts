import {
  encodeMorse,
  decodeMorse,
  MORSE_CODE_TABLE,
} from './lib';

describe('摩斯码编解码', () => {
  it('SOS 编码', () => {
    expect(encodeMorse('SOS')).toBe('... --- ...');
  });

  it('SOS 解码', () => {
    expect(decodeMorse('... --- ...')).toBe('SOS');
  });

  it('hello world 编码: 单词用 / 分隔', () => {
    expect(encodeMorse('hello world')).toBe('.... . .-.. .-.. --- / .-- --- .-. .-.. -..');
  });

  it('hello world 解码', () => {
    expect(decodeMorse('.... . .-.. .-.. --- / .-- --- .-. .-.. -..')).toBe('HELLO WORLD');
  });

  it('大小写不敏感 / 多余空格容错', () => {
    expect(decodeMorse('  ...   ---   ...  ')).toBe('SOS');
    expect(encodeMorse(' sos ')).toBe('... --- ...');
  });

  it('数字与常用标点往返', () => {
    const text = '1234567890 .,?!';
    expect(decodeMorse(encodeMorse(text))).toBe(text.toUpperCase());
  });

  it('全部字母往返', () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    expect(decodeMorse(encodeMorse(letters))).toBe(letters);
  });

  it('连续多个空格视为一个单词分隔', () => {
    expect(encodeMorse('a  b')).toBe('.- / -...');
    // 无 / 时多余空格仅作字母分隔符; / 才是单词分隔
    expect(decodeMorse('.-   -...')).toBe('AB');
    expect(decodeMorse('.- / -...')).toBe('A B');
  });

  it('含空内容与纯分隔符', () => {
    expect(encodeMorse('   ')).toBe('');
    expect(decodeMorse('')).toBe('');
  });

  it('不支持的中文字符抛出带字符的错误', () => {
    expect(() => encodeMorse('你好')).toThrow('你');
  });

  it('非法摩斯符号抛出错误', () => {
    expect(() => decodeMorse('..-..--?')).toThrow('..-..--?');
    expect(() => decodeMorse('ABC')).toThrow('ABC');
  });

  it('表中无重复码 (反向表与正表一一对应)', () => {
    const codes = Object.values(MORSE_CODE_TABLE);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

import { isMorseText, buildMorsePlaySchedule } from './lib';

describe('摩斯码播放调度 (buildMorsePlaySchedule)', () => {
  const sumEvents = (ms :number, evs :Array<{ on: boolean; ms: number }>) =>
    evs.reduce((a, e) => a + e.ms, 0);

  it('isMorseText 判定可播放文本', () => {
    expect(isMorseText('... --- ...')).toBe(true);
    expect(isMorseText('... / ---')).toBe(true);
    expect(isMorseText('abc')).toBe(false);
    expect(isMorseText('...---')).toBe(true); // 连续无空格也可播放 (视为超长码值)
    expect(isMorseText('/')).toBe(false);
    expect(isMorseText('')).toBe(false);
  });

  it('SOS: 码值起始时间与总时长符合 1/3/3/3 节奏', () => {
    const s = buildMorsePlaySchedule('... --- ...', 120);
    expect(s.tokens.map((t) => t.text)).toEqual(['...', '---', '...']);
    expect(s.tokens.every((t) => !t.word && t.sym >= 0)).toBe(true);
    // 第一段 600ms, 字母间隔 360ms → 第二段起始 960ms; 第三段起始 2640ms
    expect(s.startMs).toEqual([0, 960, 2640]);
    // '...'=600 + '---'=1320 + '...'=600, 字母间隔 360+360
    expect(s.totalMs).toBe(3240);
    expect(sumEvents(s.totalMs, s.events)).toBe(3240);
  });

  it('单词分隔 / 拉长间隔为 7 个单位', () => {
    const s = buildMorsePlaySchedule('... / ---', 120);
    expect(s.tokens.map((t) => t.text)).toEqual(['...', '/', '---']);
    expect(s.tokens[1].word).toBe(true);
    expect(s.tokens[1].sym).toBe(-1);
    // '...' 600ms + 单词间隔 840ms → '---' 起始 1440ms
    expect(s.startMs).toEqual([0, 1440]);
  });

  it('单个码值时长: 点 1 单位 / 划 3 单位 / 符号内间隔 1 单位', () => {
    const s = buildMorsePlaySchedule('-.', 100);
    expect(s.tokens.map((t) => t.text)).toEqual(['-.']);
    expect(s.events).toEqual([
      { on: true, ms: 300 },
      { on: false, ms: 100 },
      { on: true, ms: 100 },
    ]);
    expect(s.totalMs).toBe(500);
  });

  it('音高与总时长随 dotMs 线性变化', () => {
    expect(buildMorsePlaySchedule('... --- ...', 300).totalMs).toBe(8100);
    expect(buildMorsePlaySchedule('... --- ...', 80).totalMs).toBe(2160);
  });

  it('空内容无事件无码值', () => {
    const s = buildMorsePlaySchedule('   ', 120);
    expect(s.tokens).toEqual([]);
    expect(s.events).toEqual([]);
    expect(s.totalMs).toBe(0);
    expect(s.startMs).toEqual([]);
  });
});

import {
  MORSE_PHRASE_GROUPS,
  listCustomMorsePhrases,
  saveCustomMorsePhrases,
} from './lib';

describe('摩斯码常用编码速查', () => {
  it('内置分组与条目齐全', () => {
    expect(MORSE_PHRASE_GROUPS.map((g) => g.key)).toEqual(['call', 'q', 'num', 'word']);
    const total = MORSE_PHRASE_GROUPS.reduce((a, g) => a + g.items.length, 0);
    expect(total).toBe(26);
    const allTexts = MORSE_PHRASE_GROUPS.flatMap((g) => g.items.map((i) => i.text));
    expect(allTexts).toContain('CQ');
    expect(allTexts).toContain('SOS');
    expect(allTexts).toContain('QRZ');
    expect(allTexts).toContain('QSO');
    expect(allTexts).toContain('73');
    expect(allTexts).toContain('88');
    expect(allTexts).toContain('TU');
    expect(new Set(allTexts).size).toBe(allTexts.length); // 无重复
  });

  it('内置编码均可被摩斯表编码且码值正确', () => {
    expect(encodeMorse('CQ')).toBe('-.-. --.-');
    expect(encodeMorse('SOS')).toBe('... --- ...');
    expect(encodeMorse('QRZ')).toBe('--.- .-. --..');
    expect(encodeMorse('73')).toBe('--... ...--');
    expect(encodeMorse('TU')).toBe('- ..-');
    // 所有内置条目都能编码 (全为字母/数字/标点)
    for (const g of MORSE_PHRASE_GROUPS) {
      for (const it of g.items) {
        expect(() => encodeMorse(it.text)).not.toThrow();
      }
    }
  });

  it('自定义常用编码存取与容错', () => {
    localStorage.removeItem('morse-phrases');
    expect(listCustomMorsePhrases()).toEqual([]);
    localStorage.setItem('morse-phrases', 'not-json');
    expect(listCustomMorsePhrases()).toEqual([]);
    saveCustomMorsePhrases([{ id: 1, text: 'CQ', desc: '呼叫' }, { id: 2, text: 'BYE', desc: '再见' }]);
    expect(listCustomMorsePhrases().length).toBe(2);
    expect(listCustomMorsePhrases()[0]).toEqual({ id: 1, text: 'CQ', desc: '呼叫' });
    localStorage.removeItem('morse-phrases');
  });
});

import { renderMorseWav } from './lib';

describe('摩斯码导出 WAV 音频', () => {
  const sched = buildMorsePlaySchedule('... --- ...', 120); // SOS: totalMs = 3240

  it('生成合法 RIFF/WAVE 单声道 16bit 头', () => {
    const wav = renderMorseWav(sched, { freq: 700, wave: 'sine', amp: 0.5, sampleRate: 8000 });
    const text = (b: Uint8Array, off: number, len: number) =>
      String.fromCharCode(...Array.from(b.slice(off, off + len)));
    expect(text(wav, 0, 4)).toBe('RIFF');
    expect(text(wav, 8, 4)).toBe('WAVE');
    expect(text(wav, 36, 4)).toBe('data');
    const view = new DataView(wav.buffer);
    expect(view.getUint16(20, true)).toBe(1);  // PCM
    expect(view.getUint16(22, true)).toBe(1);  // 单声道
    expect(view.getUint32(24, true)).toBe(8000);
    expect(view.getUint16(34, true)).toBe(16); // 位深
    // 总时长 = (3240 + 120 尾音)ms @ 8k
    const dataLen = view.getUint32(40, true);
    expect(dataLen).toBe((3240 + 120) * 8000 / 1000 * 2);
    expect(wav.length).toBe(44 + dataLen);
    expect(view.getUint32(4, true)).toBe(36 + dataLen);
  });

  it('实际有波形输出且幅度不削波', () => {
    const wav = renderMorseWav(sched, { freq: 700, wave: 'sine', amp: 0.5, sampleRate: 8000 });
    const view = new DataView(wav.buffer);
    let nonZero = 0;
    let peak = 0;
    for (let i = 44; i < wav.length; i += 2) {
      const s = view.getInt16(i, true);
      peak = Math.max(peak, Math.abs(s));
      if (s !== 0) nonZero++;
    }
    expect(nonZero).toBeGreaterThan(1000); // SOS 有声段足够长
    expect(peak).toBeLessThanOrEqual(32767);
    expect(peak).toBeGreaterThan(1000);    // 并非静音
  });

  it('不同波形与幅度参与渲染', () => {
    const a = renderMorseWav(sched, { freq: 700, wave: 'square', amp: 0.2, sampleRate: 8000 });
    const b = renderMorseWav(sched, { freq: 700, wave: 'triangle', amp: 0.45, sampleRate: 8000 });
    const c = renderMorseWav(sched, { freq: 700, wave: 'sawtooth', amp: 0.14, sampleRate: 8000 });
    expect(a.length).toBe(b.length);
    expect(b.length).toBe(c.length);
    const viewA = new DataView(a.buffer);
    const viewB = new DataView(b.buffer);
    let diff = 0;
    for (let i = 44; i < a.length; i += 2) {
      if (viewA.getInt16(i, true) !== viewB.getInt16(i, true)) diff++;
    }
    expect(diff).toBeGreaterThan(100); // 波形不同 -> 采样不同
    expect(a.length).toBe(44 + (3240 + 120) * 8 * 2);
  });
});
