import { useState } from 'react';
import { Divider, Form, Switch } from 'antd';
import { getUrlDedupeDefault, setUrlDedupeDefault } from './lib';

// 设置 - 站长工具 - URL 提取: 结果去重开关 (默认开启)
// 保存的默认值同时用于「URL 提取」工具页的初始勾选状态
export const UrlExtractSetting = () => {
  const [ dedupe, setDedupe ] = useState<boolean>(() => getUrlDedupeDefault());

  return (
    <>
      <Divider orientation="left" plain>URL 提取</Divider>
      <Form.Item
        label="结果去重"
        tooltip="从文本提取链接时, 重复的 URL 只保留首次出现的一条; 关闭则每次出现都完整保留。工具页内也可临时切换, 此处修改将作为默认值。"
      >
        <Switch
          checked={ dedupe }
          onChange={ (v: boolean) => {
            setDedupe(v);
            setUrlDedupeDefault(v);
          } }
          checkedChildren="开启"
          unCheckedChildren="关闭"
        />
      </Form.Item>
    </>
  );
};
