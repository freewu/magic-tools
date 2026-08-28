import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';

// App/index.tsx 使用 top-level await (webpack 支持, jest 环境不支持),
// 在测试中 mock 掉, 只渲染 Main 组件验证整体布局
jest.mock('../renderer/App', () => ({
  appList: [],
  genMenuList: () => [],
}));

import Main from '../renderer/Main';

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
