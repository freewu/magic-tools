
import { appList, genMenuList } from "../index";
import "./appstore.css"
import { default as AppType } from "./app-type";
import { Select, Typography } from 'antd';
import { useMemo, useState } from 'react';

const { Text } = Typography;

const AppStore = () => {
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
            { value: 'all', label: '全部分类' },
            ...menu.map((g) => ({ value: g.key, label: g.name })),
          ] }
        />
        <Text type="secondary" className="appstore-toolbar-count">共 { total } 个应用</Text>
      </div>
      <div className="appstore" style={ { flex: 1, minHeight: 0, overflowY: 'auto' } }>
        {
          groups.map((parent, index) => {
            return (
              <AppType
                uri= { parent.key }
                key= { parent.key + index }
                name= { parent.name }
                children={ parent.children }/>
            );
          })
        }
      </div>
    </div>
  );
}

export default AppStore;
