import { Button, Card, Form, Input, Divider, message, Space, Tag } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib";
import { emptyResult, timeList } from "./data";
import { formatDateTime, gpsTimeOf, bdtTimeOf, gstTimeOf, glonassTimeText, julianDayOf } from "./lib";
import { InputStatus } from "antd/es/_util/statusUtils";
import { useLocale } from "../../hook/locale-context";
import { tr, trTpl } from "../../i18n/lang";
import timeLang from "./lang";

const Time = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(timeLang, locale, key, fallback);
  const tpl = (key: string, vars: Record<string, string | number>, fallback: string) => trTpl(timeLang, locale, key, vars, fallback);

  const [ status, setStatus ] = useState('');
  const [ value, setValue ] = useState('');
  const [ data, setData ] = useState<Record<string, string>>(emptyResult);
  const [ notice, contextHolder ] = message.useMessage();

  const inputStyle = { cursor: "pointer" };
  // 卫星导航系统时间分组框 (占满结果区两列, 内部再分两列)
  const satCardStyle = { gridColumn: '1 / -1', marginBottom: 16 };
  const satGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 16 };
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success(t('copyOk', '复制到粘贴板成功！！！'));
    }
  };

  const updateDate = (d: Date) => {
    setStatus('');
    const r :Record<string, string> = {
      "ts10": "",
      "ts13": d.getTime() + "",
      "rfc3339": "",
      "iso8601": d.toISOString(),
      "rfc2822": "",
      "locale": d.toLocaleString(),
      "utc": d.toUTCString(),
      "custom": formatDateTime(d),
    };
    r["ts10"] = Math.round(d.getTime() / 1000) + "";
    // 导航/天文时间系统 (与 UTC 的关系见 lib.ts 注释)
    const ms = d.getTime();
    const g = gpsTimeOf(ms);
    const b = bdtTimeOf(ms);
    const s = gstTimeOf(ms);
    const jd = julianDayOf(ms);
    r["gps"] = tpl('wkSec', { wk: g.week, sec: g.tow }, `${g.week} 周 + ${g.tow} 秒`);
    r["gpsWeekTow"] = `${g.week}, ${g.tow}`;
    r["gpsTotal"] = `${g.total}`;
    r["bdt"] = tpl('wkSec', { wk: b.week, sec: b.tow }, `${b.week} 周 + ${b.tow} 秒`);
    r["bdtWeekTow"] = `${b.week}, ${b.tow}`;
    r["bdtTotal"] = `${b.total}`;
    r["gst"] = tpl('wkSec', { wk: s.week, sec: s.tow }, `${s.week} 周 + ${s.tow} 秒`);
    r["gstWeekTow"] = `${s.week}, ${s.tow}`;
    r["gstTotal"] = `${s.total}`;
    r["glonass"] = glonassTimeText(ms);
    r["jd"] = jd.jd.toFixed(6);
    r["mjd"] = jd.mjd.toFixed(6);
    setData(r);
  }

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    let v = e.target.value;
    setValue(v);
    setData(emptyResult);
    if(v.trim() != "") {
      try {
        let d;
        // 判断是否是时间戳 全数字 ^/d+$
        if(/^\d+$/.test(v)) {
          // 如果是10位时间戳需要补三位
          if(v.length == 10) v = v + "000";
          d = new Date(parseInt(v)); 			// 时间戳格式化 可以使用Date.parse函数 但是不支持任
        } else {
          d = new Date(v);
        }
        updateDate(d);
      } catch(e) {
        console.log(e);
        setStatus('error');
        //notice.error("输入时间格式出错!!!");
      }
    }
  }

  const calcTagColor = (index :number) => {
    switch(index % 4) {
      case 1: return '#2db7f5';
      case 2: return '#87d068';
      case 3: return '#108ee9';
    }
    return '#ff5500';
  }

  return (
    <div>
      {contextHolder}
      <Space size={[0, 8]} wrap>
        {
          timeList?.map((item, index) => {
            // 只展示 15 个
            if(index < 15) {
              return (
                <Tag 
                  key={ item.key }
                  color={ calcTagColor(index) } style={ inputStyle } 
                  onClick={ () => { 
                      const v = item.value;
                      setValue( v ); 
                      updateDate(new Date(/^\d+$/.test(v)? parseInt(v) : v)); 
                    } 
                  } 
                >{ t('tl_' + item.key, item.lable) }</Tag>
              )
            }
          })
        }
      </Space>
      <TextArea
        status={ status as InputStatus }
        style={ { margin: "5px 0 5px 0" }}
        value= { value }
        onChange={  textAreaChange }
        placeholder={t('ph', '输入 10位时间戳 / 13位时间戳 / UTC 格式字符串 / YYYY-MM-DD HH:ii:ss 格式字符串')}
        autoSize={{ minRows: 3, maxRows: 3 }}
      />
      <Space>
        {/* <Button 
          onClick={ () => {  } }
          style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
        >当前时间</Button> */}
        <Button 
          onClick={ () => { setValue(''); setData(emptyResult); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >{t('clear', '清除')}</Button>
      </Space>

      <Divider dashed />

      {/* 结果分两排展示: 两列网格 (每列内部保持表单 label+输入行式布局) */}
      <Form name="basic" labelCol={{ span: 9 }} autoComplete="off">
        <div style={ { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 16 } }>
        <Form.Item label={t('lb_ts10', '时间戳(10位)')}>
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.ts10 } />
        </Form.Item>
        <Form.Item label={t('lb_ts13', '时间戳(13位)')}>
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.ts13 } />
        </Form.Item>
        <Form.Item label="ISO 8601">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.iso8601 } />
        </Form.Item>
        {/* <Form.Item label="RFC 3339">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.rfc3339 }/>
        </Form.Item> */}
        {/* <Form.Item label="RFC 2822">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.rfc2822 }/>
        </Form.Item> */}
        <Form.Item label="Locale">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.locale }/>
        </Form.Item>
        <Form.Item label="UTC">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.utc }/>
        </Form.Item>
        <Form.Item label="YYYY-MM-DD HH:ii:ss">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.custom }/>
        </Form.Item>
        <Form.Item label="YYYY-MM-DD">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { 
            data.custom? data.custom.split(" ")["0"] : '' 
          }/>
        </Form.Item>
        {/* GPS / 北斗 / 伽利略: 各自一个分组框圈起来 (内部标签不再重复系统名) */}
        <Card
          size="small"
          title={t('lb_gps', 'GPS 时间')}
          style={ satCardStyle }
          styles={ { body: { paddingTop: 12, paddingBottom: 0 } } }
        >
          <div style={ satGridStyle }>
            <Form.Item label={t('lb_ws', '周 + 秒')}>
              <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.gps }/>
            </Form.Item>
            <Form.Item label={t('lb_wsCsv', '周, 秒')}>
              <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.gpsWeekTow }/>
            </Form.Item>
            <Form.Item label={t('lb_total', '总秒数')}>
              <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.gpsTotal }/>
            </Form.Item>
          </div>
        </Card>

        <Card
          size="small"
          title={t('lb_bdt', '北斗时间')}
          style={ satCardStyle }
          styles={ { body: { paddingTop: 12, paddingBottom: 0 } } }
        >
          <div style={ satGridStyle }>
            <Form.Item label={t('lb_ws', '周 + 秒')}>
              <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.bdt }/>
            </Form.Item>
            <Form.Item label={t('lb_wsCsv', '周, 秒')}>
              <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.bdtWeekTow }/>
            </Form.Item>
            <Form.Item label={t('lb_total', '总秒数')}>
              <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.bdtTotal }/>
            </Form.Item>
          </div>
        </Card>

        <Card
          size="small"
          title={t('lb_gst', '伽利略时间')}
          style={ satCardStyle }
          styles={ { body: { paddingTop: 12, paddingBottom: 0 } } }
        >
          <div style={ satGridStyle }>
            <Form.Item label={t('lb_ws', '周 + 秒')}>
              <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.gst }/>
            </Form.Item>
            <Form.Item label={t('lb_wsCsv', '周, 秒')}>
              <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.gstWeekTow }/>
            </Form.Item>
            <Form.Item label={t('lb_total', '总秒数')}>
              <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.gstTotal }/>
            </Form.Item>
          </div>
        </Card>

        <Form.Item label={t('lb_glonass', '格洛纳斯时间 (UTC+3)')}>
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.glonass }/>
        </Form.Item>
        <Form.Item label={t('lb_jd', '儒略日 (JD)')}>
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.jd }/>
        </Form.Item>
        <Form.Item label={t('lb_mjd', '简化儒略日 (MJD)')}>
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { data.mjd }/>
        </Form.Item>
        </div>
      </Form>

    </div>
  );
}

export default Time;