import { getSiderFlag } from "../../lib/setting";
import { useState } from "react";
import { Form, Radio, Switch } from "antd";
import { AppStoreSetting } from "../AppStore/setting";
import { useTheme } from "../../hook/theme-context";
import { useLocale, LOCALE_IDS, LOCALE_LABELS } from "../../hook/locale-context";
import type { LocaleId } from "../../i18n/lang";
import { tr } from "../../i18n/lang";
import settingLang from "./lang";

export const SettingSystem = () => {

  const [ siderFlag, setSiderFlag ] = useState(getSiderFlag());
  const onChangeSiderFlag = (checked: boolean) => {
    setSiderFlag(checked);
    localStorage.setItem('sider-flag', checked + "");
  };

  // 显示模式 (浅色/深色/系统跟随), 与托盘菜单同步
  const { mode, setMode } = useTheme();
  // 界面语言 (简/繁/EN), 与托盘菜单「语言」子菜单同步
  const { locale, setLocale } = useLocale();

  return (
    <Form
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 18 }}
      layout="horizontal"
      style={{ maxWidth: 800 }}
    >
      <Form.Item label={ tr(settingLang, locale, 'lang', '界面语言') }>
        <Radio.Group
          value={ locale }
          onChange={ (e) => setLocale(e.target.value as LocaleId) }
        >
          { LOCALE_IDS.map((id) => (
            <Radio key={ id } value={ id }>{ LOCALE_LABELS[id] }</Radio>
          )) }
        </Radio.Group>
      </Form.Item>
      <Form.Item label={ tr(settingLang, locale, 'mode', '显示模式') }>
        <Radio.Group
          value={ mode }
          onChange={ (e) => setMode(e.target.value as 'light' | 'dark' | 'system') }
        >
          <Radio value="light">{ tr(settingLang, locale, 'modeLight', '浅色') }</Radio>
          <Radio value="dark">{ tr(settingLang, locale, 'modeDark', '深色') }</Radio>
          <Radio value="system">{ tr(settingLang, locale, 'modeSystem', '系统跟随') }</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label={ tr(settingLang, locale, 'sider', '默认展开右边栏') }>
        <Switch checked={ siderFlag } onChange={ onChangeSiderFlag } />
      </Form.Item>
      <AppStoreSetting />
    </Form>
  )
}
