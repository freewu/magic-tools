import { Alert, Button, Card, Descriptions, Input, Space, Tag, Typography, message } from 'antd';
import { ThunderboltOutlined, SwapOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from '../ui-lang';
import { calcCidr, CIDR_PRESETS } from './lib';
import type { CIDRResult } from './lib';

const { Text } = Typography;

const CIDRCalc: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<CIDRResult | null>(null);
  const [error, setError] = useState('');

  const handleChange = (v: string) => {
    setValue(v);
    setError('');
    if (!v.trim()) {
      setResult(null);
      return;
    }
    const r = calcCidr(v);
    if (!r) {
      setError(t('无法解析该地址, 请输入形如 192.168.1.0/24 的 CIDR (前缀 0-32), 或直接输入 IPv4 地址 (按 /32 计算)'));
      setResult(null);
      return;
    }
    setResult(r);
  };

  const descRows = result ? [
    { key: 'ip', label: t('IP 地址'), value: result.ip },
    { key: 'prefix', label: t('前缀长度'), value: `/${result.prefix}` },
    { key: 'network', label: t('网络地址'), value: result.network },
    { key: 'broadcast', label: t('广播地址'), value: result.prefix >= 31 ? `${result.broadcast}${result.prefix === 32 ? t(' (自身)') : ''}` : result.broadcast },
    { key: 'mask', label: t('子网掩码'), value: `${result.mask}  ${tt('({n} 位)', { n: result.prefix })}` },
    { key: 'wildcard', label: t('通配符掩码'), value: result.wildcard },
    { key: 'total', label: t('地址总数'), value: `${result.totalHosts.toLocaleString()} ${t('个')}` },
    { key: 'usable', label: t('可用主机数'), value: `${result.usableHosts.toLocaleString()} ${t('个')}` },
    { key: 'range', label: t('可用地址范围'), value: result.firstHost && result.lastHost ? `${result.firstHost} ~ ${result.lastHost}` : t('— (无可用主机地址)') },
  ] : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('CIDR 计算器')}
        description={t('输入 IPv4 CIDR（如 192.168.1.0/24）或纯 IP（按 /32 单主机计算），即时给出网络地址、广播地址、掩码、通配符掩码与主机范围。可直接点下方 A 类 / B 类 / C 类 / 单主机 / 点对点快速示例。')}
      />

      <Card size="small">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space wrap>
            <span style={{ color: 'rgba(0,0,0,0.55)' }}>CIDR / IP</span>
            <Input
              style={{ width: 320, fontFamily: 'monospace' }}
              placeholder={t('例如 192.168.1.0/24 或 203.0.113.25')}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onPressEnter={() => { /* 即时计算 */ }}
            />
            <Button icon={<SwapOutlined />} onClick={() => { if (value) message.info(t('已按输入即时计算')); }}>
              {t('计算')}
            </Button>
          </Space>
          <Space wrap>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('快速示例:')}</Text>
            {CIDR_PRESETS.map((p) => (
              <Button
                key={p.label}
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => handleChange(p.cidr)}
              >
                {t(p.label)}
              </Button>
            ))}
          </Space>
          {error && <Text type="danger">{error}</Text>}
          {result && (
            <Alert
              type="success"
              showIcon
              message={tt('{i}  →  网络 {n}  /  掩码 {m}', { i: result.input, n: result.network, m: result.mask })}
            />
          )}
        </Space>
      </Card>

      {result && (
        <Card size="small" title={t('计算结果')}>
          <Descriptions
            size="small"
            bordered
            column={{ xs: 1, sm: 1, md: 2, lg: 2 }}
            items={descRows.map((d) => ({ key: d.key, label: d.label, children: <Text style={{ fontFamily: 'monospace' }}>{d.value}</Text> }))}
          />
          <Space wrap style={{ marginTop: 12 }}>
            {result.nature.map((n) => (
              <Tag key={n} color="blue">{t(n)}</Tag>
            ))}
          </Space>
          {(result.prefix === 31 || result.prefix === 32) && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
              {result.prefix === 31
                ? t('/31 网段按 RFC 3021 点对点链路计, 两个地址均可分配使用。')
                : t('/32 为单主机地址 (主机路由), 无网络/广播概念, 仅该 IP 本身可用。')}
            </Text>
          )}
        </Card>
      )}
    </Space>
  );
};

export default CIDRCalc;
