import { Checkbox, Form, Input, Divider, message, Space, Radio, Button, ColorPicker, Row, Col, Tabs } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { genColorString, transalte2Hex, calcColorSchemes } from "./lib"
import { colorTypeList, emptyResult } from "./data"
import type { RadioChangeEvent } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import colorLang from "./lang";

const ColorConvert = () => {

  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(colorLang, locale, key, fallback);

  const [ value, setValue ] = useState(''); // 需要转换的颜色值 
  const [ colorType, setColorType ] = useState('HEX'); // 输入值的颜色类型,
  const [ placeholder, setPlaceholder ] = useState(tr(colorLang, locale, 'ph_HEX', colorTypeList[0]["placeholder"])); // 颜色类型的输入提示
  const [ checked, setChecked ] = useState(false); // 输出大小写
  const [ colorData, setColorData ] = useState(emptyResult); // 转换的结果
  const [ notice, contextHolder] = message.useMessage();
  const [ colorPickerHex, setColorPickerHex ] = useState<Color | string>('#1677ff'); // colorPicker 默认颜色
  const [ showPercent, setShowPercent ] = useState(false); // 是否显示 % 

  const inputStyle = { cursor: "pointer" };

  // 切换输入颜色类型
  const onColorTypeChange = ({ target: { value } }: RadioChangeEvent) => {
    setColorType(value);
    setValue(''); // 需要把内容清空,类型变了输入的内容也没意义了
    setColorData(emptyResult);
    // 更新输入提示信息
    const tips = colorTypeList.find(item => item.label === value)?.placeholder;
    setPlaceholder(t('ph_' + value, (tips ?? '') + ''));
  };

  // 点击结果框,把结果复制到粘贴板
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success(t('copyOk', '复制到粘贴板成功！！！'));
    }
  };

  const handleCheckboxChange = () => {
    setChecked(!checked);
    // 如果要专内容不为空，处理 显示字母的大小问题
    if ( value.trim() != "") {
      const result = {
        "hex": (checked)? colorData.hex.toLowerCase() : colorData.hex.toUpperCase(),
        "rgb": (checked)? colorData.rgb.toLowerCase() : colorData.rgb.toUpperCase(),
        "hsl": (checked)? colorData.hsl.toLowerCase() : colorData.hsl.toUpperCase(),
        "cmyk": (checked)? colorData.cmyk.toLowerCase() : colorData.cmyk.toUpperCase(),
        "hsv": (checked)? colorData.hsv.toLowerCase() : colorData.hsv.toUpperCase(),
        "lab": (checked)? colorData.lab.toLowerCase() : colorData.lab.toUpperCase(),
        "lch": (checked)? colorData.lch.toLowerCase() : colorData.lch.toUpperCase(),
        "xyz": (checked)? colorData.xyz.toLowerCase() : colorData.xyz.toUpperCase(),
        "keyword": (checked)? colorData.keyword.toLowerCase() : colorData.keyword.toUpperCase(),
        "complementaryColor": (checked)? colorData.complementaryColor.toLowerCase() : colorData.complementaryColor.toUpperCase(), 
      };
      setColorData(result);
    }
  };

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setValue(value);
    // 输入4个符以上才处理
    if (value != "" && value.length >= 4) {
      covertColor(value);
    } else {
      setColorData(emptyResult);
    }
  }

  const upperLowerTranslate = (str :string) :string => {
    return checked? str.toUpperCase() : str.toLowerCase()
  }

  const covertColor = (value :string) => {
    setValue(value);
    const colorHex = transalte2Hex(value, colorType);
    const result = {
      "hex": upperLowerTranslate(genColorString(colorHex, "HEX")),
      "rgb": upperLowerTranslate(genColorString(colorHex, "RGB")),
      "hsl": upperLowerTranslate(genColorString(colorHex, "HSL")),
      "cmyk": upperLowerTranslate(genColorString(colorHex, "CMYK")),
      "hsv": upperLowerTranslate(genColorString(colorHex, "HSV")),
      "lab": upperLowerTranslate(genColorString(colorHex, "LAB")),
      "lch": upperLowerTranslate(genColorString(colorHex, "LCH")),
      "xyz": upperLowerTranslate(genColorString(colorHex, "XYZ")),
      "keyword": upperLowerTranslate(genColorString(colorHex, "KEYWORD")),
      "complementaryColor": upperLowerTranslate(genColorString(colorHex, "ComplementaryColor")),
    };
    setColorData(result);
  }

  // 把 hex 转成当前输入格式的文本 (输入格式与对应输出格式保持一致)
  const fmtText = (hex :string) :string => upperLowerTranslate(genColorString(hex, colorType));

  // 取色器选择颜色事件: 填入/输出格式跟随当前输入格式 (默认输入 HEX 时仍是 #rrggbb)
  // 注意: antd ColorPicker onChange 第二参是 css 字符串(如 rgb(87,113,150)), 并非 hex,
  // 必须用 value.toHexString() 取标准 #rrggbb 才能解析生成配色方案
  const onColorPickerChange = (value: Color) => {
    setColorPickerHex(value);
    // 带 alpha 时 toHexString() 返回 #rrggbbaa, 截取前 7 位以匹配本页支持的 #rrggbb 解析
    const raw = value.toHexString();
    const hex = raw.length > 7 ? raw.slice(0, 7) : raw;
    const text = fmtText(hex);
    setValue(text);
    // 转换 (按当前输入格式解析, 不再强制切回 HEX)
    covertColor(text);
  }

  // 切换显示 %
  const handleShowPercentChange = ()  => {
    setShowPercent(!showPercent);
  }

  // ---- 配色方案 ----
  const schemes = colorData.hex ? calcColorSchemes(colorData.hex) : [];

  // 根据背景色亮度决定前景文字颜色
  const schemeTextColor = (hex :string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#333' : '#fff';
  };

  const copyHex = (hex :string) => {
    copyTextToClipboard(hex);
    notice.success(upperLowerTranslate(hex) + t('copiedSfx', ' 已复制'));
  };

  const offsetText = (o :number) => o === 0 ? t('schemeMain', '主色') : ((o > 0 ? '+' : '') + o + '°');

  // 输入区: 类型选择 + 颜色输入框 (常驻 Tabs 上方)
  const inputPane = (
    <>
      <Space>
        <Radio.Group 
          optionType = "button" buttonStyle="solid"
          options = { colorTypeList } 
          onChange={ onColorTypeChange } 
          value={ colorType } 
        />
        <Checkbox onChange={ handleCheckboxChange } checked={ checked }>{t('ckUpper', '大写字符显示')}</Checkbox>
        {/* <Checkbox onChange={ handleShowPercentChange } value={ showPercent }>显示 %</Checkbox> */}

        <ColorPicker
          format={ 'hex'}
          value={ colorPickerHex }
          onChange={ onColorPickerChange }
        />
          
        <Button 
          onClick={ () => { setValue(''); setColorData(emptyResult); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >{t('clear', '清除')}</Button>
      </Space>
      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        value= { value }
        onChange={ textAreaChange }
        placeholder={ placeholder }
        autoSize={{ minRows: 3, maxRows: 3 }}
      />
    </>
  );

  // 格式页: 结果区 (结果行包含全部格式, 首行"颜色"大色卡跟随所选输入格式)
  const formatPane = (
    <>
      <Divider dashed />
      <Row wrap>
        <Col span={12}>
          <Form name="basic1" labelCol={{ span: 4 }} autoComplete="off">
            <Form.Item label={t('lblColor', '颜色')}>
              <Input readOnly onClick={ inputClick }  
                style={ { cursor: "pointer", backgroundColor: colorData.hex, color: colorData.complementaryColor } } 
                value= { colorData.hex ? fmtText(colorData.hex) : '' }/>
            </Form.Item>
            <Form.Item label="HEX">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.hex } />
            </Form.Item>
            <Form.Item label="RGB">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.rgb } />
            </Form.Item>
            <Form.Item label="HSL">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.hsl } />
            </Form.Item>
            <Form.Item label="CMYK">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.cmyk }/>
            </Form.Item>
            <Form.Item label="Keyword">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.keyword } />
            </Form.Item>
          </Form>
        </Col>
        <Col span={12}>
          <Form name="basic2" labelCol={{ span: 4 }} autoComplete="off">
            <Form.Item label={t('lblComp', '互补色')}>
              <Input 
                readOnly onClick={ inputClick } 
                style={ { cursor: "pointer", backgroundColor: colorData.complementaryColor, color: colorData.hex } } 
                value={ colorData.complementaryColor ? fmtText(colorData.complementaryColor) : '' } 
              />
            </Form.Item>
            <Form.Item label="HSV">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.hsv }/>
            </Form.Item>
            <Form.Item label="LAB">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.lab }/>
            </Form.Item>
            <Form.Item label="LCH">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.lch }/>
            </Form.Item>
            <Form.Item label="XYZ">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.xyz }/>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </>
  );

  // 配色方案页: 7 组方案平铺展示, 色块以 HEX 文本呈现 (简洁可读, 不随输入格式变成长文本)
  const schemePane = (
    <>
      <div style={ { marginBottom: 12 } }>
        <span style={ { fontSize: 12, color: '#999' } }>
          { t('si_a', '基于主色') } { colorData.hex ? <b>{ upperLowerTranslate(colorData.hex) }</b> : '…' } { t('si_b', ' 的色相旋转生成, 点击色块复制 HEX; ') }{ t('si_gray', '若主色为灰色 (无彩色) 各方案颜色相同属正常现象') }
        </span>
      </div>
      { schemes.length === 0 ? (
        <div style={ { fontSize: 13, color: '#999' } }>{t('schemeHint', '输入有效颜色后, 自动生成相似 / 分离 / 三角 / 四角 / 方形 / 复合 / 双分离配色')}</div>
      ) : (
        <div style={ { display: 'flex', flexDirection: 'column', gap: 18 } }>
          { schemes.map((s) => (
            <div key={ s.key }>
              <div style={ { fontWeight: 600, fontSize: 13, marginBottom: 2 } }>{ t('sl_' + s.key, s.label) }</div>
              <div style={ { marginBottom: 8, fontSize: 12, color: '#999' } }>{ t('sd_' + s.key, s.desc) }</div>
              <div style={ { display: 'flex', gap: 8, flexWrap: 'wrap' } }>
                { s.colors.map((c) => (
                  <div
                    key={ c.hex + c.offset }
                    onClick={ () => copyHex(c.hex) }
                    title={ upperLowerTranslate(c.hex) + (c.isMain ? t('titleMain', '(主色)') : c.isComplement ? t('titleComp', '(互补)') : '') + t('clickHex', ' · 点击复制 HEX') }
                    style={ {
                      flex: 1, minWidth: 96, height: 64, borderRadius: 6, background: c.hex,
                      cursor: 'pointer', padding: '6px 8px', boxSizing: 'border-box',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      color: schemeTextColor(c.hex), fontFamily: 'monospace', fontSize: 12,
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
                    } }
                  >
                    <span>{ upperLowerTranslate(c.hex) }{ c.isMain ? t('mkM', '(主)') : (c.isComplement ? t('mkC', '(补)') : '') }</span>
                    <span>{ offsetText(c.offset) }</span>
                  </div>
                )) }
              </div>
            </div>
          )) }
        </div>
      ) }
    </>
  );

  return (
    <div>
      {contextHolder}
      {inputPane}
      <Tabs
        defaultActiveKey="format"
        items={ [
          { key: 'format', label: t('tabFmt', '格式'), children: formatPane },
          { key: 'scheme', label: t('tabScheme', '配色方案'), children: schemePane },
        ] }
      />
    </div>
  );
}

export default ColorConvert;