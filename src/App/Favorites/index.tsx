// 我的收藏 (系统级页面): 展示已收藏的应用, 支持搜索 / 取消收藏 / 清空
// 收藏来源: 应用中心每个应用卡片右上角的星标; 悬浮入口 (FavoritesFab) 可直达本页
import { useMemo, useState } from 'react';
import { Button, Empty, Input, Popconfirm, Space, Typography } from 'antd';
import { ClearOutlined, SearchOutlined } from '@ant-design/icons';
import { appList } from '../index';
import { default as AppItem } from '../AppStore/app-item';
import { matchQuery } from '../AppStore/lib';
import { appNameOf } from '../app-i18n';
import { useLocale } from '../../hook/locale-context';
import { tr, trTpl } from '../../i18n/lang';
import { useFavorites } from '../../hook/use-favorites';
import { clearFavorites } from '../../lib/favorite';
import favoritesLang from './lang';
import '../AppStore/appstore.css';
import './favorites.css';

const { Text } = Typography;

const Favorites = () => {
  const { locale } = useLocale();
  const favorites = useFavorites();
  // 搜索关键词: 匹配应用名 (三语) / 目录名
  const [ query, setQuery ] = useState<string>('');

  // 收藏列表 -> 应用卡片 (按收藏顺序展示, 名称随语言; 过滤已下线/不存在的 app key)
  const items = useMemo(
    () => favorites
      .map((key) => appList.find((a) => a.key === key))
      .filter((a): a is (typeof appList)[number] => Boolean(a))
      .map((a) => ({ ...a, label: appNameOf(locale, a.key, a.label) })),
    [favorites, locale]
  );

  // 关键词过滤 (空关键词保留全部)
  const visible = useMemo(
    () => items.filter((a) => matchQuery(query, [
      a.label,
      appNameOf('en', a.key, a.label),
      appNameOf('zh-TW', a.key, a.label),
      a.key,
    ])),
    [items, query]
  );

  return (
    <div className="favorites" style={ { height: '100%', display: 'flex', flexDirection: 'column' } }>
      {/* 顶部工具栏: 左=搜索框, 右=收藏总数 + 清空 */}
      <div className="appstore-toolbar">
        <Input
          size="small"
          allowClear
          value={ query }
          style={ { width: 220 } }
          prefix={ <SearchOutlined /> }
          placeholder={ tr(favoritesLang, locale, 'search', '搜索收藏的应用') }
          onChange={ (e) => setQuery(e.target.value) }
        />
        <Space size={ 12 } className="favorites-toolbar-right">
          <Text type="secondary" className="appstore-toolbar-count">
            { trTpl(favoritesLang, locale, 'count', { n: items.length }) }
          </Text>
          { items.length > 0 && (
            <Popconfirm
              title={ tr(favoritesLang, locale, 'clearConfirm', '确定清空全部收藏吗？') }
              okText={ tr(favoritesLang, locale, 'clear', '清空收藏') }
              cancelText={ tr(favoritesLang, locale, 'cancel', '取消') }
              onConfirm={ clearFavorites }
            >
              <Button size="small" danger icon={ <ClearOutlined /> }>
                { tr(favoritesLang, locale, 'clear', '清空收藏') }
              </Button>
            </Popconfirm>
          ) }
        </Space>
      </div>

      <div className="appstore" style={ { flex: 1, minHeight: 0, overflowY: 'auto' } }>
        {
          visible.map((item) => (
            <AppItem
              key={ item.key }
              uri={ item.key }
              icon={ item.icon }
              label={ item.label }
              desktop={ item.desktop }
              web={ item.web }
            />
          ))
        }
        {
          // 尚未收藏任何应用
          items.length === 0 && (
            <div className="appstore-empty favorites-empty">
              <Empty
                image={ Empty.PRESENTED_IMAGE_SIMPLE }
                description={
                  <span className="favorites-empty-text">
                    <span className="favorites-empty-title">{ tr(favoritesLang, locale, 'empty', '还没有收藏的应用') }</span>
                    <span className="favorites-empty-hint">{ tr(favoritesLang, locale, 'emptyHint', '前往「应用中心」，点击应用右上角的星标即可收藏') }</span>
                  </span>
                }
              />
            </div>
          )
        }
        {
          // 有收藏但当前搜索无匹配
          items.length > 0 && visible.length === 0 && (
            <div className="appstore-empty">
              <Empty image={ Empty.PRESENTED_IMAGE_SIMPLE } description={ tr(favoritesLang, locale, 'noMatch', '没有匹配的收藏') } />
            </div>
          )
        }
      </div>
    </div>
  );
}

export default Favorites;
