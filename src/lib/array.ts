// 数据转成 AntD Select 支持的数据格式 { label: "xxx", value: "xxx" }
export function arrayToOptions(arr :Array<any>) :Array<{label :string,value :string}> {
  return arr.map( (item ,index) => { return { label: item ,value:item} });
}

/**
 * 把列表中 from 位置的元素移动到 to 位置 (原列表不变)
 * - from / to 越界或相等时返回浅拷贝 (不改变顺序)
 * - 不依赖具体元素类型 (收藏排序 / 任意列表拖动排序)
 */
export function moveItem<T>(list :ReadonlyArray<T>, from :number, to :number) :T[] {
  const next = [...list];
  if (from === to || from < 0 || to < 0 || from >= next.length || to >= next.length) return next;
  const [ item ] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}