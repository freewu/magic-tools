import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ZucCryptoSetting } from './setting';
import { LocaleProvider } from '../../hook/locale-context';
import { getDefaultAlgorithm, getDefaultCode, getDefaultIV, getDefaultKey } from './lib';

const setup = () => render(<LocaleProvider><ZucCryptoSetting /></LocaleProvider>);

const inputs = (c :HTMLElement) => Array.from(c.querySelectorAll('.ant-input')) as HTMLInputElement[];
const keyInput = (c :HTMLElement) => inputs(c)[0];
const ivInput = (c :HTMLElement) => inputs(c)[1];

const selectOption = (c :HTMLElement, index :number, optionText :string) => {
  fireEvent.mouseDown(c.querySelectorAll('.ant-select-selector')[index]);
  const option = screen.getAllByText(optionText).find((el) => el.closest('.ant-select-item'));
  if (!option) throw new Error('未找到选项: ' + optionText);
  fireEvent.click(option);
};

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe('祖冲之序列密码 设置项', () => {
  test('渲染默认算法 / 默认编码 / 默认密钥 / 默认偏移量 IV 四项', () => {
    const { container } = setup();
    expect(screen.getByText('祖冲之序列密码')).toBeInTheDocument();
    expect(container.querySelectorAll('.ant-select').length).toBe(2);
    expect(inputs(container).length).toBe(2);
    expect(screen.getByText('默认算法')).toBeInTheDocument();
    expect(screen.getByText('默认编码')).toBeInTheDocument();
    expect(screen.getByText('默认密钥')).toBeInTheDocument();
    expect(screen.getByText('默认偏移量(IV)')).toBeInTheDocument();
  });

  test('修改默认算法 / 编码即持久化', () => {
    const { container } = setup();
    selectOption(container, 0, 'ZUC-256');
    selectOption(container, 1, 'Base64');
    expect(getDefaultAlgorithm()).toBe('ZUC-256');
    expect(getDefaultCode()).toBe('Base64');
  });

  test('已保存的默认值会回显 (密钥 / IV 定长 HEX)', () => {
    localStorage.setItem('zuc-crypto:default-algorithm', 'ZUC-256');
    localStorage.setItem('zuc-crypto:default-key', 'ab'.repeat(32));
    localStorage.setItem('zuc-crypto:default-iv', 'cd'.repeat(23));
    const { container } = setup();
    expect(keyInput(container).value).toBe('ab'.repeat(32));
    expect(ivInput(container).value).toBe('cd'.repeat(23));
    // 长度计数 (HEX 位数 / 上限): ZUC-256 密钥 64 位, IV 46 位
    expect(screen.getByText('64 / 64')).toBeInTheDocument();
    expect(screen.getByText('46 / 46')).toBeInTheDocument();
    expect(container.querySelectorAll('.ant-input-status-error').length).toBe(0);
  });

  test('输入合法定长 HEX 才落库, 半成品不写入 (但输入框会标红)', () => {
    const { container } = setup();

    // 长度不足: 不落库 + 标红
    fireEvent.change(keyInput(container), { target: { value: 'ab'.repeat(15) } });
    expect(getDefaultKey()).toBe('');
    expect(container.querySelectorAll('.ant-input-status-error').length).toBe(1);

    // 补足到 16 字节: 落库 + 恢复正常
    fireEvent.change(keyInput(container), { target: { value: 'ab'.repeat(16) } });
    expect(getDefaultKey()).toBe('ab'.repeat(16));
    expect(container.querySelectorAll('.ant-input-status-error').length).toBe(0);

    // IV 同理 (ZUC-128 为 16 字节)
    fireEvent.change(ivInput(container), { target: { value: 'cd'.repeat(16) } });
    expect(getDefaultIV()).toBe('cd'.repeat(16));

    // 清空 -> 落库为空串
    fireEvent.change(keyInput(container), { target: { value: '' } });
    expect(getDefaultKey()).toBe('');
  });

  test('切换算法时清掉长度已不匹配的默认密钥 / IV', () => {
    localStorage.setItem('zuc-crypto:default-key', 'ab'.repeat(16));
    localStorage.setItem('zuc-crypto:default-iv', 'cd'.repeat(16));
    const { container } = setup();
    expect(getDefaultKey()).toBe('ab'.repeat(16));

    // ZUC-128 (16/16) -> ZUC-256 (32/23): 原值长度不匹配, 一并清空, 避免工具页带出用不了的值
    selectOption(container, 0, 'ZUC-256');
    expect(getDefaultKey()).toBe('');
    expect(getDefaultIV()).toBe('');
    expect(keyInput(container).value).toBe('');
    expect(ivInput(container).value).toBe('');
    expect(container.querySelectorAll('.ant-input-status-error').length).toBe(0);
  });
});
