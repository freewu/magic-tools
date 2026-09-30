import '@testing-library/jest-dom';
import { cleanup, render } from '@testing-library/react';
import CodeShot from './index';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../lib/tauri', () => ({
  saveTextFile: jest.fn().mockResolvedValue(true),
  openUrl: jest.fn(),
}));
jest.mock('./engine', () => ({
  ALL_LANG_IDS: [ 'javascript', 'typescript', 'python' ],
  highlightToHtml: jest.fn(async () => '<pre>code</pre>'),
  resolveThemeId: jest.fn(() => 'vs-dark'),
  themeBackground: jest.fn(() => '#1e1e1e'),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');

describe('CodeShot 页面', () => {
  test('页面渲染非空 (展示型/拖拽型/监听型)', () => {
    const { container } = render(<CodeShot />);
    expect(norm(container.textContent ?? '')).not.toBe('');
  });
});
