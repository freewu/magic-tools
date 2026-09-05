import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';

// App/index.tsx 使用 top-level await (webpack 支持, jest 环境不支持),
// 在测试中 mock 掉, 只渲染 Main 组件验证整体布局
jest.mock('../App', () => ({
  appList: [],
  genMenuList: () => [],
}));

// app-modules 使用 import.meta.glob (Vite 专用), ts-jest 下需 mock
jest.mock('../App/app-modules', () => ({
  // 返回可渲染的空组件 (避免 React "Element type is invalid")
  lazyPage: () => (function Dummy() { return null; }) as never,
  defineLoader: () => undefined,
}));

import Main from '../Main';

describe('App', () => {
  it('should render', () => {
    expect(
      render(
        <HashRouter>
          <Main />
        </HashRouter>
      )
    ).toBeTruthy();
  });
});
