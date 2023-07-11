const DEFAULT_SHOW_TONE = 'pinyin-convert:default-show-tone';

// 获取默认是否展示音调
export function getDefaultShowTone() :boolean  {
  const show = localStorage.getItem(DEFAULT_SHOW_TONE);
  return (show === null)? true : (show === 'false')? false : true;
}

// 设置默认是否展示音调
export function setDefaultShowTone(show: boolean) : void  {
  localStorage.setItem(DEFAULT_SHOW_TONE, show + '');
}
