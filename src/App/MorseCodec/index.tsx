import { Button, Divider, Input, message, Select, Slider, Space, theme } from "antd";
import { useEffect, useRef, useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined, CaretRightOutlined, StopOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { encodeMorse, decodeMorse, isMorseText, buildMorsePlaySchedule, type MorsePlayToken } from "./lib"
import MorseIntro from "./intro"

// 播放速度: 点的时长 (ms)
const MORSE_SPEEDS = [
  { value: 300, label: '极慢 (300ms)' },
  { value: 200, label: '慢 (200ms)' },
  { value: 120, label: '标准 (120ms)' },
  { value: 80,  label: '快 (80ms)' },
];

// 播放音效: 波形 + 响度 (默认电报音 = 经典等幅报纯正弦 CW 音)
const TONE_OPTIONS = [
  { value: 'telegraph', label: '电报音 (默认)', type: 'sine' as OscillatorType, amp: 0.5 },
  { value: 'buzzer',    label: '蜂鸣音',       type: 'square' as OscillatorType, amp: 0.2 },
  { value: 'soft',      label: '柔和音',       type: 'triangle' as OscillatorType, amp: 0.45 },
  { value: 'digital',   label: '电子音',       type: 'sawtooth' as OscillatorType, amp: 0.14 },
];

const MorseCodec = () => {

  const { token } = theme.useToken();

  const [ text, setText ] = useState('');   // 明文
  const [ morse, setMorse ] = useState(''); // 摩斯码
  const [ dotMs, setDotMs ] = useState(120);   // 播放速度
  const [ freq, setFreq ] = useState(700);     // 播放频率 Hz
  const [ playing, setPlaying ] = useState(false);
  const [ tone, setTone ] = useState('telegraph'); // 播放音效
  const [ playTokens, setPlayTokens ] = useState<MorsePlayToken[] | null>(null); // 播放的码值序列
  const [ activeIdx, setActiveIdx ] = useState(-1); // 当前发声码值 (红色高亮)
  const [ notice, contextHolder ] = message.useMessage();

  const ctxRef = useRef<AudioContext | null>(null);
  const runRef = useRef(0);          // 播放批次号, 停止时递增使旧定时器失效
  const timersRef = useRef<number[]>([]); // 所有待触发的定时器

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
    runRef.current++; // 使尚未触发的批次定时器失效
    setPlaying(false);
    setPlayTokens(null);
    setActiveIdx(-1);
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; }
  };

  const play = async () => {
    const morseStr = pickMorse();
    if (morseStr === null) {
      notice.warning('请先输入要播放的摩斯码 (或明文后先编码)');
      return;
    }
    const sched = buildMorsePlaySchedule(morseStr, dotMs);
    if (sched.events.length === 0) {
      notice.warning('没有可播放的摩斯符号');
      return;
    }
    try {
      const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtor();
      if (ctx.state === 'suspended') await ctx.resume();
      ctxRef.current = ctx;
      const runId = ++runRef.current;
      setPlaying(true);
      setPlayTokens(sched.tokens);
      setActiveIdx(-1);

      // 音频与高亮共用同一时间线 (声音从约 60ms 后开始)
      const baseMs = 60;
      const toneDef = TONE_OPTIONS.find((t) => t.value === tone) ?? TONE_OPTIONS[0];
      const peak = toneDef.amp;
      let cursor = ctx.currentTime + baseMs / 1000;
      for (const ev of sched.events) {
        if (ev.on) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = toneDef.type;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, cursor);
          gain.gain.linearRampToValueAtTime(peak, cursor + 0.01);
          gain.gain.setValueAtTime(peak, cursor + Math.max(ev.ms / 1000 - 0.02, 0.005));
          gain.gain.linearRampToValueAtTime(0.0001, cursor + ev.ms / 1000);
          osc.connect(gain).connect(ctx.destination);
          osc.start(cursor);
          osc.stop(cursor + ev.ms / 1000 + 0.03);
        }
        cursor += ev.ms / 1000;
      }

      // 每个码值开始发声时, 红色高亮它 (延迟 = 该码值在时间线上的起点 + 音频起始偏移)
      const timers: number[] = [];
      timersRef.current = timers;
      sched.startMs.forEach((st, i) => {
        timers.push(window.setTimeout(() => {
          if (runRef.current === runId) setActiveIdx(i);
        }, st + baseMs));
      });
      // 播放结束时自动停止 (最后一个声音 + 尾音)
      timers.push(window.setTimeout(() => {
        if (runRef.current === runId) stop();
      }, sched.totalMs + baseMs + 150));
    } catch (err) {
      notice.error('播放失败: ' + (err as Error).message);
      setPlaying(false);
      setPlayTokens(null);
      setActiveIdx(-1);
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

      { playing && playTokens && playTokens.length > 0 && (
        <div
          style={ {
            marginTop: 10,
            padding: '8px 12px',
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 6,
            background: token.colorBgContainer,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          } }
        >
          <span style={ { color: token.colorError, fontWeight: 600, fontSize: 13, flex: 'none' } }>● 正在播放</span>
          <span style={ { fontFamily: 'Consolas, Monaco, monospace', fontSize: 17, letterSpacing: 2, lineHeight: '28px' } }>
            { playTokens.map((t, i) => t.word ? (
              <span key={ i } style={ { color: token.colorTextTertiary, margin: '0 8px' } }>/</span>
            ) : (
              <span
                key={ i }
                style={ {
                  color: t.sym === activeIdx ? token.colorError : token.colorText,
                  background: t.sym === activeIdx ? token.colorErrorBg : 'transparent',
                  fontWeight: t.sym === activeIdx ? 700 : 400,
                  borderRadius: 4,
                  padding: '0 5px',
                  marginRight: 8,
                  transition: 'color 0.1s, background 0.1s',
                } }
              >{ t.text }</span>
            )) }
          </span>
        </div>
      ) }

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
        <span>音效</span>
        <Select
          value={ tone }
          style={ { width: 150 } }
          onChange={ setTone }
          options={ TONE_OPTIONS }
        />
        { playing && <span style={ { color: '#28a745' } }>正在播放…</span> }
      </Space>

      <Divider> 摩斯码编解码说明 </Divider>

      <MorseIntro />
    </div>
  );
}

export default MorseCodec;
