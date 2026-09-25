// SM9 加解密 (GM/T 0044-2016) — 基于 GmSSL 编译的 WebAssembly
//
// 四个标签页共享同一组密钥 (密钥在各页之间互通):
//   密钥生成: 分别生成/导出 加密 (SM9-Enc) 与 签名 (SM9-Sign) 两套主密钥 & 用户私钥
//   加密 / 解密: 主公钥 (或主私钥) + ID 加密, 用户私钥 + ID 解密
//   签名验签: 用户私钥签名, 主公钥 (或主私钥) + ID 验签
import { Alert, Button, Divider, Input, Space, Tabs, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { ArrowDownOutlined, ArrowUpOutlined, CopyOutlined, DownloadOutlined, KeyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
const { TextArea } = Input;
import { useLocale } from "../../hook/locale-context";
import { copyTextToClipboard } from "../../lib";
import { saveTextFile } from "../../lib/tauri";
import { openFile } from "../../lib/file";
import {
  initSm9, resetSm9,
  encGenerateMasterKey, encMasterPublicKey, encExtractUserKey,
  encryptWithMasterKey, encryptWithPublicKey, decrypt,
  signGenerateMasterKey, signMasterPublicKey, signExtractUserKey,
  sign, verifyWithMasterKey, verifyWithPublicKey,
} from "./gmssl";
import {
  bytesToHex, bytesToText, textToBytes, utf8Length, parseHexField, identifySm9Data,
  KIND_LABELS, getSm9Defaults, setSm9Default, clearSm9Defaults,
} from "./lib";
import SM9Intro from "./intro";
import { tabList, DEFAULT_ID, SAMPLE_PLAIN, SAMPLE_DATA } from "./data";
import { sr, srT, srErr } from './lang';

/** 各页共享的密钥集合 (均为界面上的 HEX 文本) */
type KeySet = {
  encMaster :string;  // 加密主私钥 DER
  encPublic :string;  // 加密主公钥 (65 B) — 加密只需它, 可公开
  encUser :string;    // 加密用户私钥 DER (按 ID 提取)
  signMaster :string; // 签名主私钥 DER
  signPublic :string; // 签名主公钥 (129 B) — 验签只需它, 可公开
  signUser :string;   // 签名用户私钥 DER (按 ID 提取)
};

const KEY_NAME :Record<keyof KeySet, string> = {
  encMaster: 'enc-master-key',
  encPublic: 'enc-public-key',
  encUser: 'enc-user-key',
  signMaster: 'sign-master-key',
  signPublic: 'sign-public-key',
  signUser: 'sign-user-key',
};

type HexAreaProps = {
  value :string;
  onChange? :(v :string) => void;
  placeholder? :string;
  rows? :number;
  onDoubleClick? :() => void;
  onDropFile? :(files :FileList) => void;
};

// 模块级组件 (身份稳定, 不会因父组件重渲染而丢焦点)
const HexArea = ({ value, onChange, placeholder, rows = 2, onDoubleClick, onDropFile } :HexAreaProps) => {
  const { locale } = useLocale();
  return (
  <TextArea
    style={ { margin: "4px 0", fontFamily: "monospace", fontSize: 12 } }
    value={ value }
    onChange={ (e) => onChange?.(e.target.value) }
    onDoubleClick={ onDoubleClick }
    title={ sr(locale, '双击复制内容到粘贴板') }
    placeholder={ placeholder }
    autoSize={ { minRows: rows, maxRows: rows + 3 } }
    onDragOver={ (e) => { e.preventDefault(); } }
    onDrop={ (e) => { e.preventDefault(); if (onDropFile && e.dataTransfer.files.length) onDropFile(e.dataTransfer.files); } }
  />
  );
};

const SM9Crypto = () => {
  const { locale } = useLocale();
  const t = (zh :string) => sr(locale, zh);
  const tt = (zh :string, v? :Record<string, string | number>) => srT(locale, zh, v);

  const [ activeTab, setActiveTab ] = useState<string>('keygen');
  const [ keys, setKeys ] = useState<KeySet>(() => {
    const d = getSm9Defaults();
    return {
      encMaster: d.encMaster, encPublic: '', encUser: d.encUser,
      signMaster: d.signMaster, signPublic: '', signUser: d.signUser,
    };
  });
  const [ id, setId ] = useState<string>(() => getSm9Defaults().id || DEFAULT_ID);
  const [ busy, setBusy ] = useState(false);
  const [ engineError, setEngineError ] = useState('');
  const [ notice, contextHolder ] = message.useMessage();

  // 加密页
  const [ plain, setPlain ] = useState('');
  const [ cipher, setCipher ] = useState('');
  // 解密页
  const [ decCipher, setDecCipher ] = useState('');
  const [ decPlain, setDecPlain ] = useState('');
  // 签名验签页
  const [ signData, setSignData ] = useState('');
  const [ signValue, setSignValue ] = useState('');
  const [ verifyResult, setVerifyResult ] = useState<'' | 'ok' | 'fail'>('');

  // 首次进入时加载 wasm 引擎 (失败多为非安全上下文: crypto.getRandomValues 不可用)
  useEffect(() => {
    initSm9().catch((e) => setEngineError(srErr(locale, String((e as Error)?.message ?? e))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setKey = (k :keyof KeySet, v :string) => setKeys((prev) => ({ ...prev, [k]: v }));

  const copy = (txt :string, tip :string) => {
    if (txt.trim() === '') return;
    copyTextToClipboard(txt.trim());
    notice.success(tt('{tip} 已复制到粘贴板', { tip: t(tip) }));
  };

  const exportKey = async (k :keyof KeySet) => {
    const content = keys[k].trim();
    if (content === '') { notice.warning(t('没有可导出的内容, 请先生成')); return; }
    const ok = await saveTextFile(`sm9-${KEY_NAME[k]}.txt`, content, t('保存密钥文件'));
    if (ok) notice.success(t('已保存到文件'));
  };

  // wasm 运算统一包装: loading + 错误提示
  const run = async (fn :() => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      notice.error(tt('操作失败: {m}', { m: srErr(locale, String((e as Error)?.message ?? e)) }));
    } finally {
      setBusy(false);
    }
  };

  /** 解析 HEX 输入框, 返回字节与识别到的类型; 非法时提示并返回 null */
  const readHex = (text :string, name :string) :Uint8Array | null => {
    const parsed = parseHexField(text);
    if (parsed === null) {
      notice.warning(tt('请先填写{name}', { name: t(name) }));
      return null;
    }
    if ('error' in parsed) {
      notice.warning(tt('{name}: {m}', { name: t(name), m: t(parsed.error) }));
      return null;
    }
    return parsed.bytes;
  };

  /** 识别提示: '识别为: SM9-Enc 主公钥 (65 字节)' */
  const kindHint = (hex :string) :string => {
    const parsed = parseHexField(hex);
    if (parsed === null || 'error' in parsed) return '';
    const kind = identifySm9Data(parsed.bytes);
    if (kind === 'unknown') return tt('无法识别为 SM9 数据 ({n} 字节)', { n: parsed.bytes.length });
    return tt('识别为: {label} ({n} 字节)', { label: t(KIND_LABELS[kind]), n: parsed.bytes.length });
  };

  const saveDefaults = () => {
    setSm9Default('encMaster', keys.encMaster);
    setSm9Default('encUser', keys.encUser);
    setSm9Default('signMaster', keys.signMaster);
    setSm9Default('signUser', keys.signUser);
    setSm9Default('id', id);
    notice.success(t('已保存为默认密钥与 ID (下次打开自动填充)'));
  };

  const clearDefaults = () => {
    clearSm9Defaults();
    setKeys({ encMaster: '', encPublic: '', encUser: '', signMaster: '', signPublic: '', signUser: '' });
    notice.success(t('已清空默认密钥'));
  };

  // ---------------- 密钥生成 ----------------
  const generateMaster = (use :'enc' | 'sign') => run(async () => {
    if (use === 'enc') {
      const der = await encGenerateMasterKey();
      setKeys((p) => ({ ...p, encMaster: bytesToHex(der), encPublic: '', encUser: '' }));
      notice.success(t('SM9 加密主密钥生成成功, 请再导出主公钥 / 提取用户私钥'));
    } else {
      const der = await signGenerateMasterKey();
      setKeys((p) => ({ ...p, signMaster: bytesToHex(der), signPublic: '', signUser: '' }));
      notice.success(t('SM9 签名主密钥生成成功, 请再导出主公钥 / 提取用户私钥'));
    }
  });

  const derivePublic = (use :'enc' | 'sign') => run(async () => {
    const master = readHex(use === 'enc' ? keys.encMaster : keys.signMaster, use === 'enc' ? '加密主私钥' : '签名主私钥');
    if (!master) return;
    const pub = use === 'enc' ? await encMasterPublicKey(master) : await signMasterPublicKey(master);
    setKey(use === 'enc' ? 'encPublic' : 'signPublic', bytesToHex(pub));
    notice.success(t('主公钥导出成功 (可公开分发, 加密/验签只需主公钥)'));
  });

  const extractUser = (use :'enc' | 'sign') => run(async () => {
    const master = readHex(use === 'enc' ? keys.encMaster : keys.signMaster, use === 'enc' ? '加密主私钥' : '签名主私钥');
    if (!master) return;
    if (id.trim() === '') { notice.warning(t('请先填写用户 ID')); return; }
    const usk = use === 'enc' ? await encExtractUserKey(master, id.trim()) : await signExtractUserKey(master, id.trim());
    setKey(use === 'enc' ? 'encUser' : 'signUser', bytesToHex(usk));
    notice.success(tt('用户私钥提取成功 (ID: {id})', { id: id.trim() }));
  });

  const keyBlock = (use :'enc' | 'sign') => {
    const isEnc = use === 'enc';
    const master = isEnc ? 'encMaster' : 'signMaster';
    const pub = isEnc ? 'encPublic' : 'signPublic';
    const user = isEnc ? 'encUser' : 'signUser';
    const label = isEnc ? '加密' : '签名';
    return (
      <div style={ { marginBottom: 16 } }>
        <div style={ { fontWeight: 600, marginBottom: 4 } }>
          {tt('{label}主密钥 (SM9-{alg})', { label: t(label), alg: isEnc ? 'Enc' : 'Sign' })}
          <span style={ { color: "#999", fontWeight: 400 } }>
            {isEnc ? t(' 用于加密 / 解密') : t(' 用于签名 / 验签')}
          </span>
        </div>
        <Space wrap style={ { marginBottom: 4 } }>
          <Button type="primary" size="small" icon={ <KeyOutlined /> } loading={ busy } onClick={ () => generateMaster(use) }>{t('生成主密钥对')}</Button>
          <Button size="small" disabled={ busy } onClick={ () => derivePublic(use) }>{t('导出主公钥')}</Button>
          <Button size="small" disabled={ busy } onClick={ () => extractUser(use) }>{t('提取用户私钥 (按上方 ID)')}</Button>
        </Space>
        <div style={ { color: "#999", fontSize: 12 } }>{t('主私钥 (DER HEX, 请保密)')}</div>
        <HexArea
          value={ keys[master] }
          onChange={ (v) => setKey(master, v) }
          onDoubleClick={ () => copy(keys[master], '主私钥') }
          rows={ 2 }
          placeholder={t('生成后自动填充; 也可粘贴其他工具导出的主私钥 (DER HEX)')}
        />
        <div style={ { color: "#999", fontSize: 12 } }>{kindHint(keys[master])}</div>
        <div style={ { color: "#999", fontSize: 12 } }>{t('主公钥 (未压缩点 HEX, 可公开)')}</div>
        <HexArea
          value={ keys[pub] }
          onChange={ (v) => setKey(pub, v) }
          onDoubleClick={ () => copy(keys[pub], '主公钥') }
          rows={ 2 }
          placeholder={isEnc ? t('点「导出主公钥」得到 (04 开头 65 字节); 可粘贴他人的主公钥用于加密') : t('点「导出主公钥」得到 (04 开头 129 字节); 可粘贴他人的主公钥用于验签')}
        />
        <div style={ { color: "#999", fontSize: 12 } }>{kindHint(keys[pub])}</div>
        <div style={ { color: "#999", fontSize: 12 } }>{t('用户私钥 (DER HEX, 按 ID 提取, 请保密)')}</div>
        <HexArea
          value={ keys[user] }
          onChange={ (v) => setKey(user, v) }
          onDoubleClick={ () => copy(keys[user], '用户私钥') }
          rows={ 3 }
          placeholder={t('输入 ID 后点「提取用户私钥」得到; 解密 / 签名时需要它')}
        />
        <div style={ { color: "#999", fontSize: 12 } }>{kindHint(keys[user])}</div>
        <Space wrap>
          <Button size="small" onClick={ () => copy(keys[master], '主私钥') }>{t('复制主私钥')}</Button>
          <Button size="small" onClick={ () => copy(keys[pub], '主公钥') }>{t('复制主公钥')}</Button>
          <Button size="small" onClick={ () => copy(keys[user], '用户私钥') }>{t('复制用户私钥')}</Button>
          <Button size="small" icon={ <DownloadOutlined /> } onClick={ () => exportKey(master) }>{t('导出主私钥')}</Button>
          <Button size="small" icon={ <DownloadOutlined /> } onClick={ () => exportKey(user) }>{t('导出用户私钥')}</Button>
        </Space>
      </div>
    );
  };

  const keygenTab = (
    <div>
      <Alert
        type="info"
        showIcon
        style={ { margin: "8px 0" } }
        message={t('SM9 是标识密码 (IBC): 主公钥/主私钥由密钥中心生成, 用户私钥由「主私钥 + ID」提取。')}
        description={t('加密与签名是两套独立的主密钥 (SM9-Enc / SM9-Sign), 不能混用; 发送方只需主公钥与接收方 ID, 接收方用自己的用户私钥解密。')}
      />
      <Space wrap style={ { marginBottom: 4 } }>
        <span style={ { fontWeight: 600 } }>{t('用户 ID')}</span>
        <Input
          style={ { width: 320 } }
          value={ id }
          onChange={ (e) => setId(e.target.value) }
          placeholder={t('例如 alice@example.com (UTF-8, 建议不超过 64 字节)') }
        />
        <span style={ { color: "#999" } }>{tt('当前 ID 长度: {n} 字节', { n: utf8Length(id) })}</span>
        <Button size="small" icon={ <SafetyCertificateOutlined /> } onClick={ saveDefaults }>{t('保存为默认密钥')}</Button>
        <Button size="small" danger onClick={ clearDefaults }>{t('清空默认密钥')}</Button>
      </Space>
      <div style={ { color: "#999", fontSize: 12, marginBottom: 8 } }>
        {t('默认密钥只保存在浏览器本地 (localStorage), 不会上传; 四个标签页共享同一组密钥, 解密/签名用的用户私钥必须是同一 ID 提取的。')}
      </div>
      <Divider style={ { margin: "8px 0" } } />
      {keyBlock('enc')}
      <Divider style={ { margin: "8px 0" } } />
      {keyBlock('sign')}
    </div>
  );

  // ---------------- 加密 ----------------
  const doEncrypt = () => run(async () => {
    const plainBytes = textToBytes(plain);
    if (plainBytes.length === 0) { notice.warning(t('请输入需要加密的明文')); return; }
    if (plainBytes.length > 255) {
      notice.warning(tt('SM9 单组明文上限为 255 字节, 当前 {n} 字节, 请分段加密', { n: plainBytes.length }));
      return;
    }
    if (id.trim() === '') { notice.warning(t('请先填写用户 ID (需与接收方解密时一致)')); return; }
    let out :Uint8Array;
    const pubText = keys.encPublic.trim();
    if (pubText !== '') {
      const pub = readHex(pubText, '加密主公钥');
      if (!pub) return;
      out = await encryptWithPublicKey(pub, id.trim(), plainBytes);
    } else if (keys.encMaster.trim() !== '') {
      const master = readHex(keys.encMaster, '加密主私钥');
      if (!master) return;
      out = await encryptWithMasterKey(master, id.trim(), plainBytes);
    } else {
      notice.warning(t('未配置加密主公钥/主私钥, 请先在「密钥生成」页生成或粘贴'));
      return;
    }
    setCipher(bytesToHex(out));
    notice.success(t('加密成功 (密文为 DER HEX, 可发给接收方)'));
  });

  const encryptTab = (
    <div>
      <div style={ { color: "#999", fontSize: 12, margin: "8px 0" } }>
        {t('加密只需接收方的主公钥与 ID; 主公钥留空时使用上方「加密主私钥」加密 (效果相同)。')}
      </div>
      <div style={ { fontWeight: 600 } }>{t('加密主公钥 (65 字节 HEX)')}</div>
      <HexArea
        value={ keys.encPublic }
        onChange={ (v) => setKey('encPublic', v) }
        onDoubleClick={ () => copy(keys.encPublic, '主公钥') }
        rows={ 2 }
        placeholder={t('04 开头 130 位 HEX; 留空则用「加密主私钥」加密')}
      />
      <div style={ { color: "#999", fontSize: 12 } }>{kindHint(keys.encPublic)}</div>
      <Space wrap style={ { margin: "4px 0" } }>
        <span style={ { fontWeight: 600 } }>{t('用户 ID')}</span>
        <Input style={ { width: 320 } } value={ id } onChange={ (e) => setId(e.target.value) } />
      </Space>
      <div style={ { fontWeight: 600 } }>{t('明文 (UTF-8, 单组上限 255 字节)')}</div>
      <HexArea
        value={ plain }
        onChange={ setPlain }
        onDoubleClick={ () => copy(plain, '明文') }
        onDropFile={ (files) => openFile(files, setPlain) }
        rows={ 6 }
        placeholder={t('输入需要加密的明文  或 拖拽文件到框内打开')}
      />
      <div style={ { color: "#999", fontSize: 12 } }>{tt('当前 {n} / 255 字节', { n: utf8Length(plain) })}</div>
      <div style={ { margin: '0 0 4px 0', color: '#888' } }>
        { t('示例') }
        <Space wrap size={ [ 12, 0 ] } style={ { marginLeft: 10 } }>
          <Button type="link" size="small" style={ { padding: 0, height: 'auto' } } onClick={ () => setPlain(SAMPLE_PLAIN) }>
            { t('SM9 示例明文') }
          </Button>
        </Space>
      </div>
      <Space style={ { margin: "4px 0" } }>
        <Button onClick={ doEncrypt } loading={ busy } style={ { backgroundColor: "#007bff", color: "#fff" } } icon={ <ArrowDownOutlined /> }>{t('加密')}</Button>
        <Button onClick={ () => setPlain('') }>{t('清空明文')}</Button>
      </Space>
      <div style={ { fontWeight: 600 } }>{t('密文 (DER HEX)')}</div>
      <HexArea value={ cipher } rows={ 4 } placeholder={t('加密后自动显示在此; 可粘贴密文用于「解密」页')} />
      <Space>
        <Button size="small" icon={ <CopyOutlined /> } onClick={ () => copy(cipher, '密文') }>{t('复制密文')}</Button>
        <Button size="small" icon={ <DownloadOutlined /> } onClick={ async () => {
          if (cipher.trim() === '') { notice.warning(t('没有可导出的内容, 请先生成')); return; }
          if (await saveTextFile('sm9-ciphertext.txt', cipher.trim(), t('保存文件'))) notice.success(t('已保存到文件'));
        } }>{t('导出密文')}</Button>
      </Space>
    </div>
  );

  // ---------------- 解密 ----------------
  const doDecrypt = () => run(async () => {
    const usk = readHex(keys.encUser, '加密用户私钥');
    if (!usk) return;
    if (id.trim() === '') { notice.warning(t('请先填写用户 ID (需与加密时一致)')); return; }
    const ct = readHex(decCipher, '密文');
    if (!ct) return;
    const out = await decrypt(usk, id.trim(), ct);
    setDecPlain(bytesToText(out));
    notice.success(t('解密成功'));
  });

  const decryptTab = (
    <div>
      <div style={ { color: "#999", fontSize: 12, margin: "8px 0" } }>
        {t('解密需要「用户私钥」与加密时相同的 ID; 用户私钥由接收方从主私钥提取 (见「密钥生成」页)。')}
      </div>
      <div style={ { fontWeight: 600 } }>{t('加密用户私钥 (DER HEX)')}</div>
      <HexArea
        value={ keys.encUser }
        onChange={ (v) => setKey('encUser', v) }
        onDoubleClick={ () => copy(keys.encUser, '用户私钥') }
        rows={ 3 }
        placeholder={t('粘贴用户私钥 (DER HEX), 或在上方「密钥生成」页提取')}
      />
      <div style={ { color: "#999", fontSize: 12 } }>{kindHint(keys.encUser)}</div>
      <Space wrap style={ { margin: "4px 0" } }>
        <span style={ { fontWeight: 600 } }>{t('用户 ID')}</span>
        <Input style={ { width: 320 } } value={ id } onChange={ (e) => setId(e.target.value) } />
      </Space>
      <div style={ { fontWeight: 600 } }>{t('密文 (DER HEX)')}</div>
      <HexArea
        value={ decCipher }
        onChange={ setDecCipher }
        onDoubleClick={ () => copy(decCipher, '密文') }
        onDropFile={ (files) => openFile(files, setDecCipher) }
        rows={ 4}
        placeholder={t('粘贴密文 (DER HEX)  或 拖拽文件到框内打开')}
      />
      <Space style={ { margin: "4px 0" } }>
        <Button onClick={ doDecrypt } loading={ busy } style={ { backgroundColor: "#28a745", color: "#fff" } } icon={ <ArrowUpOutlined /> }>{t('解密')}</Button>
        <Button onClick={ () => { setDecCipher(''); setDecPlain(''); } }>{t('清除')}</Button>
      </Space>
      <div style={ { fontWeight: 600 } }>{t('明文 (非文本内容按 HEX 显示)')}</div>
      <HexArea value={ decPlain } rows={ 5 } placeholder={t('解密后自动显示在此')} />
      <Button size="small" icon={ <CopyOutlined /> } onClick={ () => copy(decPlain, '明文') }>{t('复制明文')}</Button>
    </div>
  );

  // ---------------- 签名 / 验签 ----------------
  const doSign = () => run(async () => {
    const usk = readHex(keys.signUser, '签名用户私钥');
    if (!usk) return;
    const data = textToBytes(signData);
    if (data.length === 0) { notice.warning(t('请输入需要签名的数据')); return; }
    const sig = await sign(usk, data);
    setSignValue(bytesToHex(sig));
    setVerifyResult('');
    notice.success(t('签名成功 (签名值为 DER HEX)'));
  });

  const doVerify = () => run(async () => {
    const data = textToBytes(signData);
    if (data.length === 0) { notice.warning(t('请输入需要验签的数据')); return; }
    if (id.trim() === '') { notice.warning(t('请先填写签名者 ID')); return; }
    const sig = readHex(signValue, '签名值');
    if (!sig) return;
    let ok :boolean;
    if (keys.signPublic.trim() !== '') {
      const pub = readHex(keys.signPublic, '签名主公钥');
      if (!pub) return;
      ok = await verifyWithPublicKey(pub, id.trim(), data, sig);
    } else if (keys.signMaster.trim() !== '') {
      const master = readHex(keys.signMaster, '签名主私钥');
      if (!master) return;
      ok = await verifyWithMasterKey(master, id.trim(), data, sig);
    } else {
      notice.warning(t('未配置签名主公钥/主私钥, 请先在「密钥生成」页生成或粘贴'));
      return;
    }
    setVerifyResult(ok ? 'ok' : 'fail');
    if (ok) notice.success(t('验签通过: 签名有效且数据未被篡改'));
    else notice.error(t('验签失败: 签名/数据/ID/主公钥不匹配'));
  });

  const signTab = (
    <div>
      <div style={ { color: "#999", fontSize: 12, margin: "8px 0" } }>
        {t('签名用「签名用户私钥」(与签名者 ID 绑定), 验签只需签名者主公钥 + ID + 数据 + 签名值。')}
      </div>
      <div style={ { fontWeight: 600 } }>{t('签名用户私钥 (DER HEX)')}</div>
      <HexArea
        value={ keys.signUser }
        onChange={ (v) => setKey('signUser', v) }
        onDoubleClick={ () => copy(keys.signUser, '用户私钥') }
        rows={ 3}
        placeholder={t('粘贴签名用户私钥 (DER HEX), 或在上方「密钥生成」页提取')}
      />
      <div style={ { color: "#999", fontSize: 12 } }>{kindHint(keys.signUser)}</div>
      <div style={ { fontWeight: 600 } }>{t('数据 (待签名 / 待验签, UTF-8)')}</div>
      <HexArea
        value={ signData }
        onChange={ setSignData }
        onDoubleClick={ () => copy(signData, '数据') }
        onDropFile={ (files) => openFile(files, setSignData) }
        rows={ 5 }
        placeholder={t('输入数据  或 拖拽文件到框内打开 (签名与验签使用同一数据)')}
      />
      <div style={ { margin: '0 0 4px 0', color: '#888' } }>
        { t('示例') }
        <Space wrap size={ [ 12, 0 ] } style={ { marginLeft: 10 } }>
          <Button type="link" size="small" style={ { padding: 0, height: 'auto' } } onClick={ () => setSignData(SAMPLE_DATA) }>
            { t('SM9 示例签名数据') }
          </Button>
        </Space>
      </div>
      <Space style={ { margin: "4px 0" } }>
        <Button onClick={ doSign } loading={ busy } style={ { backgroundColor: "#007bff", color: "#fff" } }>{t('签名 (用户私钥)')}</Button>
      </Space>
      <div style={ { fontWeight: 600 } }>{t('签名值 (DER HEX)')}</div>
      <HexArea value={ signValue } onChange={ setSignValue } rows={ 3} placeholder={t('签名后自动显示在此; 也可粘贴他人给的签名值用于验签')} />
      <div style={ { color: "#999", fontSize: 12 } }>{kindHint(signValue)}</div>
      <Divider style={ { margin: "8px 0" } } />
      <div style={ { fontWeight: 600 } }>{t('签名主公钥 (129 字节 HEX)')}</div>
      <HexArea
        value={ keys.signPublic }
        onChange={ (v) => setKey('signPublic', v) }
        onDoubleClick={ () => copy(keys.signPublic, '主公钥') }
        rows={ 2 }
        placeholder={t('04 开头 258 位 HEX; 留空则用「签名主私钥」验签')}
      />
      <div style={ { color: "#999", fontSize: 12 } }>{kindHint(keys.signPublic)}</div>
      <Space wrap style={ { margin: "4px 0" } }>
        <span style={ { fontWeight: 600 } }>{t('签名者 ID')}</span>
        <Input style={ { width: 320 } } value={ id } onChange={ (e) => setId(e.target.value) } />
        <Button onClick={ doVerify } loading={ busy } style={ { backgroundColor: "#28a745", color: "#fff" } }>{t('验签 (主公钥 + ID)')}</Button>
        { verifyResult === 'ok' && <Tag color="success">{t('验签通过')}</Tag> }
        { verifyResult === 'fail' && <Tag color="error">{t('验签失败')}</Tag> }
      </Space>
    </div>
  );

  return (
    <div>
      { contextHolder }
      { engineError !== '' && (
        <Alert
          type="error"
          showIcon
          style={ { margin: "8px 0" } }
          message={t('SM9 引擎 (WebAssembly) 加载失败')}
          description={ engineError }
          action={ <Button size="small" onClick={ () => { resetSm9(); setEngineError(''); initSm9().catch((e) => setEngineError(srErr(locale, String((e as Error)?.message ?? e)))); } }>{t('重试')}</Button> }
        />
      ) }

      <Tabs
        activeKey={ activeTab }
        onChange={ setActiveTab }
        items={ tabList.map(({ key, label }) => ({
          key,
          label: t(label),
          children: key === 'keygen' ? keygenTab : key === 'encrypt' ? encryptTab : key === 'decrypt' ? decryptTab : signTab,
        })) }
      />

      <Divider>{t(' SM9 说明 ')}</Divider>
      <SM9Intro />
    </div>
  );
};

export default SM9Crypto;
