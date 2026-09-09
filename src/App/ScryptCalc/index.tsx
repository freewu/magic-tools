import { Button, Checkbox, Divider, Input, InputNumber, Select, Space, Tag, message } from 'antd';
import { useState } from 'react';
import { copyTextToClipboard } from '../../lib';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from './lang';
import { scrypt, toHex } from './lib';

// 默认参数参考 RFC 7914 交互式登录建议 (N=16384, r=8, p=1)
const N_OPTIONS = [ 1024, 2048, 4096, 8192, 16384, 32768, 65536 ].map((n) => ({
  value: n,
  label: `${n} (2^${Math.log2(n)})`,
}));

const randomSaltHex = (bytes = 16): string => {
  const buf = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < bytes; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  return toHex(buf);
};

const ScryptCalc = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const [ password, setPassword ] = useState(''); // 口令
  const [ salt, setSalt ] = useState(randomSaltHex()); // 盐(hex, 可随机)
  const [ n, setN ] = useState(16384); // CPU/内存成本
  const [ r, setR ] = useState(8); // 块大小
  const [ p, setP ] = useState(1); // 并行度
  const [ dkLen, setDkLen ] = useState(32); // 派生密钥长度(字节)
  const [ upper, setUpper ] = useState(false);
  const [ result, setResult ] = useState('');
  const [ costMs, setCostMs ] = useState(0);
  const [ busy, setBusy ] = useState(false);
  const [ notice, contextHolder ] = message.useMessage();

  const inputClick = (e: React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if (txt !== '') {
      copyTextToClipboard(txt);
      notice.success(t('复制到粘贴板成功！！！'));
    }
  };

  const format = (hex: string) => (upper ? hex.toUpperCase() : hex);

  const calc = async () => {
    if (password.trim() === '') {
      notice.warning(t('请输入口令'));
      return;
    }
    if (salt.trim() === '') {
      notice.warning(t('请输入盐值'));
      return;
    }
    setBusy(true);
    // 先让 busy/loading 渲染一帧再执行同步计算
    await new Promise((resolve) => setTimeout(resolve, 30));
    const t0 = performance.now();
    try {
      const dk = scrypt(password, salt.trim(), { n, r, p }, dkLen);
      setResult(format(toHex(dk)));
      setCostMs(Math.round(performance.now() - t0));
    } catch (err) {
      notice.error(tt('计算失败: {m}', { m: (err as Error).message }));
      setResult('');
      setCostMs(0);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {contextHolder}

      <Space wrap style={{ marginBottom: 4 }}>
        <Tag color="#2db7f5">{t('口令')}</Tag>
        <Tag color="#87d068">{t('盐')}</Tag>
        <Tag color="#108ee9">N / r / p</Tag>
        <Tag color="#ff5500">{t('内存开销 = 128 · N · r 字节')}</Tag>
      </Space>

      <div style={{ margin: '6px 0' }}>
        <span style={{ marginRight: 8 }}>{t('口令:')}</span>
        <Input
          allowClear
          placeholder={t('口令 (Password)')}
          style={{ width: 320 }}
          value={ password }
          onChange={ (e) => setPassword(e.target.value) }
          onPressEnter={ calc }
        />
      </div>

      <div style={{ margin: '6px 0' }}>
        <span style={{ marginRight: 8 }}>{t('盐值:')}</span>
        <Input
          allowClear
          placeholder={t('盐 (Salt, 十六进制字符串或任意文本)')}
          style={{ width: 480 }}
          value={ salt }
          onChange={ (e) => setSalt(e.target.value) }
          onPressEnter={ calc }
        />
        <Button style={{ marginLeft: 8 }} onClick={ () => setSalt(randomSaltHex()) }>{t('随机盐')}</Button>
      </div>

      <div style={{ margin: '6px 0' }}>
        <Space wrap>
          <span>{t('N:')}</span>
          <Select
            style={{ width: 140 }}
            value={ n }
            onChange={ (v: number) => setN(v) }
            options={ N_OPTIONS }
          />
          <span>{t('r:')}</span>
          <InputNumber
            addonAfter=""
            min={ 1 }
            max={ 32 }
            value={ r }
            onChange={ (v: number | null) => { if (v != null) setR(v); } }
          />
          <span>{t('p:')}</span>
          <InputNumber
            min={ 1 }
            max={ 16 }
            value={ p }
            onChange={ (v: number | null) => { if (v != null) setP(v); } }
          />
          <span>{t('派生长度:')}</span>
          <InputNumber
            addonAfter={t('字节')}
            min={ 16 }
            max={ 256 }
            value={ dkLen }
            onChange={ (v: number | null) => { if (v != null) setDkLen(v); } }
          />
          <Checkbox checked={ upper } onChange={ (e) => { setUpper(e.target.checked); if (result !== '') setResult(e.target.checked ? result.toUpperCase() : result.toLowerCase()); } }>
            {t('大写显示')}
          </Checkbox>
          <Button type="primary" loading={ busy } onClick={ calc }>{t('计算')}</Button>
          <Button onClick={ () => { setPassword(''); setResult(''); setCostMs(0); } } style={ { backgroundColor: '#dc3545', color: '#fff' } }>{t('清除')}</Button>
        </Space>
      </div>

      <Divider dashed />

      {costMs > 0 && (
        <div style={ { marginBottom: 4 } }>
          <Tag color="geekblue">{tt('计算耗时: {ms} ms', { ms: costMs })}</Tag>
        </div>
      )}

      <Input.TextArea
        showCount
        readOnly
        onDoubleClick={ inputClick }
        title={t('双击复制结果到粘贴板')}
        style={ { margin: '5px 0' } }
        value={ result }
        placeholder={t('派生密钥 (十六进制)')}
        autoSize={ { minRows: 6, maxRows: 12 } }
      />
    </div>
  );
};

export default ScryptCalc;
