// 计算行数
export const calcLineCount = (value :string) :number => {
  const arr = value.split("\n")
  const len = arr.length;
  // 当只有一行时，内容只有一个 \n 返回 0
  if(1 === len && arr[0] === "") return 0;
  return len;
  // return ('' === value.trim())? 0 : len:  
}

// 移除空行
export const removeEmptyLine = (v :string) :string => {
  if('' === v.trim()) return "";
  let arr:Array<string> = [];
  v.split("\n").map((line :string) => {
    if('' !== line.trim() ) { 
      arr.push(line);
    }
  })
  return arr.join("\n");
}