import { Button, Divider, Input, message, Select, Slider, Space } from "antd";
import { useEffect, useRef, useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined, CaretRightOutlined, StopOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { encodeMorse, decodeMorse } from "./lib"
import MorseIntro from "./intro"

// 播放速度: 点的时长 (ms)
const MORSE_SPEEDS = [
  { value: 300, label: '极慢 (300ms)' },
  { value: 200, label: '慢 (200ms)' },
  { value: 120, label: '标准 (120ms)' },
  { value: 80,  label: '快 (80ms)' },
];

// 判断是否为摩斯码文本 (字母间空格 / 单词间 / 分隔)
const isMorseText = (s :string) :boolean =>
  /[.\-]/.test(s) && /^[\s.\-/]+$/.test(s);

// 将摩斯码转换为按顺序播放的事件序列 (单位已换算为毫秒)
const buildPlayEvents = (morse :string, dotMs :number) :Array<{ on: boolean; ms: number }> => {
  const tokens = morse.trim().split(/\s+/).filter(Boolean);
  const events :Array<{ on: boolean; ms: number }> = [];
  let pendingGap = 0; // 下一个声音前需要静音的长度
  for (const token of tokens) {
    if (token === '/') { // 单词间隔 7 个单位
      pendingGap = Math.max(pendingGap, dotMs * 7);
      continue;
    }
    if (!/^[.\-]+$/.test(token)) continue; // 忽略无法识别的杂字符
    const syms = token.split('');
    syms.forEach((sym, j) => {
      if (pendingGap > 0) { events.push({ on: false, ms: pendingGap }); pendingGap = 0; }
      events.push({ on: true, ms: sym === '.' ? dotMs : dotMs * 3 }); // 点 1 / 划 3
      if (j < syms.length - 1) events.push({ on: false, ms: dotMs });  // 符号内间隔 1
    });
    pendingGap = dotMs * 3; // 字母间隔 3
  }
  return events;
};

const MorseCodec = () => {

  const [ text, setText ] = useState('');   // 明文
  const [ morse, setMorse ] = useState(''); // 摩斯码
  const [ dotMs, setDotMs ] = useState(120);   // 播放速度
  const [ freq, setFreq ] = useState(700);     // 播放频率 Hz
  const [ playing, setPlaying ] = useState(false);
  const [ notice, contextHolder ] = message.useMessage();

  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  // 组件卸载时停止播放
  useEffect(() => () => { stop(); }, []);

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLTextAreaElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const encode = () => {
    try {
      setMorse( encodeMorse(text) );
    } catch(err) {
      notice.error("编码失败: " + (err as Error).message);
    }
  }

  const decode = () => {
    try {
      setText( decodeMorse(morse) );
    } catch(err) {
      notice.error("解码失败: " + (err as Error).message);
    }
  }

  // 取当前可播放的摩斯码: 优先下方的摩斯框, 其次上方若为摩斯码, 最后尝试把上方明文编码后播放
  const pickMorse = () :string | null => {
    const m = morse.trim();
    const t = text.trim();
    if (isMorseText(m)) return m;
    if (isMorseText(t)) return t;
    if (t !== '') {
      try { return encodeMorse(t); } catch { return null; }
    }
    return null;
  }

  const stop = () => {
    setPlaying(false);
    if (timerRef.current !== undefined) { window.clearTimeout(timerRef.current); timerRef.current = undefined; }
    if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; }
  };

  const play = async () => {
    const morseStr = pickMorse();
    if (morseStr === null) {
      notice.warning('请先输入要播放的摩斯码 (或明文后先编码)');
      return;
    }
    const events = buildPlayEvents(morseStr, dotMs);
    if (events.length === 0) {
      notice.warning('没有可播放的摩斯符号');
      return;
    }
    try {
      const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtor();
      if (ctx.state === 'suspended') await ctx.resume();
      ctxRef.current = ctx;
      setPlaying(true);

      let cursor = ctx.currentTime + 0.06;
      for (const ev of events) {
        if (ev.on) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, cursor);
          gain.gain.linearRampToValueAtTime(0.5, cursor + 0.01);
          gain.gain.setValueAtTime(0.5, cursor + Math.max(ev.ms - 0.02, 0.005));
          gain.gain.linearRampToValueAtTime(0.0001, cursor + ev.ms);
          osc.connect(gain).connect(ctx.destination);
          osc.start(cursor);
          osc.stop(cursor + ev.ms + 0.03);
        }
        cursor += ev.ms / 1000;
      }
      const total = (cursor - ctx.currentTime) * 1000 + 150;
      timerRef.current = window.setTimeout(() => { stop(); }, total);
    } catch (err) {
      notice.error('播放失败: ' + (err as Error).message);
      setPlaying(false);
    }
  };

  return (
    <div>
      {contextHolder}

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setText(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { text }
        placeholder="输入需要编码的文本 (字母 / 数字 / 常用标点), 或解码结果的回填区"
        autoSize={{ minRows: 4, maxRows: 6 }}
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setText ); } }
      />

      <Space wrap>
        <Button
          onClick={ encode }
          style={ { backgroundColor: "#007bff", color: "#fff" } }
          icon={<ArrowDownOutlined />}
        >文本 → 摩斯码</Button>
        <Button
          onClick={ decode }
          style={ { backgroundColor: "#28a745", color: "#fff" } }
          icon={<ArrowUpOutlined />}
        >摩斯码 → 文本</Button>
        <Button
          onClick={ play }
          disabled={ playing }
          style={ { backgroundColor: "#17a2b8", color: "#fff" } }
          icon={<CaretRightOutlined />}
        >播放摩斯码</Button>
        <Button
          onClick={ stop }
          disabled={ !playing }
          danger
          icon={<StopOutlined />}
        >停止</Button>
        <Button
          onClick={ () => { setText(''); setMorse(''); } }
          style={ { backgroundColor: "#dc3545", color: "#fff" } }
        >清除</Button>
      </Space>

      <TextArea
        style={ { margin: "8px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setMorse(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { morse }
        placeholder="摩斯码结果区: 字母间空格, 单词间使用 / 分隔, 例如 ... --- ... (SOS)"
        autoSize={{ minRows: 4, maxRows: 6 }}
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setMorse ); } }
      />

      <Space style={ { marginTop: 4 } } wrap>
        <span>播放速度</span>
        <Select
          value={ dotMs }
          style={ { width: 160 } }
          onChange={ setDotMs }
          options={ MORSE_SPEEDS }
        />
        <span>频率</span>
        <div style={ { width: 200, display: 'inline-block' } }>
          <Slider
            min={ 200 }
            max={ 1600 }
            step={ 10 }
            value={ freq }
            onChange={ setFreq }
          />
        </div>
        <span>{ freq } Hz</span>
        { playing && <span style={ { color: '#28a745' } }>正在播放…</span> }
      </Space>

      <Divider> 摩斯码编解码说明 </Divider>

      <MorseIntro />
    </div>
  );
}

export default MorseCodec;
