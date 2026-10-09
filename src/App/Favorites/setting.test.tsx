import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { FavoritesSetting } from './setting';
import { LocaleProvider } from '../../hook/locale-context';
import { getDefaultGroupByType } from './lib';

const renderSetting = () => render(
  <LocaleProvider>
    <FavoritesSetting />
  </LocaleProvider>
);

beforeEach(() => localStorage.clear());

describe('设置中心 我的收藏设置', () => {
  test('开关默认关闭, 切换后写入设置', () => {
    renderSetting();
    expect(getDefaultGroupByType()).toBe(false);
    const sw = screen.getByRole('switch');
    expect(sw).not.toBeChecked();

    fireEvent.click(sw);
    expect(getDefaultGroupByType()).toBe(true);
    expect(sw).toBeChecked();

    fireEvent.click(sw);
    expect(getDefaultGroupByType()).toBe(false);
    expect(sw).not.toBeChecked();
  });

  test('已开启时初始即为打开状态', () => {
    localStorage.setItem('favorites:group-by-type', 'true');
    renderSetting();
    expect(screen.getByRole('switch')).toBeChecked();
  });
});
