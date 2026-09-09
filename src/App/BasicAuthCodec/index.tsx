import { Divider, Button, Input, Space, message, Checkbox } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { basicAuthToken, basicAuthHeader, parseBasicAuth } from "./lib"
import { default as BasicAuthIntro } from "./intro"
import { useLocale } from "../../hook/locale-context";
import { tr, trTpl } from "../../i18n/lang";
import basicAuthLang from "./lang";

const BasicAuthCodec = () => {

  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(basicAuthLang, locale, key, fallback);
  const tpl = (key: string, vars: Record<string, string | number>, fallback: string) => trTpl(basicAuthLang, locale, key, vars, fallback);


  const [ username, setUsername ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ withHeader, setWithHeader ] = useState(true); // 输出完整 Authorization 请求头
  const [ tokenOut, setTokenOut ] = useState('');        // 编码输出
  const [ authIn, setAuthIn ] = useState('');            // 待解读输入
  const [ outUser, setOutUser ] = useState('');
  const [ outPass, setOutPass ] = useState('');
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success(t('copyOk', '复制到粘贴板成功！！！'));
    }
  };

  const encode = () => {
    if (username.trim() === '') { notice.warning(t('userEmpty', '用户名不能为空')); return; }
    setTokenOut(withHeader ? basicAuthHeader(username, password) : basicAuthToken(username, password));
  }

  const decode = () => {
    if (authIn.trim() === '') return;
    try {
      const r = parseBasicAuth(authIn);
      setOutUser(r.username);
      setOutPass(r.password);
      notice.success(t('decodeOk', '解读成功'));
    } catch(err) {
      setOutUser(''); setOutPass('');
      notice.error(tpl('decodeFail', { msg: (err as Error).message }, '解读失败: ' + (err as Error).message));
    }
  }

  return (
    <div>
      {contextHolder}

      <Space wrap style={ { margin: "5px 0" } }>
        <label>{ t('userLabel', '用户名:') }</label>
        <Input
          style={{ width: 200 }}
          allowClear
          value={ username }
          placeholder={ t('userPh', '如 admin') }
          onChange={ (e) => setUsername(e.target.value) }
        />
        <label>{ t('passLabel', '密码:') }</label>
        <Input.Password
          style={{ width: 200 }}
          allowClear
          value={ password }
          placeholder={ t('passPh', '留空也允许') }
          onChange={ (e) => setPassword(e.target.value) }
        />
        <Checkbox checked={ withHeader } onChange={ (e) => setWithHeader(e.target.checked) }>
          { t('fullHeader', '生成完整 Authorization 请求头') }
        </Checkbox>
        <Button
          onClick={ encode }
          style={ { "backgroundColor" : "#007bff", "color" : "#fff" } }
          icon={<ArrowDownOutlined />}
        >{ t('encode', '编码') }</Button>
      </Space>

      <TextArea
        style={ { margin: "5px 0 10px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setTokenOut(e.target.value); } }
        title={ t('copyTitle', '双击复制内容到粘贴板') }
        value={ tokenOut }
        placeholder={ t('tokenOutPh', '点击「编码」后在此生成 Base64 Token / 完整请求头, 双击可复制') }
        autoSize={{ minRows: 2, maxRows: 4 }}
      />

      <Divider plain style={{ margin: "8px 0" }}>{ t('dividerDecode', '解读 Authorization / Token') }</Divider>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onChange={ (e) => setAuthIn(e.target.value) }
        value={ authIn }
        placeholder={ t('authInPh', '粘贴 "Authorization: Basic dXNlcjpwYXNz" / "Basic xxx" / 裸 Token 进行解读') }
        autoSize={{ minRows: 2, maxRows: 4 }}
      />
      <Space wrap style={ { margin: "5px 0 5px 0" } }>
        <Button
          onClick={ decode }
          style={ { "backgroundColor" : "#28a745", "color" : "#fff" } }
          icon={<ArrowUpOutlined />}
        >{ t('decode', '解读') }</Button>
        <Button
          onClick={ () => { setAuthIn(''); setOutUser(''); setOutPass(''); } }
          style={ { "backgroundColor" : "#dc3545", "color" : "#fff" } }
        >{ t('clear', '清除') }</Button>
        <label>{ t('userLabel', '用户名:') }</label>
        <Input
          style={{ width: 180 }}
          readOnly
          value={ outUser }
          placeholder={ t('outUserPh', '解读出的用户名') }
        />
        <label>{ t('passLabel', '密码:') }</label>
        <Input
          style={{ width: 180 }}
          readOnly
          value={ outPass }
          placeholder={ t('outPassPh', '解读出的密码') }
        />
      </Space>

      <Divider>{ t('dividerIntro', 'HTTP Basic Authentication 说明') }</Divider>
      <BasicAuthIntro />
    </div>
  );
}

export default BasicAuthCodec;