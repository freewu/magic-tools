import {
  Alert, Button, Card, Checkbox, Descriptions, Input, List, Space, Tabs, Tag, Typography, message,
} from 'antd';
import { CompassOutlined, CopyOutlined, ExperimentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { parseUserAgent, generateUaList, GEN_OS_LIST, GEN_BROWSER_LIST } from './lib';
import type { UAInfo, GenOS, GenBrowser } from './lib';

const { Text } = Typography;

const DEVICE_LABEL: Record<UAInfo['deviceType'], string> = {
  mobile: '手机',
  tablet: '平板',
  desktop: '桌面设备',
  tv: '电视 / 大屏',
  bot: '爬虫 / 程序',
  unknown: '未知',
};

const COMMON_UAS: Array<[string, string]> = [
  ['Chrome (Win11)', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'],
  ['Edge', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'],
  ['Firefox (macOS)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0'],
  ['Safari (iPhone)', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'],
  ['Chrome (Android)', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'],
  ['Safari (iPad)', 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'],
  ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
  ['curl', 'curl/8.4.0'],
];

const UserAgentParser: React.FC = () => {
  const [ua, setUa] = useState(() => (typeof navigator !== 'undefined' ? navigator.userAgent : ''));
  const info = useMemo(() => parseUserAgent(ua), [ua]);
  const isBot = info.deviceType === 'bot';

  // ---- 生成 tab 状态 ----
  const [genOS, setGenOS] = useState<GenOS[]>(['win11', 'win10', 'mac']);
  const [genBrowser, setGenBrowser] = useState<GenBrowser[]>(['chrome', 'edge', 'firefox', 'safari']);
  const [genVer, setGenVer] = useState('');
  const [generated, setGenerated] = useState<ReturnType<typeof generateUaList> | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制');
    } catch {
      message.error('复制失败, 请手动选择复制');
    }
  };

  return (
    <Tabs
      defaultActiveKey="parse"
      items={[
        {
          key: 'parse',
          label: (
            <span><CompassOutlined /> 解析</span>
          ),
          children: (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message="UA 解析"
                description="从 User-Agent 字符串中提取浏览器名称与版本、渲染引擎、操作系统、CPU 架构与设备信息。页面加载时已自动载入当前浏览器的 UA，也可粘贴任意 UA 字符串手动分析。"
              />
              <Card size="small" title="User-Agent 字符串" extra={
                <Text type="secondary" style={{ fontSize: 12 }}>{ua.length} 字符</Text>
              }>
                <Input.TextArea
                  value={ua}
                  onChange={(e) => setUa(e.target.value)}
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12 }}
                  placeholder="粘贴 User-Agent 字符串…"
                />
              </Card>

              {info.raw.trim() ? (
                <Card size="small" title="解析结果">
                  <Descriptions
                    size="small"
                    bordered
                    column={{ xs: 1, sm: 1, md: 2, lg: 2 }}
                    items={[
                      {
                        key: 'browser',
                        label: <Space size={4}><CompassOutlined /> 浏览器 / 程序</Space>,
                        children: (
                          <Space wrap size={6}>
                            <Text strong>{info.browserName || '—'}</Text>
                            {info.browserVersion && <Text code>{info.browserVersion}</Text>}
                            {isBot && info.botName && <Tag color="red">爬虫 / 非浏览器</Tag>}
                          </Space>
                        ),
                      },
                      { key: 'engine', label: '渲染引擎', children: info.engine },
                      {
                        key: 'os',
                        label: '操作系统',
                        children: info.osName !== '未知'
                          ? <Space size={6}><span>{info.osName}</span>{info.osVersion && <Text code>{info.osVersion}</Text>}</Space>
                          : '—',
                      },
                      { key: 'cpu', label: 'CPU 架构', children: info.cpuArch || '—' },
                      {
                        key: 'device',
                        label: '设备类型',
                        children: <Tag color={isBot ? 'red' : info.deviceType === 'desktop' ? 'blue' : 'green'}>{DEVICE_LABEL[info.deviceType]}</Tag>,
                      },
                      { key: 'model', label: '设备型号', children: info.deviceModel || '—' },
                    ]}
                  />
                  {isBot && (
                    <Alert
                      style={{ marginTop: 12 }}
                      type="warning"
                      showIcon
                      message={`检测到非浏览器程序: ${info.botName}`}
                      description="该 UA 通常来自搜索引擎爬虫或命令行/脚本请求，不是真实用户的浏览器。"
                    />
                  )}
                </Card>
              ) : (
                <Alert type="warning" showIcon message="请输入 User-Agent 字符串进行分析" />
              )}

              <Card size="small" title="常见 UA 速查" extra={<Button size="small" type="link" onClick={() => setUa('')}>清空</Button>}>
                <Space wrap size={8}>
                  {COMMON_UAS.map(([label, u]) => (
                    <Button key={label} size="small" onClick={() => { setUa(u); message.info(`已载入 ${label} UA`); }}>{label}</Button>
                  ))}
                </Space>
              </Card>
            </Space>
          ),
        },
        {
          key: 'generate',
          label: (
            <span><ExperimentOutlined /> 生成</span>
          ),
          children: (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message="UA 生成"
                description={
                  <>
                    勾选需要的「平台」与「浏览器」（可多选），点
                    <Text strong> 生成 UA 列表</Text> 即可得到全部组合的 UA 字符串，每条可单独复制或载入「解析」tab 验证。
                    Safari 仅有 macOS / iOS 版本，不支持的组合会自动跳过并标注。
                  </>
                }
              />
              <Card size="small" title="组合条件" extra={
                <Button type="primary" size="small" icon={<ThunderboltOutlined />}
                  disabled={genOS.length === 0 || genBrowser.length === 0}
                  onClick={() => setGenerated(generateUaList(genOS, genBrowser, genVer))}>
                  生成 UA 列表
                </Button>
              }>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>平台</Text>
                    <Checkbox.Group
                      options={GEN_OS_LIST.map((o) => ({ label: o.label, value: o.value }))}
                      value={genOS}
                      onChange={(v) => setGenOS(v as GenOS[])}
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>浏览器</Text>
                    <Checkbox.Group
                      options={GEN_BROWSER_LIST.map((b) => ({ label: b.label, value: b.value }))}
                      value={genBrowser}
                      onChange={(v) => setGenBrowser(v as GenBrowser[])}
                    />
                  </div>
                  <Space size={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>浏览器版本</Text>
                    <Input
                      size="small"
                      style={{ width: 180 }}
                      value={genVer}
                      onChange={(e) => setGenVer(e.target.value.replace(/[^\d.]/g, ''))}
                      placeholder="留空 = 各浏览器默认较新版本"
                      allowClear
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>（可选，例如 130）</Text>
                  </Space>
                </Space>
              </Card>

              {generated ? (
                <Card size="small" title={`生成结果 (${generated.filter((g) => g.ua).length} 条可用)`} extra={
                  <Button size="small" icon={<CopyOutlined />}
                    disabled={!generated.some((g) => g.ua)}
                    onClick={() => copy(generated.filter((g) => g.ua).map((g) => g.ua).join('\n'))}>
                    复制全部
                  </Button>
                }>
                  <List
                    size="small"
                    dataSource={generated}
                    renderItem={(g) => (
                      <List.Item
                        style={{ alignItems: 'flex-start' }}
                        actions={g.ua ? [
                          <Button key="c" size="small" icon={<CopyOutlined />} onClick={() => copy(g.ua!)}>复制</Button>,
                          <Button key="p" size="small" onClick={() => { setUa(g.ua!); message.success(`已载入「${g.label}」到解析`); }}>
                            载入解析
                          </Button>,
                        ] : []}
                      >
                        <Space direction="vertical" size={4} style={{ width: '100%', paddingRight: 8 }}>
                          <Space size={6}>
                            <Tag color={g.ua ? 'blue' : 'default'} style={{ minWidth: 120, textAlign: 'center', margin: 0 }}>{g.label}</Tag>
                            {!g.ua && <Text type="secondary" style={{ fontSize: 12 }}>该浏览器无此平台版本</Text>}
                          </Space>
                          {g.ua && (
                            <Text code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                              {g.ua}
                            </Text>
                          )}
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              ) : (
                <Alert type="info" showIcon message="尚未生成 — 勾选上方平台与浏览器组合后点击「生成 UA 列表」。" />
              )}
            </Space>
          ),
        },
      ]}
    />
  );
};

export default UserAgentParser;
