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
const TOML = require('toml-patch');
export const json2toml = (data :Object) :string => {
  return TOML.stringify(data);
}

export const toml2json = (data :string) :Object => {
  return TOML.parse(data);
}

// xml <==> json
// const options = { compact: true, ignoreComment: true, spaces: 4 };
// const XML = require('xml-js');
export const json2xml = (data :Object) :string => {
  return '';
  //return XML.json2xml(data, options);
}

export const xml2json = (data :string) :Object => {
  return {};
  //return XML.xml2json(data);
}