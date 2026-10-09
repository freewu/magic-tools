// 设置中心 -> 系统设置: 配置文件导入 / 导出
// 导出当前全部设置 (localStorage 快照) 为 JSON, 文件名带版本号与时间;
// 导入同结构文件后写回 localStorage 并刷新页面生效。
import { useRef, useState } from 'react';
import { Button, Divider, Form, Space, Typography, message } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocale } from '../../hook/locale-context';
import { tr, trTpl } from '../../i18n/lang';
import { saveTextFile } from '../../lib/tauri';
import {
  ConfigError,
  applyConfig,
  buildConfig,
  configFileName,
  parseConfig,
  reloadPage,
  serializeConfig,
  type ConfigErrorCode,
} from '../../lib/config';
import settingLang from './lang';

/** 解析错误码 -> 语言包键 */
const ERROR_KEY: Record<ConfigErrorCode, string> = {
  'invalid-json': 'configErrInvalidJson',
  'invalid-format': 'configErrFormat',
  'not-magic-tools': 'configErrNotMagicTools',
  'missing-settings': 'configErrMissingSettings',
};

/** 解析错误码 -> 兜底中文 (语言包缺词条时) */
const ERROR_FALLBACK: Record<ConfigErrorCode, string> = {
  'invalid-json': '不是合法的 JSON 文件',
  'invalid-format': '配置文件格式不正确',
  'not-magic-tools': '不是 MagicTools 配置文件',
  'missing-settings': '配置文件缺少 settings 字段',
};

/** 导入成功后延迟刷新, 留出提示信息的展示时间 */
const RELOAD_DELAY_MS = 800;

export const SettingConfig = () => {
  const { locale } = useLocale();
  const [ messageApi, contextHolder ] = message.useMessage();
  const [ exporting, setExporting ] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const t = (key: string, fallback: string) => tr(settingLang, locale, key, fallback);

  // 导出: 生成配置 -> 系统保存框 / 浏览器下载
  const onExport = async () => {
    setExporting(true);
    try {
      const config = buildConfig();
      const count = Object.keys(config.settings).length;
      const name = configFileName(config.appVersion);
      const ok = await saveTextFile(name, serializeConfig(config), t('configSaveTitle', '保存配置文件'), {
        filterName: t('configFilter', 'JSON 配置文件'),
        extensions: [ 'json' ],
      });
      if (ok) {
        messageApi.success(trTpl(settingLang, locale, 'configExported', { n: count }, `已导出 ${count} 项配置`));
      }
    } catch (err) {
      messageApi.error(t('configErrExport', '导出配置文件失败'));
      console.error('export config failed:', err);
    } finally {
      setExporting(false);
    }
  };

  // 导入: 解析校验 -> 写回 localStorage -> 刷新页面
  const importText = (text: string) => {
    try {
      const config = parseConfig(text);
      const count = applyConfig(config);
      messageApi.success(trTpl(settingLang, locale, 'configImported', { n: count }, `已导入 ${count} 项配置, 页面即将刷新`));
      window.setTimeout(() => reloadPage(), RELOAD_DELAY_MS);
    } catch (err) {
      const code: ConfigErrorCode = err instanceof ConfigError ? err.code : 'invalid-format';
      messageApi.error(t(ERROR_KEY[code], ERROR_FALLBACK[code]));
    }
  };

  const onPickFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    file.text()
      .then(importText)
      .catch((err) => {
        messageApi.error(t('configErrRead', '读取配置文件失败'));
        console.error('read config failed:', err);
      });
  };

  return (
    <>
      { contextHolder }
      <Divider orientation="left" plain>{ t('configDivider', '配置文件') }</Divider>
      <Form.Item label={ t('configLabel', '导入 / 导出') }>
        <Space wrap>
          <Button
            icon={ <DownloadOutlined /> }
            loading={ exporting }
            onClick={ () => { void onExport(); } }
          >{ t('configExport', '导出配置') }</Button>
          <Button
            icon={ <UploadOutlined /> }
            onClick={ () => fileRef.current?.click() }
          >{ t('configImport', '导入配置') }</Button>
          <Typography.Text type="secondary" style={ { fontSize: 12 } }>
            { t('configHint', '导出为 JSON 文件 (含版本号与时间), 导入后自动刷新页面') }
          </Typography.Text>
        </Space>
        <input
          ref={ fileRef }
          type="file"
          accept=".json,application/json"
          style={ { display: 'none' } }
          onChange={ (e) => { onPickFile(e.target.files); e.target.value = ''; } }
        />
      </Form.Item>
    </>
  );
};
