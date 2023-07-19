import { Checkbox, Form, Input, Divider, message, Space, Radio, Button, ColorPicker } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import "./image-cut.css"

const ImageEXIF = () => {

  const [ value, setValue ] = useState(''); // base64编码的图片
  const [ result, setResult ] = useState({}); // EXIF结果
  const [ path, setPath ] = useState(''); 

  const download = () => {
    if(value !== '') {
      const blob = new Blob([JSON.stringify(result)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = 'exif.json'; // 下载文件名
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getData = () => {
    const img2 = document.getElementById("img-exif");
    if (img2 != null) {
      // const allMetaData = EXIF.getAllTags(img2);
      // console.log(allMetaData);
      // setResult(allMetaData);
      EXIF.getData(img2 as any, function() {
        //const allMetaData = EXIF.getAllTags(this);
        const allMetaData = EXIF.getAllTags(img2);
        console.log(allMetaData);
        setResult(allMetaData);
      });
    }
  }

  return (
    <div>
      <div 
        className="img-pick"
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { 
          e.preventDefault(); 
          const files = e.dataTransfer.files;
          if(0 === files.length) {
            // notice.error("请选择文件！！！");
            return;
          }
          // todo 判断文件类型
          const reader = new FileReader();
          // 加载失败
          reader.onerror = (err) => {
            console.log(err);
          }
          // 文件加载完毕
          reader.onload = () => {
            setValue(reader.result as string);
            setTimeout(() => { getData() },500);
            // genResult(reader.result as string,type,width,height,alt,showData);
          }
          // console.log(files[0]);
          setPath(files[0].path)
          reader.readAsDataURL(files[0]);
        } }
      >
        <span>请拖拽要提取 EXIF 信息的图片到框内</span>
      </div>

      { value.trim() !== ''?
       (
        <div 
          onClick={ download }
          title="点击下载全部数据"
          className="exif-preview">
          <img src={ value } width={ 200 } id="img-exif" />
          <img src={ "file://" + path } width={ 200 } id="img-exif1" />
        </div>
      ): null}

      <Divider plain dashed>提取结果</Divider>

      
    </div>
  );
}

export default ImageEXIF;