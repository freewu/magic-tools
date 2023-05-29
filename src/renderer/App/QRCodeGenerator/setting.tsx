import { Select, Form, Divider, notification, Slider, Space } from "antd";
import { getDefaultErrorLevel, setDefaultErrorLevel, getDefaultSize, setDefaultSize } from "./lib";
import { useState } from "react";
import { errorCorrectionLevelList } from "./data";

const QRCodeGeneratorSetting = () => {
  const [ level, setLevel ] = useState(getDefaultErrorLevel()); // 默认容错级别
  const [ size, setSize ] = useState(getDefaultSize()); // 默认尺寸

  return (
    <>
      <Divider orientation="left" plain>二维码生成</Divider>
      <Form.Item label="默认容错等级">
        <Select
          value={ level }
          style={{ width: 240 }}
          onChange={ (value) => { setLevel(value); setDefaultErrorLevel(value); } }
          options={ errorCorrectionLevelList }
        />
      </Form.Item>
      <Form.Item label="默认尺寸">
        <Space>
          <div style={ {width: "520px"} }>
            <Slider
              value={ size }
              min = { 160 }
              max = { 360 }
              // tooltip={{ open: true, placement: 'top' }}
              onChange={ (value) => { setSize(value); setDefaultSize(value); }}
            />
          </div>
          { size }
        </Space>
      </Form.Item>
    </>
  );
}

export default QRCodeGeneratorSetting;