// 聊天生成器: 预览渲染器 (按平台样式绘制手机屏 / 桌面窗口)
//
// 预览与导出的 DOM 完全一致 (导出时就是把这个节点交给 html-to-image),
// 因此所有样式都用内联样式书写, 不依赖外部 CSS, 也不引用任何官方图片素材。
import { avatarText, batteryText, normalizeDuration, normalizeTimeText, receiptMark, signalLevels, themeOf, voiceText } from './lib';
import { cr } from './lang';
import type { ChatDoc, ChatMessage, ChatTheme } from './data';
import { useLocale } from '../../hook/locale-context';

/** 已读回执高亮色 (WhatsApp 蓝勾) */
const RECEIPT_READ = '#53bdeb';

/** 深色底上时间分隔仍需可读时使用的兜底色 (LINE 背景为蓝底) */
const DIVIDER_ON_DARK = 'rgba(255, 255, 255, 0.86)';

// ==================== 小图标 (内联 SVG, 导出 PNG 时可直接光栅化) ====================

const BackIcon = ({ color }: { color: string }) => (
  <svg width="11" height="18" viewBox="0 0 11 18" aria-hidden="true">
    <path d="M9.5 1.6 2.1 9l7.4 7.4" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MoreIcon = ({ color }: { color: string }) => (
  <svg width="16" height="4" viewBox="0 0 16 4" aria-hidden="true">
    <circle cx="2" cy="2" r="1.7" fill={color} />
    <circle cx="8" cy="2" r="1.7" fill={color} />
    <circle cx="14" cy="2" r="1.7" fill={color} />
  </svg>
);

const WifiIcon = ({ color }: { color: string }) => (
  <svg width="15" height="12" viewBox="0 0 24 18" fill={color} aria-hidden="true">
    <path d="M12 3.2c3.3 0 6.3 1.2 8.6 3.2l1.6-1.9A15.3 15.3 0 0 0 12 .6C7.4.6 3.3 2.2.8 4.5l1.6 1.9A13.5 13.5 0 0 1 12 3.2Z" />
    <path d="M12 8.5c2.3 0 4.4.8 6 2.2l1.6-1.9A11.2 11.2 0 0 0 12 5.9c-2.9 0-5.5 1.1-7.6 2.9l1.6 1.9A9 9 0 0 1 12 8.5Z" />
    <path d="M12 13.8c1.3 0 2.5.5 3.4 1.3L12 18.7l-3.4-3.6c.9-.8 2.1-1.3 3.4-1.3Z" />
  </svg>
);

const BatteryIcon = ({ color, level, charging }: { color: string; level: number; charging: boolean }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
    <span style={{
      position: 'relative', width: 23, height: 11, border: `1px solid ${color}`,
      borderRadius: 3, opacity: 0.9, display: 'inline-block',
    }}>
      <span style={{
        position: 'absolute', left: 1, top: 1, bottom: 1,
        width: Math.max(0, Math.round((19 * level) / 100)),
        background: color, borderRadius: 1.5,
      }} />
      {charging ? (
        <svg width="7" height="9" viewBox="0 0 24 24" fill={color} style={{ position: 'absolute', left: 7, top: 0 }}>
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
        </svg>
      ) : null}
    </span>
    <span style={{ fontSize: 11, opacity: 0.9 }}>{batteryText(level)}</span>
  </span>
);

const PlayIcon = ({ color, size = 14 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M8 5.5v13l11-6.5-11-6.5z" />
  </svg>
);

const PlusIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.6" />
    <path d="M12 7.5v9M7.5 12h9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const SmileIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9.2" fill="none" stroke={color} strokeWidth="1.6" />
    <path d="M8.4 14.2c1 1.4 2.2 2.1 3.6 2.1s2.6-.7 3.6-2.1" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="9.2" cy="9.6" r="1.1" fill={color} />
    <circle cx="14.8" cy="9.6" r="1.1" fill={color} />
  </svg>
);

const MicIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke={color} strokeWidth="1.6" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** 语音音波: 5 根高低不同的竖条 */
const WaveBars = ({ color }: { color: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, height: 14 }}>
    {[6, 11, 14, 9, 5].map((h, i) => (
      <span key={i} style={{ width: 2, height: h, borderRadius: 1, background: color, opacity: 0.75 }} />
    ))}
  </span>
);

// ==================== 状态栏 / 标题栏 / 输入栏 ====================

const StatusBar: React.FC<{ theme: ChatTheme; doc: ChatDoc }> = ({ theme, doc }) => {
  const bar = theme.statusBar;
  if (!bar) return null;
  const bars = signalLevels(doc.signal);
  // 输入非法时间时状态栏回退默认值 (避免把 "99:99" 之类渲进导出的 PNG)
  const clock = normalizeTimeText(doc.statusTime);
  const net = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {doc.network === 'wifi' ? <WifiIcon color={bar.color} /> : <span style={{ fontSize: 10.5, fontWeight: 700 }}>{doc.network}</span>}
      <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 1.5, height: 11 }}>
        {bars.map((on, i) => (
          <span key={i} style={{
            width: 3, height: 4 + i * 2.4, borderRadius: 1, background: bar.color,
            opacity: on ? 1 : 0.32, display: 'inline-block',
          }} />
        ))}
      </span>
    </span>
  );
  const bat = <BatteryIcon color={bar.color} level={doc.battery} charging={doc.charging} />;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 26, padding: '0 14px', background: bar.bg, color: bar.color,
      fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
    }}>
      {bar.timeRight
        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{net}</span>
        : <span style={{ fontSize: 12.5 }}>{clock}</span>}
      {bar.timeRight
        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 12.5 }}>{clock}</span>{bat}</span>
        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{net}{bat}</span>}
    </div>
  );
};

/** 手机标题栏 */
const MobileHeader: React.FC<{ theme: ChatTheme; doc: ChatDoc }> = ({ theme, doc }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
    background: theme.header.bg, color: theme.header.color,
    borderBottom: theme.header.border ? `1px solid ${theme.header.border}` : 'none',
  }}>
    {theme.header.back ? <BackIcon color={theme.header.color} /> : null}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 15.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {doc.title || '\u00a0'}
      </div>
      {doc.subtitle ? (
        <div style={{ fontSize: 11, color: theme.header.subColor, marginTop: 1 }}>{doc.subtitle}</div>
      ) : null}
    </div>
    <MoreIcon color={theme.header.color} />
  </div>
);

/** 底部输入栏 (手机屏) */
const InputBar: React.FC<{ theme: ChatTheme; label: string }> = ({ theme, label }) => {
  const bar = theme.inputBar;
  if (!bar) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
      background: bar.bg, borderTop: bar.border ? `1px solid ${bar.border}` : 'none',
    }}>
      <MicIcon color={bar.color} />
      <div style={{
        flex: 1, minWidth: 0, background: bar.pill, color: bar.color, fontSize: 13,
        padding: '7px 12px', borderRadius: 16,
        border: bar.border ? `1px solid ${bar.border}` : 'none',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      <SmileIcon color={bar.color} />
      <PlusIcon color={bar.color} />
    </div>
  );
};

/** 桌面客户端左侧频道栏 (Slack) */
const Sidebar: React.FC<{ theme: ChatTheme }> = ({ theme }) => {
  const side = theme.sidebar;
  if (!side) return null;
  return (
    <div style={{ width: 132, background: side.bg, color: side.color, padding: '10px 8px', fontSize: 12.5, flex: '0 0 auto' }}>
      <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 13, marginBottom: 10, padding: '0 6px' }}>MagicTools</div>
      {side.items.map((item, i) => (
        <div key={item} style={{
          padding: '5px 6px', borderRadius: 4, marginBottom: 2,
          background: i === 0 ? side.active : 'transparent',
          color: i === 0 ? '#ffffff' : side.color,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{item}</div>
      ))}
    </div>
  );
};

/** 桌面窗口顶栏 (Discord 的窗口标题, Slack 的紫色工作区栏) */
const WindowChrome: React.FC<{ theme: ChatTheme; doc: ChatDoc; fallback: { bg: string; color: string } }> = ({ theme, doc, fallback }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, height: 30, padding: '0 10px',
    background: (theme.titleBar ?? fallback).bg,
    color: (theme.titleBar ?? fallback).color,
    fontSize: 12.5, fontWeight: 600,
  }}>
    {theme.titleBar ? (
      <span style={{ display: 'inline-flex', gap: 5 }}>
        {theme.titleBar.dots.map((c) => <span key={c} style={{ width: 9, height: 9, borderRadius: 5, background: c }} />)}
      </span>
    ) : null}
    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</span>
  </div>
);

// ==================== 消息体 ====================

const Avatar: React.FC<{ theme: ChatTheme; src: string; name: string }> = ({ theme, src, name }) => (
  <div style={{
    width: theme.avatar.size, height: theme.avatar.size, flex: '0 0 auto',
    borderRadius: theme.avatar.radius >= 50 ? '50%' : theme.avatar.radius,
    overflow: 'hidden', background: theme.avatar.bg, color: theme.avatar.color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: Math.round(theme.avatar.size * 0.42), fontWeight: 600,
  }}>
    {src
      ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      : avatarText(name)}
  </div>
);

/** 图片占位 (未选择图片时) */
const ImagePlaceholder: React.FC<{ theme: ChatTheme; label: string }> = ({ theme, label }) => (
  <div style={{
    width: 150, height: 100, borderRadius: 6, background: 'rgba(127, 127, 127, 0.14)',
    border: '1px dashed rgba(127, 127, 127, 0.5)', color: theme.meta,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
  }}>{label}</div>
);

const MessageBody: React.FC<{ theme: ChatTheme; msg: ChatMessage; t: (zh: string) => string }> = ({ theme, msg, t }) => {
  const meta = theme.meta;
  const receipt = receiptMark(theme.receipt);
  const receiptColor = theme.receipt === 'read' ? RECEIPT_READ : meta;

  if (msg.type === 'time') {
    return (
      <div style={{ padding: '2px 0 4px' }}>
        <div style={{
          textAlign: 'center', fontSize: 11,
          color: theme.id === 'line' ? DIVIDER_ON_DARK : meta,
        }}>{msg.text || t('时间')}</div>
      </div>
    );
  }

  if (msg.type === 'image') {
    if (theme.bubble === 'plain') {
      return msg.image
        ? <img src={msg.image} alt="" style={{ maxWidth: 260, maxHeight: 200, borderRadius: 6, display: 'block' }} />
        : <ImagePlaceholder theme={theme} label={t('图片')} />;
    }
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{
          display: 'inline-block', padding: 3, borderRadius: Math.max(3, theme.incoming.radius),
          background: msg.side === 'out' ? theme.outgoing.bg : theme.incoming.bg,
        }}>
          {msg.image
            ? <img src={msg.image} alt="" style={{ maxWidth: 168, maxHeight: 190, borderRadius: 5, display: 'block' }} />
            : <ImagePlaceholder theme={theme} label={t('图片')} />}
        </span>
        <Meta theme={theme} msg={msg} receipt={receipt} receiptColor={receiptColor} inside={theme.timeInBubble} />
      </span>
    );
  }

  const content = msg.type === 'voice' ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <PlayIcon color={theme.bubble === 'plain' ? theme.nameColor : (msg.side === 'out' ? theme.outgoing.color : theme.incoming.color)} />
      <WaveBars color={theme.bubble === 'plain' ? theme.nameColor : (msg.side === 'out' ? theme.outgoing.color : theme.incoming.color)} />
      <span style={{
        fontSize: 12.5, minWidth: 22,
        color: theme.bubble === 'plain' ? theme.meta : (msg.side === 'out' ? theme.outgoing.color : theme.incoming.color),
        opacity: 0.85,
      }}>{voiceText(normalizeDuration(msg.duration))}</span>
    </span>
  ) : (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14.5, lineHeight: 1.45 }}>
      {msg.text || ''}
    </span>
  );

  if (theme.bubble === 'plain') {
    // 纯消息流 (Slack / Discord): 无气泡, 正文直接用平台文字色
    return <span style={{ display: 'block', color: theme.incoming.color }}>{content}</span>;
  }
  const bubble = msg.side === 'out' ? theme.outgoing : theme.incoming;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: msg.side === 'out' ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
      <span style={{
        position: 'relative', display: 'inline-block', maxWidth: 230,
        background: bubble.bg, color: bubble.color,
        border: bubble.border ? `1px solid ${bubble.border}` : 'none',
        borderRadius: bubble.radius, padding: '8px 11px',
      }}>
        {content}
        {bubble.tail ? (
          <span style={{
            position: 'absolute', top: 11, width: 8, height: 8, background: bubble.bg,
            transform: 'rotate(45deg)', borderRadius: 1.5,
            [msg.side === 'out' ? 'right' : 'left']: -3,
          }} />
        ) : null}
      </span>
      <Meta theme={theme} msg={msg} receipt={receipt} receiptColor={receiptColor} inside={theme.timeInBubble} />
    </span>
  );
};

/** 时间 + 已读回执 (气泡内或气泡下) */
const Meta: React.FC<{
  theme: ChatTheme; msg: ChatMessage; receipt: string; receiptColor: string; inside: boolean;
}> = ({ theme, msg, receipt, receiptColor, inside }) => {
  if (!msg.time) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, color: theme.meta,
      marginTop: inside ? 2 : 3, opacity: inside ? 1 : 0.95,
    }}>
      {msg.time}
      {receipt ? <span style={{ color: receiptColor, letterSpacing: -1 }}>{receipt}</span> : null}
    </span>
  );
};

/** 一行消息 (含头像 / 昵称 / 气泡) */
const MessageRow: React.FC<{
  theme: ChatTheme; doc: ChatDoc; msg: ChatMessage; compact: boolean; t: (zh: string) => string;
}> = ({ theme, doc, msg, compact, t }) => {
  if (msg.type === 'time') {
    return <div style={{ display: 'flex', justifyContent: 'center' }}><MessageBody theme={theme} msg={msg} t={t} /></div>;
  }
  const isOut = msg.side === 'out';
  const name = msg.name || (isOut ? doc.nameOut : doc.nameIn);
  const avatarSrc = isOut ? doc.avatarOut : doc.avatarIn;
  // 纯消息流 (Slack / Discord): 双方都在左侧, 头像 + 昵称 + 正文
  if (theme.align === 'left') {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingTop: compact ? 0 : 6 }}>
        {compact ? <div style={{ width: theme.avatar.size, flex: '0 0 auto' }} /> : <Avatar theme={theme} src={avatarSrc} name={name} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          {compact ? null : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 2 }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: theme.nameColor }}>{name || '\u00a0'}</span>
              {msg.time ? <span style={{ fontSize: 11, color: theme.meta }}>{msg.time}</span> : null}
            </div>
          )}
          <MessageBody theme={theme} msg={msg} t={t} />
        </div>
      </div>
    );
  }
  const showName = doc.showNames;
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      justifyContent: isOut ? 'flex-end' : 'flex-start',
    }}>
      {isOut ? null : <Avatar theme={theme} src={avatarSrc} name={name} />}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOut ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
        {showName && name ? (
          <span style={{ fontSize: 11, color: theme.nameColor, marginBottom: 3 }}>{name}</span>
        ) : null}
        <MessageBody theme={theme} msg={msg} t={t} />
      </div>
      {isOut ? <Avatar theme={theme} src={avatarSrc} name={name} /> : null}
    </div>
  );
};

// ==================== 预览主体 ====================

export interface ChatPreviewProps {
  doc: ChatDoc;
}

/**
 * 聊天预览: 手机屏 (mobile) / 桌面窗口 (desktop)。
 * 结构与样式即导出 PNG 的最终像素, 页面侧只需把根节点交给 html-to-image。
 */
export const ChatPreview: React.FC<ChatPreviewProps> = ({ doc }) => {
  const { locale } = useLocale();
  const t = (zh: string) => cr(locale, zh);
  const theme = themeOf(doc.platform);

  const chatArea = (
    <div style={{
      background: theme.background,
      backgroundImage: theme.pattern || undefined,
      backgroundSize: theme.pattern ? '18px 18px' : undefined,
      padding: theme.layout === 'mobile' ? '12px 12px 14px' : '14px 18px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
      minHeight: theme.layout === 'mobile' ? 420 : 360,
      flex: 1, minWidth: 0,
    }}>
      {doc.messages.length === 0 ? (
        <div style={{ margin: 'auto', color: theme.meta, fontSize: 12.5 }}>{t('请在左侧添加或编辑消息')}</div>
      ) : doc.messages.map((msg, i) => {
        const prev = i > 0 ? doc.messages[i - 1] : null;
        const compact = theme.align === 'left' && !!prev && prev.type !== 'time' && prev.side === msg.side
          && (prev.name || (prev.side === 'out' ? doc.nameOut : doc.nameIn)) === (msg.name || (msg.side === 'out' ? doc.nameOut : doc.nameIn));
        return <MessageRow key={msg.id} theme={theme} doc={doc} msg={msg} compact={compact} t={t} />;
      })}
    </div>
  );

  if (theme.layout === 'mobile') {
    return (
      <div
        data-testid="chat-preview"
        data-platform={theme.id}
        style={{
          width: theme.width + 16, background: '#1c1c1e', padding: 8, borderRadius: 30,
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.24)', boxSizing: 'content-box',
        }}
      >
        <div style={{
          width: theme.width, borderRadius: 23, overflow: 'hidden',
          background: theme.background, display: 'flex', flexDirection: 'column',
          fontFamily: theme.font, color: '#000',
        }}>
          <StatusBar theme={theme} doc={doc} />
          <MobileHeader theme={theme} doc={doc} />
          {chatArea}
          {doc.showInputBar ? <InputBar theme={theme} label={t('输入消息')} /> : null}
        </div>
      </div>
    );
  }

  const chrome = theme.titleBar ?? (theme.sidebar ? { bg: theme.sidebar.bg, color: '#ffffff' } : null);
  return (
    <div
      data-testid="chat-preview"
      data-platform={theme.id}
      style={{
        width: theme.width + (theme.sidebar ? 132 : 0), borderRadius: 10, overflow: 'hidden',
        background: theme.background, boxShadow: '0 12px 30px rgba(0, 0, 0, 0.24)',
        fontFamily: theme.font, display: 'flex', flexDirection: 'column',
        border: '1px solid rgba(0, 0, 0, 0.18)',
      }}
    >
      {chrome ? <WindowChrome theme={theme} doc={doc} fallback={chrome} /> : null}
      <div style={{ display: 'flex', height: 380 }}>
        <Sidebar theme={theme} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8, padding: '9px 16px',
            background: theme.header.bg, color: theme.header.color,
            borderBottom: `1px solid ${theme.header.border || 'rgba(0, 0, 0, 0.12)'}`,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}># {doc.title || '\u00a0'}</span>
            {doc.subtitle ? <span style={{ fontSize: 11.5, color: theme.header.subColor }}>{doc.subtitle}</span> : null}
          </div>
          {chatArea}
          {doc.showInputBar ? (
            <div style={{ padding: '10px 16px 14px', background: theme.inputBar?.bg ?? theme.background }}>
              <div style={{
                border: `1px solid ${theme.inputBar?.border || 'rgba(0, 0, 0, 0.14)'}`,
                background: theme.inputBar?.pill ?? theme.background,
                color: theme.inputBar?.color ?? theme.meta,
                borderRadius: 6, padding: '8px 12px', fontSize: 13,
              }}>{t('输入消息')}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
