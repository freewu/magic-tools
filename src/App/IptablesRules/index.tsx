import { Alert, AutoComplete, Button, Divider, Input, Select, Space, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ClearOutlined, CopyOutlined, FileTextOutlined, PlayCircleOutlined, SaveOutlined,
} from '@ant-design/icons';
import { useMemo, useState, type ReactNode } from 'react';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { ir, irT } from './lang';
import {
  BUILTIN_CHAINS, CONN_STATES, IPTABLES_TABLES, LOG_LEVELS, PROTOCOLS, REJECT_WITH,
  RESULT_HEIGHT, RULE_OPS, SAMPLE_IPTABLES, TARGETS, TARGET_ARGS,
} from './data';
import {
  buildIptablesScript, buildRulePlan, emptyRuleConfig, parseIptables, ruleToConfig,
  TARGET_ARG_FLAGS, type IpOp, type IpRule, type ParseResult, type RuleConfig,
} from './lib';
import {
  buildSimplePlan, buildSimpleScript, emptySimpleConfig, SIMPLE_SCENES,
  type SimpleConfig, type SimpleScene,
} from './simple';

const { Text } = Typography;
const { TextArea } = Input;

/** 校验错误码 -> 提示文案 */
const ERROR_TEXT: Record<string, string> = {
  table: '表不能为空',
  chain: '链不能为空',
  position: '插入 / 删除位置必须是数字',
  source: '源地址格式不正确',
  destination: '目的地址格式不正确',
  sport: '源端口格式不正确',
  dport: '目的端口格式不正确',
  'port-proto': '端口匹配需要协议为 tcp / udp / sctp, 或使用逗号列表 (multiport)',
  target: '请填写动作 (-j)',
  policy: '默认策略只能是 ACCEPT 或 DROP',
  'reject-with': '拒绝方式取值不正确 (如 icmp-port-unreachable / tcp-reset)',
  'log-level': '日志级别必须是 0-7',
  'set-mark': '标记值格式不正确 (如 0x1 或 1)',
  'to-destination': '转发到地址格式不正确',
  'to-source': '源地址转换格式不正确',
  'to-ports': '重定向端口必须是端口或端口区间',
  limit: '限速格式不正确 (如 10/min)',
  'limit-burst': '突发包数必须是数字',
  comment: '备注不能超过 256 个字符',
  'log-prefix': '日志前缀不能超过 29 个字符',
  'simple-port-required': '请填写端口',
  'simple-port-format': '端口格式不正确 (如 80 / 8000:8010 / 80,443)',
  'simple-ip-required': '请填写要封禁的 IP 地址',
  'simple-ip-format': 'IP 地址格式不正确 (如 203.0.113.10, 不支持主机名)',
  'simple-net-required': '请填写要封禁的网段',
  'simple-net-format': '网段格式不正确 (如 203.0.113.0/24)',
  'simple-target-ip-required': '请填写转发目标 IP',
  'simple-target-ip-format': '转发目标 IP 格式不正确',
  'simple-target-port-required': '请填写转发目标端口',
  'simple-target-port-format': '转发目标端口必须是 1-65535 的单个端口',
};

/** 提示码 -> 文案 */
const WARN_TEXT: Record<string, string> = {
  'insert-first': '未填插入位置, 将插入到链首 (位置 1)',
  'append-last': '追加规则会放在链末尾, 若前面已有 DROP 规则可能不生效',
  forward: 'NAT 转发需要开启内核转发 (net.ipv4.ip_forward=1)',
  'custom-chain-table': '清空 / 删除链只在对应表内生效, 请确认表名',
  'simple-open-established': '若 INPUT 默认策略为 DROP, 还需放行 ESTABLISHED,RELATED 连接, 否则现有连接会中断',
  'simple-open-ssh': '放行 22 端口时请先确认规则已生效再断开当前连接 (可用 screen / nohup 执行)',
  'simple-block-existing': 'DROP 只拦截新建连接, 已建立的连接需要手动断开 (ss -K)',
  'simple-block-inbound': '本工具只封禁入方向 (INPUT), 需要限制出方向请用「生成」页签',
  'simple-forward-iface': '未填出口网卡时 MASQUERADE 由路由决定出口, 多网卡机器建议填写',
};

/** 动作参数键 -> 界面标签 */
const ARG_LABEL: Record<string, string> = {
  toDestination: '转发到',
  toSource: '源地址转换为',
  toPorts: '重定向端口',
  setMark: '标记值',
  logPrefix: '日志前缀',
  logLevel: '日志级别',
  rejectWith: '拒绝方式',
};

/** 「生成」页签的示例配置 */
const SAMPLE_CONFIG: RuleConfig = {
  ...emptyRuleConfig(),
  table: 'nat',
  chain: 'PREROUTING',
  protocol: 'tcp',
  dport: '8080',
  target: 'DNAT',
  args: { toDestination: '10.0.0.5:8080' },
  comment: '端口转发',
};

/** 字段容器 (标签在上, 控件在下) */
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 186 }}>
    <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
    {children}
  </div>
);

/** 已解析规则的匹配条件片段 */
const matchSummary = (r: IpRule): string[] => {
  const out: string[] = [];
  if (r.protocol) out.push(`-p ${r.protocol}`);
  if (r.source) out.push(`-s ${r.source}`);
  if (r.destination) out.push(`-d ${r.destination}`);
  if (r.inIface) out.push(`-i ${r.inIface}`);
  if (r.outIface) out.push(`-o ${r.outIface}`);
  if (r.sport) out.push(`${r.sport.includes(',') ? '--sports' : '--sport'} ${r.sport}`);
  if (r.dport) out.push(`${r.dport.includes(',') ? '--dports' : '--dport'} ${r.dport}`);
  if (r.icmpType) out.push(`--icmp-type ${r.icmpType}`);
  if (r.states.length) out.push(`--state ${r.states.join(',')}`);
  if (r.limit) out.push(`--limit ${r.limit}`);
  if (r.limitBurst) out.push(`--limit-burst ${r.limitBurst}`);
  return out;
};

/** 已解析规则的动作片段 */
const targetSummary = (r: IpRule): string => {
  if (r.op === 'P') return r.policy;
  if (!r.target) return '';
  const extras = Object.entries(r.args)
    .filter(([ , v ]) => v !== '')
    .map(([ k, v ]) => `${TARGET_ARG_FLAGS[k] ?? k} ${v}`);
  return [ `-j ${r.target}`, ...extras ].join(' ');
};

const IptablesRules = () => {
  const { locale } = useLocale();
  const t = (zh: string) => ir(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => irT(locale, zh, v);
  const [ messageApi, contextHolder ] = message.useMessage();

  const [ tab, setTab ] = useState('simple');                // 当前页签
  const [ text, setText ] = useState('');                   // 待解析文本
  const [ parsed, setParsed ] = useState<ParseResult | null>(null);
  const [ cfg, setCfg ] = useState<RuleConfig>(emptyRuleConfig);
  const [ sc, setSc ] = useState<SimpleConfig>(emptySimpleConfig);

  const plan = useMemo(() => buildRulePlan(cfg), [ cfg ]);
  const script = useMemo(() => buildIptablesScript(plan), [ plan ]);

  const simplePlan = useMemo(() => buildSimplePlan(sc), [ sc ]);
  const simpleScript = useMemo(() => buildSimpleScript(simplePlan), [ simplePlan ]);

  const upd = (patch: Partial<RuleConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const updArg = (key: string, v: string) => setCfg((c) => ({ ...c, args: { ...c.args, [ key ]: v } }));
  const updS = (patch: Partial<SimpleConfig>) => setSc((c) => ({ ...c, ...patch }));

  const copy = (value: string) => {
    if (value === '') return;
    copyTextToClipboard(value);
    messageApi.success(t('复制到粘贴板成功!!!'));
  };

  // 解析
  const runParse = () => {
    if (text.trim() === '') {
      messageApi.warning(t('请先输入 iptables 规则文本'));
      return;
    }
    const result = parseIptables(text);
    setParsed(result);
    messageApi.success(tt('解析完成, 共 {n} 条规则', { n: result.rules.length }));
  };

  // 表格文本 (复制用)
  const tableText = (rules: IpRule[]): string =>
    rules.map((r) => [
      r.index, r.table, r.chain, r.op, matchSummary(r).join(' '), targetSummary(r), r.comment,
    ].join('\t')).join('\n');

  // 载入到生成页签
  const loadRule = (r: IpRule) => {
    setCfg(ruleToConfig(r));
    setTab('generate');
    messageApi.success(t('已载入到「生成」页签'));
  };

  const showMatch = [ 'A', 'I', 'D' ].includes(cfg.op);
  const showTarget = [ 'A', 'I', 'D', 'P' ].includes(cfg.op);   // -P 也需要选默认策略
  const argKeys = TARGET_ARGS[cfg.target.trim()]?.map((a) => a.key) ?? [];
  const allText = [
    plan.command, plan.restoreLine, ...plan.view, ...plan.remove, ...plan.persist,
  ].filter((x) => x !== '').join('\n');

  const saveSh = async () => {
    const ok = await saveTextFile('iptables-rules.sh', script, t('保存为 .sh'), {
      filterName: t('Shell 脚本'), extensions: [ 'sh' ],
    });
    if (ok) messageApi.success(t('保存成功'));
  };

  const saveSimpleSh = async () => {
    const ok = await saveTextFile(simplePlan.fileName, simpleScript, t('保存为 .sh'), {
      filterName: t('Shell 脚本'), extensions: [ 'sh' ],
    });
    if (ok) messageApi.success(t('保存成功'));
  };

  const columns: ColumnsType<IpRule> = [
    { title: t('序号'), dataIndex: 'index', width: 60 },
    {
      title: t('操作'), width: 96,
      render: (_, r) => {
        const short = RULE_OPS.find((o) => o.value === r.op)?.short ?? r.op;
        const pos = (r.op === 'I' || (r.op === 'D' && r.position !== undefined)) && r.position !== undefined ? ` ${r.position}` : '';
        return <Text code>{`${short}${pos}`}</Text>;
      },
    },
    { title: t('表 / 链'), width: 150, render: (_, r) => `${r.table} / ${r.chain === '' ? '-' : r.chain}` },
    {
      title: t('匹配条件'),
      render: (_, r) => {
        const parts = matchSummary(r);
        return (
          <Space size={4} wrap>
            {parts.length === 0 ? <Text type="secondary">-</Text>
              : parts.map((p) => <Text key={p} code style={{ fontSize: 12 }}>{p}</Text>)}
            {r.unknown.length > 0 && (
              <Tooltip title={t('该行使用了本工具未建模的参数, 生成时会被忽略')}>
                <Tag color="warning">{tt('{n} 个未识别参数', { n: r.unknown.length })}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    { title: t('动作'), width: 240, render: (_, r) => <Text code style={{ fontSize: 12 }}>{targetSummary(r)}</Text> },
    { title: t('备注'), dataIndex: 'comment', width: 120, ellipsis: true },
    { title: t('原始规则'), dataIndex: 'raw', width: 320, ellipsis: true, render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    {
      title: '', width: 110,
      render: (_, r) => <Button size="small" type="link" onClick={() => loadRule(r)}>{t('载入到生成')}</Button>,
    },
  ];

  /** 代码块 (每行可点击复制) */
  const codeBlock = (title: string, lines: string[]) => (
    <div style={{ marginBottom: 8 }}>
      <Space size={4} style={{ marginBottom: 2 }}>
        <Text strong style={{ fontSize: 13 }}>{title}</Text>
        <Button size="small" type="link" icon={<CopyOutlined />} onClick={() => copy(lines.join('\n'))}>{t('复制')}</Button>
      </Space>
      <div
        style={{
          background: '#23241f', color: '#f8f8f2', borderRadius: 6, padding: '6px 10px',
          fontFamily: 'Consolas, Monaco, monospace', fontSize: 12.5, lineHeight: 1.8,
          whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200, overflow: 'auto',
        }}
      >
        {lines.map((line) => (
          <div key={line} title={t('点击复制')} style={{ cursor: 'pointer' }} onClick={() => copy(line)}>{line}</div>
        ))}
      </div>
    </div>
  );

  const simpleScene = SIMPLE_SCENES.find((s) => s.value === sc.scene) ?? SIMPLE_SCENES[0];
  const simpleAllText = [
    ...simplePlan.commands, ...simplePlan.extra, ...simplePlan.view, ...simplePlan.remove, ...simplePlan.persist,
  ].filter((x) => x !== '').join('\n');

  const simplePane = (
    <div>
      <Space wrap size={[ 12, 12 ]} align="start">
        <Field label={t('使用场景')}>
          <Select
            value={sc.scene}
            onChange={(v) => updS({ scene: v as SimpleScene })}
            options={SIMPLE_SCENES.map((s) => ({ value: s.value, label: t(s.label) }))}
          />
        </Field>
        {(sc.scene === 'open' || sc.scene === 'forward') && (
          <Field label={t('协议')}>
            <Select
              value={sc.protocol}
              onChange={(v) => updS({ protocol: v })}
              options={[ 'tcp', 'udp' ].map((x) => ({ value: x, label: x }))}
            />
          </Field>
        )}
        {sc.scene === 'open' && (
          <Field label={t('端口')}>
            <Input value={sc.port} onChange={(e) => updS({ port: e.target.value })} placeholder="80,443" />
          </Field>
        )}
        {sc.scene === 'block-ip' && (
          <Field label={t('IP 地址')}>
            <Input value={sc.sourceIp} onChange={(e) => updS({ sourceIp: e.target.value })} placeholder="203.0.113.10" />
          </Field>
        )}
        {sc.scene === 'block-net' && (
          <Field label={t('网段')}>
            <Input value={sc.sourceNet} onChange={(e) => updS({ sourceNet: e.target.value })} placeholder="203.0.113.0/24" />
          </Field>
        )}
        {sc.scene === 'forward' && (
          <>
            <Field label={t('对外端口')}>
              <Input value={sc.port} onChange={(e) => updS({ port: e.target.value })} placeholder="8080" />
            </Field>
            <Field label={t('转发目标 IP')}>
              <Input value={sc.targetIp} onChange={(e) => updS({ targetIp: e.target.value })} placeholder="10.0.0.5" />
            </Field>
            <Field label={t('转发目标端口')}>
              <Input value={sc.targetPort} onChange={(e) => updS({ targetPort: e.target.value })} placeholder="8080" />
            </Field>
            <Field label={t('出口网卡')}>
              <Input value={sc.outIface} onChange={(e) => updS({ outIface: e.target.value })} placeholder="eth0" />
            </Field>
          </>
        )}
        <Field label={t('备注')}>
          <Input value={sc.comment} onChange={(e) => updS({ comment: e.target.value })} placeholder="SSH" />
        </Field>
      </Space>

      <div style={{ marginTop: 6 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{t(simpleScene.hint)}</Text>
      </div>

      <Space wrap style={{ marginTop: 12 }}>
        <Button icon={<ClearOutlined />} onClick={() => setSc(emptySimpleConfig())}>{t('恢复默认')}</Button>
        <Button icon={<CopyOutlined />} disabled={simplePlan.commands.length === 0} onClick={() => copy(simpleAllText)}>{t('复制全部')}</Button>
        <Button icon={<SaveOutlined />} disabled={simplePlan.commands.length === 0} onClick={saveSimpleSh}>{t('保存为 .sh')}</Button>
      </Space>

      <Divider dashed style={{ margin: '12px 0' }} />

      {simplePlan.errors.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message={t('校验未通过, 请检查以下问题:')}
          description={(
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {simplePlan.errors.map((code) => <li key={code}>{t(ERROR_TEXT[code] ?? code)}</li>)}
            </ul>
          )}
        />
      ) : (
        <div>
          {simplePlan.warnings.length > 0 && (
            <Alert
              style={{ marginBottom: 10 }}
              type="warning"
              showIcon
              message={(
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {simplePlan.warnings.map((code) => <li key={code}>{t(WARN_TEXT[code] ?? code)}</li>)}
                </ul>
              )}
            />
          )}
          {codeBlock(t('生效指令 (iptables 命令)'), simplePlan.commands)}
          {simplePlan.extra.length > 0 && codeBlock(t('附加系统指令 (内核转发)'), simplePlan.extra)}
          {codeBlock(t('查看与验证'), simplePlan.view)}
          {codeBlock(t('删除指令'), simplePlan.remove)}
          {codeBlock(t('保存与持久化'), simplePlan.persist)}
        </div>
      )}
    </div>
  );

  const parsePane = (
    <div>
      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={t('粘贴 iptables 命令或 iptables-save 输出, 每行一条, 例如:\niptables -t nat -A PREROUTING -p tcp --dport 8080 -j REDIRECT --to-ports 80\n:INPUT DROP [0:0]')}
      />
      <Space wrap style={{ marginTop: 8 }}>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={runParse}>{t('解析')}</Button>
        <Button icon={<FileTextOutlined />} onClick={() => setText(SAMPLE_IPTABLES)}>{t('示例')}</Button>
        <Button icon={<ClearOutlined />} onClick={() => { setText(''); setParsed(null); }}>{t('清空')}</Button>
        <Button
          icon={<CopyOutlined />}
          disabled={parsed === null || parsed.rules.length === 0}
          onClick={() => copy(tableText(parsed === null ? [] : parsed.rules))}
        >
          {t('复制表格')}
        </Button>
      </Space>
      {parsed !== null && (
        <div style={{ marginTop: 10 }}>
          <Space wrap>
            <Text strong>{tt('共 {n} 条规则', { n: parsed.rules.length })}</Text>
          </Space>
          {parsed.errors.length > 0 && (
            <Alert
              style={{ marginTop: 8 }}
              type="warning"
              showIcon
              message={tt('以下 {n} 行无法识别为 iptables 规则:', { n: parsed.errors.length })}
              description={<div style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>{parsed.errors.join('\n')}</div>}
            />
          )}
          <Table<IpRule>
            style={{ marginTop: 8 }}
            size="small"
            rowKey="index"
            columns={columns}
            dataSource={parsed.rules}
            scroll={{ x: 1200, y: RESULT_HEIGHT }}
            pagination={{ pageSize: 20, size: 'small', showSizeChanger: false }}
            locale={{ emptyText: t('解析后的规则会显示在这里') }}
          />
        </div>
      )}
    </div>
  );

  const generatePane = (
    <div>
      <Space wrap size={[ 12, 12 ]} align="start">
        <Field label={t('表名')}>
          <Select
            value={cfg.table}
            onChange={(v) => upd({ table: v })}
            options={IPTABLES_TABLES.map((x) => ({ value: x, label: x }))}
          />
        </Field>
        <Field label={t('操作')}>
          <Select
            value={cfg.op}
            onChange={(v) => upd({ op: v as IpOp })}
            options={RULE_OPS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </Field>
        <Field label={t('链名')}>
          <AutoComplete
            value={cfg.chain}
            onChange={(v) => upd({ chain: v })}
            options={(BUILTIN_CHAINS[cfg.table] ?? []).map((c) => ({ value: c }))}
          />
        </Field>
        {(cfg.op === 'I' || cfg.op === 'D') && (
          <Field label={t('插入位置')}>
            <Input value={cfg.position} onChange={(e) => upd({ position: e.target.value })} placeholder="1" />
          </Field>
        )}
        {showTarget && (
          <Field label={cfg.op === 'P' ? t('默认策略') : t('动作')}>
            {cfg.op === 'P' ? (
              <Select
                value={cfg.target}
                onChange={(v) => upd({ target: v })}
                options={[ 'ACCEPT', 'DROP' ].map((x) => ({ value: x, label: x }))}
              />
            ) : (
              <AutoComplete
                value={cfg.target}
                onChange={(v) => upd({ target: v })}
                options={TARGETS.map((x) => ({ value: x }))}
              />
            )}
          </Field>
        )}
        {showTarget && argKeys.map((key) => (
          <Field key={key} label={t(ARG_LABEL[key] ?? key)}>
            {key === 'rejectWith' ? (
              <AutoComplete
                value={cfg.args[key] ?? ''}
                onChange={(v) => updArg(key, v)}
                options={REJECT_WITH.map((x) => ({ value: x }))}
              />
            ) : key === 'logLevel' ? (
              <Select
                value={cfg.args[key] === undefined || cfg.args[key] === '' ? undefined : cfg.args[key]}
                onChange={(v) => updArg(key, v ?? '')}
                allowClear
                options={LOG_LEVELS}
              />
            ) : (
              <Input value={cfg.args[key] ?? ''} onChange={(e) => updArg(key, e.target.value)} />
            )}
          </Field>
        ))}
        {showMatch && (
          <>
            <Field label={t('协议')}>
              <Select
                value={cfg.protocol === '' ? 'all' : cfg.protocol}
                onChange={(v) => upd({ protocol: v === 'all' ? '' : v })}
                options={PROTOCOLS.map((p) => ({ value: p, label: p === 'all' ? t('不限') : p }))}
              />
            </Field>
            <Field label={t('源地址')}>
              <Input value={cfg.source} onChange={(e) => upd({ source: e.target.value })} placeholder="192.168.1.0/24" />
            </Field>
            <Field label={t('目的地址')}>
              <Input value={cfg.destination} onChange={(e) => upd({ destination: e.target.value })} placeholder="10.0.0.5" />
            </Field>
            <Field label={t('入接口')}>
              <Input value={cfg.inIface} onChange={(e) => upd({ inIface: e.target.value })} placeholder="eth0" />
            </Field>
            <Field label={t('出接口')}>
              <Input value={cfg.outIface} onChange={(e) => upd({ outIface: e.target.value })} placeholder="eth0" />
            </Field>
            <Field label={t('源端口')}>
              <Input value={cfg.sport} onChange={(e) => upd({ sport: e.target.value })} placeholder="1024:65535" />
            </Field>
            <Field label={t('目的端口')}>
              <Input value={cfg.dport} onChange={(e) => upd({ dport: e.target.value })} placeholder="80,443" />
            </Field>
            <Field label={t('连接状态')}>
              <Select
                mode="multiple"
                allowClear
                value={cfg.states}
                onChange={(v) => upd({ states: v })}
                options={CONN_STATES.map((s) => ({ value: s, label: s }))}
                style={{ width: 186 }}
                placeholder="NEW,ESTABLISHED"
              />
            </Field>
            <Field label={t('ICMP 类型')}>
              <Input value={cfg.icmpType} onChange={(e) => upd({ icmpType: e.target.value })} placeholder="echo-request" />
            </Field>
            <Field label={t('限速')}>
              <Input value={cfg.limit} onChange={(e) => upd({ limit: e.target.value })} placeholder="10/min" />
            </Field>
            <Field label={t('突发包数')}>
              <Input value={cfg.limitBurst} onChange={(e) => upd({ limitBurst: e.target.value })} placeholder="20" />
            </Field>
          </>
        )}
        <Field label={t('备注')}>
          <Input value={cfg.comment} onChange={(e) => upd({ comment: e.target.value })} placeholder="SSH" />
        </Field>
        {showMatch && (
          <Field label={t('追加参数')}>
            <Input value={cfg.extra} onChange={(e) => upd({ extra: e.target.value })} placeholder="--tcp-flags SYN,ACK SYN" />
          </Field>
        )}
      </Space>

      <Space wrap style={{ marginTop: 12 }}>
        <Button icon={<FileTextOutlined />} onClick={() => setCfg(SAMPLE_CONFIG)}>{t('示例')}</Button>
        <Button icon={<ClearOutlined />} onClick={() => setCfg(emptyRuleConfig())}>{t('重置')}</Button>
        <Button icon={<CopyOutlined />} disabled={plan.command === ''} onClick={() => copy(allText)}>{t('复制全部')}</Button>
        <Button icon={<SaveOutlined />} disabled={plan.command === ''} onClick={saveSh}>{t('保存为 .sh')}</Button>
      </Space>

      <Divider dashed style={{ margin: '12px 0' }} />

      {plan.errors.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message={t('校验未通过, 请检查以下问题:')}
          description={(
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {plan.errors.map((code) => <li key={code}>{t(ERROR_TEXT[code] ?? code)}</li>)}
            </ul>
          )}
        />
      ) : (
        <div>
          {plan.warnings.length > 0 && (
            <Alert
              style={{ marginBottom: 10 }}
              type="warning"
              showIcon
              message={(
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {plan.warnings.map((code) => <li key={code}>{t(WARN_TEXT[code] ?? code)}</li>)}
                </ul>
              )}
            />
          )}
          {codeBlock(t('生效指令 (iptables 命令)'), [ plan.command ])}
          {plan.restoreLine !== '' && codeBlock(t('iptables-save 规则行'), [ plan.restoreLine ])}
          {codeBlock(t('查看与验证'), plan.view)}
          {codeBlock(t('删除指令'), plan.remove)}
          {codeBlock(t('保存与持久化'), plan.persist)}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {contextHolder}
      <Tabs
        size="small"
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'simple', label: <Text style={{ fontSize: 13 }}>{t('简单配置')}</Text>, children: simplePane },
          { key: 'parse', label: <Text style={{ fontSize: 13 }}>{t('解析')}</Text>, children: parsePane },
          { key: 'generate', label: <Text style={{ fontSize: 13 }}>{t('生成')}</Text>, children: generatePane },
        ]}
      />
    </div>
  );
};

export default IptablesRules;
