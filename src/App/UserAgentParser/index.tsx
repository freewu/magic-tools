import { Alert, Button, Card, Descriptions, Input, Space, Tag, Typography, message } from 'antd';
import { CompassOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { parseUserAgent } from './lib';
import type { UAInfo } from './lib';

const { Text } = Typography;

const DEVICE_LABEL: Record<UAInfo['deviceType'], string> = {
  mobile: '手机',
  tablet: '平板',
  desktop: '桌面设备',
  tv: '电视 / 大屏',
  bot: '爬虫 / 程序',
  unknown: '未知',
};

const UserAgentParser: React.FC = () => {
  // 页面加载自动分析当前浏览器 UA
  const [ua, setUa] = useState(() => (typeof navigator !== 'undefined' ? navigator.userAgent : ''));
  const info = useMemo(() => parseUserAgent(ua), [ua]);

  const isBot = info.deviceType === 'bot';

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="UA 解析器"
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
          {[
            ['Chrome (Win11)', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'],
            ['Edge', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'],
            ['Firefox (macOS)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0'],
            ['Safari (iPhone)', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'],
            ['Chrome (Android)', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'],
            ['Safari (iPad)', 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'],
            ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
            ['curl', 'curl/8.4.0'],
          ].map(([label, u]) => (
            <Button key={label} size="small" onClick={() => { setUa(u); message.info(`已载入 ${label} UA`); }}>{label}</Button>
          ))}
        </Space>
      </Card>
    </Space>
  );
};

export default UserAgentParser;
