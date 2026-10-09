import { Select, Button, Input, Space, message, Row, Tooltip, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
const { TextArea } = Input;
import { useLocale } from "../../hook/locale-context";
import { cr, crT, crErr } from './lang';
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { arrayToOptions } from "../../lib/array"
import { bytesToUtf8, utf8ToBytes } from "../../lib/codec"
import { algorithmList, codeList } from "./data";
import { checkFixedHex, decodeBytes, encodeBytes, getDefaultAlgorithm, getDefaultCode, getDefaultIV, getDefaultKey, ivLenOf, keyLenOf, randomHex, ZUC_PARAMS } from "./lib";
import type { HexCheck, ZucAlgorithm, ZucCode } from "./lib";
import { initZuc, zucApply } from "./zuc";
import type { InputStatus } from "antd/es/_util/statusUtils";

const ZucCrypto = () => {
  const { locale } = useLocale();
  const t = (zh: string) => cr(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => crT(locale, zh, v);

  const [ notice, contextHolder ] = message.useMessage();
  const [ algorithm, setAlgorithm ] = useState<ZucAlgorithm>(getDefaultAlgorithm()); // 算法
  const [ code, setCode ] = useState<ZucCode>(getDefaultCode()); // 编码
  const [ key, setKey ] = useState(getDefaultKey()); // 密钥 (HEX)
  const [ iv, setIV ] = useState(getDefaultIV()); // 偏移量 IV (HEX)
  const [ encodeValue, setEncodeValue ] = useState(''); // 要加密的内容
  const [ decodeValue, setDecodeValue ] = useState(''); // 要解密的内容
  const [ engineState, setEngineState ] = useState('loading'); // wasm 引擎状态 loading / ready / error
  const [ engineError, setEngineError ] = useState('');

  // 预加载 wasm 引擎 (约 19 KB, 首次加载后缓存); 失败时页面仍可用, 仅点击加解密时提示
  useEffect(() => {
    let alive = true;
    initZuc().then(() => { if(alive) setEngineState('ready'); })
      .catch((e :unknown) => {
        if(alive) {
          setEngineState('error');
          setEngineError((e instanceof Error)? e.message : String(e));
        }
      });
    return () => { alive = false; };
  }, []);

  // 当前算法下的密钥 / IV 长度 (字节) 与校验结果
  const keyNeed = keyLenOf(algorithm);
  const ivNeed = ivLenOf(algorithm);
  const keyCheck :HexCheck = checkFixedHex(key, keyNeed);
  const ivCheck :HexCheck = checkFixedHex(iv, ivNeed);

  // 输入框状态: 空值不标红 (只是还没填), 其余不合法都标红
  const statusOf = (check :HexCheck) :InputStatus => (check.ok || check.issue === 'empty')? '' : 'error';

  // 不合法的原因文案 (合法时返回空串)
  const reasonOf = (check :HexCheck, isKey :boolean) :string => {
    if(check.ok) return '';
    if(check.issue === 'empty') return t(isKey? '请输入密钥' : '请输入偏移量 IV');
    if(check.issue === 'nonhex') return t(isKey? '密钥只能包含十六进制字符 0-9 / a-f' : '偏移量 IV 只能包含十六进制字符 0-9 / a-f');
    return tt(
      isKey? '密钥需为 {bits} 位 HEX ({need} 字节), 当前 {got} 字节' : '偏移量 IV 需为 {bits} 位 HEX ({need} 字节), 当前 {got} 字节',
      { bits: check.needBytes * 2, need: check.needBytes, got: check.gotBytes }
    );
  };

  // 加解密失败统一提示
  const fail = (e :unknown) => {
    console.log(e);
    const msg = (e instanceof Error)? e.message : String(e);
    notice.error(t('加解密失败') + ': ' + crErr(locale, msg || t('未知错误')));
  };

  // 加密处理 (与解密是同一个 wasm 调用: 明文 XOR 密钥流)
  const encode = async () => {
    const reason = reasonOf(keyCheck, true) || reasonOf(ivCheck, false);
    if(reason !== '') { notice.error(reason); return; }
    if(encodeValue === '') { notice.error(t('请输入需要加密的内容')); return; }
    try {
      const out = await zucApply(algorithm, keyCheck.bytes as Uint8Array, ivCheck.bytes as Uint8Array, utf8ToBytes(encodeValue));
      setDecodeValue(encodeBytes(out, code));
    } catch (e) { fail(e); }
  };

  // 解密处理
  const decode = async () => {
    const reason = reasonOf(keyCheck, true) || reasonOf(ivCheck, false);
    if(reason !== '') { notice.error(reason); return; }
    if(decodeValue.trim() === '') { notice.error(t('请输入需要解密的内容')); return; }
    try {
      const data = decodeBytes(decodeValue, code);
      const out = await zucApply(algorithm, keyCheck.bytes as Uint8Array, ivCheck.bytes as Uint8Array, data);
      setEncodeValue(bytesToUtf8(out));
    } catch (e) { fail(e); }
  };

  // 清除内容
  const clear = () => {
    setEncodeValue('');
    setDecodeValue('');
  };

  // 生成随机密钥 / IV (HEX)
  const randomize = (isKey :boolean) => {
    const value = randomHex(isKey? keyNeed : ivNeed);
    if(value === '') { notice.error(t('当前环境不支持安全随机数 (需要 HTTPS 或 localhost), 无法生成密钥')); return; }
    if(isKey) { setKey(value); } else { setIV(value); }
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success(t('复制到粘贴板成功！！！'));
    }
  };

  // 引擎状态文案
  const engineText = (engineState === 'ready')? t('引擎就绪')
    : (engineState === 'loading')? t('引擎加载中...')
    : t('引擎加载失败') + ((engineError !== '')? ': ' + engineError : '');

  return (
    <div>
      { contextHolder }

      <Row style = { { marginTop: "5px" } }>
        <Space wrap>
          {t('算法:')}
          <Select
            value={ algorithm }
            style={{ width: 120 }}
            onChange={ (v :ZucAlgorithm) => { setAlgorithm(v) } }
            options={ arrayToOptions(algorithmList) }
          />
          {t('编码:')}
          <Select
            value={ code }
            style={{ width: 120 }}
            onChange={ (v :ZucCode) => { setCode(v) } }
            options={ arrayToOptions(codeList) }
          />
          {t('密钥:')}
          <Input
            allowClear
            maxLength={ keyNeed * 2 }
            status={ statusOf(keyCheck) }
            style={ { width: 260 } }
            onChange={ (e) => { setKey(e.target.value) } }
            value= { key } />
          <Tooltip title={ t('随机生成密钥') }>
            <Button size="small" onClick={ () => randomize(true) }>{t('随机')}</Button>
          </Tooltip>
          { keyCheck.gotBytes + ' / ' + keyNeed }
          {t('偏移量(IV):')}
          <Input
            allowClear
            maxLength={ ivNeed * 2 }
            status={ statusOf(ivCheck) }
            style={ { width: 260 } }
            onChange={ (e) => { setIV(e.target.value) } }
            value= { iv } />
          <Tooltip title={ t('随机生成偏移量 IV') }>
            <Button size="small" onClick={ () => randomize(false) }>{t('随机')}</Button>
          </Tooltip>
          { ivCheck.gotBytes + ' / ' + ivNeed }
        </Space>
      </Row>

      <div style={ { margin: "5px 0 5px 0" } }>
        <Space wrap size={ 8 }>
          <Typography.Text type="secondary" style={ { fontSize: 12 } }>
            { algorithm } · { ZUC_PARAMS[algorithm].spec } · zuc v0.4.1 (Rust → WebAssembly)
          </Typography.Text>
          <Typography.Text type={ (engineState === 'error')? 'danger' : 'secondary' } style={ { fontSize: 12 } }>
            { t('引擎') }: { engineText }
          </Typography.Text>
        </Space>
        <br />
        <Typography.Text type="secondary" style={ { fontSize: 12 } }>
          { t('密钥 / IV 使用 HEX 输入, 加密与解密为同一操作 (密钥流异或)') }
        </Typography.Text>
      </div>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) } }
        title={t('双击复制内容到粘贴板')}
        value= { encodeValue }
        placeholder={t('输入需要进行祖冲之序列密码加密的内容 或 拖拽文件到框内打开')}
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Button
        onClick={ encode }
        style={ {"backgroundColor" : "#007bff","color": "#fff"} }
        icon={<ArrowDownOutlined />}
      >{t('加密')}</Button>
      <Button
        onClick={ decode }
        style={ {"backgroundColor" : "#28a745","color": "#fff"} }
        icon={<ArrowUpOutlined />}
      >{t('解密')}</Button>
      <Button
        onClick={ () =>clear() }
        style={ {"backgroundColor" : "#dc3545","color": "#fff"} }
      >{t('清除')}</Button>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) } }
        title={t('双击复制内容到粘贴板')}
        value= { decodeValue }
        placeholder={t('输入需要进行祖冲之序列密码解密的内容 或 拖拽文件到框内打开')}
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />
    </div>
  )
}
export default ZucCrypto;
