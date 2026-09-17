import { Alert, Button, Divider, Input, Select, Space, Spin, message } from 'antd';
import { useState } from 'react';
import { CopyOutlined, KeyOutlined, SaveOutlined } from '@ant-design/icons';
import { useLocale } from '../../hook/locale-context';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import { cs, csT } from './lang';
import {
  CSR_FILE_NAME,
  DEFAULT_SUBJECT,
  KEY_BITS_OPTIONS,
  KEY_FILE_NAME,
  KEY_FORMAT_OPTIONS,
  SAN_PLACEHOLDER,
  SUBJECT_FIELDS,
} from './data';
import {
  csrAvailable,
  generateCsr,
  validateCsrInput,
  type CsrKeyBits,
  type CsrResult,
  type CsrSubjectInput,
  type PrivateKeyFormat,
} from './lib';
import CSRIntro from './intro';

const { TextArea } = Input;

// 表单左侧字段名样式 (与 htpasswd 生成等页面保持一致)
const labelStyle :React.CSSProperties = { width: 104, textAlign: 'right', color: '#888', whiteSpace: 'nowrap', flexShrink: 0 };
const monoStyle :React.CSSProperties = { fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' };

const tipStyle :React.CSSProperties = { color: '#999', fontSize: 12, lineHeight: '18px' };

/** 结果块 (私钥 / CSR 各一块): 只读文本域 + 复制 / 保存 */
interface ResultBlockProps {
  title :string;
  value :string;
  saveLabel :string;
  copyLabel :string;
  hint :string;
  onCopy :() => void;
  onSave :() => void;
}

const ResultBlock :React.FC<ResultBlockProps> = ({ title, value, saveLabel, copyLabel, hint, onCopy, onSave }) => (
  <div style={ { marginBottom: 16 } }>
    <div style={ { fontWeight: 600, margin: '8px 0 4px' } }>{title}</div>
    <TextArea
      readOnly
      value={ value }
      spellCheck={ false }
      title={ hint }
      onDoubleClick={ (e) => {
        if ((e.target as HTMLTextAreaElement).value.trim() !== '') onCopy();
      } }
      style={ { ...monoStyle, maxWidth: 860 } }
      autoSize={ { minRows: 5, maxRows: 12 } }
    />
    <Space style={ { marginTop: 8 } }>
      <Button icon={ <CopyOutlined /> } onClick={ onCopy }>{copyLabel}</Button>
      <Button icon={ <SaveOutlined /> } style={ { backgroundColor: '#28a745', color: '#fff' } } onClick={ onSave }>{saveLabel}</Button>
    </Space>
  </div>
);

const CSRGenerator = () => {
  const { locale } = useLocale();
  const t = (zh :string) => cs(locale, zh);
  const tt = (zh :string, v? :Record<string, string | number>) => csT(locale, zh, v);

  const [ subject, setSubject ] = useState<CsrSubjectInput>({ ...DEFAULT_SUBJECT });
  const [ san, setSan ] = useState('');
  const [ keyBits, setKeyBits ] = useState<CsrKeyBits>(2048);
  const [ keyFormat, setKeyFormat ] = useState<PrivateKeyFormat>('pkcs8');
  const [ result, setResult ] = useState<CsrResult | null>(null);
  const [ loading, setLoading ] = useState(false);
  const [ notice, contextHolder ] = message.useMessage();

  const supported = csrAvailable();
  const formatTip = KEY_FORMAT_OPTIONS.find((o) => o.value === keyFormat)?.tip ?? '';

  // 生成 RSA 私钥 + CSR
  const generate = async () => {
    if (!supported) { notice.error(t('当前环境不支持 WebCrypto (crypto.subtle), 无法生成密钥')); return; }
    const issues = validateCsrInput({ subject, san, keyBits, keyFormat });
    if (issues.length > 0) { notice.warning(tt(issues[0].key, issues[0].vars)); return; }
    setLoading(true);
    try {
      const r = await generateCsr({ subject, san, keyBits, keyFormat });
      setResult(r);
      notice.success(tt('已生成 {bits} 位 RSA 私钥与 CSR', { bits: r.keyBits }));
    } catch (err) {
      notice.error(tt('生成失败: {m}', { m: (err as Error).message }));
    } finally {
      setLoading(false);
    }
  };

  const copy = (text :string, label :string) => {
    if (text.trim() === '') return;
    copyTextToClipboard(text);
    notice.success(tt('{tip} 已复制到粘贴板', { tip: t(label) }));
  };

  // 保存私钥 / CSR 到文件 (桌面端弹系统保存框, Web 端回退浏览器下载)
  const save = async (which :'key' | 'csr') => {
    if (!result) return;
    const name = which === 'key' ? KEY_FILE_NAME : CSR_FILE_NAME;
    const content = which === 'key' ? result.privateKeyPem : result.csrPem;
    try {
      const ok = await saveTextFile(name, content, t('保存文件'), which === 'key'
        ? { filterName: t('私钥文件'), extensions: [ 'key', 'pem' ] }
        : { filterName: t('证书签名请求'), extensions: [ 'csr', 'pem' ] });
      if (ok) notice.success(tt('已保存 {f}', { f: name }));
    } catch (err) {
      notice.error(tt('保存失败: {m}', { m: (err as Error).message }));
    }
  };

  const reset = () => {
    setSubject({ ...DEFAULT_SUBJECT });
    setSan('');
    setKeyBits(2048);
    setKeyFormat('pkcs8');
    setResult(null);
  };

  return (
    <div>
      {contextHolder}

      {!supported && (
        <Alert
          type="warning"
          showIcon
          style={ { marginBottom: 12, maxWidth: 860 } }
          message={t('当前环境不支持 WebCrypto (crypto.subtle), 无法生成密钥')}
        />
      )}

      <div style={ { fontWeight: 600, marginBottom: 8 } }>{t('主体信息 (Subject)')}</div>

      <Space direction="vertical" size={ 10 } style={ { width: '100%', maxWidth: 860 } }>
        {SUBJECT_FIELDS.map((f) => (
          <div key={ f.key } style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
            <span style={ labelStyle }>
              {f.required && <span style={ { color: '#dc3545' } }>*</span>}{t(f.label)}
            </span>
            <Input
              allowClear
              value={ subject[f.key] ?? '' }
              placeholder={ t(f.placeholder) }
              maxLength={ f.maxLength }
              onPressEnter={ generate }
              onChange={ (e) => setSubject({ ...subject, [f.key]: f.upper ? e.target.value.toUpperCase() : e.target.value }) }
            />
          </div>
        ))}

        <div style={ { display: 'flex', alignItems: 'flex-start', gap: 12 } }>
          <span style={ { ...labelStyle, paddingTop: 6 } }>{t('SAN (备用名称)')}</span>
          <div style={ { flex: 1 } }>
            <TextArea
              value={ san }
              placeholder={ t(SAN_PLACEHOLDER) }
              onChange={ (e) => setSan(e.target.value) }
              autoSize={ { minRows: 3, maxRows: 6 } }
            />
            <div style={ { ...tipStyle, marginTop: 4 } }>
              {t('每行一个域名或 IP, 也可用逗号分隔; 留空时自动使用 CN (现代浏览器已忽略 CN, SAN 必须有值)')}
            </div>
          </div>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <span style={ labelStyle }>{t('密钥算法')}</span>
          <Select
            value={ keyBits }
            style={ { width: 160 } }
            onChange={ (v :CsrKeyBits) => setKeyBits(v) }
            options={ KEY_BITS_OPTIONS.map((n) => ({ value: n, label: `RSA-${n}` })) }
          />
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <span style={ labelStyle }>{t('私钥格式')}</span>
          <Select
            value={ keyFormat }
            style={ { width: 260 } }
            onChange={ (v :PrivateKeyFormat) => setKeyFormat(v) }
            options={ KEY_FORMAT_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) })) }
          />
        </div>
        <div style={ { ...tipStyle, marginLeft: 116 } }>{t(formatTip)}</div>

        <Space style={ { marginLeft: 116 } }>
          <Button type="primary" icon={ <KeyOutlined /> } loading={ loading } disabled={ !supported } onClick={ generate }>
            {t('生成密钥与 CSR')}
          </Button>
          <Button onClick={ reset }>{t('重置')}</Button>
          <Button disabled={ !result } style={ { backgroundColor: result ? '#dc3545' : undefined, color: result ? '#fff' : undefined } } onClick={ () => setResult(null) }>
            {t('清除结果')}
          </Button>
        </Space>

        <div style={ { ...tipStyle, marginLeft: 116 } }>
          {t('私钥与 CSR 全部在本机生成, 不会上传任何服务器; 生成后请立即保存, 拿到证书前请勿丢失私钥。')}
        </div>
      </Space>

      <Divider />

      <div style={ { fontWeight: 600, marginBottom: 8 } }>{t('生成结果')}</div>

      {loading && (
        <div style={ { marginBottom: 12 } }>
          <Spin size="small" /> <span style={ { ...tipStyle, marginLeft: 8 } }>{t('生成中, 大位长密钥可能需要几秒...')}</span>
        </div>
      )}

      {!result && !loading && (
        <div style={ tipStyle }>{t('还没生成, 填写上方信息后点「生成密钥与 CSR」')}</div>
      )}

      {result && (
        <div>
          {/* 摘要 */}
          <div style={ { maxWidth: 860, border: '1px solid rgba(128,128,128,0.25)', borderRadius: 6, marginBottom: 12 } }>
            <div style={ { padding: '6px 10px', background: 'rgba(128,128,128,0.08)', fontWeight: 600 } }>{t('生成结果摘要')}</div>
            {([
              [ t('密钥算法 (RSA)'), `RSA-${result.keyBits}` ],
              [ t('签名算法'), result.signatureAlgorithm ],
              [ t('主体 (Subject)'), result.subjectLine ],
              [ t('备用名称 (SAN)'), result.san.length > 0 ? result.san.join(', ') : t('无') ],
              [ t('CSR 指纹 (SHA-256)'), result.fingerprint ],
            ] as [ string, string ][]).map(([ label, value ]) => (
              <div key={ label } style={ { display: 'flex', borderTop: '1px solid rgba(128,128,128,0.15)' } }>
                <div style={ { width: 190, flexShrink: 0, padding: '6px 10px', background: 'rgba(128,128,128,0.06)', color: '#888' } }>{label}</div>
                <div style={ { flex: 1, padding: '6px 10px', ...monoStyle } }>{value}</div>
              </div>
            ))}
          </div>

          <ResultBlock
            title={ t('server.key (私钥, 请务必保密)') }
            value={ result.privateKeyPem }
            hint={ t('双击复制内容到粘贴板') }
            copyLabel={ t('复制') }
            saveLabel={ t('保存为 server.key') }
            onCopy={ () => copy(result.privateKeyPem, '私钥') }
            onSave={ () => { void save('key'); } }
          />

          <ResultBlock
            title={ t('server.csr (提交给 CA 的证书签名请求)') }
            value={ result.csrPem }
            hint={ t('双击复制内容到粘贴板') }
            copyLabel={ t('复制') }
            saveLabel={ t('保存为 server.csr') }
            onCopy={ () => copy(result.csrPem, '证书签名请求') }
            onSave={ () => { void save('csr'); } }
          />
        </div>
      )}

      <Divider>{t(' CSR 申请文件说明 ')}</Divider>
      <CSRIntro />
    </div>
  );
};

export default CSRGenerator;
