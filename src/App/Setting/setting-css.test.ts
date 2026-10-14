import fs from 'fs';
import path from 'path';

// 设置中心分隔线的样式靠 CSS 类名钩子生效 (jsdom 不做布局, 无法断言实际渲染宽度),
// 这里做源码级守卫: 防止样式规则或类名被误删 (参考 lang.test.ts 的做法)
const read = (file: string) => fs.readFileSync(path.join(__dirname, file), 'utf8');

describe('设置中心 分隔标题 / 分隔线样式', () => {
  const css = read('setting.css');
  const tsx = read('index.tsx');

  test('分隔标题: 蓝紫色 #4c6cb3 且加粗 (深色模式由主题变量换成更亮的同色相)', () => {
    expect(css).toMatch(/\.setting-body \.ant-divider-inner-text\s*\{[^}]*font-weight:\s*700/);
    expect(css).toMatch(/\.setting-body \.ant-divider-inner-text\s*\{[^}]*color:\s*var\(--app-divider-text,\s*#4c6cb3\)/);
  });

  test('分隔线: 抵消卡片左右 padding 实现 100% 通栏', () => {
    expect(css).toMatch(/\.setting-panel > \.ant-divider-horizontal\s*\{[^}]*margin-inline:\s*-16px/);
  });

  test('分隔线: 文字前不留一小段线, 标题与表单标签左对齐', () => {
    // antd orientation="left" 渲染的类名是 ant-divider-with-text-start (::before 默认占 5%)
    expect(css).toContain('.setting-panel > .ant-divider-with-text-start::before');
    expect(css).toMatch(/\.setting-panel > \.ant-divider-horizontal > \.ant-divider-inner-text\s*\{[^}]*margin-inline-start:\s*16px/);
  });

  test('DOM 类名钩子存在: setting-body / setting-panel', () => {
    expect(tsx).toContain('className="setting-body"');
    expect(tsx).toContain('className="setting-panel"');
  });
});
