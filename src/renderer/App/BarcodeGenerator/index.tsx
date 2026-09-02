import { Button, ColorPicker, Divider, Input, Select, Slider, Space, Switch, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import type { Color } from 'antd/es/color-picker';
import JsBarcode from 'jsbarcode';
import { barcodeFormatList } from './data';
import {
  getDefaultFormat,
  getDefaultBarWidth,
  getDefaultBarHeight,
  getDefaultShowText,
  getFormatHint,
  validateBarcode,
} from './lib';

const BarcodeGenerator = () => {

  const [ format, setFormat ] = useState<string>(getDefaultFormat()); // 条码格式
  const [ value, setValue ] = useState(''); // 需要编码的内容
  const [ barWidth, setBarWidth ] = useState(getDefaultBarWidth()); // 条宽
  const [ barHeight, setBarHeight ] = useState(getDefaultBarHeight()); // 条码高度
  const [ showText, setShowText ] = useState(getDefaultShowText()); // 是否显示内容文字
  const [ lineColor, setLineColor ] = useState('#000000'); // 条码颜色
  const [ backgroudColor, setBackgroudColor ] = useState('#ffffff'); // 条码背景色
  const [ runtimeError, setRuntimeError ] = useState(''); // 生成时异常提示 (jsbarcode 内部校验)
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // 下载 PNG
  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = 'barcode-' + format.toLowerCase() + '.png';
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 取色器回调
  const onLineColorChange = (value: Color, hex: string) => { setLineColor(hex); };
  const onBackgroudColorChange = (value: Color, hex: string) => { setBackgroudColor(hex); };

  return (
    <>
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
        <div style={ { width: 160 } }>
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
        <div style={ { width: 160 } }>
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
  );
}

export default BarcodeGenerator;
