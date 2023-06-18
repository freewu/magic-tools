// 内容统计页
import { Button,Input, Space, message,Divider } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { InputStatus } from "antd/es/_util/statusUtils";
import { calcLineCount, removeEmptyLine } from "./lib"
import "./image-color.css";

const ImageColor = () => {

  const [ value, setValue ] = useState(''); // base64编码的图片
  
  return (
    <div >
      <Space>
        <Button 
          onClick={ () => { setValue(''); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button>
      </Space>
      <Divider dashed />
      { value === ''? 
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
                console.log(img.width,img.height);
                // 当画布的宽或高被重置时，当前画布内容就会被移除
                myCanvas.width = img.width;
                myCanvas.height = img.height;
                ctx.drawImage(img, 0, 0,img.width,img.height);
                let data = ctx.getImageData(0, 0, img.width, img.width).data;
                //console.log(data);
                
                /**
                  ImageData 对象中的每个像素，都存在着四方面的信息，即 RGBA 值：
                    R - 红色 (0-255)
                    G - 绿色 (0-255)
                    B - 蓝色 (0-255)
                    A - alpha 通道 (0-255; 0 是透明的，255 是完全可见的)
                */ 
                let start = 0;
                let c = new Map<string,number>;
                while(start < data.length) {
                  let r = data[start];
                  let g = data[start + 1];
                  let b = data[start + 2];
                  let a = data[start + 3];
                  start = start + 4
                  //console.log(`RGBA(${r},${g},${b})`);
                  let key = `${r},${g},${b}`;
                  let i = c.get(key);
                  if(i) {
                    c.set(key,i + 1);
                  } else {
                    c.set(key,1);
                  }
                }
                // 取最多的 N 条数据
                // 先取出所有值 values 
                let arr :Array<number> = Array.from(c.values());
                // 排序完成的数组
                let sortedArr :Array<number> = arr.sort((a,b)=> {
                  return b - a;
                });
                // 打印
                //console.log(sortedArr);
                // 取 Top N n = 10
                let filter = 0;
                let n = 10;
                // 如果数量不够就取所有长度 返回所有 map 的 key 就行了
                if(sortedArr.length < n) n = sortedArr.length;
                filter = sortedArr[n - 1];
                let cr :Array<String>= [];
                c.forEach((value,key) => {
                  if( value >= filter) cr.push(key);
                })
                console.log(cr);

              }
              // let img = new Image();
              // img.src = reader.result as string;

              // const myCanvas :HTMLCanvasElement = document.getElementById("canvas-img");
              // const ctx: CanvasRenderingContext2D = myCanvas.getContext('2d')!;
              
              // // 当画布的宽或高被重置时，当前画布内容就会被移除
              // myCanvas.width = myCanvas.width;
              // myCanvas.height = myCanvas.height;

              // img.onload = () => {
              //   let h = img.height * myCanvas.offsetWidth / img.height;
              //   myCanvas.height = h;
              //   ctx.drawImage(img, 0, 0,myCanvas.offsetWidth,h);

              //   // 获取需要统计的数据
              //   let data = ctx.getImageData(0, 0, myCanvas.width, myCanvas.height).data;
              //   console.log(data);
              // };
            }
            reader.readAsDataURL(files[0]);
          } }
        />
       : null
      }
      { value !== ''? 
        <img src={value} width={ 860 }/> 
        :null
      }
      <canvas id="canvas-img" style={ {} }/>
    </div>
  );
}

export default ImageColor;