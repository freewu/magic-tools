import { Button, Divider, InputNumber, Select, Space, Tag, Tabs, theme, message } from 'antd';
import { useState } from 'react';
import { CopyOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from './../../lib'
import {
  CRON_FIELD_META,
  CRON_FORMAT_LIST,
  CRON_PRESETS,
  defaultCronValues,
  buildCronExpr,
  applyPreset,
  optionsFor,
  type CronFieldKey,
  type CronFieldValue,
  type CronFormatValue,
  type CronPreset,
} from './lib'
import CronIntro from './intro'
import CronParsePanel from './parse'

const MODE_OPTIONS = [
  { value: 'any',   label: '任意 (*)' },
  { value: 'range', label: '范围 a-b' },
  { value: 'step',  label: '每 N 个' },
  { value: 'list',  label: '指定值' },
];

const CronRules = () => {

  const { token } = theme.useToken();

  const [ format, setFormat ] = useState<CronFormatValue>('standard');
  const [ values, setValues ] = useState<Record<CronFieldKey, CronFieldValue>>(() => defaultCronValues());
  const [ notice, contextHolder ] = message.useMessage();

  const expr = buildCronExpr(format, values);
  const formatDef = CRON_FORMAT_LIST.find((f) => f.value === format) ?? CRON_FORMAT_LIST[0];

  const updateField = (key :CronFieldKey, patch :Partial<CronFieldValue>) => {
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const switchMode = (key :CronFieldKey, mode :CronFieldValue['mode']) => {
    const meta = CRON_FIELD_META[key];
    if (mode === 'range') {
      updateField(key, { mode, from: meta.min, to: meta.max, step: undefined, list: undefined });
    } else if (mode === 'step') {
      updateField(key, { mode, step: 5, from: undefined, to: undefined, list: undefined });
    } else if (mode === 'list') {
      updateField(key, { mode, list: [], from: undefined, to: undefined, step: undefined });
    } else {
      updateField(key, { mode, from: undefined, to: undefined, step: undefined, list: undefined });
    }
  };

  const usePreset = (p :CronPreset) => {
    if (p.onlyStandard && format === 'linux') {
      notice.info('该预设需要「秒」字段, 请先切换到标准格式');
      return;
    }
    setValues(applyPreset(format, p));
  };

  return (
    <div>
      {contextHolder}

      <Tabs
        defaultActiveKey="gen"
        items={ [
          {
            key: 'gen',
            label: '生成',
            children: (
              <div>
      <Space wrap style={ { marginBottom: 10 } }>
        <span>表达式格式</span>
        <Select
          style={ { width: 300 } }
          value={ format }
          onChange={ setFormat }
          options={ CRON_FORMAT_LIST.map((f) => ({ value: f.value, label: f.label })) }
        />
        { format === 'linux' && <Tag color="orange">Linux cron 无「秒 / 年」字段, 已隐藏对应配置行</Tag> }
      </Space>

      <div style={ { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 } }>
        <span style={ { lineHeight: '24px' } }>快速预设</span>
        { CRON_PRESETS.map((p) => (
          <Button
            key={ p.label }
            size="small"
            onClick={ () => usePreset(p) }
            title={ p.note }
          >{ p.label }</Button>
        )) }
      </div>

      { formatDef.keys.map((key) => {
        const meta = CRON_FIELD_META[key];
        const fv = values[key];
        const options = optionsFor(meta);
        return (
          <div
            key={ key }
            style={ { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '6px 0', borderBottom: `1px dashed ${token.colorSplit}` } }
          >
            <Space size={ 4 }>
              <Tag style={ { width: 34, textAlign: 'center', margin: 0 } }>{ meta.label }</Tag>
              <span style={ { color: token.colorTextTertiary, fontSize: 12 } }>{ meta.tip }</span>
            </Space>

            <Select
              style={ { width: 110 } }
              size="small"
              value={ fv.mode }
              onChange={ (m) => switchMode(key, m) }
              options={ MODE_OPTIONS }
            />

            { fv.mode === 'range' && (
              <Space size={ 4 }>
                <InputNumber
                  size="small"
                  style={ { width: 84 } }
                  min={ meta.min } max={ meta.max } precision={ 0 }
                  value={ fv.from }
                  onChange={ (n) => updateField(key, { from: n ?? undefined }) }
                />
                <span>至</span>
                <InputNumber
                  size="small"
                  style={ { width: 84 } }
                  min={ meta.min } max={ meta.max } precision={ 0 }
                  value={ fv.to }
                  onChange={ (n) => updateField(key, { to: n ?? undefined }) }
                />
              </Space>
            ) }

            { fv.mode === 'step' && (
              <Space size={ 4 }>
                <span>每</span>
                <InputNumber
                  size="small"
                  style={ { width: 76 } }
                  min={ 1 } max={ meta.max } precision={ 0 }
                  value={ fv.step }
                  onChange={ (n) => updateField(key, { step: n ?? 1 }) }
                />
                <span>{ meta.label }执行 (即 */N)</span>
              </Space>
            ) }

            { fv.mode === 'list' && (
              <Select
                mode="multiple"
                size="small"
                style={ { minWidth: 260, maxWidth: 420 } }
                placeholder={ `选择 ${meta.tip} 中的若干值` }
                value={ fv.list ?? [] }
                onChange={ (list) => updateField(key, { list: list as number[] }) }
                options={ options }
                maxTagCount="responsive"
                showSearch
                optionFilterProp="label"
              />
            ) }

            { fv.mode === 'any' && <span style={ { color: token.colorTextTertiary } }>不限制</span> }
          </div>
        );
      }) }

      <div
        style={ {
          marginTop: 12,
          padding: '10px 12px',
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 6,
          background: token.colorBgContainer,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        } }
      >
        <Tag color={ format === 'linux' ? 'orange' : 'blue' }>{ format === 'linux' ? 'Linux (5 段)' : '标准 (7 段)' }</Tag>
        <code
          style={ { fontSize: 16, fontWeight: 600, color: token.colorText, fontFamily: 'Consolas, Monaco, monospace' } }
        >{ expr }</code>
        <Button
          size="small"
          type="primary"
          icon={ <CopyOutlined /> }
          onClick={ () => { copyTextToClipboard(expr); notice.success('复制到粘贴板成功！！！'); } }
        >复制</Button>
      </div>
      <div style={ { color: token.colorTextTertiary, fontSize: 12, marginTop: 4 } }>
        标准格式 = 秒 分 时 日 月 周 年; Linux 格式 = 分 时 日 月 周 (crontab 不支持秒/年)
      </div>

              </div>
            ),
          },
          {
            key: 'parse',
            label: '解析',
            children: <CronParsePanel />,
          },
        ] }
      />

      <Divider> Cron 规则说明 </Divider>

      <CronIntro />
    </div>
  );
}

export default CronRules;
