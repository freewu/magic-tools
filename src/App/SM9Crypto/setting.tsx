import { Form, Divider, Input, Space, Button, message } from "antd";
import React, { useState } from "react";
import {
  getSm9Defaults, setSm9Default, clearSm9Defaults,
  normalizeHex, isHex, hexToBytes, bytesToHex,
} from "./lib";
import {
  encMasterPublicKey, encExtractUserKey, signMasterPublicKey, signExtractUserKey,
} from "./gmssl";
import { srErr } from "./lang";
import type { InputStatus } from "antd/es/_util/statusUtils";

import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

/** 可手动填写的 HEX 默认值项 (主公钥同样可粘贴他人的, 用于本机加密 / 验签) */
type HexKey = 'encMaster' | 'encPublic' | 'encUser' | 'signMaster' | 'signPublic' | 'signUser';

// SM9 默认密钥设置 (与 SM9 页「密钥生成」共用同一 localStorage 槽位)
export const SM9CryptoSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const init = getSm9Defaults();
  const [ id, setId ] = useState(init.id);                         // 默认用户 ID
  const [ encMaster, setEncMaster ] = useState(init.encMaster);     // 加密主私钥
  const [ encPublic, setEncPublic ] = useState(init.encPublic);     // 加密主公钥 (按 ID 生成)
  const [ encUser, setEncUser ] = useState(init.encUser);           // 加密用户私钥
  const [ signMaster, setSignMaster ] = useState(init.signMaster);  // 签名主私钥
  const [ signPublic, setSignPublic ] = useState(init.signPublic);  // 签名主公钥 (按 ID 生成)
  const [ signUser, setSignUser ] = useState(init.signUser);        // 签名用户私钥
  const [ status, setStatus ] = useState({} as Record<string, InputStatus>);
  const [ busy, setBusy ] = useState<'' | 'enc' | 'sign'>('');
  const [ notice, contextHolder ] = message.useMessage();

  /** 留空 = 不配置; 否则必须为偶数长度 HEX */
  const onHexChange = (
    key :HexKey,
    setter :(v :string) => void,
  ) => (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setter(v);
    const cleaned = v.replace(/[\s:]/g, '');
    const ok = cleaned === '' || (cleaned.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(cleaned));
    if (ok) {
      setSm9Default(key, cleaned);
      setStatus((p) => ({ ...p, [key]: '' }));
    } else {
      setStatus((p) => ({ ...p, [key]: 'error' }));
    }
  };

  const onIdChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setId(v);
    setSm9Default('id', v);
  };

  /** 清空某项的错误态 (生成成功后) */
  const clearStatus = (key :HexKey) => setStatus((p) => ({ ...p, [key]: '' }));

  /**
   * 按上方「用户 ID」+ 已填入的主私钥, 生成主公钥与用户私钥并保存为默认值。
   * 加密 (enc): 导出加密主公钥 + 提取加密用户私钥;  签名 (sign): 同名签名版本。
   */
  const genBy = async (use :'enc' | 'sign') => {
    const uid = id.trim();
    if (uid === '') { notice.warning(st('请先填写用户 ID')); return; }
    const hex = normalizeHex(use === 'enc' ? encMaster : signMaster);
    if (hex === '') {
      notice.warning(st(use === 'enc' ? '请先填写「默认加密主私钥」' : '请先填写「默认签名主私钥」'));
      return;
    }
    if (!isHex(hex)) { notice.warning(st('内容不是合法的十六进制 (HEX)')); return; }
    setBusy(use);
    try {
      const master = hexToBytes(hex);
      const pub = bytesToHex(use === 'enc' ? await encMasterPublicKey(master) : await signMasterPublicKey(master));
      const usk = bytesToHex(use === 'enc' ? await encExtractUserKey(master, uid) : await signExtractUserKey(master, uid));
      if (use === 'enc') {
        setEncPublic(pub); setSm9Default('encPublic', pub); clearStatus('encPublic');
        setEncUser(usk); setSm9Default('encUser', usk); clearStatus('encUser');
      } else {
        setSignPublic(pub); setSm9Default('signPublic', pub); clearStatus('signPublic');
        setSignUser(usk); setSm9Default('signUser', usk); clearStatus('signUser');
      }
      notice.success(rowT(locale, '已按用户 ID「${id}」生成${label}主公钥与用户私钥', { id: uid, label: st(use === 'enc' ? '加密' : '签名') }));
    } catch (e) {
      notice.error(rowT(locale, '生成失败: ${m}', { m: srErr(locale, String((e as Error)?.message ?? e)) }));
    } finally {
      setBusy('');
    }
  };

  const clear = () => {
    clearSm9Defaults();
    setId('');
    setEncMaster('');
    setEncPublic('');
    setEncUser('');
    setSignMaster('');
    setSignPublic('');
    setSignUser('');
    setStatus({});
  };

  const input = { width: "100%", maxWidth: 520 } as const;
  const area = { fontFamily: "monospace", fontSize: 12, width: "100%", maxWidth: 520 } as const;

  return (
    <>
      {contextHolder}
      <Divider orientation="left" plain>{ st('SM9 加解密') }</Divider>
      <Form.Item label={ st('默认用户 ID') }>
        <Space wrap>
          <Input
            style={ input }
            onChange={ onIdChange }
            value={ id }
            placeholder={ st('例如 bluefrog; 解密/验签需与加密/签名时一致') }
          />
          <Button size="small" loading={ busy === 'enc' } disabled={ busy !== '' } onClick={ () => { void genBy('enc'); } }>
            { st('按此 ID 生成加密公钥 / 私钥') }
          </Button>
          <Button size="small" loading={ busy === 'sign' } disabled={ busy !== '' } onClick={ () => { void genBy('sign'); } }>
            { st('按此 ID 生成签名公钥 / 私钥') }
          </Button>
        </Space>
        <div style={ { color: "#999", fontSize: 12, marginTop: 4 } }>
          { st('用下方对应的「主私钥」+ 该 ID 生成主公钥与用户私钥, 结果自动保存为本页默认值') }
        </div>
      </Form.Item>
      <Form.Item label={ st('默认加密主私钥 (DER HEX)') }>
        <Input.TextArea
          status={ status.encMaster }
          rows={ 2 }
          style={ area }
          onChange={ onHexChange('encMaster', setEncMaster) }
          value={ encMaster }
          placeholder={ st('用于导出主公钥与提取用户私钥; 留空表示不配置') }
        />
      </Form.Item>
      <Form.Item label={ st('默认加密主公钥 (HEX)') }>
        <Input.TextArea
          status={ status.encPublic }
          rows={ 2 }
          style={ area }
          onChange={ onHexChange('encPublic', setEncPublic) }
          value={ encPublic }
          placeholder={ st('按用户 ID 生成后自动填入 (04 开头 65 字节); 留空表示不配置') }
        />
      </Form.Item>
      <Form.Item label={ st('默认加密用户私钥 (DER HEX)') }>
        <Input.TextArea
          status={ status.encUser }
          rows={ 3 }
          style={ area }
          onChange={ onHexChange('encUser', setEncUser) }
          value={ encUser }
          placeholder={ st('SM9 页「加解密」使用; 留空表示不配置') }
        />
      </Form.Item>
      <Form.Item label={ st('默认签名主私钥 (DER HEX)') }>
        <Input.TextArea
          status={ status.signMaster }
          rows={ 2 }
          style={ area }
          onChange={ onHexChange('signMaster', setSignMaster) }
          value={ signMaster }
          placeholder={ st('用于导出签名主公钥; 留空表示不配置') }
        />
      </Form.Item>
      <Form.Item label={ st('默认签名主公钥 (HEX)') }>
        <Input.TextArea
          status={ status.signPublic }
          rows={ 2 }
          style={ area }
          onChange={ onHexChange('signPublic', setSignPublic) }
          value={ signPublic }
          placeholder={ st('按用户 ID 生成后自动填入 (04 开头 129 字节); 留空表示不配置') }
        />
      </Form.Item>
      <Form.Item label={ st('默认签名用户私钥 (DER HEX)') }>
        <Input.TextArea
          status={ status.signUser }
          rows={ 3 }
          style={ area }
          onChange={ onHexChange('signUser', setSignUser) }
          value={ signUser }
          placeholder={ st('SM9 页「签名验签」使用; 留空表示不配置') }
        />
      </Form.Item>
      <Form.Item label=" ">
        <Space style={ { width: "100%" } }>
          <Button size="small" danger onClick={ clear }>{ st('清空默认密钥') }</Button>
          <span style={ { color: "#999" } }>{ st('默认密钥保存在浏览器本地, 打开 SM9 页会自动带出') }</span>
        </Space>
      </Form.Item>
    </>
  );
}

export default SM9CryptoSetting;
