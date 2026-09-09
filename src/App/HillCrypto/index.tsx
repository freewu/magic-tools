import { Button, Divider, Input, Space, message } from "antd";
import { useState } from "react";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { hillEncrypt, hillDecrypt, hillKeySize, hillKeyShapeValid, getDefaultKey } from "./lib"
import HillIntro from "./intro"
import { useLocale } from "../../hook/locale-context";
import { cr, crT } from "../crypto-lang";

const HillCrypto = () => {
  const { locale } = useLocale();
  const t = (zh: string) => cr(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => crT(locale, zh, v);

  const [ key, setKey ] = useState(getDefaultKey()); // 密钥 (4 或 9 个字母)
  const [ keyStatus, setKeyStatus ] = useState('' as 'error' | '');
  const [ plainValue, setPlainValue ] = useState('');  // 明文区 (加密输入 / 解密输出)
  const [ cipherValue, setCipherValue ] = useState(''); // 密文区 (解密输入 / 加密输出)
  const [ notice, contextHolder ] = message.useMessage();

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    const v = (e.target as HTMLTextAreaElement).value;
    if (v.trim() !== '') {
      copyTextToClipboard(v);
      notice.success(t('内容已复制到粘贴板'));
    }
  };

  const onKeyChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setKey(v);
    if (hillKeyShapeValid(v)) {
      setKeyStatus('');
    } else {
      setKeyStatus('error');
    }
  };

  const size = hillKeySize(key);

  const doEncrypt = () => {
    if (key.trim() === '') { notice.warning(t('请输入密钥')); return; }
    if (size === 0) { notice.warning(t('密钥长度需为 4 个字母 (2×2) 或 9 个字母 (3×3)')); return; }
    if (plainValue === '') { notice.warning(t('请输入需要加密的明文')); return; }
    try {
      setCipherValue(hillEncrypt(plainValue, key));
    } catch (err) {
      notice.error(tt('加密失败: {m}', { m: (err as Error).message }));
    }
  };

  const doDecrypt = () => {
    if (key.trim() === '') { notice.warning(t('请输入密钥')); return; }
    if (size === 0) { notice.warning(t('密钥长度需为 4 个字母 (2×2) 或 9 个字母 (3×3)')); return; }
    if (cipherValue.trim() === '') { notice.warning(t('请输入需要解密的密文')); return; }
    try {
      setPlainValue(hillDecrypt(cipherValue, key));
    } catch (err) {
      notice.error(tt('解密失败: {m}', { m: (err as Error).message }));
    }
  };

  const clear = () => {
    setPlainValue('');
    setCipherValue('');
  };

  return (
    <div>
      { contextHolder }

      <Space wrap style={ { margin: "8px 0" } }>
        <span>{t('密钥 (矩阵):')}</span>
        <Input
          value={ key }
          status={ keyStatus || undefined }
          onChange={ onKeyChange }
          placeholder={t('4 个字母 = 2×2 (如 HILL), 9 个字母 = 3×3 (如 GYBNQKURP)')}
          style={ { width: 340, fontFamily: "monospace" } }
          allowClear
        />
        { size > 0 && <span style={ { color: "#1890ff" } }>{ tt('当前为 {n}×{n} 矩阵', { n: size }) }</span> }
        <span style={ { color: "#999" } }>{t('仅处理 A-Z 字母 (其它字符自动移除), 末尾自动补 X 凑整块')}</span>
      </Space>

      <div style={ { fontWeight: 600, color: "#555" } }>{t('明文区 (加密输入 / 解密输出)')}</div>
      <TextArea
        style={ { margin: "4px 0" } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => setPlainValue(e.target.value) }
        title={t('双击复制内容到粘贴板')}
        value={ plainValue }
        placeholder={t('输入需要加密的明文 (只保留字母), 例如 ACT / SHORT  或 拖拽文件到框内打开')}
        autoSize={{ minRows: 7, maxRows: 7 }}
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setPlainValue); } }
      />

      <Space style={ { margin: "4px 0" } }>
        <Button
          onClick={ doEncrypt }
          style={ { backgroundColor: "#007bff", color: "#fff" } }
          icon={ <ArrowDownOutlined /> }
        >{t('加密')}</Button>
        <Button
          onClick={ doDecrypt }
          style={ { backgroundColor: "#28a745", color: "#fff" } }
          icon={ <ArrowUpOutlined /> }
        >{t('解密')}</Button>
        <Button
          onClick={ clear }
          style={ { backgroundColor: "#dc3545", color: "#fff" } }
        >{t('清除')}</Button>
      </Space>

      <div style={ { fontWeight: 600, color: "#555" } }>{t('密文区 (解密输入 / 加密输出)')}</div>
      <TextArea
        style={ { margin: "4px 0", fontFamily: "monospace" } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => setCipherValue(e.target.value) }
        title={t('双击复制内容到粘贴板')}
        value={ cipherValue }
        placeholder={t('加密结果自动显示在此 (大写字母); 也可粘贴外部密文后点「解密」  或 拖拽文件到框内打开')}
        autoSize={{ minRows: 5, maxRows: 7 }}
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setCipherValue); } }
      />

      <Divider>{t(' 希尔密码说明 ')}</Divider>
      <HillIntro />
    </div>
  );
}

export default HillCrypto;
