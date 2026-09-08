import { Input } from "antd";
const { TextArea } = Input;
import { saveTextFile } from "../../lib/tauri";
import { ConvertResult } from "./interface";

export const ConfigResult = ({ data, click, type } :ConfigResultProps ) => {

  // 保存成配置文件 (右键结果框) -> 统一走系统保存框/浏览器下载
  const saveConfigFile = async (e :React.MouseEvent<HTMLTextAreaElement>) => {
    // 0/1/2: 左/中/右 (IE 键位编码不同), 仅响应右键
    if(e.button !== 2) return ;
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '' && !data.error) {
      const ok = await saveTextFile('config.' + type, data.data, '保存配置文件', {
        filterName: `${type.toUpperCase()} 配置文件`,
        extensions: [type],
      });
      if (!ok) return;
    }
  };

  return (
    <TextArea
      status= { data.error? 'error' : '' }
      readOnly
      style={ { margin: "5px 0 5px 0" }}
      onClick={ click }
      //onDoubleClick={ saveConfigFile }
      onMouseDown={ saveConfigFile }
      title="单击复制内容到粘贴板,右击保存配置文件"
      value={ data.data }
      autoSize={{ minRows: 10, maxRows: 10 }}
    />
  );

}

// 接收参数
export interface ConfigResultProps {
  data: ConvertResult,
  click: React.MouseEventHandler<HTMLTextAreaElement>,
  type: string,
}
