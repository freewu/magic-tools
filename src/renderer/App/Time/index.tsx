import { Button, Form, Input, Divider, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"

const Time = () => {

  const emptyResult = {
    "ts10": "",
    "ts13": "",
    "rfc3339": "",
    "iso8601": "",
    "rfc2822": "",
    "locale": "",
    "utc": "",
    "custom": "",
  };

  const [ value, setValue ] = useState('');
  const [ data, setData ] = useState(emptyResult);
  const [ notice, contextHolder ] = message.useMessage();

  const inputStyle = { cursor: "pointer" };
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    copyTextToClipboard((e.target as HTMLInputElement).value);
    notice.success("复制到粘贴板成功！！！");
  };

  // 格式化时间为 YYYY-MM-DD HH:ii:ss 格式
  const formatDateTime = (date :Date) => {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();
    return `${year}-${paddingZero(month)}-${paddingZero(day)} ${paddingZero(hour)}:${paddingZero(minute)}:${paddingZero(second)}`;
  }

  // 补 0 处理
  const paddingZero = (n :number) => {
    return (n >= 0 && n <= 9)? "0" + String(n) : String(n);
  }

  const updateDate = (d: Date) => {
    const r = {
      "ts10": "",
      "ts13": d.getTime() + "",
      "rfc3339": "",
      "iso8601": d.toISOString(),
      "rfc2822": "",
      "locale": d.toLocaleString(),
      "utc": d.toUTCString(),
      "custom": formatDateTime(d),
    };
    r["ts10"] = Math.round(d.getTime() / 1000) + "";
    setData(r);
  }

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    let v = e.target.value;
    setValue(v);
    setData(emptyResult);
    if(v.trim() != "") {
      try {
        let d;
        // 判断是否是时间戳 全数字 ^/d+$
        if(/^\d+$/.test(v)) {
          // 如果是10位时间戳需要补三位
          if(v.length == 10) v = v + "000";
          d = new Date(parseInt(v)); 			// 时间戳格式化 可以使用Date.parse函数 但是不支持任
        } else {
          d = new Date(v);
        }
        updateDate(d);
      } catch(e) {
        console.log(e);
        notice.error("输入时间格式出错!!!");
      }
    }
  }

  return (
    <div>
      {contextHolder}
      <TextArea
        value= { value }
        onChange={  textAreaChange }
        placeholder="输入 10位 / 13位 时间戳 或 UTC 格式字符串 或 YYYY-MM-DD HH:ii:ss 格式字符串"
        autoSize={{ minRows: 3, maxRows: 3 }}
      />

      <Button 
        onClick={ () => { setValue( formatDateTime(new Date())); updateDate(new Date()); } }
        style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
      >当前时间</Button>

      <Button 
        onClick={ () => { setValue(''); setData(emptyResult); } }
        style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
      >清除</Button>

      <Divider dashed />

      <Form name="basic" labelCol={{ span: 4 }}autoComplete="off">
        <Form.Item label="时间戳(10位)">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.ts10 } />
        </Form.Item>
        <Form.Item label="时间戳(13位)">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.ts13 } />
        </Form.Item>
        <Form.Item label="ISO 8601">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.iso8601 } />
        </Form.Item>
        {/* <Form.Item label="RFC 3339">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.rfc3339 }/>
        </Form.Item> */}
        {/* <Form.Item label="RFC 2822">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.rfc2822 }/>
        </Form.Item> */}
        <Form.Item label="Locale">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.locale }/>
        </Form.Item>
        <Form.Item label="UTC">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.utc }/>
        </Form.Item>
        <Form.Item label="YYYY-MM-DD HH:ii:ss">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.custom }/>
        </Form.Item>
      </Form>

    </div>
  );
}

export default Time;