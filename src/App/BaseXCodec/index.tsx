import { Divider, Button, Input, Space, message, Select } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "./../../lib/file"
import { BaseXEncode, BaseXDecode, getDefaultCode } from "./lib"
import { codeList } from "./data";
import { default as BaseXIntro } from "./intro"
import { useLocale } from "../../hook/locale-context";
import { tr, trTpl } from "../../i18n/lang";
import baseXLang from "./lang";

const BaseXCodec = () => {

  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(baseXLang, locale, key, fallback);
  const tpl = (key: string, vars: Record<string, string | number>, fallback: string) => trTpl(baseXLang, locale, key, vars, fallback);


  const [ code, setCode ] = useState(getDefaultCode());
  const [ encodeValue, setEncodeValue ] = useState('');
  const [ decodeValue, setDecodeValue ] = useState('');
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success(t('copyOk', '复制到粘贴板成功！！！'));
    }
  };

  const encode = () => {
    if (encodeValue.trim() != "") {
      setDecodeValue( BaseXEncode(encodeValue,code) );
    }
  }

  const decode = () => {
    if (decodeValue.trim() != "") {
      let r = ""
      try {
        r = BaseXDecode(decodeValue,code)
      } catch(err) {
        notice.error(tpl('decodeFail', { msg: (err as Error).message }, '解码失败: ' + (err as Error).message));
        return;
      }
      setEncodeValue(r);
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
        placeholder={ tpl('encodePh', { code }, '') }
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Space wrap>
        <label>{ t('typeLabel', '码型:') }</label>
        <Select
          value={ code }
          style={{ width: 220 }}
          onChange={ (v: string) => { setCode(v); setEncodeValue(''); setDecodeValue(''); } }
          options={ codeList.map((c) => ({ label: c, value: c })) }
        />
        <Button 
          onClick={ encode }
          style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
          icon={<ArrowDownOutlined />}
        >{ t('encode', '编码') }</Button>
        <Button 
          onClick={ decode }
          style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
          icon={<ArrowUpOutlined />}
        >{ t('decode', '解码') }</Button>&nbsp;
        <Button 
          onClick={ () => { setEncodeValue(''); setDecodeValue(''); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >{ t('clear', '清除') }</Button>
      </Space>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) ;} }
        title={ t('copyTitle', '双击复制内容到粘贴板') }
        value= { decodeValue }
        placeholder={ tpl('decodePh', { code }, '') }
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />

      <Divider>{ t('divider', 'BaseX 编码说明') }</Divider>

      <BaseXIntro code={ code } />
    </div>
  );
}

export default BaseXCodec;
