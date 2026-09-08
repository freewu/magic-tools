import { Alert, Button, ColorPicker, Divider, Input, Select, Slider, Space, Switch, Tabs, Tooltip, message, theme } from "antd";
import { useEffect, useRef, useState } from "react";
import type { Color } from 'antd/es/color-picker';
import JsBarcode from 'jsbarcode';
import { barcodeFormatList } from './data';
import { savePngFile, savePngBatch } from '../../lib/tauri';
import {
  getDefaultFormat,
  getDefaultBarWidth,
  getDefaultBarHeight,
  getDefaultShowText,
  getFormatHint,
  validateBarcode,
} from './lib';

const MAX_BATCH = 200; // 批量行数上限
const pad3 = (n: number): string => String(n).padStart(3, '0');

// 批量条目: 每条一个 canvas, 由 jsbarcode 绘制
const BarcodeCell: React.FC<{
  text: string;
  format: string;
  barWidth: number;
  barHeight: number;
  showText: boolean;
  lineColor: string;
  backgroudColor: string;
}> = ({ text, format, barWidth, barHeight, showText, lineColor, backgroudColor }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [ err, setErr ] = useState('');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    try {
      JsBarcode(canvas, text, {
        format,
        width: barWidth,
        height: barHeight,
        displayValue: showText,
        font: 'sans-serif',
        fontSize: 14,
        textMargin: 4,
        lineColor,
        background: backgroudColor,
        margin: 8,
      });
      setErr('');
    } catch (e) {
      setErr((e as Error).message ?? String(e));
      canvas.width = 0;
    }
  }, [ text, format, barWidth, barHeight, showText, lineColor, backgroudColor ]);

  if (err) {
    return <div style={ { color: '#ff4d4f', fontSize: 12 } }>{ err }</div>;
  }
  return <canvas ref={ ref } style={ { display: 'block', maxWidth: 320, height: 'auto' } } />;
};

const BarcodeGenerator = () => {
  const { token } = theme.useToken();

  const [ format, setFormat ] = useState<string>(getDefaultFormat()); // 条码格式
  const [ value, setValue ] = useState(''); // 需要编码的内容
  const [ barWidth, setBarWidth ] = useState(getDefaultBarWidth()); // 条宽
  const [ barHeight, setBarHeight ] = useState(getDefaultBarHeight()); // 条码高度
  const [ showText, setShowText ] = useState(getDefaultShowText()); // 是否显示内容文字
  const [ lineColor, setLineColor ] = useState('#000000'); // 条码颜色
  const [ backgroudColor, setBackgroudColor ] = useState('#ffffff'); // 条码背景色
  const [ runtimeError, setRuntimeError ] = useState(''); // 生成时异常提示 (jsbarcode 内部校验)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ notice, contextHolder ] = message.useMessage();

  // 批量模式
  const [ mode, setMode ] = useState('single'); // single | batch
  const [ batchText, setBatchText ] = useState(''); // 批量: 每行一个编码内容
  const [ batchPrefix, setBatchPrefix ] = useState('barcode'); // 批量: 文件名前缀
  const batchBoxRef = useRef<HTMLDivElement | null>(null);

  // 渲染期同步校验 (避免先展示旧图/旧错误一帧)
  const vmsg = value === '' ? '' : validateBarcode(format, value);
  const errorText = vmsg !== '' ? vmsg : runtimeError;

  // 渲染条码到 canvas
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (value === '' || vmsg !== '') {
      setRuntimeError('');
      canvas.width = 0;
      return;
    }
    try {
      JsBarcode(canvas, value, {
        format,
        width: barWidth,
        height: barHeight,
        displayValue: showText,
        font: 'sans-serif',
        fontSize: 16,
        textMargin: 4,
        lineColor,
        background: backgroudColor,
        margin: 8,
      });
      setRuntimeError('');
    } catch (e) {
      setRuntimeError('生成失败: ' + ((e as Error).message ?? String(e)));
      canvas.width = 0;
    }
  };

  useEffect(() => {
    render();
  });

  // 下载/保存 PNG (Tauri 弹系统保存对话框选位置; 浏览器环境直接触发下载)
  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) {
      notice.warning('请先输入内容生成条形码');
      return;
    }
    const ok = await savePngFile('barcode-' + format.toLowerCase() + '.png', canvas.toDataURL('image/png'));
    if (ok) notice.success('条形码图片已保存');
  };

  // 批量行解析
  const allLines = batchText.split(/\r?\n/).map((s) => s.trim()).filter((s) => s !== '');
  const batchLines = allLines.slice(0, MAX_BATCH);
  const batchOver = allLines.length > MAX_BATCH;

  // 批量导出: 逐卡片抓取 canvas, 桌面版选文件夹一次写入 / 网页版逐个下载
  const exportBatch = async () => {
    if (batchLines.length === 0) {
      notice.warning('请先输入内容');
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
    const box = batchBoxRef.current;
    if (!box) return;
    const cards = Array.from(box.children);
    const names: string[] = [];
    const dataUrls: string[] = [];
    let failed = 0;
    cards.forEach((card, i) => {
      const canvas = card.querySelector('canvas');
      if (canvas) {
        names.push(`${batchPrefix.trim() || 'barcode'}-${pad3(i + 1)}.png`);
        dataUrls.push((canvas as HTMLCanvasElement).toDataURL('image/png'));
      } else {
        failed += 1;
      }
    });
    if (dataUrls.length === 0) {
      notice.error('条形码生成失败, 请检查内容后重试');
      return;
    }
    const n = await savePngBatch(names, dataUrls);
    if (n > 0) {
      notice.success(failed > 0 ? `已保存 ${n} 个 (${failed} 行内容不符合 ${format} 规则被跳过)` : `已保存 ${n} 个条形码`);
    } else {
      notice.info('已取消保存');
    }
  };

  // 取色器回调
  const onLineColorChange = (value: Color, hex: string) => { setLineColor(hex); };
  const onBackgroudColorChange = (value: Color, hex: string) => { setBackgroudColor(hex); };

  return (
    <>
      { contextHolder }
      {/* 公共生成参数: 单个 / 批量 共用 */}
      <Space style={ { margin: "5px 0 5px 0", flexWrap: "wrap" } }>
        <Tooltip placement="topLeft" title={ getFormatHint(format) }>
          <label>格式:</label>
        </Tooltip>
        <Select
          style={ { width: 200 } }
          value={ format }
          onChange={ (v) => { setFormat(v); } }
          options={ barcodeFormatList }
        />
        <label>条宽:</label>
        <div style={ { width: 130 } }>
          <Slider
            min={ 1 }
            max={ 5 }
            step={ 1 }
            value={ barWidth }
            onChange={ (v) => { setBarWidth(v); } }
          />
        </div>
        <span>{ barWidth }px</span>
        <label>高度:</label>
        <div style={ { width: 130 } }>
          <Slider
            min={ 30 }
            max={ 300 }
            value={ barHeight }
            onChange={ (v) => { setBarHeight(v); } }
          />
        </div>
        <span>{ barHeight }px</span>
        <label>颜色:</label>
        <ColorPicker
          format={ 'hex' }
          value={ lineColor }
          onChange={ onLineColorChange }
        />
        <label>背景色:</label>
        <ColorPicker
          format={ 'hex' }
          value={ backgroudColor }
          onChange={ onBackgroudColorChange }
        />
        <label>显示内容:</label>
        <Switch
          checked={ showText }
          checkedChildren="显示"
          unCheckedChildren="隐藏"
          onChange={ (v) => { setShowText(v); } }
        />
      </Space>

      <Divider style={{ margin: '10px 0' }} />

      <Tabs
        size="small"
        activeKey={ mode }
        onChange={ (k) => setMode(k) }
        items={ [
          {
            key: 'single',
            label: '单个',
            children: (
              <>
                <Input
                  style={ { margin: "5px 0 5px 0" } }
                  allowClear
                  maxLength={ 200 }
                  value={ value }
                  onChange={ (e) => { setValue(e.target.value); } }
                  placeholder={ "输入内容后自动生成条形码 (" + getFormatHint(format) + ")" }
                />

                <Space style={ { margin: "5px 0 5px 0" } }>
                  <Button
                    type="primary"
                    onClick={ download }
                    disabled={ value === '' || errorText !== '' }
                  >下载 PNG</Button>
                  <Button
                    onClick={ () => { setValue(''); } }
                    style={ { backgroundColor: "#dc3545", color: "#fff" } }
                  >清除</Button>
                </Space>

                { errorText !== '' && (
                  <div style={ { color: '#ff4d4f', margin: "5px 0" } }>{ errorText }</div>
                ) }

                <Divider dashed />

                { value !== '' && errorText === '' && (
                  <div
                    id="barcodebox"
                    onClick={ download }
                    title="点击下载条形码 PNG"
                    style={ {
                      display: 'inline-block',
                      padding: 10,
                      border: '1px dashed rgba(128, 128, 128, 0.45)',
                      borderRadius: 8,
                      background: backgroudColor,
                      maxWidth: '100%',
                      overflowX: 'auto',
                      cursor: 'pointer',
                    } }
                  >
                    <canvas
                      ref={ canvasRef }
                      style={ { display: 'block', maxWidth: '100%', height: 'auto' } }
                    />
                  </div>
                ) }
              </>
            ),
          },
          {
            key: 'batch',
            label: '批量',
            children: (
              <>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 8 }}
                  message={ `每行一个编码内容, 一次生成 ${MAX_BATCH} 行以内; 不符合当前 ${format} 编码规则的行走自动跳过; 导出时桌面版选择文件夹一次保存全部图片, 网页版逐个下载。` }
                />
                <Input.TextArea
                  style={ { margin: "5px 0 5px 0" } }
                  value={ batchText }
                  onChange={ (e) => setBatchText(e.target.value) }
                  placeholder={ `批量内容 (每行一个条形码)\n\n示例:\n6901028040479\n4006381333931\nABC-12345\nhttps://example.com` }
                  autoSize={{ minRows: 6, maxRows: 12 }}
                  spellCheck={ false }
                />
                <Space wrap style={ { marginTop: '4px' } }>
                  <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
                    { batchLines.length } 行{batchOver ? ` (超过 ${MAX_BATCH} 行, 已截断)` : ''}
                  </span>
                  <label style={{ fontSize: 13 }}>文件名前缀:</label>
                  <Input
                    style={ { width: 120 } }
                    value={ batchPrefix }
                    maxLength={ 40 }
                    onChange={ (e) => setBatchPrefix(e.target.value.trim()) }
                    placeholder="barcode"
                  />
                  <Button
                    type="primary"
                    disabled={ batchLines.length === 0 }
                    onClick={ exportBatch }
                  >导出全部 PNG</Button>
                  <Button
                    onClick={ () => { setBatchText(''); } }
                    style={ { backgroundColor: "#dc3545", color: "#fff" } }
                  >清空</Button>
                </Space>
                <Divider dashed />
                { batchLines.length > 0 && (
                  <div
                    ref={ batchBoxRef }
                    style={ { display: 'flex', flexWrap: 'wrap', gap: 12 } }
                  >
                    { batchLines.map((line, i) => {
                      const lineErr = validateBarcode(format, line);
                      return (
                        <div
                          key={ i }
                          style={ {
                            display: 'inline-block',
                            textAlign: 'center',
                            border: '1px solid rgba(128,128,128,0.25)',
                            borderRadius: 8,
                            padding: 8,
                            background: backgroudColor,
                          } }
                        >
                          { lineErr !== '' ? (
                            <div style={ { color: '#ff4d4f', fontSize: 12, maxWidth: 200 } }>{ lineErr }</div>
                          ) : (
                            <BarcodeCell
                              text={ line }
                              format={ format }
                              barWidth={ barWidth }
                              barHeight={ barHeight }
                              showText={ showText }
                              lineColor={ lineColor }
                              backgroudColor={ backgroudColor }
                            />
                          ) }
                          <div
                            title={ line }
                            style={ {
                              maxWidth: 320,
                              marginTop: 4,
                              fontSize: 12,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: 'rgba(0,0,0,0.6)',
                            } }
                          >{ line }</div>
                        </div>
                      );
                    }) }
                  </div>
                ) }
              </>
            ),
          },
        ] }
      />
    </>
  );
}

export default BarcodeGenerator;
