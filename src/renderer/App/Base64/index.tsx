import { Checkbox, Divider, Button,Input, Space, message, Tooltip } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { Base64 as B64 } from 'js-base64';
import { default as Base64Intro } from "./intro"

const Base64 = () => {

  const tips = `
Base64编码后的字符串中可能包含"+/="之类的字符，而"/"，"="等是URL的保留字符或不安全字符，因此如果直接在URL中传输Base64编码，保留字符和不安全字符会被替换为%XX的形式，对后端来说解码不方便。如果不替换，就会造成URL注入漏洞。
因此，有一种URL安全的Base64编码，可以解决这个问题。 URL安全的Base64编码特点：

  1 不能被3整除时，不补=符号。
  2 生成Base64编码中，"+"和"/"被替换成其他非URL保留字符，使其可以直接放入URL中传输。比如"+"和"/"被替换成"-"和"_"。

安全的Base64编码也有好多种，有些编码不会去掉等号，有些编码替换的符号不同
`;

  const [ encodeValue, setEncodeValue ] = useState('');
  const [ decodeValue, setDecodeValue ] = useState('');
  const [ safe, setSafe ] = useState(false);

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    copyTextToClipboard((e.target as HTMLInputElement).value);
    openNotification("bottomRight");
  };

  const [api, contextHolder] = message.useMessage();
  const openNotification = (placement :string ) => {
    api.success( "复制到粘贴板成功！！！");
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
        api.error("解码失败！！！");
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
        title="双击复制内容到粘贴板"
        value= { encodeValue }
        placeholder="需要进行 Base64 编码的内容"
        autoSize={{ minRows: 5}}
      />

      <Button 
        onClick={ encode }
        style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
        icon={<ArrowDownOutlined />}
      >Base64 编码</Button>
      <Button 
        onClick={ decode }
        style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
        icon={<ArrowUpOutlined />}
      >Base64 解码</Button>&nbsp;
      <Tooltip placement="bottomRight" title={ tips }>
        <Checkbox onChange={ (e) => { setSafe(e.target.checked); } } value={ safe }>安全</Checkbox>
      </Tooltip>&nbsp;
      <Button 
        onClick={ () => { setEncodeValue(''); setDecodeValue(''); } }
        style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
      >清除</Button>
      
      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder="需要进行 Base64 解码的内容"
        autoSize={{ minRows: 5}}
      />
      
      <Divider> Base64 编码说明 </Divider>

      <Base64Intro />
    </div>
  );
}

export default Base64;