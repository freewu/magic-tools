import { Divider, Form, Switch } from "antd";
import { useState } from "react";
import { getDefaultGroupByType, setDefaultGroupByType } from "./lib";
import { appNameOf } from "../app-i18n";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import favoritesLang from "./lang";

// 我的收藏 相关设置 (设置中心 -> 系统设置)
export const FavoritesSetting = () => {
  const [ groupByType, setGroupByType ] = useState(getDefaultGroupByType());
  const { locale } = useLocale();

  const onChangeGroupByType = (checked: boolean) => {
    setGroupByType(checked);
    setDefaultGroupByType(checked);
  };

  return (
    <>
      <Divider orientation="left" plain>{ appNameOf(locale, 'Favorites', '我的收藏') }</Divider>
      <Form.Item label={ tr(favoritesLang, locale, 'settingGroupByType', '收藏按类型展示') }>
        <Switch checked={ groupByType } onChange={ onChangeGroupByType } />
      </Form.Item>
    </>
  );
}
