import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { LocaleProvider } from '../../hook/locale-context';
import { NesEmulatorSetting } from './setting';
import { getDefaultOptions, setDefaultOptions } from './lib';

const renderSetting = () => render(
  <LocaleProvider>
    <Form>
      <NesEmulatorSetting />
    </Form>
  </LocaleProvider>,
);

describe('设置中心 NES 模拟器: 全屏虚拟按键', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('默认显示按键, 透明度滑块可用', () => {
    renderSetting();
    expect(screen.getByText('全屏虚拟按键')).toBeInTheDocument();
    expect(screen.getByText('按键透明度')).toBeInTheDocument();
    expect(screen.getByTestId('nes-show-pad')).toBeChecked();
    expect(document.querySelector('.ant-slider-disabled')).toBeNull();
  });

  test('关掉「全屏虚拟按键」会写入设置, 并禁用透明度滑块', () => {
    renderSetting();
    fireEvent.click(screen.getByTestId('nes-show-pad'));
    expect(getDefaultOptions().showPad).toBe(false);
    expect(document.querySelector('.ant-slider-disabled')).not.toBeNull();
  });

  test('已保存的关闭状态会被读出来', () => {
    setDefaultOptions({ showPad: false, padOpacity: 45 });
    renderSetting();
    expect(screen.getByTestId('nes-show-pad')).not.toBeChecked();
    expect(getDefaultOptions().padOpacity).toBe(45);
  });
});
