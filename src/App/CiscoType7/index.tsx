import { Alert, Select, Divider, Button, Input, Space, message, Row } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useState } from "react";
const { TextArea } = Input;
import { useLocale } from "../../hook/locale-context";
import { cr, crT } from './lang';
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { TYPE7_SALT_MAX, TYPE7_SALT_MIN, decryptType7, encryptType7 } from './lib';

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

  const [ notice, contextHolder ] = message.useMessage();
  const [ encodeValue, setEncodeValue ] = useState(''); // 要加密的明文
  const [ decodeValue, setDecodeValue ] = useState(''); // 要解密的 Type 7 串
  const [ salt, setSalt ] = useState<number | 'random'>('random'); // 加密时的盐偏移

  // 加密处理: 上框明文 -> 下框 Type 7
  const encode = () => {
    if(encodeValue.trim() === '') return ;
    try {
      setDecodeValue(encryptType7(encodeValue, salt === 'random' ? undefined : salt));
    } catch (error) {
      console.log(error);
      notice.error(transErr((error as Error).message));
      setDecodeValue('');
    }
  };

  // 解密处理: 下框 Type 7 -> 上框明文
  const decode = () => {
    if(decodeValue.trim() === '') return ;
    try {
      setEncodeValue(decryptType7(decodeValue));
    } catch (error) {
      console.log(error);
      notice.error(transErr((error as Error).message));
    }
  };

  // 清除内容 有选择变化,清除结果?
  const clear = () => {
    setEncodeValue('');
    setDecodeValue('');
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success(t('复制到粘贴板成功！！！'));
    }
  };

  return (
    <div>
      { contextHolder }

      <Alert
        type="warning"
        showIcon
        style={ { marginTop: 5 } }
        message={t('Cisco Type 7 使用固定公开密钥表做 XOR 弱加密, 可被任何工具还原, 不具备安全性; 仅用于与旧版 Cisco IOS 配置 (show running-config) 中的口令互通或查看')}
      />

      <Row style = { { marginTop: "5px" }}>
        <Space wrap>
          {t('盐偏移(加密):')}
          <Select
            value={ salt }
            style={{ width: 160 }}
            onChange={ setSalt }
            options={ [
              { label: t('随机 (推荐)'), value: 'random' },
              ...Array.from({ length: TYPE7_SALT_MAX - TYPE7_SALT_MIN + 1 }, (_, i) => ({
                label: `${i} (${i.toString(16).padStart(2, '0').toUpperCase()})`,
                value: i,
              })),
            ] }
          />
          {t('位于首 2 位 (0~15); 随机更贴近设备实际输出')}
        </Space>
      </Row>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) } }
        title={t('双击复制内容到粘贴板')}
        value= { encodeValue }
        placeholder={t('输入需要进行 Cisco Type 7 加密的明文 或 拖拽文件到框内打开 (UTF-8, 支持中文与多行)')}
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Space>
        <Button
          onClick={ encode }
          style={ {"backgroundColor" : "#007bff","color": "#fff"} }
          icon={<ArrowDownOutlined />}
        >{t('加密为 Type 7')}</Button>
        <Button
          onClick={ decode }
          style={ {"backgroundColor" : "#28a745","color": "#fff"} }
          icon={<ArrowUpOutlined />}
        >{t('解密为明文')}</Button>
        <Button
          onClick={ () =>clear() }
          style={ {"backgroundColor" : "#dc3545","color": "#fff"} }
        >{t('清除')}</Button>
      </Space>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) } }
        title={t('双击复制内容到粘贴板')}
        value= { decodeValue }
        placeholder={t('输入需要进行 Cisco Type 7 解密的密文 或 拖拽文件到框内打开 (例如 01050D480809, 支持大写/小写/空白分隔)')}
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />

      <Divider dashed />
      <div style={ { color: "#999", fontSize: 12 } }>
        {t('盐偏移只影响加密输出: 前 2 位十六进制即盐值, 解密时自动从串首读取, 与上方选择无关。')}
      </div>
    </div>
  )
}
export default CiscoType7;
