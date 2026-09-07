import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, Checkbox, Input, Radio, Select, Slider, Space, Typography, message,
} from 'antd';
import {
  DownloadOutlined, CopyOutlined, ThunderboltOutlined, ClearOutlined,
} from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import {
  SPECS, specLabel, sampleGlyph, rowsToBytes, formatCArray, matrixToText,
} from './lib';
import type { BitOrder, ExtractMode } from './lib';
import './dotmatrix.css';

const { Text } = Typography;

interface ResultItem {
  ch: string;
  matrix: Uint8Array;
  bytes: number[];
}

interface Result {
  code: string;
  items: ResultItem[];
  specLabel: string;
}

/** 点阵预览画布: 用 --app-text 颜色跟随深浅主题 */
const MatrixCanvas = ({ m, w, h, invert }: { m: Uint8Array; w: number; h: number; invert: boolean }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cell = Math.max(6, Math.floor(160 / Math.max(w, h)));
    const gap = 1;
    const color = getComputedStyle(document.documentElement).getPropertyValue('--app-text').trim() || '#000';
    canvas.width = w * (cell + gap) - gap;
    canvas.height = h * (cell + gap) - gap;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    for (let r = 0; r < h; r += 1) {
      for (let c = 0; c < w; c += 1) {
        const on = m[r * w + c] === 1;
        if (invert ? !on : on) ctx.fillRect(c * (cell + gap), r * (cell + gap), cell, cell);
      }
    }
  }, [ m, w, h, invert ]);
  return <canvas ref={ ref } className="dot-canvas" />;
};

const DotMatrixFont = () => {
  const [ specIdx, setSpecIdx ] = useState(5); // 默认 16x16
  const [ text, setText ] = useState('你好');
  const [ mode, setMode ] = useState<ExtractMode>('row');
  const [ order, setOrder ] = useState<BitOrder>('msb');
  const [ invert, setInvert ] = useState(false);
  const [ threshold, setThreshold ] = useState(100);
  const [ result, setResult ] = useState<Result | null>(null);
  const [ notice, contextHolder ] = message.useMessage();

  const spec = SPECS[specIdx];

  const generate = () => {
    const chars = Array.from(new Set(text.replace(/\s+/g, '')));
    if (chars.length === 0) {
      notice.warning('请输入需要取模的字符 (可多个, 自动去重)');
      return;
    }
    const items: ResultItem[] = [];
    for (const ch of chars) {
      const matrix = sampleGlyph(ch, spec, { threshold, invert });
      if (!matrix) {
        notice.error('当前环境不支持 Canvas 字形采样');
        return;
      }
      const bytes = rowsToBytes(matrix, spec.w, spec.h, mode, order);
      items.push({ ch, matrix, bytes });
    }
    const code = formatCArray({
      chars: items.map((i) => i.ch),
      chunks: items.map((i) => i.bytes),
      spec,
      mode,
      order,
    });
    setResult({ code, items, specLabel: specLabel(spec) });
    notice.success(`已为 ${items.length} 个字符生成取模代码`);
  };

  const copyCode = async () => {
    if (!result) return;
    await copyTextToClipboard(result.code);
    notice.success('取模代码已复制到粘贴板');
  };

  const saveH = async () => {
    if (!result) return;
    try {
      const ok = await saveTextFile(`font_${result.specLabel.replace('x', 'x')}.h`, result.code, '保存字库头文件', { filterName: 'C 头文件', extensions: ['h'] });
      if (ok) notice.success('已保存 .h 文件');
    } catch (err) {
      notice.error('保存失败: ' + (err as Error).message);
    }
  };

  const firstItem = result?.items[0];
  const firstText = useMemo(() => (firstItem ? matrixToText(firstItem.matrix, spec.w, spec.h) : ''), [ firstItem, spec ]);

  return (
    <div>
      {contextHolder}

      <Space wrap style={ { marginBottom: 8 } }>
        <span className="dot-label">规格</span>
        <Select
          size="middle"
          style={ { width: 110 } }
          value={ specIdx }
          onChange={ setSpecIdx }
          options={ SPECS.map((s, i) => ({ value: i, label: `${s.w}×${s.h}` })) }
        />
        <span className="dot-label">字符</span>
        <Input
          style={ { width: 240 } }
          value={ text }
          onChange={ (e) => setText(e.target.value) }
          placeholder="输入字符, 多个自动去重, 如: 中A8"
          maxLength={ 60 }
        />
      </Space>

      <Space wrap style={ { marginBottom: 8 } }>
        <span className="dot-label">取模方式</span>
        <Radio.Group
          value={ mode }
          onChange={ (e) => setMode(e.target.value) }
          options={ [
            { value: 'row', label: '逐行式' },
            { value: 'col', label: '逐列式' },
          ] }
          optionType="button"
          size="small"
        />
        <span className="dot-label">位序</span>
        <Radio.Group
          value={ order }
          onChange={ (e) => setOrder(e.target.value) }
          options={ [
            { value: 'msb', label: '高位在前' },
            { value: 'lsb', label: '低位在前' },
          ] }
          optionType="button"
          size="small"
        />
        <Checkbox checked={ invert } onChange={ (e) => setInvert(e.target.checked) }>反色 (取白)</Checkbox>
        <span className="dot-label">阈值</span>
        <Slider
          style={ { width: 160, display: 'inline-block', margin: '0 6px' } }
          min={ 0 }
          max={ 255 }
          value={ threshold }
          onChange={ setThreshold }
          tooltip={ { open: true, placement: 'bottom' } }
        />
      </Space>

      <Space wrap style={ { marginBottom: 10 } }>
        <Button type="primary" icon={ <ThunderboltOutlined /> } onClick={ generate }>生成取模代码</Button>
        <Button icon={ <CopyOutlined /> } onClick={ () => void copyCode() } disabled={ !result }>复制代码</Button>
        <Button icon={ <DownloadOutlined /> } onClick={ () => void saveH() } disabled={ !result }>下载 .h</Button>
        <Button icon={ <ClearOutlined /> } onClick={ () => setResult(null) } disabled={ !result }>清除结果</Button>
      </Space>

      <Text type="secondary" style={ { fontSize: 12, display: 'block', marginBottom: 10 } }>
        字形按系统字体渲染后以 { spec.w }×{ spec.h } 网格采样 (取每格中心判定), 与所选系统字体相关, 与标准字库字形可能有差异; 如需精确标准点阵字库请用字库文件/专业取模软件。
      </Text>

      { result && firstItem && (
        <div className="dot-result">
          <div className="dot-preview-col">
            <div className="dot-preview-title">预览 (仅第一个字符 “{firstItem.ch}”)</div>
            <div className="dot-preview-cell">
              <MatrixCanvas m={ firstItem.matrix } w={ spec.w } h={ spec.h } invert={ invert } />
            </div>
            <pre className="dot-bin">{ firstText }</pre>
          </div>
          <div className="dot-code-col">
            <div className="dot-preview-title">取模结果 ({ result.items.length } 字符 · { spec.w }×{ spec.h } · { mode === 'row' ? '逐行式' : '逐列式' } · { order === 'msb' ? '高位在前' : '低位在前' })</div>
            <pre className="dot-code">{ result.code }</pre>
          </div>
        </div>
      ) }

      { result && !firstItem && (
        <Text type="secondary">请在输入框中输入字符后点击「生成取模代码」</Text>
      ) }
    </div>
  );
};

export default DotMatrixFont;
