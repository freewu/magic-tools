import '@testing-library/jest-dom';
import { cleanup, render } from '@testing-library/react';
import BrowserFingerprint from './index';

afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');

describe('BrowserFingerprint 页面', () => {
  test('页面渲染非空 (展示型/拖拽型/监听型)', () => {
    const { container } = render(<BrowserFingerprint />);
    expect(norm(container.textContent ?? '')).not.toBe('');
  });
});
