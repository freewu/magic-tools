import { Alert, Button, Divider, Input, message, Progress, Space, Table, Tag, theme, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import {
  CopyOutlined,
  DownloadOutlined,
  LinkOutlined,
  LoadingOutlined,
  ScissorOutlined,
} from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { isTauri, openUrl } from '../../lib/tauri';
import DesktopOnlyNotice from '../../lib/desktop';
import { useLocale } from '../../hook/locale-context';
import {
  detectPlatform, extractUrl, fetchPlan, formatBytes, formatDuration, htmlParserOf, isPlatformSupported,
  mediaFileName, parseTwitter, UNKNOWN_PLATFORM, UNSUPPORTED_PLATFORMS, type MediaInfo, type MediaStream,
  type Platform,
} from './lib';
import { cancelDownload, downloadMedia, fetchText, pickSavePath } from './fetch';
import { vx, vxT } from './lang';
import VideoExtractIntro from './intro';

const { Text } = Typography;

/** 下载中的任务状态 */
type DownloadState = {
  /** 正在下载的流 id */
  id: string;
  /** 进度百分比 (总大小未知时为 0) */
  percent: number;
  /** 已下载字节 */
  written: number;
  /** 总字节 (未知为 0) */
  total: number;
};

const VideoExtract = () => {
  const { locale } = useLocale();
  const t = (zh: string) => vx(locale, zh);
  const tt = (zh: string, v: Record<string, string | number>) => vxT(locale, zh, v);

  const { token } = theme.useToken();
  const [ notice, contextHolder ] = message.useMessage();

  const [ input, setInput ] = useState('');
  const [ loading, setLoading ] = useState(false);
  const [ info, setInfo ] = useState<MediaInfo | null>(null);
  const [ platform, setPlatform ] = useState<Platform>(UNKNOWN_PLATFORM);
  const [ download, setDownload ] = useState<DownloadState | null>(null);

  const desktop = isTauri();

  // 提取: 识别平台 -> 抓分享页 -> 解析直链
  const extract = async () => {
    if (!desktop) return;
    const target = extractUrl(input) || input.trim();
    if (target === '') {
      notice.warning(t('请先粘贴视频分享链接或分享文案'));
      return;
    }
    if (!/^https?:\/\//i.test(target)) {
      notice.warning(t('链接必须以 http:// 或 https:// 开头'));
      return;
    }

    const found = detectPlatform(target);
    setPlatform(found);
    if (!isPlatformSupported(found)) {
      notice.warning(tt('暂不支持 {name} 的自动解析 (平台接口不公开), 可改用 yt-dlp 下载', { name: found.name }));
      return;
    }

    setLoading(true);
    setInfo(null);
    try {
      const plans = fetchPlan(target, found);
      const parser = htmlParserOf(found.id);
      let result: MediaInfo | null = null;
      let lastError: Error | null = null;

      for (const plan of plans) {
        try {
          const res = await fetchText(plan.url, found.referer);
          const parsed = plan.json ? parseTwitter(res.text, res.finalUrl) : parser(res.text, res.finalUrl);
          // 页面地址始终用用户粘贴的解析结果 (接口地址对用户无意义)
          parsed.pageUrl = plan.json ? target : (res.finalUrl || target);
          result = parsed;
          // 拿到直链就不再尝试备用地址
          if (parsed.streams.length > 0) break;
        } catch (err) {
          lastError = err as Error;
        }
      }

      if (!result) throw lastError ?? new Error(t('解析失败'));
      setInfo(result);
      if (result.streams.length === 0) notice.warning(t('没有解析到直链, 详见下方提示'));
      else notice.success(tt('解析成功: 共 {n} 条直链', { n: result.streams.length }));
    } catch (err) {
      notice.error(tt('解析失败: {msg}', { msg: (err as Error).message }));
    } finally {
      setLoading(false);
    }
  };

  // 复制直链
  const copyLink = (url: string) => {
    void copyTextToClipboard(url);
    notice.success(t('复制到粘贴板成功!!!'));
  };

  // 下载: 选保存路径 -> Rust 流式下载 -> 进度回调
  const startDownload = async (stream: MediaStream) => {
    if (!desktop) return;
    if (info === null) return;
    if (download !== null) {
      notice.warning(t('请等待当前下载完成, 或先点「取消」'));
      return;
    }
    const dest = await pickSavePath(mediaFileName(info, stream));
    if (dest === null) return;

    setDownload({ id: stream.id, percent: 0, written: 0, total: stream.size ?? 0 });
    try {
      const bytes = await downloadMedia({
        url: stream.url,
        referer: info.referer,
        dest,
        onProgress: (p) => {
          const total = p.total > 0 ? p.total : (stream.size ?? 0);
          setDownload({
            id: stream.id,
            percent: total > 0 ? Math.min(100, Math.round((p.written / total) * 100)) : 0,
            written: p.written,
            total,
          });
        },
      });
      notice.success(tt('已保存: {size}', { size: formatBytes(bytes) }));
    } catch (err) {
      notice.error(tt('下载失败: {msg}', { msg: (err as Error).message }));
    } finally {
      setDownload(null);
    }
  };

  // 取消下载
  const stopDownload = async () => {
    await cancelDownload();
    notice.info(t('已取消下载'));
  };

  const kindTag = (kind: MediaStream['kind']) => {
    const map = {
      video: { color: 'blue', text: '视频' },
      audio: { color: 'green', text: '音频' },
      muxed: { color: 'purple', text: '音视频' },
    } as const;
    const item = map[kind];
    return <Tag color={ item.color }>{ t(item.text) }</Tag>;
  };

  const columns: ColumnsType<MediaStream> = [
    {
      title: t('类型'),
      dataIndex: 'kind',
      width: 96,
      render: (kind: MediaStream['kind']) => kindTag(kind),
    },
    {
      title: t('清晰度'),
      dataIndex: 'quality',
      width: 120,
      render: (v: string | undefined) => v ?? '--',
    },
    {
      title: t('编码'),
      dataIndex: 'codec',
      width: 110,
      render: (v: string | undefined) => v ?? '--',
    },
    {
      title: t('体积'),
      dataIndex: 'size',
      width: 100,
      render: (v: number | undefined) => formatBytes(v),
    },
    {
      title: t('格式'),
      dataIndex: 'ext',
      width: 80,
      render: (v: string | undefined) => v ?? '--',
    },
    {
      title: t('说明'),
      dataIndex: 'note',
      render: (v: string | undefined) => (v === undefined ? '--' : t(v)),
    },
    {
      title: t('操作'),
      key: 'action',
      width: 250,
      render: (_: unknown, stream) => (
        <Space size={ 4 } wrap>
          <Button
            size="small"
            type="primary"
            icon={ <DownloadOutlined /> }
            disabled={ !desktop || download !== null }
            onClick={ () => { void startDownload(stream); } }
          >{t('下载')}</Button>
          <Button size="small" icon={ <CopyOutlined /> } onClick={ () => { copyLink(stream.url); } }>{t('复制直链')}</Button>
          <Button size="small" icon={ <LinkOutlined /> } onClick={ () => { void openUrl(stream.url); } }>{t('打开')}</Button>
        </Space>
      ),
    },
  ];

  const hasStreams = info !== null && info.streams.length > 0;

  return (
    <div>
      {contextHolder}

      <Alert
        type="info"
        showIcon
        style={ { marginBottom: 12, maxWidth: 900 } }
        message={ t('粘贴视频分享链接 (或整段分享文案), 自动解析出无水印直链并下载') }
        description={
          <span style={ { fontSize: 12, color: token.colorTextSecondary } }>
            { t('支持 B 站 / 抖音 / TikTok / 小红书 / 微博 / X (Twitter) / Vimeo / YouTube / 通用网页; 仅处理公开内容, 不绕过登录、付费与 DRM') }
          </span>
        }
      />

      <Space.Compact style={ { width: '100%', maxWidth: 900 } }>
        <Input
          allowClear
          value={ input }
          prefix={ <ScissorOutlined /> }
          placeholder={ t('粘贴分享链接或分享文案, 如 https://v.douyin.com/xxxxxx/') }
          onChange={ (e) => { setInput(e.target.value); } }
          onPressEnter={ () => { void extract(); } }
        />
        <Button
          type="primary"
          loading={ loading }
          disabled={ !desktop }
          icon={ loading ? <LoadingOutlined /> : undefined }
          onClick={ () => { void extract(); } }
        >{t('提取')}</Button>
      </Space.Compact>

      { !desktop && (
        <DesktopOnlyNotice
          text={ t('该功能仅在桌面应用中可用') }
          download={ t('下载桌面版') }
          hint={ t('浏览器演示版受 CORS 限制, 无法请求各平台页面与 CDN; 桌面版 (Tauri) 无此限制, 还支持带进度的本地下载') }
        />
      ) }

      {/* 识别到的平台 */}
      { platform !== UNKNOWN_PLATFORM && (
        <div
          data-testid="vx-platform"
          style={ { margin: '10px 0', fontSize: 12, color: token.colorTextSecondary } }
        >
          { tt('识别平台: {name}', { name: platform.name }) }
          { !isPlatformSupported(platform) && <Tag color="orange" style={ { marginLeft: 6 } }>{ t('该平台暂不支持自动解析') }</Tag> }
        </div>
      ) }

      {/* 解析结果 */}
      { info !== null && (
        <div
          data-testid="vx-result"
          style={ {
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 6,
            padding: 12,
            margin: '12px 0',
            maxWidth: 1000,
            backgroundColor: token.colorFillQuaternary,
          } }
        >
          <div style={ { display: 'flex', gap: 12, flexWrap: 'wrap' } }>
            { info.cover !== undefined && info.cover !== '' && (
              <img
                className="vx-cover"
                src={ info.cover }
                alt={ info.title }
                referrerPolicy="no-referrer"
                style={ { width: 160, height: 90, objectFit: 'cover', borderRadius: 4, border: `1px solid ${token.colorBorderSecondary}` } }
              />
            ) }
            <div style={ { flex: 1, minWidth: 240 } }>
              <div data-testid="vx-title" style={ { fontWeight: 600, marginBottom: 6, wordBreak: 'break-word' } }>{ info.title }</div>
              <Space size={ 8 } wrap style={ { fontSize: 12, color: token.colorTextSecondary } }>
                { info.author !== undefined && info.author !== '' && <span>{ tt('作者: {v}', { v: info.author }) }</span> }
                <span>{ tt('时长: {v}', { v: formatDuration(info.duration) }) }</span>
                <span>{ tt('直链数: {v}', { v: info.streams.length }) }</span>
              </Space>
              <div style={ { marginTop: 6, fontSize: 12 } }>
                <a onClick={ () => { void openUrl(info.pageUrl); } }>{ t('打开原页面') }</a>
                <Divider type="vertical" />
                <a onClick={ () => { copyLink(info.pageUrl); } }>{ t('复制页面链接') }</a>
              </div>
            </div>
          </div>

          { info.warnings.length > 0 && (
            <div data-testid="vx-warnings" style={ { marginTop: 10 } }>
              { info.warnings.map((w) => (
                <Alert key={ w } type="warning" showIcon style={ { marginBottom: 6 } } message={ t(w) } />
              )) }
            </div>
          ) }

          { hasStreams && (
            <Table
              style={ { marginTop: 10 } }
              size="small"
              rowKey="id"
              pagination={ false }
              scroll={ { x: 900 } }
              dataSource={ info.streams }
              columns={ columns }
            />
          ) }

          {/* 下载进度 */}
          { download !== null && (
            <div data-testid="vx-progress" style={ { marginTop: 10 } }>
              <Progress
                percent={ download.percent }
                status="active"
                strokeColor="#1677ff"
                format={() => (download.percent > 0 ? `${download.percent}%` : formatBytes(download.written))}
              />
              <Space size={ 8 }>
                <Text type="secondary" style={ { fontSize: 12 } }>
                  { download.total > 0
                    ? tt('已下载 {a} / {b}', { a: formatBytes(download.written), b: formatBytes(download.total) })
                    : tt('已下载 {a}', { a: formatBytes(download.written) }) }
                </Text>
                <Button size="small" danger onClick={ () => { void stopDownload(); } }>{t('取消')}</Button>
              </Space>
            </div>
          ) }
        </div>
      ) }

      {/* 空态 */}
      { info === null && !loading && (
        <div style={ { color: token.colorTextTertiary, margin: '16px 0', maxWidth: 900 } }>
          { t('粘贴链接后点击「提取」: 先识别平台, 再从分享页里解析出标题、封面与可直接保存的媒体直链') }
          <br />
          { t('暂不支持: 快手 / 微信视频号 (接口不公开); 这类链接可改用 yt-dlp (qiaomu-download) 下载') }
        </div>
      ) }

      <Divider>{t('视频提取说明')}</Divider>

      <VideoExtractIntro />
    </div>
  );
};

export default VideoExtract;

/** 供测试与调用方使用: 暂不支持的平台 id 列表 */
export const VX_UNSUPPORTED = UNSUPPORTED_PLATFORMS;
