import { Radio, Divider, QRCode, Input, Space, message, Tooltip, ColorPicker,Row, Slider, Button, Upload } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { errorCorrectionLevelList } from './data';
import type { RadioChangeEvent, QRCodeProps } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { ArrowUpOutlined } from '@ant-design/icons';
import { getDefaultErrorLevel, getErrorLevelTip, getDefaultSize } from './lib';

const QRCodeGenerator = () => {

  const [ value, setValue ] = useState(''); // 需要编码的内容
  const [ errorLevelTips, setErrorLevelTips ] = useState(getErrorLevelTip(getDefaultErrorLevel())); // 容错级别提示
  const [ errorLevel, setErrorLevel ] = useState(getDefaultErrorLevel()); // 默认容错级别 L / M / Q / H
  const [ color, setColor ] = useState('#000'); // 二维码背颜色
  const [ backgroudColor, setBackgroudColor ] = useState('transparent'); // 二维码背景色
  const [ size, setSize ] = useState(getDefaultSize()); // 二维码尺寸大小
  const [ icon, setIcon ] = useState(""); // 二维码中间图片
  const [ iconSize, setIconSize ] = useState(getDefaultSize() / 8); // 二维码中间图片大小
 
  const onErrorLevelChange = ( { target: { value } }: RadioChangeEvent ) => {
    setErrorLevel(value);
    setErrorLevelTips(getErrorLevelTip(value));
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('myqrcode')?.querySelector('canvas');
    const img = document.getElementById('myqrcode')?.querySelector('img');

    if (canvas) {
      // 处理中间 icon 图片跨域问题
      if(img) {
        // 缓存的图像数据仍然会被画布视为有污染的跨源内容
        img.src =img.src+'?v='+Math.random()
        img.crossOrigin= 'anonymous';
      }
      const url = canvas.toDataURL();
      const a = document.createElement('a');
      a.download = 'QRCode.png';
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // color 取色器选择颜色事件
  const onColorChange = (value: Color, hex: string) => {
    setColor(hex); 
  }

  // backgroudColor 取色器选择颜色事件
  const onBackgroudColorChange = (value: Color, hex: string) => {
    setBackgroudColor(hex); 
  }

  return (
    <>
      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        showCount
        maxLength={ 100 }
        onChange={ (e) => { setValue(e.target.value); } }
        value= { value }
        placeholder="需要生成二维码的内容"
        autoSize={{ minRows: 5}}
      />
      <Row style = { { marginTop: "5px" }}>
        <Space>
          <Tooltip placement="topLeft" title={ "Error Resistance: " + errorLevelTips }>
            <label>容错等级:</label>
          </Tooltip>
          <Radio.Group 
            optionType="button" buttonStyle="solid"
            options={ errorCorrectionLevelList } 
            onChange={ onErrorLevelChange } 
            value={ errorLevel } 
          />
          <label>颜色:</label>
          <ColorPicker
            format={ 'hex'}
            value={ color }
            onChange={ onColorChange }
          />
          <label>背景色:</label>
          <ColorPicker
            format={ 'hex'}
            value={ backgroudColor }
            onChange={ onBackgroudColorChange }
          />
          <Button 
            onClick={ () => { setValue(''); } }
            style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
          >清除</Button>
        </Space>
      </Row>
      <Row style = { { marginTop: "14px" }}>
        <Space>
          <label>二维码大小:</label>
          <div style={ {width: "600px"} }>
            <Slider
              value={ size }
              min = { 160 }
              max = { 360 }
              // tooltip={{ open: true, placement: 'bottom' }}
              onChange={ (value) => { setSize(value); setIconSize(value / 8); }}
            />
          </div>
          <span>{ size }</span>
        </Space>
      </Row>
      {/* <Row style = { { marginTop: "14px" }}>
        <Space>
          <label>中间图标:</label>
          <div style={ {width: "600px"} }>
            <Input
              placeholder="输入图标地址"
              allowClear= { true }
              value= { icon } 
              onChange={ (e) => { setIcon(e.target.value.trim()) }} />
          </div>
        </Space>
      </Row> */}

      <Divider dashed />

      <div id="myqrcode" onClick = { downloadQRCode } title="点击下载二维码">
        <QRCode
          style={{ marginBottom: 16 }}
          errorLevel={ errorLevel as QRCodeProps['errorLevel'] }
          value={ value }
          color={ color }
          bgColor={ backgroudColor }
          size={ size }
          icon={ icon }
          iconSize={ iconSize } // 按尺寸缩放中间图标
        />
      </div>
    </>
  );
}

export default QRCodeGenerator;