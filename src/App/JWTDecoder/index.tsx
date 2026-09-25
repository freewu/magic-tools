import { Tabs } from "antd";
import JWTDecodeTab from "./decode-tab";
import JWTEncodeTab from "./encode-tab";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import jwtLang from "./lang";

/** JWT 工具: 「解析」(解码) 与「生成」(编码) 两个页签 */
const JWTDecoder = () => {

  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(jwtLang, locale, key, fallback);

  return (
    <Tabs
      defaultActiveKey="decode"
      items={ [
        { key: 'decode', label: t('tabDecode', '解析'), children: <JWTDecodeTab /> },
        { key: 'encode', label: t('tabEncode', '生成'), children: <JWTEncodeTab /> },
      ] }
    />
  );
}

export default JWTDecoder;
