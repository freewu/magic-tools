import { useState } from 'react';
import { Button, Divider, Input, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { encodeMorse } from './lib';
import {
  listCustomMorsePhrases,
  saveCustomMorsePhrases,
  newMorsePhraseId,
  type CustomMorsePhrase,
} from './lib';

// 设置 - 其它 - 摩斯码常用编码: 维护自定义常用编码 (在「摩斯码编解码」下拉中快速填充)
export const MorseCodecSetting = () => {

  const [ list, setList ] = useState<CustomMorsePhrase[]>(() => listCustomMorsePhrases());
  const [ text, setText ] = useState('');
  const [ desc, setDesc ] = useState('');
  const [ notice, contextHolder ] = message.useMessage();

  const commit = (next :CustomMorsePhrase[]) => {
    setList(next);
    saveCustomMorsePhrases(next);
  };

  const codeOf = (t :string) :string => {
    try { return encodeMorse(t); } catch { return '?'; }
  };

  const updateRow = (id :number, patch :Partial<CustomMorsePhrase>) => {
    commit(list.map((p) => p.id === id ? { ...p, ...patch } : p));
  };

  const removeRow = (id :number) => {
    commit(list.filter((p) => p.id !== id));
  };

  const addRow = () => {
    const t = text.trim();
    const d = desc.trim();
    if (t === '') {
      notice.warning('请填写填入文本');
      return;
    }
    commit([ ...list, { id: newMorsePhraseId(), text: t, desc: d || t } ]);
    setText('');
    setDesc('');
    notice.success('已添加');
  };

  return (
    <>
      {contextHolder}
      <Divider orientation="left" plain>摩斯码常用编码</Divider>
      <div style={ { color: '#999', fontSize: 12, marginBottom: 8 } }>
        自定义常用编码, 保存后可在「摩斯码编解码」的常用编码下拉框中选中快速填充到明文与摩斯码区
      </div>
      { list.length === 0 && (
        <div style={ { color: '#999', fontSize: 12, marginBottom: 8 } }>暂无自定义编码, 在下方添加即可 (内置 CQ/SOS/Q简语/73 等无需配置)</div>
      ) }
      { list.map((p) => (
        <div key={ p.id } style={ { display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' } }>
          <Input
            size="small"
            style={ { width: 140 } }
            value={ p.text }
            placeholder="填入文本"
            onChange={ (e) => updateRow(p.id, { text: e.target.value }) }
          />
          <span style={ { color: '#bbb', fontFamily: 'Consolas, Monaco, monospace', fontSize: 12, minWidth: 120 } }>{ codeOf(p.text) }</span>
          <Input
            size="small"
            style={ { flex: '1 1 260px', minWidth: 200 } }
            value={ p.desc }
            placeholder="说明 (含义)"
            onChange={ (e) => updateRow(p.id, { desc: e.target.value }) }
          />
          <Button
            size="small"
            danger
            type="text"
            icon={ <DeleteOutlined /> }
            onClick={ () => removeRow(p.id) }
          />
        </div>
      )) }
      <div style={ { display: 'flex', gap: 6, flexWrap: 'wrap' } }>
        <Input
          size="small"
          style={ { width: 140 } }
          value={ text }
          placeholder="填入文本 (如 TU)"
          onChange={ (e) => setText(e.target.value) }
        />
        <Input
          size="small"
          style={ { flex: '1 1 260px', minWidth: 200 } }
          value={ desc }
          placeholder="说明 (如 谢谢)"
          onChange={ (e) => setDesc(e.target.value) }
        />
        <Button
          size="small"
          type="primary"
          icon={ <PlusOutlined /> }
          onClick={ addRow }
        >添加</Button>
      </div>
    </>
  );
}
