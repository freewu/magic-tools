import { Select, Form, Divider } from "antd";
import { getDefaultApp,setDefaultApp } from "./lib";
import { useState } from "react";
import { appList } from "../index";
import { appNameOf } from "../app-i18n";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import appstoreLang from "./lang";

export const AppStoreSetting = () => {
  const [ app, setApp ] = useState(getDefaultApp()); // 默认展示的 app
  const { locale } = useLocale();

  const onChangeDefaultApp = (value: string) => {
    setApp(value);
    setDefaultApp(value);
  };

  // 应用列表 (固定页面 + 全部工具, 名称随语言)
  const getAppList = () => {
    const result = [
      { value: 'AppStore', label: appNameOf(locale, 'AppStore', '应用中心') },
      { value: 'Help', label: appNameOf(locale, 'Help', '帮助页面') },
      { value: 'Setting', label: appNameOf(locale, 'Setting', '设置') },
    ];
    appList.forEach((v) => {
      result.push({ value: v.key, label: appNameOf(locale, v.key, v.label) });
    });
    return result;
  };

  return (
    <>
      <Divider orientation="left" plain>{ appNameOf(locale, 'AppStore', '应用中心') }</Divider>
      <Form.Item label={ tr(appstoreLang, locale, 'defaultApp', '默认展示应用') }>
        <Select
          value={ app }
          style={{ width: 240 }}
          onChange={ onChangeDefaultApp }
          options={ getAppList() }
        />
      </Form.Item>
    </>
  );
}
