
// 打开文件制作
export const openFile = (files: any, callback :Function) => {
  if(0 === files.length) {
    // notice.error("请选择文件！！！");
    return;
  }
  const reader = new FileReader();
  // 加载失败
  reader.onerror = (err) => {
    console.log(err);
  }
  // 文件加载完毕
  reader.onload = () => {
    callback(reader.result as string)
    // setValue(reader.result as string);
    // setLineCount(calcLineCount(reader.result as string));
  }
  reader.readAsText(files[0]);
}