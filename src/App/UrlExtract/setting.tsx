import { useState } from 'react';
import { Divider, Form, Switch } from 'antd';
import { getUrlDedupeDefault, setUrlDedupeDefault } from './lib';
import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

// 设置 - 站长工具 - URL 提取: 结果去重开关 (默认开启)
// 保存的默认值同时用于「URL 提取」工具页的初始勾选状态
export const UrlExtractSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ dedupe, setDedupe ] = useState<boolean>(() => getUrlDedupeDefault());

  return (
    <>
      <Divider orientation="left" plain>{ st('URL 提取') }</Divider>
      <Form.Item
        label={ st('结果去重') }
        tooltip={ st('从文本提取链接时, 重复的 URL 只保留首次出现的一条; 关闭则每次出现都完整保留。工具页内也可临时切换, 此处修改将作为默认值。') }
      >
        <Switch
          checked={ dedupe }
          onChange={ (v: boolean) => {
            setDedupe(v);
            setUrlDedupeDefault(v);
          } }
          checkedChildren={ st('开启') }
          unCheckedChildren={ st('关闭') }
        />
      </Form.Item>
    </>
  );
};
