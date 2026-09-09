import { Radio, Divider, QRCode, Input, Space, message, Tooltip, ColorPicker, Row, Slider, Button, Alert, Tabs, theme } from "antd";
import { useRef, useState } from "react";
const { TextArea } = Input;
import { errorCorrectionLevelList } from './data';
import type { RadioChangeEvent, QRCodeProps } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { getDefaultErrorLevel, getErrorLevelTip, getDefaultSize } from './lib';
import { savePngFile, savePngBatch } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { im, imT } from './lang';

const MAX_BATCH = 200; // 批量行数上限
const pad3 = (n: number): string => String(n).padStart(3, '0');

const QRCodeGenerator = () => {
  const { locale } = useLocale();
  const t = (zh: string) => im(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => imT(locale, zh, v);
  const { token } = theme.useToken();

  const [ value, setValue ] = useState(''); // 需要编码的内容
  const [ errorLevelTips, setErrorLevelTips ] = useState(getErrorLevelTip(getDefaultErrorLevel())); // 容错级别提示
  const [ errorLevel, setErrorLevel ] = useState(getDefaultErrorLevel()); // 默认容错级别 L / M / Q / H
  const [ color, setColor ] = useState('#000'); // 二维码背颜色
  const [ backgroudColor, setBackgroudColor ] = useState('transparent'); // 二维码背景色
  const [ size, setSize ] = useState(getDefaultSize()); // 二维码尺寸大小
  const [ icon, setIcon ] = useState(""); // 二维码中间图片
  const [ iconSize, setIconSize ] = useState(getDefaultSize() / 8); // 二维码中间图片大小

  // 批量模式
  const [ mode, setMode ] = useState('single'); // single | batch
  const [ batchText, setBatchText ] = useState(''); // 批量: 每行一个内容
  const [ batchPrefix, setBatchPrefix ] = useState('QRCode'); // 批量: 导出文件名前缀
  const batchBoxRef = useRef<HTMLDivElement | null>(null); // 批量预览容器

  const onErrorLevelChange = ( { target: { value } }: RadioChangeEvent ) => {
    setErrorLevel(value);
    setErrorLevelTips(getErrorLevelTip(value));
  };

  const [ notice, contextHolder ] = message.useMessage();

  // 保存二维码为 PNG (Tauri 弹系统保存对话框选位置; 浏览器环境直接触发下载)
  const downloadQRCode = async () => {
    const box = document.getElementById('myqrcode');
    const canvas = box?.querySelector('canvas');
    const img = box?.querySelector('img');

    if (!canvas) {
      if (value.trim() === '') notice.warning(t('请先输入内容生成二维码'));
      return;
    }

    // 处理中间 icon 图片跨域问题
    if (img) {
      // 缓存的图像数据仍然会被画布视为有污染的跨源内容
      img.src = img.src + '?v=' + Math.random();
      img.crossOrigin = 'anonymous';
    }
    const ok = await savePngFile('QRCode.png', canvas.toDataURL('image/png'));
    if (ok) notice.success(t('二维码图片已保存'));
  };

  // 批量行解析: 每行一个内容
  const allLines = batchText.split(/\r?\n/).map((s) => s.trim()).filter((s) => s !== '');
  const batchLines = allLines.slice(0, MAX_BATCH);
  const batchOver = allLines.length > MAX_BATCH;

  // 批量导出: 逐卡片抓取 canvas, 桌面版选文件夹一次写入 / 网页版逐个下载
  const exportBatch = async () => {
    if (batchLines.length === 0) {
      notice.warning(t('请先输入内容'));
      return;
    }
    // 稍等 React/antd QRCode 完成 canvas 绘制
    await new Promise((resolve) => setTimeout(resolve, 80));
    const box = batchBoxRef.current;
    if (!box) return;
    const cards = Array.from(box.children);
    const names: string[] = [];
    const dataUrls: string[] = [];
    let failed = 0;
    cards.forEach((card, i) => {
      const canvas = card.querySelector('canvas');
      if (canvas) {
        names.push(`${batchPrefix.trim() || 'QRCode'}-${pad3(i + 1)}.png`);
        dataUrls.push((canvas as HTMLCanvasElement).toDataURL('image/png'));
      } else {
        failed += 1;
      }
    });
    if (dataUrls.length === 0) {
      notice.error(t('二维码生成失败, 请检查内容后重试'));
      return;
    }
    const n = await savePngBatch(names, dataUrls);
    if (n > 0) {
      notice.success(failed > 0 ? tt('已保存 {n} 个 ({f} 行内容过长未生成)', { n, f: failed }) : tt('已保存 {n} 个二维码', { n }));
    } else {
      notice.info(t('已取消保存'));
    }
  };

  // color 取色器选择颜色事件
  const onColorChange = (value: Color, hex: string) => {
    setColor(hex); 
  }

  // backgroudColor 取色器选择颜色事件
  const onBackgroudColorChange = (value: Color, hex: string) => {
    setBackgroudColor(hex); 
  }

  return (
    <>
      { contextHolder }
      {/* 公共生成参数: 单个 / 批量 共用 */}
      <Row style = { { marginTop: "5px" }}>
        <Space wrap>
          <Tooltip placement="topLeft" title={ "Error Resistance: " + errorLevelTips }>
            <label>{t('容错等级:')}</label>
          </Tooltip>
          <Radio.Group
            optionType="button" buttonStyle="solid"
            options={ errorCorrectionLevelList }
            onChange={ onErrorLevelChange }
            value={ errorLevel }
          />
          <label>{t('颜色:')}</label>
          <ColorPicker
            format={ 'hex' }
            value={ color }
            onChange={ onColorChange }
          />
          <label>{t('背景色:')}</label>
          <ColorPicker
            format={ 'hex' }
            value={ backgroudColor }
            onChange={ onBackgroudColorChange }
          />
          <label>{t('尺寸:')}</label>
          <div style={ { width: 180 } }>
            <Slider
              value={ size }
              min = { 160 }
              max = { 360 }
              onChange={ (value) => { setSize(value); setIconSize(value / 8); }}
            />
          </div>
          <span>{ size }px</span>
        </Space>
      </Row>

      <Divider style={{ margin: '10px 0' }} />

      <Tabs
        size="small"
        activeKey={ mode }
        onChange={ (k) => setMode(k) }
        items={ [
          {
            key: 'single',
            label: t('单个'),
            children: (
              <>
                <TextArea
                  style={ { margin: "5px 0 5px 0" } }
                  showCount
                  maxLength={ 100 }
                  onChange={ (e) => { setValue(e.target.value); } }
                  value= { value }
                  placeholder={t('需要生成二维码的内容')}
                  autoSize={{ minRows: 5 }}
                />
                <Row style={ { marginTop: '4px' } }>
                  <Space>
                    <Button
                      type="primary"
                      disabled={ value.trim() === '' }
                      onClick={ downloadQRCode }
                    >{t('保存图片')}</Button>
                    <Button
                      onClick={ () => { setValue(''); } }
                      style={ { backgroundColor: "#dc3545", color: "#fff" } }
                    >{t('清除')}</Button>
                  </Space>
                </Row>
                <Divider dashed />
                { value.trim() !== '' ? (
                  <div id="myqrcode" onClick={ downloadQRCode } title={t('点击下载二维码')}>
                    <QRCode
                      style={{ marginBottom: 16 }}
                      errorLevel={ errorLevel as QRCodeProps['errorLevel'] }
                      value={ value ? value : '' }
                      color={ color }
                      bgColor={ backgroudColor }
                      size={ size }
                      icon={ icon }
                      iconSize={ iconSize } // 按尺寸缩放中间图标
                    />
                  </div>
                ) : null }
              </>
            ),
          },
          {
            key: 'batch',
            label: t('批量'),
            children: (
              <>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 8 }}
                  message={ tt('每行一个二维码内容, 一次生成 {n} 行以内; 导出时桌面版选择文件夹一次保存全部图片, 网页版逐个下载。', { n: MAX_BATCH }) }
                />
                <TextArea
                  style={ { margin: "5px 0 5px 0" } }
                  value={ batchText }
                  onChange={ (e) => setBatchText(e.target.value) }
                  placeholder={ t('批量内容 (每行一个二维码)\n\n示例:\nhttps://example.com/page/1\nhttps://example.com/page/2\nhttps://example.com/page/3') }
                  autoSize={{ minRows: 6, maxRows: 12 }}
                  spellCheck={ false }
                />
                <Row style={ { marginTop: '4px' } }>
                  <Space wrap>
                    <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
                      { tt('{n} 行', { n: batchLines.length }) }{batchOver ? tt(' (超过 {m} 行, 已截断)', { m: MAX_BATCH }) : ''}
                    </span>
                    <label style={{ fontSize: 13 }}>{t('文件名前缀:')}</label>
                    <Input
                      style={ { width: 120 } }
                      value={ batchPrefix }
                      maxLength={ 40 }
                      onChange={ (e) => setBatchPrefix(e.target.value.trim()) }
                      placeholder="QRCode"
                    />
                    <Button
                      type="primary"
                      disabled={ batchLines.length === 0 }
                      onClick={ exportBatch }
                    >{t('导出全部 PNG')}</Button>
                    <Button
                      onClick={ () => { setBatchText(''); } }
                      style={ { backgroundColor: "#dc3545", color: "#fff" } }
                    >{t('清空')}</Button>
                  </Space>
                </Row>
                <Divider dashed />
                { batchLines.length > 0 && (
                  <div
                    ref={ batchBoxRef }
                    style={ { display: 'flex', flexWrap: 'wrap', gap: 12 } }
                  >
                    { batchLines.map((line, i) => (
                      <div
                        key={ i }
                        style={ {
                          display: 'inline-block',
                          textAlign: 'center',
                          border: '1px solid rgba(128,128,128,0.25)',
                          borderRadius: 8,
                          padding: 8,
                          background: backgroudColor === 'transparent' ? '#fff' : backgroudColor,
                        } }
                      >
                        <QRCode
                          errorLevel={ errorLevel as QRCodeProps['errorLevel'] }
                          value={ line }
                          color={ color }
                          bgColor={ backgroudColor }
                          size={ size }
                          icon={ icon }
                          iconSize={ iconSize }
                        />
                        <div
                          title={ line }
                          style={ {
                            maxWidth: size,
                            marginTop: 4,
                            fontSize: 12,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: 'rgba(0,0,0,0.6)',
                          } }
                        >{ line }</div>
                      </div>
                    )) }
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

export default QRCodeGenerator;
