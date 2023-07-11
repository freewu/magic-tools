import { Input } from "antd";
const { TextArea } = Input;
import { ConvertResult } from "./interface";

export const ConfigResult = ({ data, click, type } :ConfigResultProps ) => {

  // 保存成配置文件
  const saveConfigFile = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    /**
      0	规定鼠标左键。
      1	规定鼠标中键。
      2	规定鼠标右键。

      //IE 参数不同：
      1	规定鼠标左键。
      4	规定鼠标中键。
      2	规定鼠标右键。
     */
    // 判断是否是右键按下 
    if(e.button !== 2) return ;
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      const blob = new Blob([data.data], {type: 'application/' + type})
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = 'config.' + type; // 下载文件名
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
