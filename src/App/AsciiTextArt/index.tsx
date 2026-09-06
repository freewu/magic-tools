import { Button, Input, InputNumber, Space, message } from "antd";
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { useMemo, useState } from "react";
import { copyTextToClipboard } from "../../lib";
import { saveBytesFile } from "../../lib/tauri";
import { GLYPHS, renderFiglet } from "./lib";

const SAMPLE = 'Hello ASCII!';

const AsciiTextArt: React.FC = () => {
  const [ text, setText ] = useState(SAMPLE);
  const [ pixel, setPixel ] = useState('#');
  const [ scale, setScale ] = useState(2);
  const [ spacing, setSpacing ] = useState(1);

  const art = useMemo(
    () => renderFiglet(text, { pixel, scale, spacing }),
    [ text, pixel, scale, spacing ],
  );
  const artRows = useMemo(() => art.split('\n'), [ art ]);

  const doCopy = async () => {
    if (!art) return;
    try {
      await copyTextToClipboard(art);
      message.success('已复制 ' + art.length + ' 字符到剪贴板');
    } catch (err) {
      message.error('复制失败, 请手动选中文本复制');
    }
  };

  const doSave = async () => {
    if (!art) return;
    const word = (text.split(/\s+/)[0] || 'ascii-art').replace(/[\\/:*?"<>|]/g, '') || 'ascii-art';
    const name = word + '.txt';
    const ok = await saveBytesFile(name, new TextEncoder().encode(art), {
      title: '保存 ' + name,
      filterName: '文本文件',
      extensions: [ 'txt' ],
    });
    if (ok) message.success('已保存 ' + name);
  };

  const row = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 } as const;
  const labelStyle = { color: '#666', whiteSpace: 'nowrap' } as const;

  return (
    <div style={ { maxWidth: 980 } }>
      <div style={ row }>
        <span style={ labelStyle }>文字</span>
        <Input.TextArea
          value={ text } onChange={ (e) => setText(e.target.value) }
          placeholder="输入要生成大字的内容 (支持多行, 每行独立排版)"
          autoSize={ { minRows: 2, maxRows: 6 } } style={ { width: 320, maxWidth: '100%' } }
        />
      </div>
      <div style={ row }>
        <span style={ labelStyle }>像素字符</span>
        <Input value={ pixel } onChange={ (e) => setPixel(e.target.value.charAt(0)) } maxLength={ 1 }
          style={ { width: 70, fontFamily: 'monospace' } } />
        <span style={ { color: '#bbb', fontSize: 12 } }>可用 # . @ 0 * 或 █ 等</span>
        <span style={ labelStyle }>放大</span>
        <InputNumber min={ 1 } max={ 4 } value={ scale } onChange={ (v) => { if (v != null) setScale(v); } } style={ { width: 70 } } />
        <span style={ labelStyle }>字距</span>
        <InputNumber min={ 0 } max={ 6 } value={ spacing } onChange={ (v) => { if (v != null) setSpacing(v); } } style={ { width: 70 } } />
      </div>
      <div style={ { color: '#bbb', fontSize: 12, marginBottom: 10 } }>
        支持 A-Z a-z 0-9 与常见英文标点; 中文等未收录字符以 ? 显示; 空格宽 3 列 · 实时生成, 改任意参数立即重排
      </div>

      <div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } }>
        <span style={ { color: '#666' } }>结果 ({ artRows.length } 行 · { art.length } 字符):</span>
        <Space>
          <Button size="small" icon={ <CopyOutlined /> } disabled={ !art } onClick={ doCopy }>复制文本</Button>
          <Button size="small" icon={ <DownloadOutlined /> } disabled={ !art } onClick={ doSave }>下载 .txt</Button>
        </Space>
      </div>
      <pre style={ {
        background: '#f6f8fa', color: '#222', borderRadius: 8, padding: 12,
        fontSize: 9, lineHeight: 0.9, letterSpacing: 0, whiteSpace: 'pre',
        overflow: 'auto', maxHeight: 480, margin: 0,
        fontFamily: 'Consolas, "Courier New", monospace',
      } }>{ art }</pre>
      <div style={ { color: '#bbb', fontSize: 12, marginTop: 6 } }>
        提示: 预览按等宽字体近似比例示意, 复制到 Markdown 代码块或等宽字体编辑器效果最佳
      </div>
    </div>
  );
}

export default AsciiTextArt;
