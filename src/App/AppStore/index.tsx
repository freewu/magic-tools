import { appList, genMenuList } from "../index";
import "./appstore.css"
import { default as AppType } from "./app-type";
import { useLocale } from "../../hook/locale-context";
import { tr, trTpl } from "../../i18n/lang";
import shell from "../../i18n/shell";
import { appNameOf } from "../app-i18n";
import appstoreLang from "./lang";
import { matchQuery } from "./lib";
import { Empty, Input, Select, Space, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';

const { Text } = Typography;

const AppStore = () => {
  const { locale } = useLocale();
  // 分类筛选: 'all' = 全部分类 (默认), 其余为分类 key
  const [ filter, setFilter ] = useState<string>('all');
  // 搜索关键词: 匹配应用名 (三语) / 目录名 / 分类名, 多个关键词为「与」关系
  const [ query, setQuery ] = useState<string>('');
  const menu = useMemo(() => genMenuList(appList), []);
  const groups = useMemo(
    () => (filter === 'all' ? menu : menu.filter((g) => g.key === filter)),
    [menu, filter]
  );
  // 应用卡片名随语言: AppItem label 替换为当前语言包名称; 按关键词过滤 (空关键词保留全部)
  const visible = useMemo(
    () => groups.map((g) => {
      // 分类名也参与匹配: 输入「图片」可列出该分类下全部应用
      const catNames = [
        g.name,
        tr(shell, locale, 'cat.' + g.key, g.name),
        tr(shell, 'en', 'cat.' + g.key, g.name),
      ];
      const children = (g.children ?? [])
        .filter((c) => matchQuery(query, [
          appNameOf(locale, c.key, c.label),
          c.label,
          appNameOf('en', c.key, c.label),
          appNameOf('zh-TW', c.key, c.label),
          c.key,
          ...catNames,
        ]))
        .map((c) => ({ ...c, label: appNameOf(locale, c.key, c.label) }));
      return {
        key: g.key,
        name: tr(shell, locale, 'cat.' + g.key, g.name),
        children,
      };
    }).filter((g) => g.children.length > 0),
    [groups, locale, query]
  );
  // 过滤后应用总数 (右上角展示)
  const total = useMemo(
    () => visible.reduce((s, g) => s + g.children.length, 0),
    [visible]
  );

  return (
    <div style={ { height: '100%', display: 'flex', flexDirection: 'column' } }>
      {/* 顶部工具栏: 左=搜索框 + 分类筛选, 右=过滤后应用总数 */}
      <div className="appstore-toolbar">
        <Space size={ 8 } wrap>
          <Input
            size="small"
            allowClear
            value={ query }
            style={ { width: 220 } }
            prefix={ <SearchOutlined /> }
            placeholder={ tr(appstoreLang, locale, 'search', '搜索应用名 / 分类名') }
            onChange={ (e) => setQuery(e.target.value) }
          />
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
        </Space>
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
        {
          // 无匹配结果 (关键词/分类筛选后为空)
          total === 0 && (
            <div className="appstore-empty">
              <Empty
                image={ Empty.PRESENTED_IMAGE_SIMPLE }
                description={ tr(appstoreLang, locale, 'empty', '没有匹配的应用') }
              />
            </div>
          )
        }
      </div>
    </div>
  );
}

export default AppStore;
