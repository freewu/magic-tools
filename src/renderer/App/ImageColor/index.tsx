// 内容统计页
import { Button,Input, Space, Alert, Divider, Spin } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard,debounce } from "../../lib"
import { openFile } from "../../lib/file"
import { InputStatus } from "antd/es/_util/statusUtils";
import { genColorMap, getTopArray } from "./lib"
import "./image-color.css";
import { default as LevitationBox } from "./levitation-box"

const ImageColor = () => {

  // image-color-container 容器的宽度
  const genWidth = () :number => {
    return window.innerWidth - 300;
  };

  const [ loading, setLoading ] = useState(false); // 计算需要时间
  const [ width, setWidth ] = useState(''); // 图片展示宽度
  const [ height, setHeight ] = useState(''); // 图片展示高度
  const [ imgWidth, setImgWidth ] = useState(''); // 图片实际宽度
  const [ imgHeight, setImgHeight ] = useState(''); // 图片实际高度
  const [ value, setValue ] = useState(''); // base64编码的图片
  const [ result, setResult ] = useState(new Array<String>()); // 提取的数组数据
  const [ colorMap, setColorMap ] = useState(new Map<string,number>); // 提取的图片像素 map
  
  return (
    <div id="image-color-container">
      <Space>
        <Button 
          onClick={ () => { 
            setValue(''); setResult([]);
            setWidth(genWidth() + '');setHeight('');
            setImgWidth('');setImgHeight(''); 
          } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button>
      </Space>
      <Divider dashed />
      { value === '' && loading == false? 
        <TextArea
          readOnly
          style={ { margin: "5px 0 5px 0" }}
          onChange={ (e) => { setValue(e.target.value); } }
          value= { value }
          placeholder="拖拽要提取主体色的图片文件到框内"
          autoSize={{ minRows: 8, maxRows: 8 }}
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
              const myCanvas :HTMLCanvasElement = document.getElementById("canvas-img")!;
              const ctx: CanvasRenderingContext2D = myCanvas.getContext('2d')!;

              let img = new Image();
              img.src = reader.result as string;
              img.onload = () => {
                setLoading(true);
                
                // 处理展示区域
                setImgHeight(img.height + '');
                setImgWidth(img.width + '');
                let mw = genWidth(); 
                // 如果图片宽度 大于 展示区域需要等比缩放
                if (img.width > mw) {
                  setWidth(mw + '');
                  setHeight((img.height * mw / img.width) + '' );
                } else {
                  setWidth(img.width + '');
                  setHeight('');
                }
                // 当画布的宽或高被重置时，当前画布内容就会被移除
                myCanvas.width = img.width;
                myCanvas.height = img.height;
                ctx.drawImage(img, 0, 0,img.width,img.height);
                let data = ctx.getImageData(0, 0, img.width, img.width).data;
                // 统计出 colorMap
                const c = genColorMap(data);
                setColorMap(c);
                // 取最多的 N 条数据
                const list = getTopArray(c,10);
                console.log(list);
                setResult(list);
                // for(let a in list) {
                //   console.log(list[a],":",c.get(list[a]));
                // }
                setTimeout(() => {
                  setLoading(false);
                },5000)
              }
            }
            reader.readAsDataURL(files[0]);
          } }
        />
       : null
      }
      {loading?
        <Spin tip="Loading...">
          <Alert
            message="主题色提取中"
            description="提取计算需要时间"
            type="info"
          />
        </Spin>
        : null
      }
      { value !== ''? 
        <div>
          <img src={value} width={ width } height={ height } /> 
        </div>
        :null
      }
      {
        result.length > 0 && loading == false? 
        <LevitationBox colorList={ result } colorMap={ colorMap } />
        : null
      }
      <canvas id="canvas-img" style={ {} }/>
    </div>
  );
}

export default ImageColor;