import { Button, Divider, Input, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { xxEncodeText, xxDecodeText } from "./lib"
import XXIntro from "./intro"
import { useLocale } from "../../hook/locale-context";
import { tr, trTpl } from "../../i18n/lang";
import xxLang from "./lang";

const XXencode = () => {

  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(xxLang, locale, key, fallback);
  const tpl = (key: string, vars: Record<string, string | number>, fallback: string) => trTpl(xxLang, locale, key, vars, fallback);


  const [ encodeValue, setEncodeValue ] = useState('');
  const [ decodeValue, setDecodeValue ] = useState('');
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLTextAreaElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success(t('copyOk', '复制到粘贴板成功！！！'));
    }
  };

  const encode = () => {
    try {
      setDecodeValue( xxEncodeText(encodeValue) );
    } catch(err) {
      notice.error(tpl('encodeFail', { msg: (err as Error).message }, '编码失败: ' + (err as Error).message));
    }
  }

  const decode = () => {
    try {
      setEncodeValue( xxDecodeText(decodeValue) );
    } catch(err) {
      notice.error(tpl('decodeFail', { msg: (err as Error).message }, '解码失败: ' + (err as Error).message));
    }
  }

  return (
    <div>
      {contextHolder}

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) ;} }
        title={ t('copyTitle', '双击复制内容到粘贴板') }
        value= { encodeValue }
        placeholder={ t('encodePh', '输入需要 XXencode 编码的内容') }
        autoSize={{ minRows: 5, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Button
        onClick={ encode }
        style={ { "backgroundColor" : "#007bff", "color": "#fff", "marginRight": "8px" } }
        icon={<ArrowDownOutlined />}
      >{ t('encode', 'XXencode 编码') }</Button>
      <Button
        onClick={ decode }
        style={ { "backgroundColor" : "#28a745", "color": "#fff", "marginRight": "8px" } }
        icon={<ArrowUpOutlined />}
      >{ t('decode', 'XXencode 解码') }</Button>
      <Button
        onClick={ () => { setEncodeValue(''); setDecodeValue(''); } }
        style={ { "backgroundColor" : "#dc3545", "color": "#fff" } }
      >{ t('clear', '清除') }</Button>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) ;} }
        title={ t('copyTitle', '双击复制内容到粘贴板') }
        value= { decodeValue }
        placeholder={ t('decodePh', '输入需要 XXencode 解码的内容 (支持带 begin/end 头尾的经典格式)') }
        autoSize={{ minRows: 5, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />

      <Divider>{ t('divider', 'XXencode 编码说明') }</Divider>

      <XXIntro />
    </div>
  );
}

export default XXencode;
