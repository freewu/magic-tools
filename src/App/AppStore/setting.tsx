import { Checkbox, Select, Form, Divider, Space } from "antd";
import { getDefaultApp,setDefaultApp } from "./lib";
import { useState } from "react";
import { appList } from "../index";
import { appNameOf } from "../app-i18n";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import shell from "../../i18n/shell";
import appstoreLang from "./lang";
import { APP_TYPES } from "../app-types";
import {
  getVisibleAppTypes,
  resetVisibleAppTypes,
  setVisibleAppTypes,
} from "../../lib/app-type-filter";

export const AppStoreSetting = () => {
  const [ app, setApp ] = useState(getDefaultApp()); // 默认展示的 app
  // 应用中心展示的分类 (勾选的分类才会出现在应用中心与左侧菜单; 不影响「我的收藏」)
  const [ types, setTypes ] = useState<string[]>(getVisibleAppTypes());
  const { locale } = useLocale();

  const onChangeDefaultApp = (value: string) => {
    setApp(value);
    setDefaultApp(value);
  };

  const t = (key: string, fallback: string) => tr(appstoreLang, locale, key, fallback);

  // 勾选变化: 立刻持久化 + 广播, 应用中心 / 左侧菜单实时过滤
  const onChangeTypes = (next: Array<string | number>) => {
    setTypes(setVisibleAppTypes(next.map((v) => String(v))));
  };

  // 全选 / 全不选 (全选状态下点击 = 清空, 方便快速筛选)
  const allChecked = types.length === APP_TYPES.length;
  const indeterminate = types.length > 0 && !allChecked;
  const onToggleAll = () => {
    setTypes(allChecked ? setVisibleAppTypes([]) : resetVisibleAppTypes());
  };

  // 应用列表 (固定页面 + 全部工具, 名称随语言)
  const getAppList = () => {
    const result = [
      { value: 'AppStore', label: appNameOf(locale, 'AppStore', '应用中心') },
      { value: 'Favorites', label: appNameOf(locale, 'Favorites', '我的收藏') },
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
      <Form.Item
        label={ t('visibleTypes', '应用中心展示类型') }
        extra={ t('visibleTypesTip', '未勾选的分类不会出现在应用中心与左侧菜单；「我的收藏」不受影响') }
      >
        <Space direction="vertical" size={ 6 }>
          <Checkbox indeterminate={ indeterminate } checked={ allChecked } onChange={ onToggleAll }>
            { t('selectAll', '全选') }
          </Checkbox>
          <Checkbox.Group value={ types } onChange={ onChangeTypes }>
            <div style={ { display: 'flex', flexWrap: 'wrap', gap: '4px 18px' } }>
              { APP_TYPES.map((item) => (
                <Checkbox key={ item.key } value={ item.key }>
                  { tr(shell, locale, 'cat.' + item.key, item.name) }
                </Checkbox>
              )) }
            </div>
          </Checkbox.Group>
        </Space>
      </Form.Item>
    </>
  );
}
