import { Button, Divider, Input, message, Progress, Space, Tag, theme } from 'antd';
import { useState } from 'react';
import {
  CopyOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { isTauri } from '../../lib/tauri';
import { checkTdkField, parseTdk, TDK_FIELDS, type TdkResult } from './lib';
import { fetchPageHtml } from './fetch';
import WebTDKIntro from './intro';

const WebTDKCheck = () => {

  const { token } = theme.useToken();

  const [ url, setUrl ] = useState(''); // 网址
  const [ loading, setLoading ] = useState(false); // 检测中
  const [ tdk, setTdk ] = useState<TdkResult | null>(null); // 检测结果
  const [ finalUrl, setFinalUrl ] = useState(''); // 最终地址
  const [ notice, contextHolder ] = message.useMessage();

  // 检测
  const check = async () => {
    if (url.trim() === '') {
      notice.warning('请先输入要检测的网址');
      return;
    }
    setLoading(true);
    setTdk(null);
    setFinalUrl('');
    try {
      const page = await fetchPageHtml(url);
      setTdk(parseTdk(page.html));
      setFinalUrl(page.finalUrl);
    } catch (err) {
      notice.error('检测失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 复制某字段内容
  const copyField = (text :string) => {
    if (text === '') return;
    copyTextToClipboard(text);
    notice.success('复制到粘贴板成功!!!');
  };

  return (
    <div>
      {contextHolder}

      <Space.Compact style={ { width: '100%', maxWidth: 620 } }>
        <Input
          allowClear
          prefix={ <SearchOutlined /> }
          value={ url }
          placeholder="输入网址, 如 https://example.com"
          onChange={ (e) => { setUrl(e.target.value); } }
          onPressEnter={ check }
        />
        <Button
          type="primary"
          loading={ loading }
          onClick={ check }
        >检测</Button>
      </Space.Compact>
      { !isTauri() && (
        <div style={ { marginTop: 6, color: token.colorTextTertiary, fontSize: 12 } }>
          浏览器演示版受 CORS 限制, 多数外部站点无法抓取; 桌面版 (Tauri) 无此限制
        </div>
      ) }

      { finalUrl !== '' && (
        <div style={ { marginTop: 12, color: token.colorTextSecondary } }>
          检测完成: { finalUrl }
        </div>
      ) }

      {/* 检测结果 */}
      { tdk && TDK_FIELDS.map(({ field, label, limit, emptyTip }) => {
        const text = tdk[field];
        const check = checkTdkField(text, limit);
        const tagMap = {
          empty:  { color: 'default', text: '未设置' },
          ok:     { color: 'success', text: '长度正常' },
          over:   { color: 'error',   text: '超过建议' },
        } as const;
        const tag = tagMap[check.status];
        return (
          <div
            key={ field }
            style={ {
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 6,
              padding: '12px 16px',
              margin: '12px 0',
              maxWidth: 720,
              backgroundColor: token.colorFillQuaternary,
              color: token.colorText,
            } }
          >
            <div style={ { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 } }>
              <b>{ label }</b>
              <Tag color={ tag.color }>{ tag.text }</Tag>
              <span style={ { color: token.colorTextSecondary, fontSize: 12 } }>
                当前 { check.length } / 建议不超过 { check.limit } 字符
              </span>
              <Button
                size="small"
                icon={ <CopyOutlined /> }
                disabled={ text === '' }
                onClick={ () => { copyField(text); } }
              >复制</Button>
            </div>
            <Progress
              percent={ check.percent }
              showInfo={ false }
              size="small"
              status={ check.status === 'over' ? 'exception' : 'normal' }
              strokeColor={ check.status === 'over' ? '#ff4d4f' : (check.status === 'empty' ? token.colorBorderSecondary : '#52c41a') }
              style={ { margin: '6px 0 2px 0' } }
            />
            { check.status === 'empty' ? (
              <div style={ { color: token.colorTextTertiary } }>{ emptyTip }</div>
            ) : (
              <div
                title="双击复制内容"
                onDoubleClick={ () => { copyField(text); } }
                style={ {
                  maxHeight: 120,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  padding: '6px 8px',
                  backgroundColor: token.colorBgContainer,
                  color: token.colorText,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 4,
                  cursor: 'text',
                } }
              >
                { text }
              </div>
            ) }
          </div>
        );
      }) }

      {/* 未检测时的占位提示 */}
      { tdk === null && !loading && (
        <div style={ { color: token.colorTextTertiary, margin: '16px 0' } }>
          输入网址后点击「检测」, 将解析网页 &lt;title&gt; 与
          keywords / description 两个 meta 标签并给出长度建议
        </div>
      ) }

      <Divider>网页 TDK 信息检测说明</Divider>

      <WebTDKIntro />
    </div>
  );
}

export default WebTDKCheck;
