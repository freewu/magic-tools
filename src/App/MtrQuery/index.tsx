import { Button, Divider, Input, InputNumber, Select, Space, Switch, Table, Tag, Typography, message, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, SearchOutlined } from '@ant-design/icons';
import { useMemo, useRef, useState } from 'react';
import { copyTextToClipboard } from '../../lib';
import { isTauri } from '../../lib/tauri';
import DesktopOnlyNotice from '../../lib/desktop';
import { useLocale } from '../../hook/locale-context';
import { mq, mqT } from './lang';
import MtrQueryIntro from './intro';
import {
  DEFAULT_MTR_OPTIONS, INTERVAL_OPTIONS, TIMEOUT_OPTIONS, clampInterval, clampMaxHops, clampRounds,
  clampTimeout, formatLoss, formatRtt, hopsToText, kindText, lossColor, lossyHops, normalizeHost,
  runMtrTrace, stateColor, stateText, validateHost,
} from './lib';
import type { MtrHop, MtrResolvedTarget } from './lib';
import { mtrProbe, mtrResolve, reverseDns } from './net';

const { Text } = Typography;

const MtrQuery = () => {
  const { locale } = useLocale();
  const t = (zh: string) => mq(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => mqT(locale, zh, v);
  const { token } = theme.useToken();

  const desktop = isTauri(); // 桌面版才能发送 ICMP
  const [ input, setInput ] = useState('');                  // 目标输入
  const [ maxHops, setMaxHops ] = useState(DEFAULT_MTR_OPTIONS.maxHops);
  const [ rounds, setRounds ] = useState(DEFAULT_MTR_OPTIONS.rounds);
  const [ timeoutMs, setTimeoutMs ] = useState(DEFAULT_MTR_OPTIONS.timeoutMs);
  const [ intervalMs, setIntervalMs ] = useState(DEFAULT_MTR_OPTIONS.intervalMs);
  const [ resolveNames, setResolveNames ] = useState(DEFAULT_MTR_OPTIONS.resolveNames);

  const [ running, setRunning ] = useState(false);            // 探测进行中
  const [ hops, setHops ] = useState<MtrHop[]>([]);          // 逐跳统计
  const [ target, setTarget ] = useState<MtrResolvedTarget | null>(null);
  const [ round, setRound ] = useState(0);                   // 已完成轮次
  const [ messageApi, contextHolder ] = message.useMessage();

  const stopRef = useRef(false);      // 「停止」标记
  const sessionRef = useRef(0);       // 会话号, 重新查询时丢弃旧回调

  const lost = useMemo(() => lossyHops(hops), [ hops ]);

  const copy = (text: string) => {
    if (text === '') return;
    copyTextToClipboard(text);
    messageApi.success(t('复制到粘贴板成功!!!'));
  };

  const clear = () => {
    setHops([]);
    setTarget(null);
    setRound(0);
  };

  // 开始探测
  const start = async () => {
    const invalid = validateHost(input);
    if (invalid !== '') {
      messageApi.warning(t(invalid));
      return;
    }
    setRunning(true);
    clear();
    stopRef.current = false;
    const session = ++sessionRef.current;
    const alive = () => session === sessionRef.current;
    try {
      const resolved = await mtrResolve(normalizeHost(input));
      if (!alive()) return;
      setTarget(resolved);
      if (!resolved.hasIpv4) {
        messageApi.warning(t('该域名没有 IPv4 地址, ICMP 探测暂只支持 IPv4 目标'));
        return;
      }
      const result = await runMtrTrace({
        target: resolved,
        maxHops: clampMaxHops(maxHops),
        rounds: clampRounds(rounds),
        timeoutMs: clampTimeout(timeoutMs),
        intervalMs: clampInterval(intervalMs),
        resolveNames,
        probe: (address, ttl, timeout) => mtrProbe(address, ttl, timeout),
        reverse: (addr) => reverseDns(addr),
        shouldStop: () => stopRef.current || !alive(),
        onRound: (no, list) => {
          if (!alive()) return;
          setHops(list);
          setRound(no);
        },
        sleep: (ms) => new Promise<void>((resolve) => { setTimeout(resolve, ms); }),
      });
      if (!alive()) return;
      setHops(result);
      if (stopRef.current) {
        messageApi.info(t('已停止'));
      } else {
        messageApi.success(tt('探测完成: {addr} 共 {n} 跳', { addr: resolved.address, n: result.length }));
      }
    } catch (err) {
      if (alive()) messageApi.error(tt('查询失败: {msg}', { msg: (err as Error).message }));
    } finally {
      if (alive()) setRunning(false);
    }
  };

  const columns: ColumnsType<MtrHop> = [
    { title: t('跳数'), dataIndex: 'ttl', key: 'ttl', width: 64, render: (v: number) => <Text strong>{ v }</Text> },
    {
      title: t('主机'), dataIndex: 'host', key: 'host',
      render: (_: unknown, row: MtrHop) => (
        <span
          title={ t('双击复制内容') }
          onDoubleClick={ () => { copy(row.host ?? ''); } }
          style={ { cursor: 'text' } }
        >
          <span style={ { wordBreak: 'break-all' } }>{ row.host ?? '-' }</span>
          { row.addr && row.host !== row.addr && (
            <Text type="secondary" style={ { marginLeft: 6, fontSize: 12 } }>{ row.addr }</Text>
          ) }
        </span>
      ),
    },
    {
      title: t('丢包率'), dataIndex: 'loss', key: 'loss', width: 92,
      render: (v: number) => <Tag color={ lossColor(v) }>{ formatLoss(v) }</Tag>,
    },
    { title: t('发包'), dataIndex: 'snt', key: 'snt', width: 70, render: (v: number, row: MtrHop) => <span title={ `${row.recv}/${v}` }>{ v }</span> },
    { title: t('最近'), dataIndex: 'last', key: 'last', width: 92, render: (v: number | null) => formatRtt(v) },
    { title: t('平均'), dataIndex: 'avg', key: 'avg', width: 92, render: (v: number | null) => formatRtt(v) },
    { title: t('最好'), dataIndex: 'best', key: 'best', width: 92, render: (v: number | null) => formatRtt(v) },
    { title: t('最差'), dataIndex: 'worst', key: 'worst', width: 92, render: (v: number | null) => formatRtt(v) },
    { title: t('抖动'), dataIndex: 'jitter', key: 'jitter', width: 92, render: (v: number | null) => formatRtt(v) },
    {
      title: t('状态'), dataIndex: 'state', key: 'state', width: 100,
      render: (v: string, row: MtrHop) => (
        <Tag color={ stateColor(v) } title={ row.detail ?? undefined }>{ stateText(v) }</Tag>
      ),
    },
  ];

  return (
    <div>
      { contextHolder }

      <Space wrap>
        <Input
          allowClear
          style={ { width: 280 } }
          prefix={ <SearchOutlined /> }
          value={ input }
          placeholder={ t('输入域名或 IP, 如 example.com 或 1.1.1.1') }
          onChange={ (e) => { setInput(e.target.value); } }
          onPressEnter={ () => { if (desktop && !running) void start(); } }
        />
        <Button
          type="primary"
          loading={ running }
          disabled={ !desktop }
          onClick={ () => { void start(); } }
        >{ running ? t('查询中') : t('查询') }</Button>
        { running && <Button danger onClick={ () => { stopRef.current = true; } }>{t('停止')}</Button> }
        { !running && hops.length > 0 && (
          <Button onClick={ () => { copy(hopsToText(hops)); } } icon={ <CopyOutlined /> }>{t('复制结果')}</Button>
        ) }
        { !running && hops.length > 0 && <Button onClick={ clear }>{t('清空')}</Button> }
      </Space>

      {/* 参数 */}
      <div style={ { marginTop: 12 } }>
        <Space wrap size={ [ 16, 8 ] }>
          <Space size={ 4 }>
            <Text type="secondary">{t('最大跳数')}</Text>
            <InputNumber size="small" min={ 1 } max={ 64 } style={ { width: 72 } } value={ maxHops } onChange={ (v) => { setMaxHops(clampMaxHops(v)); } } disabled={ running } />
          </Space>
          <Space size={ 4 }>
            <Text type="secondary">{t('轮次')}</Text>
            <InputNumber size="small" min={ 1 } max={ 100 } style={ { width: 72 } } value={ rounds } onChange={ (v) => { setRounds(clampRounds(v)); } } disabled={ running } />
          </Space>
          <Space size={ 4 }>
            <Text type="secondary">{t('超时 (ms)')}</Text>
            <Select size="small" style={ { width: 92 } } value={ timeoutMs } onChange={ (v: number) => { setTimeoutMs(clampTimeout(v)); } } disabled={ running } options={ TIMEOUT_OPTIONS.map((v) => ({ value: v, label: String(v) })) } />
          </Space>
          <Space size={ 4 }>
            <Text type="secondary">{t('间隔 (ms)')}</Text>
            <Select size="small" style={ { width: 92 } } value={ intervalMs } onChange={ (v: number) => { setIntervalMs(clampInterval(v)); } } disabled={ running } options={ INTERVAL_OPTIONS.map((v) => ({ value: v, label: String(v) })) } />
          </Space>
          <Space size={ 4 }>
            <Text type="secondary">{t('反解主机名')}</Text>
            <Switch size="small" checked={ resolveNames } onChange={ setResolveNames } disabled={ running } />
          </Space>
        </Space>
      </div>

      {/* 浏览器演示版: 仅提示, 同时上方按钮已禁用 */}
      { !desktop && (
        <DesktopOnlyNotice
          text={ t('该功能仅在桌面应用中可用') }
          download={ t('下载桌面版') }
          hint={ t('浏览器版没有应用内 ICMP 探测能力 (浏览器不允许发送原始 ICMP 包), 请下载桌面版后使用') }
        />
      ) }

      { target && (
        <div style={ { marginTop: 12 } }>
          <Space wrap size={ [ 8, 8 ] }>
            <Tag color="blue">{ `${t('目标')}: ${target.address}` }</Tag>
            { !target.isLiteral && <Tag>{ target.input }</Tag> }
            <Tag>{ t(kindText(target.kind)) }</Tag>
            { hops.length > 0 && <Tag>{ tt('共 {n} 跳', { n: hops.length }) }</Tag> }
            { round > 0 && <Tag color="processing">{ tt('第 {n} 轮', { n: round }) }</Tag> }
            { lost.length > 0 && <Tag color="warning">{ `${lost.length} x ${t('丢包率')}` }</Tag> }
          </Space>
        </div>
      ) }

      { hops.length > 0 && (
        <Table<MtrHop>
          rowKey="ttl"
          columns={ columns }
          dataSource={ hops }
          size="small"
          pagination={ false }
          scroll={ { x: 960 } }
          style={ { marginTop: 8 } }
        />
      ) }

      { target && hops.length === 0 && !running && (
        <div style={ { marginTop: 12, color: token.colorTextTertiary } }>
          {t('说明: 首轮会从第 1 跳探测到最大跳数 (完整发现路径), 之后的轮次只探测到已到达目标的那一跳')}
        </div>
      ) }

      { !target && !running && (
        <div style={ { marginTop: 16, color: token.colorTextTertiary } }>
          {t('输入域名或 IP 后点击「查询」, 工具会先完整发现到目标的路径, 再对每一跳持续探测, 统计丢包率与 RTT 抖动')}
        </div>
      ) }

      <Divider>{t('MTR 查询说明')}</Divider>

      <MtrQueryIntro />
    </div>
  );
}

export default MtrQuery;
