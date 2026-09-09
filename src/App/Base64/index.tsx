import { Checkbox, Divider, Button,Input, Space, message, Tooltip } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { Base64 as B64 } from 'js-base64';
import { default as Base64Intro } from "./intro"
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import base64Lang from "./lang";

const Base64 = () => {

  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(base64Lang, locale, key, fallback);

  const tipsZh = `
Base64编码后的字符串中可能包含"+/="之类的字符，而"/"，"="等是URL的保留字符或不安全字符，因此如果直接在URL中传输Base64编码，保留字符和不安全字符会被替换为%XX的形式，对后端来说解码不方便。如果不替换，就会造成URL注入漏洞。
因此，有一种URL安全的Base64编码，可以解决这个问题。 URL安全的Base64编码特点：

  1 不能被3整除时，不补=符号。
  2 生成Base64编码中，"+"和"/"被替换成其他非URL保留字符，使其可以直接放入URL中传输。比如"+"和"/"被替换成"-"和"_"。

安全的Base64编码也有好多种，有些编码不会去掉等号，有些编码替换的符号不同
`;
  const tipsTw = `Base64 編碼後的字串中可能含有 "+/=" 之類的字元, 而 "/"、"=" 等是 URL 的保留字元或不安全字元, 因此若直接在 URL 中傳輸 Base64 編碼, 保留字元與不安全字元會被替換成 %XX 的形式, 對後端來說解碼不方便。若不替換, 就會造成 URL 注入漏洞。
因此, 有一種 URL 安全的 Base64 編碼可以解決這個問題。URL 安全 Base64 編碼的特點:

  1 無法被 3 整除時, 不補 = 符號。
  2 產生的 Base64 編碼中, "+" 與 "/" 被替換成其他非 URL 保留字元, 使其可以直接放入 URL 中傳輸。例如 "+" 與 "/" 被替換成 "-" 與 "_"。

安全的 Base64 編碼也有好多種, 有些編碼不會去掉等號, 有些編碼替換的符號不同
`;
  const tipsEn = `Encoded Base64 output may contain characters such as "+/=", while "/", "=" and friends are reserved or unsafe characters in URLs. If Base64 is placed directly into a URL, those reserved/unsafe characters get percent-encoded as %XX, which is inconvenient for the server to decode. Without escaping, it can also lead to URL injection.
URL-safe Base64 solves this. Its characteristics:

  1 It never appends '=' padding when the input is not divisible by 3.
  2 "+" and "/" in the output are replaced with non-reserved URL characters ("-" and "_"), so the result can be put straight into a URL.

There are several URL-safe variants: some keep the padding, some replace different characters.
`;
  const tips = locale === 'zh-TW' ? tipsTw : locale === 'en' ? tipsEn : tipsZh;

  const [ encodeValue, setEncodeValue ] = useState('');
  const [ decodeValue, setDecodeValue ] = useState('');
  const [ safe, setSafe ] = useState(false);
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
      setDecodeValue( B64.encode(encodeValue, safe) );
    }
  }

  const decode = () => {
    if (decodeValue.trim() != "") {
      let r = ""
      try {
        r = B64.decode( decodeValue)
      } catch(err) {
        notice.error(t('decodeFailed', '解码失败！！！'));
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
        placeholder={ t('encodePh', '输入需要进行 Base64 编码的内容  或 拖拽文件到框内打开') }
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Button 
        onClick={ encode }
        style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
        icon={<ArrowDownOutlined />}
      >{ t('encode', 'Base64 编码') }</Button>
      <Button 
        onClick={ decode }
        style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
        icon={<ArrowUpOutlined />}
      >{ t('decode', 'Base64 解码') }</Button>&nbsp;
      <Tooltip placement="bottomRight" title={ tips }>
        <Checkbox onChange={ (e) => { setSafe(e.target.checked); } } checked={ safe }>{ t('safe', '安全') }</Checkbox>
      </Tooltip>&nbsp;
      <Button 
        onClick={ () => { setEncodeValue(''); setDecodeValue(''); } }
        style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
      >{ t('clear', '清除') }</Button>
      
      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) ;} }
        title={ t('copyTitle', '双击复制内容到粘贴板') }
        value= { decodeValue }
        placeholder={ t('decodePh', '输入需要进行 Base64 解码的内容  或 拖拽文件到框内打开') }
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />
      
      <Divider>{ t('divider', 'Base64 编码说明') }</Divider>

      <Base64Intro />
    </div>
  );
}

export default Base64;