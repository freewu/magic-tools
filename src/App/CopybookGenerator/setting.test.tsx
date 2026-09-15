import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { CopybookGeneratorSetting } from './setting';
import { getDefaultByRow, getDefaultLoop } from './lib';

describe('CopybookGeneratorSetting 默认开关', () => {
  beforeEach(() => localStorage.clear());

  test('「默认循环填充 / 默认按行填充」初始值正确且点击后持久化', () => {
    render(<CopybookGeneratorSetting />);

    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
    expect(switches[0]).toBeChecked(); // 默认循环填充: 开
    expect(switches[1]).not.toBeChecked(); // 默认按行填充: 关

    fireEvent.click(switches[0]);
    fireEvent.click(switches[1]);

    expect(getDefaultLoop()).toBe(false);
    expect(getDefaultByRow()).toBe(true);
  });

  test('已保存的默认值会回显到开关上', () => {
    localStorage.setItem('copybook-generator.loop', '0');
    localStorage.setItem('copybook-generator.byRow', '1');
    render(<CopybookGeneratorSetting />);

    const switches = screen.getAllByRole('switch');
    expect(switches[0]).not.toBeChecked();
    expect(switches[1]).toBeChecked();
  });
});
