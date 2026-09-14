import { Button, Checkbox, Divider, Input, InputNumber, Space, Tag, Typography, message, theme } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ClearOutlined, CopyOutlined, DisconnectOutlined, DownloadOutlined, LinkOutlined, SendOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { ws, wsT } from './lang';
import {
  byteLength, clampHeartbeat, countEntries, entriesToText, formatPayload, formatTime, validateWsUrl,
  HEARTBEAT_MAX, HEARTBEAT_MIN, type LogDir, type LogEntry,
} from './lib';
import WebSocketIntro from './intro';

const { Text } = Typography;
const MONO = 'Consolas, Monaco, "Courier New", monospace';

type Status = 'idle' | 'connecting' | 'open' | 'closed';

/** 收到的数据统一转成文本 (string / Blob / ArrayBuffer) */
const toText = async (data: unknown): Promise<string> => {
  if (typeof data === 'string') return data;
  if (typeof Blob !== 'undefined' && data instanceof Blob) { try { return await data.text(); } catch { return '[Blob]'; } }
  if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
    try { return new TextDecoder().decode(data); } catch { return `[ArrayBuffer ${data.byteLength} bytes]`; }
  }
  return String(data);
};

/** WebSocket 调试: 连接 / 收发消息 / 日志 / 心跳 */
const WebSocketDebug = () => {
  const { locale } = useLocale();
  const t = (zh: string) => ws(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => wsT(locale, zh, v);
  const { token } = theme.useToken();

  const [ url, setUrl ] = useState('ws://localhost:8080'); // 服务地址
  const [ status, setStatus ] = useState<Status>('idle'); // 连接状态
  const [ entries, setEntries ] = useState<LogEntry[]>([]); // 日志
  const [ text, setText ] = useState(''); // 待发送内容
  const [ autoScroll, setAutoScroll ] = useState(true); // 自动滚动
  const [ pretty, setPretty ] = useState(true); // JSON 美化
  const [ heartbeat, setHeartbeat ] = useState(HEARTBEAT_MIN); // 心跳间隔 (秒)
  const [ hbText, setHbText ] = useState('ping'); // 心跳内容

  const wsRef = useRef<WebSocket | null>(null);
  const seqRef = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const prettyRef = useRef(pretty);
  prettyRef.current = pretty;
  const sendRef = useRef<(payload: string, silent?: boolean) => void>(() => {});

  const push = (dir: LogDir, s: string) => {
    seqRef.current += 1;
    const e: LogEntry = { id: seqRef.current, dir, text: s, time: Date.now(), bytes: byteLength(s) };
    setEntries((prev) => [ ...prev, e ]);
  };

  const send = (payload: string, silent = false) => {
    const socket = wsRef.current;
    // readyState: 1 = OPEN
    if (!socket || socket.readyState !== 1) {
      if (!silent) message.warning(t('请先连接'));
      return;
    }
    try {
      socket.send(payload);
      push('send', payload);
    } catch (e) {
      push('error', tT('发送失败: {m}', { m: e instanceof Error ? e.message : String(e) }));
    }
  };
  sendRef.current = send;

  const onDisconnect = () => {
    const socket = wsRef.current;
    wsRef.current = null;
    if (socket) { try { socket.close(); } catch { /* ignore */ } }
    setStatus((prev) => (prev === 'idle' ? 'idle' : 'closed'));
  };

  const onConnect = () => {
    if (typeof WebSocket === 'undefined') { message.error(t('当前环境不支持 WebSocket')); return; }
    const v = validateWsUrl(url);
    if (!v.ok) {
      message.error(t(v.reason === 'empty' ? '地址不能为空' : v.reason === 'scheme' ? '地址需以 ws:// 或 wss:// 开头 (http/https 会自动转换)' : '地址格式不正确'));
      return;
    }
    onDisconnect();
    setUrl(v.url);
    setStatus('connecting');
    push('sys', tT('正在连接 {url} …', { url: v.url }));
    let socket: WebSocket;
    try {
      socket = new WebSocket(v.url);
    } catch (e) {
      setStatus('closed');
      push('error', e instanceof Error ? e.message : String(e));
      return;
    }
    wsRef.current = socket;
    socket.onopen = () => { setStatus('open'); push('sys', t('连接已建立')); };
    socket.onmessage = (ev) => {
      void toText(ev.data)
        .then((s) => push('recv', formatPayload(s, prettyRef.current)))
        .catch(() => push('error', t('连接出错')));
    };
    socket.onerror = () => { push('error', t('连接出错')); };
    socket.onclose = (ev) => {
      if (wsRef.current === socket) wsRef.current = null;
      setStatus('closed');
      push('sys', tT('连接已关闭 (code {code})', { code: ev.code }));
    };
  };

  // 心跳: 连接建立期间按间隔发送
  useEffect(() => {
    if (status !== 'open' || heartbeat <= 0) return;
    const timer = window.setInterval(() => sendRef.current(hbText, true), heartbeat * 1000);
    return () => window.clearInterval(timer);
  }, [ status, heartbeat, hbText ]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [ entries, autoScroll ]);

  // 组件卸载时释放连接
  useEffect(() => () => {
    const socket = wsRef.current;
    wsRef.current = null;
    if (socket) { try { socket.close(); } catch { /* ignore */ } }
  }, []);

  const stat = useMemo(() => countEntries(entries), [ entries ]);

  const statusText = status === 'idle' ? t('未连接') : status === 'connecting' ? t('连接中…') : status === 'open' ? t('已连接') : t('已断开');
  const statusColor = status === 'open' ? 'success' : status === 'connecting' ? 'processing' : status === 'closed' ? 'warning' : 'default';
  const dirColor = (dir: LogDir): string =>
    dir === 'send' ? token.colorPrimary : dir === 'recv' ? token.colorSuccess : dir === 'error' ? token.colorError : token.colorTextTertiary;
  const dirMark = (dir: LogDir): string => (dir === 'send' ? '↑' : dir === 'recv' ? '↓' : dir === 'error' ? '!' : '·');

  const onCopyLog = async () => {
    if (entries.length === 0) { message.warning(t('日志为空')); return; }
    await copyTextToClipboard(entriesToText(entries));
    message.success(t('已复制到剪贴板'));
  };

  const onDownloadLog = async () => {
    if (entries.length === 0) { message.warning(t('日志为空')); return; }
    const name = `websocket-log-${Date.now()}.txt`;
    const ok = await saveTextFile(name, entriesToText(entries), tT('保存 {n}', { n: name }), { filterName: 'TXT', extensions: [ 'txt' ] });
    if (ok) message.success(tT('已保存 {n}', { n: name }));
  };

  return (
    <>
      <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
        <Space.Compact style={ { flex: 1, minWidth: 260 } }>
          <Input
            value={ url }
            onChange={ (e) => setUrl(e.target.value) }
            onPressEnter={ onConnect }
            placeholder="ws://localhost:8080"
            allowClear
            style={ { fontFamily: MONO } }
          />
          <Button type="primary" icon={ <LinkOutlined /> } disabled={ status === 'connecting' || status === 'open' } onClick={ onConnect }>{ t('连接') }</Button>
          <Button danger icon={ <DisconnectOutlined /> } disabled={ status !== 'open' } onClick={ onDisconnect }>{ t('断开') }</Button>
        </Space.Compact>
        <Tag color={ statusColor }>{ statusText }</Tag>
      </div>

      <Divider orientation="left" plain style={ { marginTop: 16 } }>{ t('发送内容') }</Divider>
      <Input.TextArea
        value={ text }
        onChange={ (e) => setText(e.target.value) }
        onKeyDown={ (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); send(text); } } }
        autoSize={ { minRows: 4, maxRows: 10 } }
        spellCheck={ false }
        style={ { fontFamily: MONO, fontSize: 13 } }
        placeholder={ t('消息内容 (Ctrl + Enter 发送)') }
      />
      <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 } }>
        <Button type="primary" icon={ <SendOutlined /> } disabled={ status !== 'open' } onClick={ () => send(text) }>{ t('发送') }</Button>
        <Checkbox checked={ pretty } onChange={ (e) => setPretty(e.target.checked) }>{ t('JSON 美化') }</Checkbox>
        <Text>{ t('心跳间隔 (秒)') }</Text>
        <InputNumber
          min={ HEARTBEAT_MIN }
          max={ HEARTBEAT_MAX }
          value={ heartbeat }
          style={ { width: 100 } }
          onChange={ (value: number | null) => setHeartbeat(clampHeartbeat(value === null ? HEARTBEAT_MIN : value)) }
        />
        <Input
          value={ hbText }
          onChange={ (e) => setHbText(e.target.value) }
          style={ { width: 180 } }
          placeholder={ t('心跳内容') }
        />
        <Text type="secondary" style={ { fontSize: 12 } }>{ t('0 = 关闭心跳') }</Text>
      </div>

      <Divider orientation="left" plain style={ { marginTop: 16 } }>
        { t('日志') }
        <Tag style={ { marginLeft: 8 } }>{ tT('发送 {n} / 接收 {m} / 合计 {b} 字节', { n: stat.sent, m: stat.recv, b: stat.bytes }) }</Tag>
      </Divider>
      <Space style={ { marginBottom: 8 } } wrap>
        <Button size="small" icon={ <CopyOutlined /> } onClick={ onCopyLog }>{ t('复制日志') }</Button>
        <Button size="small" icon={ <DownloadOutlined /> } onClick={ onDownloadLog }>{ t('下载日志') }</Button>
        <Button size="small" danger type="text" icon={ <ClearOutlined /> } disabled={ entries.length === 0 } onClick={ () => setEntries([]) }>{ t('清空日志') }</Button>
        <Checkbox checked={ autoScroll } onChange={ (e) => setAutoScroll(e.target.checked) }>{ t('自动滚动') }</Checkbox>
      </Space>
      <div
        ref={ boxRef }
        style={ {
          height: 260,
          overflow: 'auto',
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 6,
          padding: '6px 10px',
          background: token.colorFillQuaternary,
          fontFamily: MONO,
          fontSize: 12.5,
          lineHeight: '20px',
        } }
      >
        { entries.length === 0
          ? <Text type="secondary">{ t('日志为空') }</Text>
          : entries.map((e) => (
            <div key={ e.id } style={ { whiteSpace: 'pre-wrap', wordBreak: 'break-all' } }>
              <span style={ { color: token.colorTextTertiary, marginRight: 6 } }>{ formatTime(e.time) }</span>
              <span style={ { color: dirColor(e.dir), marginRight: 6 } }>{ dirMark(e.dir) }</span>
              <span style={ { color: e.dir === 'error' ? token.colorError : token.colorText } }>{ e.text }</span>
            </div>
          )) }
      </div>

      <Divider>{ t('WebSocket 调试说明') }</Divider>
      <WebSocketIntro />
    </>
  );
};

export default WebSocketDebug;
