import { appList, genMenuList } from "../index";
import "./appstore.css"
import { default as AppType } from "./app-type";
import { useLocale } from "../../hook/locale-context";
import { tr, trTpl } from "../../i18n/lang";
import shell from "../../i18n/shell";
import { appNameOf } from "../app-i18n";
import appstoreLang from "./lang";
import { Select, Typography } from 'antd';
import { useMemo, useState } from 'react';

const { Text } = Typography;

const AppStore = () => {
  const { locale } = useLocale();
  // 分类筛选: 'all' = 全部分类 (默认), 其余为分类 key
  const [ filter, setFilter ] = useState<string>('all');
  const menu = useMemo(() => genMenuList(appList), []);
  const groups = useMemo(
    () => (filter === 'all' ? menu : menu.filter((g) => g.key === filter)),
    [menu, filter]
  );
  // 筛选后应用总数 (右上角展示)
  const total = useMemo(
    () => groups.reduce((s, g) => s + (g.children?.length ?? 0), 0),
    [groups]
  );
  // 应用卡片名随语言: AppItem label 替换为当前语言包名称
  const visible = useMemo(
    () => groups.map((g) => ({
      key: g.key,
      name: tr(shell, locale, 'cat.' + g.key, g.name),
      children: (g.children ?? []).map((c) => ({ ...c, label: appNameOf(locale, c.key, c.label) })),
    })),
    [groups, locale]
  );

  return (
    <div style={ { height: '100%', display: 'flex', flexDirection: 'column' } }>
      {/* 顶部工具栏: 左=分类筛选, 右=筛选后应用总数 */}
      <div className="appstore-toolbar">
        <Select
          size="small"
          value={ filter }
          style={ { width: 180 } }
          onChange={ (v: string) => setFilter(v) }
          options={ [
            { value: 'all', label: tr(appstoreLang, locale, 'all', '全部分类') },
            ...menu.map((g) => ({ value: g.key, label: tr(shell, locale, 'cat.' + g.key, g.name) })),
          ] }
        />
        <Text type="secondary" className="appstore-toolbar-count">{ trTpl(appstoreLang, locale, 'count', { n: total }) }</Text>
      </div>
      <div className="appstore" style={ { flex: 1, minHeight: 0, overflowY: 'auto' } }>
        {
          visible.map((g) => {
            return (
              <AppType
                uri= { g.key }
                key= { g.key }
                name= { g.name }
                children={ g.children }/>
            );
          })
        }
      </div>
    </div>
  );
}

export default AppStore;
