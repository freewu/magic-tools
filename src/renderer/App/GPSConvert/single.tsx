import { Form, Input, Divider, message, Space, Radio, Button,Tag } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { typeList, emptyResult, pickList } from "./data"
import type { RadioChangeEvent } from 'antd';
import { pointToString,GPSPoint,tencentMapPointToString, getDefaultType } from "./lib"
import { gcj02Tobd09, bd09Togcj02 } from "./lib"
import { wgs84Togcj02, gcj02Towgs84 } from "./lib"
import "./gps-convert.css"

const GPSConvertSingle = () => {
  const dt = getDefaultType();
  const dp = typeList.find(item => item.value === dt)?.placeholder

  const [ value, setValue ] = useState(''); // 需要转换的 GPS坐标 
  const [ type, setType ] = useState(dt); // 输入坐标类型,
  const [ placeholder, setPlaceholder ] = useState(dp); // 数字类型的输入提示
  const [ result, setResult] = useState(emptyResult); // 转换的结果
  const [ notice, contextHolder] = message.useMessage();

  const inputStyle = { cursor: "pointer" };

  // 切换坐标类型类型
  const onTypeChange = ({ target: { value } }: RadioChangeEvent) => {
    setType(value);
    setValue(''); // 需要把内容清空,类型变了输入的内容也没意义了
    setResult(emptyResult);
    // 更新输入提示信息
    const tips = typeList.find(item => item.value === value)?.placeholder;
    setPlaceholder(tips + "");
  };

  // 点击结果框,把结果复制到粘贴板
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setValue(value);
    if (value.split(",").length === 2 && /^[0-9\.]+,[0-9\.]+$/.test(value)) {
      covertGPS(value);
    } else {
      setResult(emptyResult);
    }
  }

  const covertGPS = (value :string) => {
    setValue(value);
    let d = value.split(",")
    let p :GPSPoint = {
      lng : parseFloat(d[0]),
      lat : parseFloat(d[1]),
    };
    // 互换一下
    if(type === "TXMAP") {
      p.lng = parseFloat(d[1]);
      p.lat = parseFloat(d[0]);
    }

    switch(type) {
      case "WGS84":
        let g = wgs84Togcj02(p);
        setResult(
          {
            "WGS84": value,
            "GCJ02": pointToString(g),
            "BD09": pointToString(gcj02Tobd09(g)),
            "CGCS": "",
            "TXMAP": tencentMapPointToString(g),
          }
        );
        break;
      case "TXMAP": case "GCJ02":
        setResult(
          {
            "WGS84": pointToString(gcj02Towgs84(p)),
            "GCJ02": pointToString(p),
            "BD09": pointToString(gcj02Tobd09(p)),
            "CGCS": "",
            "TXMAP": tencentMapPointToString(p),
          }
        );
        break;
      case "BD09":
        let r = bd09Togcj02(p);
        setResult(
          {
            "WGS84": pointToString(gcj02Towgs84(r)),
            "GCJ02": pointToString(r),
            "BD09": value,
            "CGCS": "",
            "TXMAP": tencentMapPointToString(p),
          }
        );
        break;
      case "CGCS":
        setResult(
          {
            "WGS84": "",
            "GCJ02": "",
            "BD09": "",
            "CGCS": value,
            "TXMAP": "",
          }
        );
        break;
    }
  }

  const calcTagColor = (index :number) => {
    switch(index % 4) {
      case 1: return '#2db7f5';
      case 2: return '#87d068';
      case 3: return '#108ee9';
    }
    return '#ff5500';
  }

  return (
    <div>
      {contextHolder}

      <Space>
        <Radio.Group
          optionType = "button" buttonStyle="solid"
          options = { typeList } 
          onChange={ onTypeChange } 
          value={ type } 
        />
        <Button 
          onClick={ () => { setValue(''); setResult(emptyResult); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button>

      </Space>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        value= { value }
        onChange={ textAreaChange }
        placeholder={ placeholder }
        autoSize={{ minRows: 3, maxRows: 5 }}
      />

      <Space size={[0, 8]} wrap>
      {
        pickList.map((item, index) => {
          // 只展示 10 个
          if(index < 10) {
            return (
              <Tag
                className="hash-tag"
                key={ index + item.label }
                color={ calcTagColor(index) }
                onClick={ () => {
                  if(undefined !== window.electron) {
                    window.electron.ipcRenderer.sendMessage('open-url', [ item.url ]);
                  } else {
                    document.getElementById("map-url")?.setAttribute("herf",item.url);
                    document.getElementById("map-url")?.click();
                    // window.open(item.url); 
                  }
                  
                } } >{ item.label }</Tag>
            )
          }
        })
      }
      <a href="" id="map-url" target="_blank" style={ { display: "none"} }></a>
      </Space>

      <Divider dashed />
      <Form name="basic"labelCol={{ span: 4 }} autoComplete="off">
        <Form.Item label="WGS84 (lng,lat)">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { result.WGS84 } />
        </Form.Item>
        <Form.Item label="GCJ02 (lng,lat)">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { result.GCJ02} />
        </Form.Item>
        <Form.Item label="BD09 (lng,lat)">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { result.BD09 } />
        </Form.Item>
        {/* <Form.Item label="CGCS (lng,lat)">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { result.CGCS } />
        </Form.Item> */}
        <Form.Item label="腾讯地图 (lat,lng)">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { result.TXMAP } />
        </Form.Item>
      </Form>
    </div>
  );
}

export default GPSConvertSingle;