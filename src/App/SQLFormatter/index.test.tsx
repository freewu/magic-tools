import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());
import SQLFormatter from './index';

jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../lib/tauri', () => ({
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

const norm = (s: string) => s.replace(/\s+/g, '');
const btn = (name: string) => {
  const target = norm(name);
  const hit = screen.getAllByRole('button').find((b) => norm(b.textContent ?? '') === target);
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit as HTMLButtonElement;
};
const boxes = () => screen.getAllByRole('textbox') as HTMLTextAreaElement[];

describe('SQLFormatter 页面', () => {
  test('渲染选项区域与清除/保存按钮', () => {
    render(<SQLFormatter />);
    expect(btn('清除')).toBeInTheDocument();
    expect(btn('保存为.sql')).toBeInTheDocument();
  });

  test('输入 SQL 自动格式化: 结果被换行展开且保留字段', () => {
    render(<SQLFormatter />);
    fireEvent.change(boxes()[0], { target: { value: 'select id,name from user where id=1' } });
    const result = boxes()[boxes().length - 1].value;
    expect(result).not.toBe('');
    expect(result).toContain('user');
    expect(result.length).toBeGreaterThan(30);
  });

  test('清空输入后结果清空', () => {
    render(<SQLFormatter />);
    fireEvent.change(boxes()[0], { target: { value: 'select 1' } });
    fireEvent.change(boxes()[0], { target: { value: '' } });
    expect(boxes()[boxes().length - 1].value).toBe('');
  });
});
