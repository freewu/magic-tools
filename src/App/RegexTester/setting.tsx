import { useState } from 'react';
import { Button, Divider, Input, Space, message } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from './../../lib'
import {
  listRegexPresets,
  saveRegexPresets,
  resetRegexPresets,
  newPresetId,
  type RegexPreset,
} from './lib';

// 设置 - 其它 - 正则表达式: 维护常用正则列表 (在「正则表达式」工具中可直接点击套用)
export const RegexTesterSetting = () => {

  const [ presets, setPresets ] = useState<RegexPreset[]>(() => listRegexPresets());
  const [ name, setName ] = useState('');
  const [ pattern, setPattern ] = useState('');
  const [ flags, setFlags ] = useState('');
  const [ notice, contextHolder ] = message.useMessage();

  const commit = (next :RegexPreset[]) => {
    setPresets(next);
    saveRegexPresets(next);
  };

  const updateRow = (id :number, patch :Partial<RegexPreset>) => {
    commit(presets.map((p) => p.id === id ? { ...p, ...patch } : p));
  };

  const removeRow = (id :number) => {
    commit(presets.filter((p) => p.id !== id));
  };

  const addRow = () => {
    const n = name.trim();
    const p = pattern.trim();
    if (n === '' || p === '') {
      notice.warning('请填写名称与正则表达式');
      return;
    }
    try {
      // eslint-disable-next-line no-new
      new RegExp(p, flags);
    } catch (e) {
      notice.error('正则表达式无效: ' + (e as Error).message);
      return;
    }
    commit([ ...presets, { id: newPresetId(), name: n, pattern: p, flags } ]);
    setName(''); setPattern(''); setFlags('');
  };

  const reset = () => {
    setPresets(resetRegexPresets());
    notice.success('已恢复默认预设');
  };

  return (
    <>
      {contextHolder}
      <Divider orientation="left" plain>正则表达式</Divider>
      <div style={ { color: '#999', fontSize: 12, marginBottom: 8 } }>
        常用正则列表, 保存后可在「正则表达式」工具下拉框里点击直接套用
      </div>
      { presets.map((p) => (
        <div key={ p.id } style={ { display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' } }>
          <Input
            size="small"
            style={ { width: 160 } }
            value={ p.name }
            onChange={ (e) => updateRow(p.id, { name: e.target.value }) }
          />
          <Input
            size="small"
            style={ { flex: '1 1 320px', minWidth: 240 } }
            value={ p.pattern }
            onChange={ (e) => updateRow(p.id, { pattern: e.target.value }) }
          />
          <Input
            size="small"
            style={ { width: 70 } }
            value={ p.flags }
            placeholder="标志"
            title="正则标志位, 如 gim"
            onChange={ (e) => updateRow(p.id, { flags: e.target.value }) }
          />
          <Button
            size="small"
            danger
            type="text"
            icon={ <DeleteOutlined /> }
            onClick={ () => removeRow(p.id) }
          />
          <Button
            size="small"
            type="text"
            icon={ <CopyOutlined /> }
            title="一键复制该正则规则"
            onClick={ () => { copyTextToClipboard(p.pattern); notice.success('复制到粘贴板成功！！！'); } }
          />
        </div>
      )) }
      <Space.Compact style={ { width: '100%', marginTop: 4 } }>
        <Input
          size="small"
          style={ { width: 160 } }
          value={ name }
          placeholder="新预设名称"
          onChange={ (e) => setName(e.target.value) }
        />
        <Input
          size="small"
          value={ pattern }
          placeholder="新预设正则表达式"
          onChange={ (e) => setPattern(e.target.value) }
        />
        <Input
          size="small"
          style={ { width: 70 } }
          value={ flags }
          placeholder="标志"
          onChange={ (e) => setFlags(e.target.value) }
        />
        <Button
          size="small"
          type="primary"
          icon={ <PlusOutlined /> }
          onClick={ addRow }
        >添加</Button>
      </Space.Compact>
      <div style={ { marginTop: 8 } }>
        <Button
          size="small"
          icon={ <ReloadOutlined /> }
          onClick={ reset }
        >恢复默认预设</Button>
      </div>
    </>
  );
}
