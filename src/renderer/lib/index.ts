// 复制到粘贴板
export async function copyTextToClipboard(text: string) {
  if ("clipboard" in navigator) {
    return await navigator.clipboard.writeText(text);
  } else {
    return document.execCommand('copy', true, text);
  }
}

// 防抖函数
export function debounce(operate:Function, delay:number) {
  let time :any = null
  let timer :any = null
  let newTime = null
  function task() {
    newTime =+ new Date()
    if(newTime - time < delay) {
      timer = setTimeout(task, delay)
    } else {
      operate()
      timer = null
    }
    time = newTime
  }
  return function () {
    // 更新时间戳
    time =+ new Date();
    if(!timer) {
      timer = setTimeout(task, delay)
    }
  }
}

// 每间隔多少字符插入指定了符
export function insertIntervalString(str :string, disNum :number = 4, insertStr:string  = " ") {
  return str.replace(new RegExp("(.{" + disNum + "})", "g"), "$1" + insertStr);
}
