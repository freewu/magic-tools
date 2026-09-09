import { Alert, Button, Divider, Input, Radio, Select, Space, message } from 'antd';
import { useState } from 'react';
import { copyTextToClipboard } from '../../lib';
import { TYPE7_SALT_MAX, TYPE7_SALT_MIN, decryptType7, encryptType7 } from './lib';
import { useLocale } from '../../hook/locale-context';
import { cr, crT } from '../crypto-lang';

const { TextArea } = Input;

const CiscoType7 = () => {
  const { locale } = useLocale();
  const t = (zh: string) => cr(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => crT(locale, zh, v);
  // lib 抛出的中文错误在 catch 处翻译
  const P1 = 'Type 7 第 ';
  const P2 = '位起含非十六进制字符';
  const transErr = (m: string): string => {
    if (m === 'Type 7 串长度不合法 (至少 2 位且为偶数)') return t(m);
    if (m === 'Type 7 盐偏移不合法 (前 2 位应为 00~0F 的十六进制)') return t(m);
    if (m.startsWith(P1) && m.endsWith(P2)) return tt('Type 7 第 {pos} 位起含非十六进制字符', { pos: m.slice(P1.length, m.length - P2.length) });
    return m;
  };
  const [ direction, setDirection ] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [ value, setValue ] = useState('');
  const [ salt, setSalt ] = useState<number | 'random'>('random'); // 加密时的盐偏移
  const [ result, setResult ] = useState('');
  const [ notice, contextHolder ] = message.useMessage();

  const inputClick = (e: React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if (txt !== '') {
      copyTextToClipboard(txt);
      notice.success(t('复制到粘贴板成功！！！'));
    }
  };

  const run = () => {
    if (value === '') return;
    try {
      if (direction === 'encrypt') {
        setResult(encryptType7(value, salt === 'random' ? undefined : salt));
      } else {
        setResult(decryptType7(value));
      }
    } catch (err) {
      notice.error(transErr((err as Error).message));
      setResult('');
    }
  };

  const clearAll = () => {
    setValue('');
    setResult('');
  };

  const isEncrypt = direction === 'encrypt';

  return (
    <div style={ { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } }>
      {contextHolder}
      <Alert
        type="warning"
        showIcon
        message={t('Cisco Type 7 使用固定公开密钥表做 XOR 弱加密, 可被任何工具还原, 不具备安全性; 仅用于与旧版 Cisco IOS 配置 (show running-config) 中的口令互通或查看')}
      />
      <Divider dashed />
      <Space wrap style={ { marginBottom: 8 } }>
        <Radio.Group
          value={ direction }
          onChange={ (e) => { setDirection(e.target.value); setResult(''); } }
          options={ [
            { label: t('明文 → Type 7 (加密)'), value: 'encrypt' },
            { label: t('Type 7 → 明文 (解密)'), value: 'decrypt' },
          ] }
          optionType="button"
        />
        { isEncrypt && (
          <Space>
            <span>{t('盐偏移 (首 2 位, 0~15)')}</span>
            <Select
              style={ { width: 160 } }
              value={ salt }
              onChange={ setSalt }
              options={ [
                { label: t('随机 (推荐)'), value: 'random' },
                ...Array.from({ length: TYPE7_SALT_MAX - TYPE7_SALT_MIN + 1 }, (_, i) => ({
                  label: `${i} (${i.toString(16).padStart(2, '0').toUpperCase()})`,
                  value: i,
                })),
              ] }
            />
          </Space>
        ) }
      </Space>
      <TextArea
        style={ { margin: '5px 0 5px 0' } }
        value={ value }
        autoSize={ { minRows: 4, maxRows: 8 } }
        placeholder={ isEncrypt
          ? t('输入需要加密为 Type 7 的明文 (UTF-8, 支持中文与多行)')
          : t('输入 Type 7 串 (例如 01050D480809, 支持大写/小写/空白分隔)') }
        onChange={ (e) => setValue(e.target.value) }
      />
      <Space style={ { marginBottom: 8 } }>
        <Button type="primary" disabled={ value === '' } onClick={ run }>
          { isEncrypt ? t('加密为 Type 7') : t('解密为明文') }
        </Button>
        <Button onClick={ clearAll } style={ { backgroundColor: '#dc3545', color: '#fff' } }>{t('清除')}</Button>
      </Space>
      <Divider dashed />
      <span style={ { color: '#999', fontSize: 12, marginBottom: 4 } }>
        { isEncrypt ? t('Type 7 结果 (点击可复制)') : t('解密明文 (点击可复制)') }
      </span>
      <TextArea
        readOnly
        value={ result }
        autoSize={ { minRows: 2, maxRows: 6 } }
        placeholder={ isEncrypt ? t('加密结果: 2 位盐偏移 + 大写 hex') : t('解密结果') }
        onClick={ inputClick }
      />
    </div>
  );
};

export default CiscoType7;
