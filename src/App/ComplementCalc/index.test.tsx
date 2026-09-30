import '@testing-library/jest-dom';
import { cleanup, render } from '@testing-library/react';
import ComplementCalc from './index';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');

describe('ComplementCalc 页面', () => {
  test('页面渲染非空 (展示型/拖拽型/监听型)', () => {
    const { container } = render(<ComplementCalc />);
    expect(norm(container.textContent ?? '')).not.toBe('');
  });
});
