// 中文名称的拼音注音 (拼音显示在汉字上方)
//
// pinyin-pro 单独打成 vendor-pinyin chunk (约 286KB), 体积远大于本工具本身,
// 因此这里按需懒加载: 只有用户开启「中文显示拼音」时才动态 import, 未开启不产生额外请求。

// 汉字范围 (基本区 + 扩展A + 兼容区), 只对汉字注音
const CHINESE_CHAR = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

// 单个汉字的带声调拼音 (加缓存: 色板上汉字重复率高, 避免反复调用)
const pinyinCache = new Map<string,string>();
let converter: ((char: string) => string) | null = null;

/**
 * 是否包含汉字 (用于判断名称是否需要注音)
 */
export const containsChinese = (text: string) :boolean => CHINESE_CHAR.test(text);

/**
 * 获取单个汉字的拼音 (带声调), 非汉字 / 未收录的字返回空串 (不注音)
 * 未加载 pinyin-pro 时统一返回空串, 加载完成后组件重新渲染即可看到注音
 */
export const getCharPinyin = (char: string) :string => {
  if(!CHINESE_CHAR.test(char)) return "";

  const cached = pinyinCache.get(char);
  if(cached !== undefined) return cached;

  const value = (converter)? converter(char) : "";
  // 未加载完成时结果为 "", 此时不写入缓存, 等加载完成后再计算
  if(converter) pinyinCache.set(char, value);
  return value;
}

/**
 * 加载 pinyin-pro (幂等), 返回是否可用
 */
export const loadPinyin = async () :Promise<boolean> => {
  if(converter) return true;
  try {
    const { pinyin } = await import("pinyin-pro");
    converter = (char: string) :string => {
      const value = pinyin(char, { toneType: "symbol", type: "array" })[0] ?? "";
      // pinyin-pro 未收录的字符会原样返回, 这种不注音
      return CHINESE_CHAR.test(value)? "" : value;
    };
    pinyinCache.clear();
    return true;
  } catch (e) {
    // 加载失败时保持不注音, 不影响色板正常使用
    console.warn("pinyin-pro load failed", e);
    return false;
  }
}
