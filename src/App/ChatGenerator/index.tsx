// 聊天生成器: 左侧编辑对话 (平台 / 会话信息 / 手机状态栏 / 消息列表), 右侧实时预览并导出 PNG
import {
  Alert, Button, Card, Col, Divider, Input, InputNumber, Row, Segmented, Select, Space, Switch, Tabs, Tag,
  Tooltip, Typography, Upload, message,
} from 'antd';
import {
  ArrowDownOutlined, ArrowUpOutlined, CloudUploadOutlined, DeleteOutlined, DownloadOutlined, PictureOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { ChatPreview } from './preview';
import { useLocale } from '../../hook/locale-context';
import { savePngFile } from '../../lib/tauri';
import { cr, crT } from './lang';
import {
  IMAGE_MAX_CHARS, MESSAGES_MAX, NAME_MAX, NETWORKS, PLATFORMS, SCALES, TEXT_MAX, TIME_LABEL_MAX, TITLE_MAX,
  type ChatDoc, type ChatMessage, type ChatMessageType, type ChatNetwork, type ChatScale, type ChatSide,
  type ChatSystem, type PlatformId,
} from './data';
import {
  addMessage, clearMessages, createMessage, docFromDefaults, getDefaultScale, isTimeText, moveMessage,
  normalizeScale, removeMessage, sampleMessages, themeOf, updateMessage,
} from './lib';

const { Text, Paragraph } = Typography;

/** 消息类型 -> 文案 key (再走 lang 取词) */
const TYPE_LABEL: Record<ChatMessageType, string> = { text: '文字', image: '图片', voice: '语音', time: '时间' };

const ChatGenerator: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => cr(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => crT(locale, zh, v);

  // 会话状态 (含平台) 一次性从默认值初始化, 之后由页面自身维护
  const [doc, setDoc] = useState<ChatDoc>(() => docFromDefaults());
  const [scale, setScale] = useState<ChatScale>(() => getDefaultScale());
  const [exporting, setExporting] = useState(false);
  const shotRef = useRef<HTMLDivElement>(null);

  const theme = themeOf(doc.platform);
  const patch = (p: Partial<ChatDoc>) => setDoc((d) => ({ ...d, ...p }));

  // ---- 消息操作 ----
  const append = (type: ChatMessageType, side: ChatSide = 'in') => {
    if (doc.messages.length >= MESSAGES_MAX) {
      message.warning(tt('消息条数已达上限 {max} 条', { max: MESSAGES_MAX }));
      return;
    }
    patch({ messages: addMessage(doc.messages, createMessage(doc, type, side)) });
  };

  const onMove = (id: string, dir: 'up' | 'down') => patch({ messages: moveMessage(doc.messages, id, dir) });
  const onRemove = (id: string) => patch({ messages: removeMessage(doc.messages, id) });
  const onUpdate = (id: string, p: Partial<ChatMessage>) => patch({ messages: updateMessage(doc.messages, id, p) });

  /** 图片选择: 读成 data URL 后写入消息 (不落盘、不上传) */
  const onPickImage = (msg: ChatMessage, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => message.error(tt('读取图片失败: {msg}', { msg: 'FileReader error' }));
    reader.onload = () => {
      const url = String(reader.result ?? '');
      if (url.length > IMAGE_MAX_CHARS) {
        message.error(tt('图片过大 (超过 {size} MB), 请压缩后重试', { size: Math.round(IMAGE_MAX_CHARS / 1024 / 1024) }));
        return;
      }
      onUpdate(msg.id, { image: url });
    };
    reader.readAsDataURL(file);
  };

  /** 上传头像 (data URL, 仅本地使用) */
  const onPickAvatar = (side: ChatSide, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => message.error(tt('读取图片失败: {msg}', { msg: 'FileReader error' }));
    reader.onload = () => {
      const url = String(reader.result ?? '');
      if (url.length > IMAGE_MAX_CHARS) {
        message.error(tt('图片过大 (超过 {size} MB), 请压缩后重试', { size: Math.round(IMAGE_MAX_CHARS / 1024 / 1024) }));
        return;
      }
      patch(side === 'out' ? { avatarOut: url } : { avatarIn: url });
    };
    reader.readAsDataURL(file);
  };

  // ---- 导出 PNG ----
  const exportPng = async () => {
    const node = shotRef.current;
    if (!node) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(node, { pixelRatio: scale, cacheBust: false });
      const name = `chat-${doc.platform}-${Date.now()}.png`;
      const ok = await savePngFile(name, dataUrl);
      if (ok) message.success(t('已导出 PNG'));
    } catch (e) {
      message.error(tt('导出失败: {msg}', { msg: e instanceof Error ? e.message : String(e) }));
    } finally {
      setExporting(false);
    }
  };

  const statusTimeInvalid = !isTimeText(doc.statusTime);

  return (
    <div style={{ width: '100%' }}>
      <Tabs
        size="small"
        activeKey={doc.platform}
        onChange={(k) => patch({ platform: k as PlatformId })}
        items={PLATFORMS.map((p) => ({ key: p.id, label: p.label }))}
        style={{ marginTop: 4 }}
      />
      <Row gutter={16} wrap align="stretch">
        {/* ==================== 左: 编辑 ==================== */}
        <Col xs={24} lg={13} xxl={12}>
          <Card size="small" title={t('编辑对话')} style={{ height: '100%' }} extra={
            <Space size={6} wrap>
              <Button size="small" icon={<PlusOutlined />} onClick={() => append('text', 'in')}>{t('添加文字')}</Button>
              <Button size="small" icon={<PictureOutlined />} onClick={() => append('image', 'in')}>{t('添加图片')}</Button>
              <Button size="small" onClick={() => append('voice', 'in')}>{t('添加语音')}</Button>
              <Button size="small" onClick={() => append('time')}>{t('添加时间')}</Button>
              <Button size="small" onClick={() => { patch({ messages: clearMessages() }); message.success(t('已清空对话')); }} danger>{t('清空')}</Button>
            </Space>
          }>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {/* ---- 会话信息 ---- */}
              <Space wrap size={10}>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('聊天标题')}</Text>
                  <Input
                    size="small"
                    style={{ width: 180 }}
                    maxLength={TITLE_MAX}
                    value={doc.title}
                    onChange={(e) => patch({ title: e.target.value })}
                  />
                </span>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('副标题')}</Text>
                  <Input
                    size="small"
                    style={{ width: 130 }}
                    maxLength={TITLE_MAX}
                    value={doc.subtitle}
                    onChange={(e) => patch({ subtitle: e.target.value })}
                  />
                </span>
              </Space>

              <Space wrap size={10}>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('对方昵称')}</Text>
                  <Input
                    size="small"
                    style={{ width: 140 }}
                    maxLength={NAME_MAX}
                    value={doc.nameIn}
                    onChange={(e) => patch({ nameIn: e.target.value })}
                  />
                </span>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('我的昵称')}</Text>
                  <Input
                    size="small"
                    style={{ width: 120 }}
                    maxLength={NAME_MAX}
                    value={doc.nameOut}
                    onChange={(e) => patch({ nameOut: e.target.value })}
                  />
                </span>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <Tooltip title={t('在气泡上方显示昵称')}>
                    <Switch size="small" checked={doc.showNames} onChange={(v) => patch({ showNames: v })} />
                  </Tooltip>
                  <span style={{ marginLeft: 6 }}>{t('显示昵称')}</span>
                </Text>
              </Space>

              <Space wrap size={10}>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('对方头像')}</Text>
                  <Tooltip title={t('头像仅本地使用, 不会上传')}>
                    <Upload
                      showUploadList={false}
                      accept="image/*"
                      beforeUpload={(file) => { onPickAvatar('in', file as File); return false; }}
                    >
                      <Button size="small" icon={<CloudUploadOutlined />}>{t('上传头像')}</Button>
                    </Upload>
                  </Tooltip>
                  {doc.avatarIn ? (
                    <Button size="small" type="link" onClick={() => patch({ avatarIn: '' })}>{t('移除头像')}</Button>
                  ) : null}
                </span>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('我的头像')}</Text>
                  <Tooltip title={t('头像仅本地使用, 不会上传')}>
                    <Upload
                      showUploadList={false}
                      accept="image/*"
                      beforeUpload={(file) => { onPickAvatar('out', file as File); return false; }}
                    >
                      <Button size="small" icon={<CloudUploadOutlined />}>{t('上传头像')}</Button>
                    </Upload>
                  </Tooltip>
                  {doc.avatarOut ? (
                    <Button size="small" type="link" onClick={() => patch({ avatarOut: '' })}>{t('移除头像')}</Button>
                  ) : null}
                </span>
              </Space>

              <Divider style={{ margin: '4px 0' }} />

              {/* ---- 手机状态栏 ---- */}
              <Space wrap size={10}>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('手机状态栏')}</Text>
                  <Segmented
                    size="small"
                    value={doc.system}
                    onChange={(v) => patch({ system: v as ChatSystem })}
                    options={[{ value: 'ios', label: 'iOS' }, { value: 'android', label: t('安卓') }]}
                  />
                </span>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('时间')}</Text>
                  <Tooltip title={t('时间格式应为 HH:MM (如 9:41)')}>
                    <Input
                      size="small"
                      style={{ width: 74 }}
                      maxLength={5}
                      status={statusTimeInvalid ? 'error' : ''}
                      value={doc.statusTime}
                      onChange={(e) => patch({ statusTime: e.target.value })}
                    />
                  </Tooltip>
                </span>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('电量')}</Text>
                  <InputNumber
                    size="small"
                    style={{ width: 86 }}
                    min={1}
                    max={100}
                    value={doc.battery}
                    onChange={(v) => patch({ battery: Number(v ?? 82) })}
                    addonAfter="%"
                  />
                </span>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('充电中')}</Text>
                  <Switch size="small" checked={doc.charging} onChange={(v) => patch({ charging: v })} />
                </span>
              </Space>

              <Space wrap size={10}>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('信号')}</Text>
                  <InputNumber
                    size="small"
                    style={{ width: 86 }}
                    min={1}
                    max={4}
                    value={doc.signal}
                    onChange={(v) => patch({ signal: Number(v ?? 4) })}
                    addonAfter={t('格')}
                  />
                </span>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('网络')}</Text>
                  <Select
                    size="small"
                    style={{ width: 96 }}
                    value={doc.network}
                    onChange={(v: ChatNetwork) => patch({ network: v })}
                    options={[
                      { value: 'wifi', label: 'Wi-Fi' },
                      ...NETWORKS.filter((n) => n !== 'wifi').map((n) => ({ value: n, label: n })),
                    ]}
                  />
                </span>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('显示底部输入栏')}</Text>
                  <Switch size="small" checked={doc.showInputBar} onChange={(v) => patch({ showInputBar: v })} />
                </span>
              </Space>

              <Divider style={{ margin: '4px 0' }} />

              {/* ---- 消息列表 ---- */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: 13 }}>{tt('消息 (共 {n} 条)', { n: doc.messages.length })}</Text>
                <Button size="small" onClick={() => { patch({ messages: sampleMessages() }); message.success(t('已载入示例对话')); }}>{t('载入示例')}</Button>
              </div>
              <div style={{ maxHeight: '46vh', overflowY: 'auto', paddingRight: 4 }}>
                {doc.messages.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('暂无消息, 点上方按钮添加一条吧')}</Text>
                ) : doc.messages.map((msg, i) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 6, padding: '6px 8px', marginBottom: 6,
                      border: '1px solid #f0f0f0', borderRadius: 6, background: '#fafafa',
                    }}
                  >
                    <Tag style={{ marginTop: 3 }}>{i + 1}</Tag>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Space size={6} wrap style={{ marginBottom: 4 }}>
                        {msg.type === 'time' ? null : (
                          <Segmented
                            size="small"
                            value={msg.side}
                            onChange={(v) => onUpdate(msg.id, { side: v as ChatSide })}
                            options={[{ value: 'in', label: t('对方') }, { value: 'out', label: t('我') }]}
                          />
                        )}
                        <Select
                          size="small"
                          style={{ width: 92 }}
                          value={msg.type}
                          onChange={(v: ChatMessageType) => onUpdate(msg.id, { type: v })}
                          options={(['text', 'image', 'voice', 'time'] as ChatMessageType[]).map((k) => ({ value: k, label: t(TYPE_LABEL[k]) }))}
                        />
                        {msg.type === 'time' ? null : (
                          <Input
                            size="small"
                            style={{ width: 66 }}
                            maxLength={5}
                            placeholder="16:20"
                            value={msg.time}
                            onChange={(e) => onUpdate(msg.id, { time: e.target.value })}
                          />
                        )}
                        {msg.type === 'text' || msg.type === 'time' ? (
                          <Input
                            size="small"
                            style={{ width: msg.type === 'time' ? 220 : 240 }}
                            maxLength={msg.type === 'time' ? TIME_LABEL_MAX : TEXT_MAX}
                            value={msg.text}
                            placeholder={msg.type === 'time' ? t('时间分隔文案') : t('内容')}
                            onChange={(e) => onUpdate(msg.id, { text: e.target.value })}
                          />
                        ) : null}
                      </Space>
                      <Space size={6} wrap>
                        {msg.type === 'voice' ? (
                          <InputNumber
                            size="small"
                            style={{ width: 128 }}
                            min={1}
                            max={99}
                            value={msg.duration}
                            addonAfter={t('时长 (秒)')}
                            onChange={(v) => onUpdate(msg.id, { duration: Number(v ?? 5) })}
                          />
                        ) : null}
                        {msg.type === 'image' ? (
                          <Upload
                            showUploadList={false}
                            accept="image/*"
                            beforeUpload={(file) => { onPickImage(msg, file as File); return false; }}
                          >
                            <Button size="small" icon={<PictureOutlined />}>
                              {msg.image ? t('替换图片') : t('选择图片')}
                            </Button>
                          </Upload>
                        ) : null}
                        {msg.type === 'image' && msg.image ? (
                          <Button size="small" type="link" onClick={() => onUpdate(msg.id, { image: '' })}>{t('删除')}</Button>
                        ) : null}
                        {doc.showNames || theme.bubble === 'plain' ? (
                          <Input
                            size="small"
                            style={{ width: 130 }}
                            maxLength={NAME_MAX}
                            placeholder={msg.side === 'out' ? doc.nameOut : doc.nameIn}
                            value={msg.name}
                            onChange={(e) => onUpdate(msg.id, { name: e.target.value })}
                          />
                        ) : null}
                        <Button size="small" icon={<ArrowUpOutlined />} title={t('上移')} disabled={i === 0} onClick={() => onMove(msg.id, 'up')} />
                        <Button size="small" icon={<ArrowDownOutlined />} title={t('下移')} disabled={i === doc.messages.length - 1} onClick={() => onMove(msg.id, 'down')} />
                        <Button size="small" danger icon={<DeleteOutlined />} title={t('删除')} onClick={() => onRemove(msg.id)} />
                      </Space>
                    </div>
                  </div>
                ))}
              </div>

              <Divider style={{ margin: '4px 0' }} />
              <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{t('聊天生成器说明')}</Text>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  <li>{t('可切换 9 个平台: 微信 / QQ / Slack / Telegram / Discord / WhatsApp / LINE / 钉钉 / 飞书')}</li>
                  <li>{t('支持文字 / 图片 / 语音 / 时间分隔四类消息, 可上移下移调整顺序')}</li>
                  <li>{t('可设置标题、昵称、头像与手机状态栏 (系统 / 时间 / 电量 / 信号 / 网络) 等细节')}</li>
                  <li>{t('全部内容在本地渲染并导出 PNG, 不联网、不上传任何数据')}</li>
                  <li>{t('样式为各平台风格的近似模拟, 与官方客户端存在差异; 请勿用于伪造真实聊天记录或任何违法用途')}</li>
                </ul>
              </Paragraph>
            </Space>
          </Card>
        </Col>

        {/* ==================== 右: 预览 / 导出 ==================== */}
        <Col xs={24} lg={11} xxl={12}>
          <Card
            size="small"
            title={t('预览与导出')}
            style={{ height: '100%' }}
            extra={
              <Space size={8} wrap>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('导出倍率')}</Text>
                <Select
                  size="small"
                  style={{ width: 76 }}
                  value={scale}
                  onChange={(v: ChatScale) => setScale(normalizeScale(v))}
                  options={SCALES.map((s) => ({ value: s, label: `${s}x` }))}
                />
                <Button size="small" type="primary" icon={<DownloadOutlined />} loading={exporting} onClick={exportPng}>
                  {exporting ? t('导出中…') : t('导出 PNG')}
                </Button>
              </Space>
            }
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div ref={shotRef} style={{ display: 'inline-block', background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                <ChatPreview doc={doc} />
              </div>
            </div>
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 12 }}
              message={t('全部内容在本地渲染并导出 PNG, 不联网、不上传任何数据')}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChatGenerator;
