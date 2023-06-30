// 获取 ColorMap  key = r,g,b  value 是 出现在次数 Map<string(r,g,b), number(出现次数)>
export const genColorMap = (data :Uint8ClampedArray) :Map<string,number> => {
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
    let r = data[start];     // R - 红色 (0-255)
    let g = data[start + 1]; // G - 绿色 (0-255)
    let b = data[start + 2]; // B - 蓝色 (0-255)
    let a = data[start + 3]; // alpha 通道 (0-255; 0 是透明的，255 是完全可见的)
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
  console.log(Array.from(c.keys()).length);
  // todo 需要做一个近视值数据合并
  return c;
};

// 获取 TopN 的数据
export const getTopArray = (m :Map<string,number>,n :number) :String[] => {
  // 先取出所有值 values 
  let arr :Array<number> = Array.from(m.values());
  // 排序完成的数组
  let sortedArr :Array<number> = arr.sort((a,b)=> {
    return b - a;
  });
  // 取 Top N n = 10
  let filter = 0;
  // 如果数量不够就取所有长度 返回所有 map 的 key 就行了
  if(sortedArr.length < n) n = sortedArr.length;
  filter = sortedArr[n - 1];
  let cr :String[] = [];
  m.forEach((value,key) => {
    if( value >= filter) cr.push(key);
  })
  return cr;
}

import {rgb } from "color-convert"

// r,g,b 格式转成  #rgb
export const rgb2Hex = (color :string) :string => {
  const c = color.split(",")
  return "#" + rgb.hex(parseInt(c[0]),parseInt(c[1]),parseInt(c[2]));
} 