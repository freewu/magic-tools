import { Button, Checkbox, Input, InputNumber, Segmented, Slider, message } from "antd";
import {
  AppstoreOutlined, AudioMutedOutlined, AudioOutlined, CommentOutlined, CompressOutlined,
  DeleteOutlined, DesktopOutlined, ExpandOutlined, EyeInvisibleOutlined, FundProjectionScreenOutlined,
  InfoCircleOutlined, MoreOutlined, PauseCircleOutlined, PhoneOutlined, PlayCircleOutlined,
  SafetyCertificateOutlined, StopOutlined, TeamOutlined, UploadOutlined, VideoCameraOutlined, WifiOutlined,
} from '@ant-design/icons';
import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useLocale } from "../../hook/locale-context";
import { ImageError, loadImageFile } from "../../lib/image";
import { im } from './lang';
import {
  SKIN_CONTROLS, SKIN_DIVIDERS, SKIN_META, SKINS, SKIN_TOP_ICONS, SHARE_SLIDE,
  PARTICIPANTS_MAX, PARTICIPANTS_MIN,
  chatLine, clockText, gridColumns, pickParticipants, trio,
  type Control, type ControlAction, type IconKey, type Skin,
} from "./lib";
import "./meeting.css";

/** 图标映射: lib 中只存图标名, 保持纯数据 */
const ICONS: Record<IconKey, ReactNode> = {
  mic: <AudioOutlined />,
  micOff: <AudioMutedOutlined />,
  cam: <VideoCameraOutlined />,
  camOff: <EyeInvisibleOutlined />,
  share: <DesktopOutlined />,
  shareOff: <StopOutlined />,
  people: <TeamOutlined />,
  chat: <CommentOutlined />,
  more: <MoreOutlined />,
  rec: <FundProjectionScreenOutlined />,
  hand: <span>✋</span>,
  leave: <PhoneOutlined rotate={135} />,
  info: <InfoCircleOutlined />,
  shield: <SafetyCertificateOutlined />,
  grid: <AppstoreOutlined />,
  signal: <WifiOutlined />,
};

/** 聊天消息出现的间隔 / 发言者轮换间隔 (毫秒) */
const CHAT_INTERVAL = 12000;
const SPEAK_INTERVAL = 4200;

const row: CSSProperties = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 };
const label: CSSProperties = { color: 'rgba(0,0,0,.65)' };
const sliderStyle: CSSProperties = { width: 140 };
const valueStyle: CSSProperties = { minWidth: 26, textAlign: 'right', fontFamily: 'monospace' };
const noteStyle: CSSProperties = { color: 'rgba(0,0,0,.45)', fontSize: 12, marginBottom: 10 };
const hiddenInput: CSSProperties = { display: 'none' };

const FakeMeeting: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => im(locale, zh);

  const [ skin, setSkin ] = useState<Skin>('tencent');
  const [ topic, setTopic ] = useState(() => trio(SKIN_META.tencent.topic, locale));
  const [ myName, setMyName ] = useState(() => (locale === 'en' ? 'Me' : '我'));
  const [ meetingId, setMeetingId ] = useState(SKIN_META.tencent.meetingId);
  const [ count, setCount ] = useState(6);
  const [ offsetMin, setOffsetMin ] = useState(0);
  const [ secs, setSecs ] = useState(0);
  const [ running, setRunning ] = useState(true);
  const [ showClock, setShowClock ] = useState(true);
  const [ rec, setRec ] = useState(true);
  const [ panel, setPanel ] = useState<'none' | 'chat' | 'people'>('none');
  const [ micOn, setMicOn ] = useState(false);
  const [ camOn, setCamOn ] = useState(false);
  const [ selfImg, setSelfImg ] = useState<string | null>(null);
  const [ hand, setHand ] = useState(false);
  const [ share, setShare ] = useState(false);
  const [ immersive, setImmersive ] = useState(false);
  const [ speakerIdx, setSpeakerIdx ] = useState(0);
  const [ chatCount, setChatCount ] = useState(2);
  const [ unread, setUnread ] = useState(0);
  const [ murmur, setMurmur ] = useState(false);
  const [ murmurVol, setMurmurVol ] = useState(35);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const meta = SKIN_META[skin];
  const participants = useMemo(() => pickParticipants(count, locale, myName), [ count, locale, myName ]);
  const me = participants[participants.length - 1];
  const others = useMemo(() => participants.filter((p) => !p.isMe), [ participants ]);
  /** Zoom 把「我」放在独立的右上角小窗里, 其余皮肤混排 */
  const gridList = skin === 'zoom' ? others : participants;
  const cols = gridColumns(gridList.length);
  const speakerId = others.length ? others[speakerIdx % others.length].id : '';

  const mutedOf = (p: typeof me) => (p.isMe ? !micOn : p.muted);
  const camOf = (p: typeof me) => (p.isMe ? camOn || !!selfImg : !p.dim);

  /** 我的真实摄像头画面 / 上传的截图 */
  const selfNode: ReactNode = camOn
    ? <video ref={ videoRef } className="fm-video" autoPlay playsInline muted />
    : selfImg
      ? <img className="fm-video is-frame" src={ selfImg } alt="" />
      : null;

  // 计时器
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [ running ]);

  // 起始时长: 改动即重置到该时长
  useEffect(() => {
    setSecs(Math.max(0, Math.round((Number(offsetMin) || 0) * 60)));
  }, [ offsetMin ]);

  // 「谁在发言」轮换
  useEffect(() => {
    const id = setInterval(() => setSpeakerIdx((i) => i + 1), SPEAK_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // 聊天消息逐条出现 (面板没打开时记未读)
  useEffect(() => {
    const id = setInterval(() => {
      setChatCount((c) => Math.min(c + 1, 10));
      setPanel((p) => {
        if (p !== 'chat') setUnread((u) => u + 1);
        return p;
      });
    }, CHAT_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // Esc 退出沉浸模式
  useEffect(() => {
    if (!immersive) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setImmersive(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ immersive ]);

  // 摄像头流挂载 / 卸载
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!camOn || !video || !stream) return;
    try {
      video.srcObject = stream;
    } catch {
      // 某些内嵌浏览器不允许直接赋值, 忽略
    }
    try {
      const played = video.play();
      if (played && typeof played.then === 'function') void played.then(undefined, () => undefined);
    } catch {
      // 无播放能力的环境 (如 jsdom) 忽略
    }
  }, [ camOn ]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => {
    if (selfImg) URL.revokeObjectURL(selfImg);
  }, [ selfImg ]);

  // 背景人声: 带通滤波的棕噪声 (纯本地合成, 无音频文件)
  useEffect(() => {
    if (!murmur) return;
    const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      message.warning(t('人声不可用 (当前环境不支持音频)'));
      setMurmur(false);
      return;
    }
    const ctx = new Ctor();
    const len = Math.floor(ctx.sampleRate * 3);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 620;
    band.Q.value = 0.7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.16;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 240;
    const gain = ctx.createGain();
    gain.gain.value = (murmurVol / 100) * 0.09;
    lfo.connect(lfoGain);
    lfoGain.connect(band.frequency);
    src.connect(band);
    band.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    lfo.start();
    audioRef.current = { ctx, gain };
    return () => {
      try {
        src.stop();
        lfo.stop();
        void ctx.close();
      } catch {
        // 已停止 / 已关闭, 忽略
      }
      audioRef.current = null;
    };
    // 音量变化由下面的 effect 单独处理, 避免重建音频链路
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ murmur ]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.gain.gain.value = (murmurVol / 100) * 0.09;
  }, [ murmurVol ]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setCamOn(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: false });
      streamRef.current = stream;
      setCamOn(true);
    } catch {
      message.warning(t('摄像头不可用或未授权'));
    }
  };

  const clearSelf = () => {
    stopCamera();
    setSelfImg((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  };

  const onSelfFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const img = await loadImageFile(f);
      stopCamera();
      setSelfImg((old) => {
        if (old) URL.revokeObjectURL(old);
        return img.url;
      });
    } catch (err) {
      message.error(err instanceof ImageError && err.code !== 'not-image'
        ? t('图片解析失败, 请确认文件格式')
        : t('读取文件失败'));
    }
  };

  const isDefaultTopic = (v: string) => SKINS.some((k) => SKIN_META[k].topic.some((tp) => tp === v));

  const switchSkin = (v: Skin) => {
    setSkin(v);
    setMeetingId(SKIN_META[v].meetingId);
    setTopic((cur) => (isDefaultTopic(cur) ? trio(SKIN_META[v].topic, locale) : cur));
  };

  /** 当前按钮是否处于「激活/开启」态 */
  const activeOf = (a: ControlAction): boolean => {
    switch (a) {
      case 'mic': return micOn;
      case 'cam': return camOn || !!selfImg;
      case 'share': return share;
      case 'hand': return hand;
      case 'rec': return rec;
      case 'chat': return panel === 'chat';
      case 'people': return panel === 'people';
      default: return false;
    }
  };

  /** 关闭态 (红色斜杠): 麦克风 / 摄像头 */
  const offOf = (a: ControlAction): boolean => (
    (a === 'mic' && !micOn) || (a === 'cam' && !(camOn || !!selfImg))
  );

  const onAction = (a: ControlAction) => {
    switch (a) {
      case 'mic': setMicOn((v) => !v); break;
      case 'cam': if (camOn || selfImg) clearSelf(); else void startCamera(); break;
      case 'share': setShare((v) => !v); break;
      case 'hand': setHand((v) => !v); break;
      case 'rec': setRec((v) => !v); break;
      case 'chat': setPanel((p) => (p === 'chat' ? 'none' : 'chat')); setUnread(0); break;
      case 'people': setPanel((p) => (p === 'people' ? 'none' : 'people')); break;
      case 'more': setPanel('none'); break;
      case 'leave': setRunning(false); setPanel('none'); break;
      default: break;
    }
  };

  const labelOf = (c: Control) => trio(activeOf(c.action) && c.labelActive ? c.labelActive : c.label, locale);
  const iconOf = (c: Control) => ICONS[activeOf(c.action) && c.iconActive ? c.iconActive : c.icon];

  const tileOf = (p: typeof me, opts?: { pane?: boolean }) => {
    const video = p.isMe ? selfNode : null;
    const cls = [
      'fm-tile',
      p.dim && !p.isMe ? 'is-dim' : '',
      speakerId === p.id ? 'is-speaking' : '',
      video ? 'is-video' : '',
      opts?.pane ? 'is-pane' : '',
    ].filter(Boolean).join(' ');
    return (
      <div className={ cls } key={ p.id }>
        <div className="fm-avatar" style={{ background: `hsl(${p.hue} 45% 45%)` }}>{ p.initial }</div>
        { video }
        <div className="fm-tag">
          <span className={ mutedOf(p) ? 'fm-icon is-off' : 'fm-icon' }>
            { mutedOf(p) ? ICONS.micOff : ICONS.mic }
          </span>
          <span className="fm-name">{ p.name }</span>
          { p.isMe && <span className="fm-badge">{ t('我') }</span> }
          { p.host && <span className="fm-badge is-host">{ t('主持人') }</span> }
        </div>
        { p.isMe && hand && <span className="fm-hand">✋</span> }
      </div>
    );
  };

  const messages = useMemo(
    () => Array.from({ length: chatCount }, (_, i) => chatLine(i, locale, participants)),
    [ chatCount, locale, participants ]
  );

  const controls = SKIN_CONTROLS[skin];
  const dividers = SKIN_DIVIDERS[skin];

  return (
    <div>
      <div style={ row }>
        <span style={ label }>{ t('界面风格') }</span>
        <Segmented
          value={ skin }
          onChange={ (v) => switchSkin(v as Skin) }
          options={ SKINS.map((k) => ({ value: k, label: trio(SKIN_META[k].name, locale) })) }
        />
        <span style={ label }>{ t('会议主题') }</span>
        <Input size="small" style={{ width: 200 }} value={ topic } onChange={ (e) => setTopic(e.target.value) } />
        <span style={ label }>{ t('我的名字') }</span>
        <Input size="small" style={{ width: 110 }} value={ myName } onChange={ (e) => setMyName(e.target.value) } />
        <span style={ label }>{ t('会议号') }</span>
        <Input size="small" style={{ width: 150 }} value={ meetingId } onChange={ (e) => setMeetingId(e.target.value) } />
      </div>

      <div style={ row }>
        <span style={ label }>{ t('参会人数') }</span>
        <Slider
          style={ sliderStyle }
          min={ PARTICIPANTS_MIN }
          max={ PARTICIPANTS_MAX }
          value={ count }
          onChange={ setCount }
          tooltip={{ open: false }}
        />
        <span style={ valueStyle }>{ count }</span>
        <span style={ label }>{ t('起始时长 (分钟)') }</span>
        <InputNumber size="small" min={ 0 } max={ 600 } value={ offsetMin } onChange={ (v) => setOffsetMin(Number(v) || 0) } />
        <Button
          size="small"
          icon={ running ? <PauseCircleOutlined /> : <PlayCircleOutlined /> }
          onClick={ () => setRunning((v) => !v) }
        >
          { running ? t('暂停计时') : t('继续计时') }
        </Button>
        <Checkbox checked={ showClock } onChange={ (e) => setShowClock(e.target.checked) }>{ t('计时') }</Checkbox>
        <Checkbox checked={ rec } onChange={ (e) => setRec(e.target.checked) }>{ t('录制红点') }</Checkbox>
        <Button
          size="small"
          icon={ immersive ? <CompressOutlined /> : <ExpandOutlined /> }
          onClick={ () => setImmersive((v) => !v) }
        >
          { t('沉浸模式') }
        </Button>
      </div>

      <div style={ row }>
        <span style={ label }>{ t('我的画面') }</span>
        <Button
          size="small"
          icon={ <VideoCameraOutlined /> }
          onClick={ () => { if (camOn) stopCamera(); else void startCamera(); } }
        >
          { camOn ? t('关闭摄像头') : t('打开摄像头') }
        </Button>
        <Button size="small" icon={ <UploadOutlined /> } onClick={ () => fileRef.current?.click() }>{ t('上传画面图片') }</Button>
        { (camOn || selfImg) && <Button size="small" icon={ <DeleteOutlined /> } onClick={ clearSelf }>{ t('清除画面') }</Button> }
        <input ref={ fileRef } type="file" accept="image/*" style={ hiddenInput } onChange={ onSelfFile } />
        <Checkbox checked={ murmur } onChange={ (e) => setMurmur(e.target.checked) }>{ t('背景人声') }</Checkbox>
        <span style={ label }>{ t('音量') }</span>
        <Slider
          style={ sliderStyle }
          min={ 0 }
          max={ 100 }
          value={ murmurVol }
          disabled={ !murmur }
          onChange={ setMurmurVol }
          tooltip={{ open: false } }
        />
        <span style={ valueStyle }>{ murmurVol }</span>
      </div>

      <div style={ noteStyle }>{ t('一键演示: 点击「沉浸模式」全屏展示, 按 Esc 退出; 界面完全在本地渲染, 不上传任何数据') }</div>

      <div className={ immersive ? 'fm-stage fm-immersive' : 'fm-stage' }>
        <div className={ `fm-app fm-${skin}` }>
          <div className="fm-top">
            <span className="fm-logo">{ meta.badge }</span>
            { skin !== 'tencent' && <span className="fm-brand">{ trio(meta.name, locale) }</span> }
            <span className="fm-topic">{ topic || t('会议中') }</span>
            <span className="fm-sub">{ `${trio(meta.idLabel, locale)}: ${meetingId}` }</span>
            <span className="fm-grow" />
            { rec && <span className="fm-rec">REC</span> }
            { skin === 'zoom' && (
              <span className="fm-chip is-ok"><span className="fm-icon">{ ICONS.shield }</span>{ t('已加密') }</span>
            ) }
            { skin === 'teams' && (
              <span className="fm-sub">{ locale === 'en' ? `${count} people` : `${count} 人` }</span>
            ) }
            { showClock && <span className="fm-clock">{ clockText(skin, locale, secs) }</span> }
            <span className="fm-top-icons">
              { SKIN_TOP_ICONS[skin].map((k) => <span className="fm-icon" key={ k }>{ ICONS[k] }</span>) }
            </span>
          </div>

          <div className="fm-body">
            <div className="fm-main">
              { share ? (
                <>
                  <span className="fm-note">{ `${others[0]?.name ?? ''} ${t('正在共享屏幕')}` }</span>
                  <div className="fm-share">
                    <h4>{ trio(SHARE_SLIDE.title, locale) }</h4>
                    <ul>
                      { SHARE_SLIDE.bullets.map((b) => <li key={ b[0] }>{ trio(b, locale) }</li>) }
                    </ul>
                    <div className="fm-bars">
                      { SHARE_SLIDE.bars.map((h, i) => <div className="fm-bar" key={ i } style={{ height: `${h}%` }} />) }
                    </div>
                  </div>
                </>
              ) : (
                <div className="fm-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                  { gridList.map((p) => tileOf(p)) }
                </div>
              ) }
              { skin === 'zoom' && <div className="fm-selfpane">{ tileOf(me, { pane: true }) }</div> }
            </div>

            { panel === 'chat' && (
              <aside className="fm-side">
                <div className="fm-side-h"><span>{ t('聊天') }</span><span className="fm-sub">{ chatCount }</span></div>
                <div className="fm-side-list">
                  { messages.map((m, i) => (
                    <div className="fm-msg" key={ i }>
                      <div className="fm-msg-h"><b>{ m.author }</b><span>{ m.at }</span></div>
                      <p>{ m.text }</p>
                    </div>
                  )) }
                </div>
                <div className="fm-side-input">
                  <span className="fm-fake-input">{ t('说点什么…') }</span>
                  <span className="fm-side-btn">{ t('发送') }</span>
                </div>
              </aside>
            ) }

            { panel === 'people' && (
              <aside className="fm-side">
                <div className="fm-side-h">
                  <span>{ `${t('参会者')} (${participants.length})` }</span>
                  <span className="fm-side-btn">{ t('邀请') }</span>
                </div>
                <div className="fm-side-list">
                  { participants.map((p) => (
                    <div className="fm-prow" key={ p.id }>
                      <span className="fm-pdot" style={{ background: `hsl(${p.hue} 45% 45%)` }}>{ p.initial }</span>
                      <span className="fm-pname">{ p.isMe ? `${p.name} ${t('(我)')}` : p.name }</span>
                      { p.host && <span className="fm-badge is-host">{ t('主持人') }</span> }
                      <span className="fm-picons">
                        <span className={ mutedOf(p) ? 'is-off' : '' }>{ mutedOf(p) ? ICONS.micOff : ICONS.mic }</span>
                        <span className={ camOf(p) ? '' : 'is-off' }>{ camOf(p) ? ICONS.cam : ICONS.camOff }</span>
                      </span>
                    </div>
                  )) }
                </div>
              </aside>
            ) }
          </div>

          <div className="fm-bottom">
            <div className="fm-toolbar">
              { controls.map((c) => (
                <Fragment key={ c.action }>
                  { dividers.includes(c.action) && <span className="fm-sep" /> }
                  <button
                    type="button"
                    className={ [
                      'fm-btn',
                      c.danger ? 'is-danger' : '',
                      offOf(c.action) ? 'is-off' : '',
                      !c.danger && !offOf(c.action) && activeOf(c.action) ? 'is-active' : '',
                    ].filter(Boolean).join(' ') }
                    title={ labelOf(c) }
                    onClick={ () => onAction(c.action) }
                  >
                    <span className="fm-icon">{ iconOf(c) }</span>
                    <span className="fm-btn-label">{ labelOf(c) }</span>
                    { c.action === 'chat' && unread > 0 && <span className="fm-dot" /> }
                  </button>
                </Fragment>
              )) }
            </div>
          </div>
        </div>
        { immersive && (
          <button type="button" className="fm-exit" onClick={ () => setImmersive(false) }>{ t('退出沉浸') }</button>
        ) }
      </div>

      <div style={ noteStyle }>{ t('摄像头与麦克风仅在本机使用, 不会上传') }</div>
    </div>
  );
};

export default FakeMeeting;
