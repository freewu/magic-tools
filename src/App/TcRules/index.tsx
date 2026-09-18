import { Alert, Button, Divider, Input, Select, Space, Switch, Typography, message } from 'antd';
import { ClearOutlined, CopyOutlined, SaveOutlined } from '@ant-design/icons';
import { useMemo, useState, type ReactNode } from 'react';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { tcr, tcrT } from './lang';
import {
  DEFAULT_TC_CONFIG, DIRECTIONS, FILTER_KINDS, PORT_PROTOS, PROTO_PROTOS, RATE_UNITS,
  TC_MODES, TC_PRESETS,
} from './data';
import {
  applyPreset, buildTcPlan, type TcConfig, type TcDirection, type TcFilterKind,
  type TcMode, type TcRateUnit,
} from './lib';

const { Text } = Typography;

/** 校验错误码 -> 提示文案 */
const ERROR_TEXT: Record<string, string> = {
  dev: '请填写网卡名称',
  'dev-format': '网卡名称只能包含字母, 数字, 点, 下划线, 冒号, @ 和减号',
  ifb: '入口方向需要填写 ifb 设备名',
  mode: '限速方式不正确',
  rate: '限速值必须是大于 0 的数字',
  ceil: '峰值必须是大于 0 的数字',
  total: '总带宽必须是大于 0 的数字',
  'rate-total': '限速值不能大于总带宽',
  burst: '突发必须是大于 0 的数字',
  latency: '延迟必须是大于 0 的数字',
  'netem-empty': '请至少填写一项 netem 参数 (延迟 / 丢包 / 重复 / 损坏 / 乱序)',
  delay: '延迟必须是大于 0 的数字',
  'jitter-needs-delay': '抖动需要先设置延迟',
  jitter: '抖动必须是数字',
  loss: '丢包率必须在 0-100 之间',
  duplicate: '重复率必须在 0-100 之间',
  corrupt: '损坏率必须在 0-100 之间',
  reorder: '乱序率必须在 0-100 之间',
  gap: '乱序间隔必须是数字',
  'netem-limit': '队列长度必须是数字',
  'class-id': '类编号必须是 2-9999 的数字 (1 是根类)',
  'default-class': '默认类编号不合法',
  'default-equals-class': '默认类不能与限速类相同',
  'filter-port': '端口必须是 1-65535',
  'filter-proto': '协议不合法',
  'filter-ip': 'IP / 网段格式不正确',
  prio: '优先级必须是数字',
};

/** 提示码 -> 文案 */
const WARN_TEXT: Record<string, string> = {
  'need-root': '需要 root 权限执行 (命令前加 sudo 或切换到 root)',
  'whole-dev': 'netem / tbf 作用于整张网卡, 无法只针对个别端口',
  'ifb-note': '入口限速需要 ifb 内核模块, 重定向会略微增加 CPU 开销',
  'htb-class-only': '只有 HTB 支持按条件分流, 其余方式只能限制整卡',
  'not-persist': 'tc 规则重启后失效, 需写入开机脚本或 systemd 服务',
};

/** 字段容器 (标签在上, 控件在下) */
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 200 }}>
    <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
    {children}
  </div>
);

/** 速率输入 (数值 + 单位) */
const RateField = ({ label, value, unit, placeholder, onChange, onUnit }: {
  label: string; value: string; unit: TcRateUnit; placeholder?: string;
  onChange: (v: string) => void; onUnit: (v: TcRateUnit) => void;
}) => (
  <Field label={label}>
    <Space.Compact style={{ width: '100%' }}>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <Select
        value={unit}
        onChange={(v) => onUnit(v as TcRateUnit)}
        options={RATE_UNITS.map((u) => ({ value: u, label: u }))}
        style={{ width: 90 }}
      />
    </Space.Compact>
  </Field>
);

const TcRules = () => {
  const { locale } = useLocale();
  const t = (zh: string) => tcr(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => tcrT(locale, zh, v);
  const [ messageApi, contextHolder ] = message.useMessage();

  const [ cfg, setCfg ] = useState<TcConfig>(DEFAULT_TC_CONFIG);
  const [ preset, setPreset ] = useState<string | undefined>(undefined);

  const plan = useMemo(() => buildTcPlan(cfg), [ cfg ]);

  const upd = (patch: Partial<TcConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const copy = (value: string) => {
    if (value === '') return;
    copyTextToClipboard(value);
    messageApi.success(t('复制到粘贴板成功!!!'));
  };

  const allText = [ ...plan.add, ...plan.view, ...plan.clear ].join('\n');

  const applyPresetByName = (name: string) => {
    const hit = TC_PRESETS.find((p) => p.name === name);
    if (!hit) return;
    setCfg(applyPreset(cfg, hit.config));
    setPreset(name);
    messageApi.success(tt('已应用示例: {name}', { name }));
  };

  const reset = () => {
    setCfg(DEFAULT_TC_CONFIG);
    setPreset(undefined);
  };

  const saveSh = async () => {
    const ok = await saveTextFile('tc-rules.sh', plan.script, t('保存为 .sh'), {
      filterName: t('Shell 脚本'), extensions: [ 'sh' ],
    });
    if (ok) messageApi.success(t('复制到粘贴板成功!!!'));
  };

  /** 代码块 */
  const codeBlock = (title: string, lines: string[], hint?: string) => (
    <div style={{ marginBottom: 8 }}>
      <Space size={4} style={{ marginBottom: 2 }}>
        <Text strong style={{ fontSize: 13 }}>{title}</Text>
        <Button size="small" type="link" icon={<CopyOutlined />} onClick={() => copy(lines.join('\n'))}>{t('复制')}</Button>
        {hint !== undefined && <Text type="secondary" style={{ fontSize: 12 }}>{hint}</Text>}
      </Space>
      <div
        style={{
          background: '#23241f', color: '#f8f8f2', borderRadius: 6, padding: '6px 10px',
          fontFamily: 'Consolas, Monaco, monospace', fontSize: 12.5, lineHeight: 1.8,
          whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 220, overflow: 'auto',
        }}
      >
        {lines.map((line) => (
          <div key={line} title={t('点击复制')} style={{ cursor: 'pointer' }} onClick={() => copy(line)}>{line}</div>
        ))}
      </div>
    </div>
  );

  const numField = (label: string, key: keyof TcConfig, placeholder?: string) => (
    <Field label={label}>
      <Input
        value={String(cfg[key] ?? '')}
        placeholder={placeholder}
        onChange={(e) => upd({ [ key ]: e.target.value } as unknown as Partial<TcConfig>)}
      />
    </Field>
  );

  return (
    <div>
      {contextHolder}
      <Space wrap size={[ 12, 12 ]} align="start">
        <Field label={t('场景示例')}>
          <Select
            value={preset}
            onChange={applyPresetByName}
            options={TC_PRESETS.map((p) => ({ value: p.name, label: p.name }))}
            placeholder={t('请选择场景示例')}
            style={{ width: 200 }}
            allowClear
            onClear={reset}
          />
        </Field>
        <Field label={t('限速方式')}>
          <Select
            value={cfg.mode}
            onChange={(v) => upd({ mode: v as TcMode })}
            options={TC_MODES.map((m) => ({ value: m.value, label: m.label }))}
            style={{ width: 200 }}
          />
        </Field>
        <Field label={t('方向')}>
          <Select
            value={cfg.direction}
            onChange={(v) => upd({ direction: v as TcDirection })}
            options={DIRECTIONS.map((d) => ({ value: d.value, label: d.label }))}
            style={{ width: 200 }}
          />
        </Field>
        <Field label={t('网卡')}>
          <Input value={cfg.dev} onChange={(e) => upd({ dev: e.target.value })} placeholder="eth0" />
        </Field>
        {cfg.direction === 'ingress' && (
          <Field label={t('ifb 设备')}>
            <Input value={cfg.ifbDev} onChange={(e) => upd({ ifbDev: e.target.value })} placeholder="ifb0" />
          </Field>
        )}
        {cfg.mode !== 'netem' && (
          <RateField
            label={t('限速值')}
            value={cfg.rate}
            unit={cfg.rateUnit}
            onChange={(v) => upd({ rate: v })}
            onUnit={(v) => upd({ rateUnit: v })}
          />
        )}
        {cfg.mode === 'htb' && (
          <>
            <RateField
              label={t('总带宽')}
              value={cfg.total}
              unit={cfg.totalUnit}
              onChange={(v) => upd({ total: v })}
              onUnit={(v) => upd({ totalUnit: v })}
            />
            <RateField
              label={t('峰值 (ceil)')}
              value={cfg.ceil}
              unit={cfg.ceilUnit}
              placeholder={t('留空则等于限速值')}
              onChange={(v) => upd({ ceil: v })}
              onUnit={(v) => upd({ ceilUnit: v })}
            />
          </>
        )}
        {cfg.mode === 'tbf' && (
          <>
            {numField(t('突发 (burst)'), 'burstKb', t('自动计算 (速率的 1%)'))}
            {numField(t('延迟 (latency)'), 'latencyMs', t('默认延迟 400ms'))}
          </>
        )}
        {cfg.mode === 'netem' && (
          <>
            {numField(t('延迟 (ms)'), 'delayMs', '100')}
            {numField(t('抖动 (ms)'), 'jitterMs', '20')}
            {numField(t('丢包 (%)'), 'lossPct', '1')}
            {numField(t('重复 (%)'), 'duplicate', '0')}
            {numField(t('损坏 (%)'), 'corrupt', '0')}
            {numField(t('乱序 (%)'), 'reorder', '0')}
            {numField(t('乱序间隔'), 'gap', '5')}
            {numField(t('队列长度'), 'netemLimit', '1000')}
          </>
        )}
        {cfg.mode === 'htb' && (
          <>
            <Field label={t('分流条件')}>
              <Select
                value={cfg.filterKind}
                onChange={(v) => upd({ filterKind: v as TcFilterKind })}
                options={FILTER_KINDS.map((f) => ({ value: f.value, label: f.label, title: f.hint }))}
                style={{ width: 200 }}
              />
            </Field>
            {cfg.filterKind === 'port' && (
              <>
                {numField(t('端口'), 'filterPort', '80')}
                <Field label={t('协议')}>
                  <Select
                    value={cfg.filterProto}
                    onChange={(v) => upd({ filterProto: v })}
                    options={PORT_PROTOS.map((p) => ({ value: p.value, label: p.label }))}
                    style={{ width: 200 }}
                  />
                </Field>
              </>
            )}
            {cfg.filterKind === 'ip' && numField(t('目标 IP / 网段'), 'filterIp', '10.0.0.5')}
            {cfg.filterKind === 'proto' && (
              <Field label={t('协议')}>
                <Select
                  value={cfg.filterProto}
                  onChange={(v) => upd({ filterProto: v })}
                  options={PROTO_PROTOS.map((p) => ({ value: p.value, label: p.label }))}
                  style={{ width: 200 }}
                />
              </Field>
            )}
            {numField(t('限速类编号'), 'classId', '10')}
            {numField(t('默认类编号'), 'defaultClass', t('留空则使用限速值'))}
            {numField(t('优先级'), 'prio', '1')}
            {numField(t('根 handle'), 'handle', '1')}
            <Field label={t('每个类挂 sfq 队列')}>
              <Switch checked={cfg.sfq} onChange={(v) => upd({ sfq: v })} />
            </Field>
          </>
        )}
      </Space>

      <Space wrap style={{ marginTop: 12 }}>
        <Button onClick={reset} icon={<ClearOutlined />}>{t('重置')}</Button>
        <Button icon={<CopyOutlined />} disabled={plan.add.length === 0} onClick={() => copy(allText)}>{t('复制全部')}</Button>
        <Button icon={<SaveOutlined />} disabled={plan.add.length === 0} onClick={saveSh}>{t('保存为 .sh')}</Button>
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
          {codeBlock(t('添加 / 生效指令'), plan.add)}
          {codeBlock(t('查看指令'), plan.view)}
          {codeBlock(t('清除指令'), plan.clear, t('在需要撤销限速时执行, 全部带 || true 可重复执行'))}
        </div>
      )}
    </div>
  );
};

export default TcRules;
