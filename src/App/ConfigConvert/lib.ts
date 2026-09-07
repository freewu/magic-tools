const DEFAULT_INPUT_FORMAT = 'config-convert:default-input-format';

// 获取默认输入格式
export function getDefaultInputFormat() :string  {
  const format = localStorage.getItem(DEFAULT_INPUT_FORMAT);
  return (format === null)? "json" : format;
}

// 设置默认输入格式
export function setDefaultInputFormat(format :string) : void  {
  localStorage.setItem(DEFAULT_INPUT_FORMAT, format);
}

const DEFAULT_OUTPUT_FORMAT = 'config-convert:default-output-format';

// 获取默认输出格式
export function getDefaultOutputFormat() :string  {
  const format = localStorage.getItem(DEFAULT_OUTPUT_FORMAT);
  return (format === null)? "yaml" : format;
}

// 设置默认输出格式
export function setDefaultOutputFormat(format :string) : void  {
  localStorage.setItem(DEFAULT_OUTPUT_FORMAT, format);
}

// 按文件名后缀猜测配置格式 (返回 typeList 中的 value; 识别不了返回 null)
const FORMAT_BY_EXT: Record<string, string> = {
  ini: 'ini', conf: 'ini', cfg: 'ini',
  json: 'json', json5: 'json',
  xml: 'xml',
  yaml: 'yaml', yml: 'yaml',
  toml: 'toml',
  properties: 'properties', props: 'properties',
};

export const guessFormat = (filename :string) :string | null => {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return FORMAT_BY_EXT[ext] ?? null;
};

// ini <==> json
import { IIniObject, parse as iniParse, stringify as iniStringify } from 'js-ini';

export const json2ini = (data :Object) :string => {
  return iniStringify(data as IIniObject);
}

export const ini2json = (data :string) :Object => {
  return iniParse(data);
}

// yaml <==> json
import YAML from 'yaml'
export const json2yaml = (data :Object) :string => {
  return YAML.stringify(data);
}

export const yaml2json = (data :string) :Object => {
  return YAML.parse(data);
}

// toml <==> json
import * as TOML from 'toml-patch';
export const json2toml = (data :Object) :string => {
  return TOML.stringify(data);
}

export const toml2json = (data :string) :Object => {
  return TOML.parse(data);
}

// xml <==> json (fast-xml-parser)
// 约定: 属性 -> 键名加 '@_' 前缀; 文本 -> '#text'; 重复子元素自动成数组
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const XML_PARSE_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
  // 保持配置值/属性为字符串, 避免 '01' 等被数值化
  parseTagValue: false,
  parseAttributeValue: false,
};

// 去掉 <!-- --> 注释 (fast-xml-parser 会产出 #comment 键, 配置互转场景直接忽略注释)
const stripXmlComments = (text: string) :string => text.replace(/<!--[\s\S]*?-->/g, '');

const xmlParser = () => new XMLParser(XML_PARSE_OPTS);

export const xml2json = (data :string) :Object => {
  const cleaned = stripXmlComments(data);
  if (cleaned.trim() === '') return {};
  const obj = xmlParser().parse(cleaned);
  // 非法/空文档 fxp 返回空串
  if (typeof obj !== 'object' || obj === null) return {};
  return obj;
}

export const json2xml = (data :Object) :string => {
  if (data === null || typeof data !== 'object') return String(data);
  // XML 只允许单个根元素: 数组 / 多键对象包一层 <root>
  const keys = Array.isArray(data) ? [] : Object.keys(data);
  const root = Array.isArray(data) || keys.length !== 1 ? { root: data } : data;
  const builder = new XMLBuilder({
    format: true,
    indentBy: '  ',
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    suppressEmptyNode: true,
  });
  const xml = builder.build(root);
  return typeof xml === 'string' ? xml : '';
}

// properties <==> json
// import * as Properties from 'js-java-properties'
export const json2properties = (data :Object) :string => {
  if(typeof data !== 'object') return data;

  function func(d :any,str :string) :string {
    let result :any = [];
    for(let i in d) {
      if(typeof d[i] == 'object') {
        result.push(func(d[i], (str !== '')? `${str}.${i}` : i));
      } else {
        result.push((str !== '')? `${str}.${i} = ${d[i]}\n` : `${i} = ${d[i]}\n`);
      }
    }
    return result.join("");
  }
  const r = func(data,"");
  return r;
}

export const properties2json = (data :string) :Object => {
  //console.log(propertiesToJSON(data));
  //console.log(Properties.parse(data));
  //console.log(Properties.toObject(Properties.parse(data)));
  return propertiesToJSON(data);
  //return XML.xml2json(data);
}

// function propertiesToJSON(data :string) {
// 	data
// 	// Concat lines that end with '\'.
// 		.replace(/\\\n/, "")
// 		// Split by line breaks.
// 		.split("\n")
// 		// Remove commented lines:
// 		.filter((line) => /(\#|\!)/.test(line.replace(/\s/g, "").slice(0, 1)) ? false : line)
// 		// Create the JSON:
// 		.reduce((obj, line) => {
// 			const colonifiedLine = line.replace(/(\=)/, ":");
// 			const key = colonifiedLine
// 				.substring(0, colonifiedLine.indexOf(":"))
// 				.trim();
// 			const value = colonifiedLine
// 				.substring(colonifiedLine.indexOf(":") + 1)
// 				.trim();
// 			obj[key] = value;
// 			return obj;
// 		}, {});
// }
function propertiesToJSON(data :string) :Object {
  let result = {};
  const arr = data.replace(/\\\n/, "") // 去掉空行
                  .split("\n") // 换行分割
                  .filter((line) => /(\#|\!)/.test(line.replace(/\s/g, "").slice(0, 1)) ? false : line) //去掉注释
  // let a = arr.reduce((obj, item) => {
  //   // 替换 = 为 :
  //   const line = item.replace(/\s/g, "").replace(/(\=)/, ":").split(":");
  //   const key = line[0].trim();
  //   const value = line.length > 1? line[1].trim() : "";
  //   // console.log(key);
  //   // console.log(obj);

  //   result = pp(key,value,result);
  //   console.log(result);

  //   return { [key] : value }
  //   //return obj[key] = value;
  // },{})
  arr.map((item) => {
    // 替换 = 为 :
    //const line = item.replace(/\s/g, "").replace(/(\=)/, ":").split(":");
    const line = item.replace(/\s/g, "").split("=");
    const key = line[0].trim();
    const value = line.length > 1? line[1].trim() : "";

    result = pp(key,value,result);
  })
  //console.log(result);
  return result;
}

import merge from 'deepmerge'
// 生成 对象
function pp(key :string , value :string, result :any ) :Object {
  const k = key.split("."); // 使用 . 分隔
  // 只有一个
  const len = k.length;
  if(len === 1) {
    result[k[0].trim()] = value;
    return result;
  } 

  let obj :any = {};
  function create(index :number) {
    if(index == 0) {
      obj = ({ [k[0]] : obj });
      return ;
    }

    if(index == len -1) {
      obj = { [k[index]] : value };
    } else {
      obj = { [k[index]] : obj };
    }
    create(index - 1)
  }
  create(len - 1);
  //return Object.assign({ ...result, ...obj });
  return merge(result,obj);
}
