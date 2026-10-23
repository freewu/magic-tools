import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Form } from 'antd';
import { LocaleProvider } from '../../hook/locale-context';
import { AppStoreSetting } from './setting';
import { APP_TYPES } from '../app-types';
import {
  ALL_APP_TYPES,
  VISIBLE_TYPES_EVENT,
  VISIBLE_TYPES_STORAGE_KEY,
  getVisibleAppTypes,
} from '../../lib/app-type-filter';

// App/index.tsx 有顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩成固定应用列表
jest.mock('../index', () => ({
  appList: [
    { key: 'AESCrypto', label: 'AES 加解密', type: 'crypto', desktop: false, web: false, icon: null },
  ],
}));

// 语言包全量导入较重且与本用例无关, 只校验默认应用下拉的渲染
jest.mock('../app-i18n', () => ({
  appNameOf: (_locale :string, _key :string, fallback :string) => fallback,
}));

const renderSetting = () => render(
  <LocaleProvider>
    <Form>
      <AppStoreSetting />
    </Form>
  </LocaleProvider>
);

describe('设置中心 应用中心展示类型', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('默认全选, 每个分类一个勾选框', () => {
    renderSetting();
    const all = screen.getByRole('checkbox', { name: '全选' }) as HTMLInputElement;
    expect(all.checked).toBe(true);
    for (const item of APP_TYPES) {
      const box = screen.getByRole('checkbox', { name: item.name }) as HTMLInputElement;
      expect(box.checked).toBe(true);
    }
  });

  test('取消勾选后持久化并广播事件', () => {
    const seen: string[][] = [];
    const onTypes = (e :Event) => seen.push((e as CustomEvent<string[]>).detail);
    window.addEventListener(VISIBLE_TYPES_EVENT, onTypes);

    renderSetting();
    fireEvent.click(screen.getByRole('checkbox', { name: '游戏' }));
    window.removeEventListener(VISIBLE_TYPES_EVENT, onTypes);

    expect(getVisibleAppTypes()).toEqual(ALL_APP_TYPES.filter((k) => k !== 'game'));
    expect(JSON.parse(localStorage.getItem(VISIBLE_TYPES_STORAGE_KEY) as string))
      .toEqual(ALL_APP_TYPES.filter((k) => k !== 'game'));
    expect(seen).toHaveLength(1);
    expect(seen[0]).not.toContain('game');
    expect((screen.getByRole('checkbox', { name: '游戏' }) as HTMLInputElement).checked).toBe(false);
    // 部分勾选时「全选」呈半选状态
    const all = screen.getByRole('checkbox', { name: '全选' });
    expect(all.closest('.ant-checkbox')).toHaveClass('ant-checkbox-indeterminate');
  });

  test('「全选」可一键清空 / 恢复', () => {
    renderSetting();
    fireEvent.click(screen.getByRole('checkbox', { name: '全选' }));
    expect(getVisibleAppTypes()).toEqual([]);
    for (const item of APP_TYPES) {
      expect((screen.getByRole('checkbox', { name: item.name }) as HTMLInputElement).checked).toBe(false);
    }
    fireEvent.click(screen.getByRole('checkbox', { name: '全选' }));
    expect(getVisibleAppTypes()).toEqual(ALL_APP_TYPES);
    for (const item of APP_TYPES) {
      expect((screen.getByRole('checkbox', { name: item.name }) as HTMLInputElement).checked).toBe(true);
    }
  });

  test('已保存的分类在重新渲染时回填', () => {
    localStorage.setItem(VISIBLE_TYPES_STORAGE_KEY, JSON.stringify([ 'game' ]));
    renderSetting();
    const group = document.querySelector('.ant-checkbox-group') as HTMLElement;
    expect(within(group).getAllByRole('checkbox')).toHaveLength(APP_TYPES.length);
    expect((screen.getByRole('checkbox', { name: '游戏' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: '类型转换' }) as HTMLInputElement).checked).toBe(false);
  });
});
