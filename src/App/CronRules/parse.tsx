import { Alert, Button, Divider, Input, Select, Space, Tag, theme, message } from 'antd';
import { useState } from 'react';
import { CopyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from './../../lib'
import { useLocale } from '../../hook/locale-context';
import { u, uT } from './lang';
import {
  CRON_FIELD_META,
  CRON_FORMAT_LIST,
  parseCronExpr,
  nextCronTimes,
  cronWeekName,
  type ParsedCronRule,
  type CronFormatValue,
  type CronLocale,
} from './lib'

const pad = (n :number) => String(n).padStart(2, '0');

const fmtTime = (d :Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const toLoc = (locale :string) :CronLocale => locale === 'zh-TW' ? 'zh-TW' : locale === 'en' ? 'en' : 'zh-CN';

// 相对描述 (基于解析时刻, 页面停留期间不跳动)
const relText = (locale :string, t :number, base :number) :string => {
  const diff = t - base;
  if (diff <= 0) return u(locale, '即将触发');
  const days = Math.floor(diff / 86400000);
  if (days > 0) return uT(locale, '约 {n} 天后', { n: days });
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return uT(locale, '约 {n} 小时后', { n: hours });
  const mins = Math.floor(diff / 60000);
  if (mins > 0) return uT(locale, '约 {n} 分钟后', { n: mins });
  return u(locale, '1 分钟内');
};

const SAMPLES :Array<{ label: string; expr: string; fmt: CronFormatValue }> = [
  { label: '每周一 09:00', expr: '0 9 * * 1', fmt: 'linux' },
  { label: '每 5 分钟', expr: '*/5 * * * *', fmt: 'linux' },
  { label: '每 30 秒', expr: '*/30 * * * * * *', fmt: 'standard' },
  { label: '每月 1 日 03:15', expr: '15 3 1 * *', fmt: 'linux' },
  { label: '每年元旦 (2026)', expr: '0 0 0 1 1 * 2026', fmt: 'standard' },
];

const CronParsePanel = () => {

  const { locale } = useLocale();
  const t = (zh :string) => u(locale, zh);
  const tt = (zh :string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const loc = toLoc(locale);
  const { token } = theme.useToken();
  const [ notice, contextHolder ] = message.useMessage();
  const [ expr, setExpr ] = useState('');
  const [ fmt, setFmt ] = useState<CronFormatValue>('linux');
  const [ rule, setRule ] = useState<ParsedCronRule | null>(null);
  const [ times, setTimes ] = useState<Date[]>([]);
  const [ err, setErr ] = useState('');
  const [ base, setBase ] = useState(0);

  const doParse = (text :string, format :CronFormatValue) => {
    setErr('');
    setRule(null);
    setTimes([]);
    try {
      const r = parseCronExpr(text, format, loc);
      const now = Date.now();
      setRule(r);
      setTimes(nextCronTimes(r, new Date(now), 10));
      setBase(now);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const useSample = (s :typeof SAMPLES[number]) => {
    setExpr(s.expr);
    setFmt(s.fmt);
    doParse(s.expr, s.fmt);
  };

  const domRes = !!rule?.fields.find((f) => f.key === 'day' && !f.any);
  const dowRes = !!rule?.fields.find((f) => f.key === 'week' && !f.any);

  return (
    <>
      {contextHolder}
      <div style={ { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0' } }>
        <span>{t('表达式格式')}</span>
        <Select
          style={ { width: 280 } }
          value={ fmt }
          onChange={ (v) => setFmt(v) }
          options={ CRON_FORMAT_LIST.map((f) => ({ value: f.value, label: t(f.label) })) }
        />
        <Input
          style={ { flex: '1 1 320px', minWidth: 300, fontFamily: 'Consolas, Monaco, monospace' } }
          placeholder={ t('输入 Cron 表达式, 如 0 9 * * 1 (格式需与上方一致)') }
          value={ expr }
          allowClear
          onChange={ (e) => setExpr(e.target.value) }
          onPressEnter={ () => { if (expr.trim()) doParse(expr, fmt); } }
        />
        <Button
          type="primary"
          icon={ <ThunderboltOutlined /> }
          disabled={ !expr.trim() }
          onClick={ () => doParse(expr, fmt) }
        >{t('解析规则')}</Button>
      </div>
      <div style={ { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 } }>
        <span style={ { color: token.colorTextTertiary, lineHeight: '22px' } }>{t('试试:')}</span>
        { SAMPLES.map((s) => (
          <Button key={ s.expr } size="small" onClick={ () => useSample(s) }>{ t(s.label) }</Button>
        )) }
      </div>

      { err && <Alert type="error" showIcon message={ t('解析失败') } description={ err } style={ { marginBottom: 8 } } /> }

      { rule && !err && (
        <div style={ { border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 6, background: token.colorBgContainer, padding: '10px 12px' } }>
          <Space wrap style={ { marginBottom: 6 } }>
            <Tag color={ fmt === 'linux' ? 'orange' : 'blue' }>{ fmt === 'linux' ? t('Linux (5 段)') : t('标准 (7 段)') }</Tag>
            <code style={ { fontSize: 15, fontWeight: 600, fontFamily: 'Consolas, Monaco, monospace' } }>
              { rule.fields.map((f) => f.raw).join(' ') }
            </code>
          </Space>
          <div style={ { display: 'flex', flexDirection: 'column', gap: 4 } }>
            { rule.fields.map((f) => {
              const meta = CRON_FIELD_META[f.key];
              return (
                <div key={ f.key } style={ { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } }>
                  <Tag style={ { width: 34, textAlign: 'center', margin: 0 } }>{ t(meta.label) }</Tag>
                  <code style={ { minWidth: 60, fontFamily: 'Consolas, Monaco, monospace', color: token.colorText } }>{ f.raw }</code>
                  { f.any
                    ? <Tag color="green">{t('任意 (*)')}</Tag>
                    : <span style={ { color: token.colorTextSecondary, fontSize: 13 } }>{ f.desc }</span>
                  }
                  { !f.any && <span style={ { color: token.colorTextTertiary, fontSize: 12 } }>{ tt('共 {x} 个取值', { x: f.allow.length }) }</span> }
                </div>
              );
            }) }
          </div>
          { domRes && dowRes && (
            <div style={ { marginTop: 6, color: token.colorTextTertiary, fontSize: 12 } }>
              { t('提示: 「日」与「周」同时被限制时按') } <b>{t('或')}</b>{ t('匹配 (任一满足即触发, 同 Vixie cron); 单独限制其一则只按该条件') }
            </div>
          ) }
        </div>
      ) }

      { rule && !err && (
        <div style={ { marginTop: 10 } }>
          <div style={ { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } }>
            <span style={ { fontWeight: 600 } }>{t('最近 10 次触发时间')}</span>
            { times.length > 0 && (
              <Button
                size="small"
                icon={ <CopyOutlined /> }
                onClick={ () => {
                  copyTextToClipboard(times.map((time) => fmtTime(time)).join('\n'));
                  notice.success(t('复制到粘贴板成功！！！'));
                } }
              >{t('复制全部')}</Button>
            ) }
          </div>
          { times.length === 0
            ? <Alert type="warning" showIcon message={ t('该规则在 2024-2099 年内无法触发 (请检查规则是否可达, 如 2 月 30 日)') } />
            : (
              <div style={ { display: 'flex', flexDirection: 'column', gap: 3 } }>
                { times.map((time, i) => (
                  <div
                    key={ i }
                    style={ {
                      display: 'flex', alignItems: 'center', gap: 10, padding: '3px 8px', borderRadius: 4,
                      background: i % 2 === 0 ? token.colorFillQuaternary : 'transparent',
                    } }
                  >
                    <span style={ { color: token.colorTextTertiary, minWidth: 40 } }>#{ i + 1 }</span>
                    <code style={ { fontFamily: 'Consolas, Monaco, monospace', fontSize: 14, fontWeight: 600, color: token.colorText } }>
                      { fmtTime(time) }
                    </code>
                    <Tag color="blue">{ cronWeekName(loc, time.getDay()) }</Tag>
                    <span style={ { color: token.colorTextTertiary, fontSize: 12 } }>{ relText(locale, time.getTime(), base) }</span>
                  </div>
                )) }
                { times.length < 10 && (
                  <div style={ { color: token.colorTextTertiary, fontSize: 12, marginTop: 4 } }>
                    { tt('仅找到 {x} 次 (在 2099 年范围内)', { x: times.length }) }
                  </div>
                ) }
              </div>
            )
          }
        </div>
      ) }
    </>
  );
};

export default CronParsePanel;
