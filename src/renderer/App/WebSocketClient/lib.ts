const DEFAULT_URL = 'websocket-client:default-url';

// 获取默认连接地址
export function getDefaultURL() :string  {
  const url = localStorage.getItem(DEFAULT_URL);
  return (url === null)? "" : url;
}

// 设置默认连接地址
export function setDefaultURL(url: string) : void  {
  localStorage.setItem(DEFAULT_URL, url);
}
