import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SettingConfig } from './setting-config';
import { CONFIG_APP_ID } from '../../lib/config';

// 保存对话框 / 页面刷新 / 各 app 配置收集在测试中打桩, 其余配置逻辑走真实实现
jest.mock('../../lib/tauri', () => ({ saveTextFile: jest.fn(async () => true) }));
jest.mock('../../lib/config', () => {
  const actual = jest.requireActual('../../lib/config');
  return { ...actual, reloadPage: jest.fn() };
});
jest.mock('../app-config-registry', () => ({
  loadAppConfigs: jest.fn(async () => ({ AESCrypto: { Mode: 'CBC', Padding: 'Pkcs7' } })),
  saveAppConfigs: jest.fn(async () => 2),
}));

import { saveTextFile } from '../../lib/tauri';
import { reloadPage } from '../../lib/config';
import { loadAppConfigs, saveAppConfigs } from '../app-config-registry';

const saveMock = saveTextFile as jest.Mock;
const reloadMock = reloadPage as jest.Mock;
const loadAppsMock = loadAppConfigs as jest.Mock;
const saveAppsMock = saveAppConfigs as jest.Mock;

const fileInput = (container: HTMLElement): HTMLInputElement =>
  container.querySelector('input[type="file"]') as HTMLInputElement;

beforeEach(() => {
  localStorage.clear();
  saveMock.mockClear();
  reloadMock.mockClear();
  loadAppsMock.mockClear();
  saveAppsMock.mockClear();
  loadAppsMock.mockResolvedValue({ AESCrypto: { Mode: 'CBC', Padding: 'Pkcs7' } });
  saveAppsMock.mockResolvedValue(2);
});

describe('设置中心 配置文件导入 / 导出', () => {
  test('导出: 文件名带版本号与时间, 内容含全局设置与各 app 配置', async () => {
    localStorage.setItem('theme-mode', 'dark');
    render(<SettingConfig />);

    fireEvent.click(screen.getByRole('button', { name: /导出配置/ }));

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    const [ name, content ] = saveMock.mock.calls[0] as [ string, string ];

    // magic-tools.config.<version>.<yyyymmddHHiiss>.json
    expect(name).toMatch(/^magic-tools\.config\.[\d.]+\.\d{14}\.json$/);

    const parsed = JSON.parse(content);
    expect(parsed.app).toBe(CONFIG_APP_ID);
    expect(typeof parsed.appVersion).toBe('string');
    expect(parsed.exportedAt).toBeTruthy();
    expect(parsed.settings[ 'theme-mode' ]).toBe('dark');
    // 各 app 默认配置 (经 getDefault* 收集)
    expect(loadAppsMock).toHaveBeenCalled();
    expect(parsed.apps).toEqual({ AESCrypto: { Mode: 'CBC', Padding: 'Pkcs7' } });
  });

  test('导出: 收集各 app 配置失败时仍导出全局设置', async () => {
    loadAppsMock.mockRejectedValueOnce(new Error('boom'));
    render(<SettingConfig />);

    fireEvent.click(screen.getByRole('button', { name: /导出配置/ }));

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    const parsed = JSON.parse((saveMock.mock.calls[0] as [ string, string ])[1]);
    expect(parsed.apps).toEqual({});
  });

  test('导入: 全局设置与各 app 配置均写回, 随后刷新页面', async () => {
    const { container } = render(<SettingConfig />);
    const file = new File(
      [ JSON.stringify({
        app: CONFIG_APP_ID,
        settings: { 'app-locale': 'en', 'sider-width': '260' },
        apps: { AESCrypto: { Mode: 'GCM' } },
      }) ],
      'magic-tools.config.json',
      { type: 'application/json' },
    );

    fireEvent.change(fileInput(container), { target: { files: [ file ] } });

    await waitFor(() => expect(localStorage.getItem('app-locale')).toBe('en'));
    expect(localStorage.getItem('sider-width')).toBe('260');
    // 各 app 配置经 setDefault* 写回
    expect(saveAppsMock).toHaveBeenCalledWith({ AESCrypto: { Mode: 'GCM' } });
    await waitFor(() => expect(reloadMock).toHaveBeenCalled());
  });

  test('导入非法文件: 提示错误且不写入任何配置', async () => {
    const { container } = render(<SettingConfig />);
    const file = new File([ 'not json' ], 'bad.json', { type: 'application/json' });

    fireEvent.change(fileInput(container), { target: { files: [ file ] } });

    expect(await screen.findByText('不是合法的 JSON 文件')).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
    expect(saveAppsMock).not.toHaveBeenCalled();
    expect(reloadMock).not.toHaveBeenCalled();
  });

  test('导入非 MagicTools 文件: 提示对应错误', async () => {
    const { container } = render(<SettingConfig />);
    const file = new File(
      [ JSON.stringify({ app: 'other', settings: {} }) ],
      'other.json',
      { type: 'application/json' },
    );

    fireEvent.change(fileInput(container), { target: { files: [ file ] } });

    expect(await screen.findByText('不是 MagicTools 配置文件')).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });
});
