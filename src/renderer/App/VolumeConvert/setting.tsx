import { Select, Form, Divider } from "antd";
import { getDefaultUnitType,setDefaultUnitType, getTypeList } from "./lib";
import { useState } from "react";
import { typeList, unitTypeList } from "./data";
import { getDefaultMSType,setDefaultMSType } from "./lib";
import { getDefaultIUType,setDefaultIUType } from "./lib";
import { getDefaultCNType,setDefaultCNType } from "./lib";
import { getDefaultUSType,setDefaultUSType } from "./lib";

export const VolumeConvertSetting = () => {
  
  const [ type, setType ] = useState(getDefaultUnitType()); // 默认制式
  const [ msType, setMSType ] = useState(getDefaultMSType()); // 默认公制单位
  const [ iuType, setIUType ] = useState(getDefaultIUType()); // 默认英制单位
  const [ usType, setUSType ] = useState(getDefaultUSType()); // 默认美制单位
  const [ cnType, setCNType ] = useState(getDefaultCNType()); // 默认市制单位

  return (
    <>
      <Divider orientation="left" plain>容积转换</Divider>
      <Form.Item label="默认制式">
        <Select
          value={ type }
          style={{ width: 240 }}
          onChange={ (value: string) => { setType(value); setDefaultUnitType(value); } }
          options={ unitTypeList }
        />
      </Form.Item>
      <Form.Item label="默认公制单位">
        <Select
          value={ msType }
          style={{ width: 240 }}
          onChange={ (value: string) => { setMSType(value); setDefaultMSType(value); } }
          options={ getTypeList('ms') }
        />
      </Form.Item>
      <Form.Item label="默认英制单位">
        <Select
          value={ iuType }
          style={{ width: 240 }}
          onChange={ (value: string) => { setIUType(value); setDefaultIUType(value); } }
          options={ getTypeList('iu') }
        />
      </Form.Item>
      <Form.Item label="默认美制单位">
        <Select
          value={ usType }
          style={{ width: 240 }}
          onChange={ (value: string) => { setUSType(value); setDefaultUSType(value); } }
          options={ getTypeList('us') }
        />
      </Form.Item>
      <Form.Item label="默认市制单位">
        <Select
          value={ cnType }
          style={{ width: 240 }}
          onChange={ (value: string) => { setCNType(value); setDefaultCNType(value); } }
          options={ getTypeList('cn') }
        />
      </Form.Item>
    </>
  );
}