import React from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import  GPSConvertSingle from "./single";
import  GPSConvertBatch from "./batch";

const onChange = (key: string) => {
  console.log(key);
};

const items: TabsProps['items'] = [
  {
    key: '1',
    label: '单个转换',
    children: <GPSConvertSingle />,
  },
  {
    key: '2',
    label: '批量转换',
    children: <GPSConvertBatch />,
  }
];

const GPSConvert = () => {
  return (
    <div>
      <Tabs
        defaultActiveKey="1"
        items={items}
        onChange={ onChange }
      />
    </div>
  );
}

export default GPSConvert;