// SM9Crypto lib 纯逻辑单测 (不加载 wasm)
import {
  normalizeHex, isHex, hexToBytes, bytesToHex, textToBytes, utf8Length, bytesToText,
  parseDerNodes, describeDer, identifySm9Data, isKindOf, KIND_LABELS,
  parseHexField, describeBytes, getSm9Defaults, setSm9Default, clearSm9Defaults, SM9_DEFAULT_ITEMS,
} from './lib';

const fromHex = hexToBytes;

// ---- 真实数据 (GmSSL v3.2.0 编译为 wasm 后生成, ID = alice@example.com) ----
// 加密主私钥 (msk): SEQUENCE { INTEGER(32), BIT STRING(65) } = 104 字节
const MSK_ENC = '3066022013e34f5e44a36f833c2bd6eaf755c5a38f7fb9e362bc0d6597fa4f9f6511b0a1034200047c83c2860f283c515d36bc7971383522e5cc37faa555abecafd74f2cc3ed82dc56344a55bdca33dd5ed319025b0579e4ea412748a603f6b3fb30aaabfcc59181';
// 加密主公钥 (mpk): 65 字节未压缩点
const MPK_ENC = '047c83c2860f283c515d36bc7971383522e5cc37faa555abecafd74f2cc3ed82dc56344a55bdca33dd5ed319025b0579e4ea412748a603f6b3fb30aaabfcc59181';
// 加密用户私钥 (usk): SEQUENCE { BIT STRING(129), BIT STRING(65) } = 204 字节
const USK_ENC = '3081c90381820004432cef656e7373d0ba33cf4e5ac060487a528dea0414dba5fd3bb0613a57ad987c0f89f3742c8298fb754fd3a6aea7d3273d0d0c1125d604279d5ba025cae9bca6c482375b73eb4db3628df0c7947be0b4cee800dc7a6bcfb964f4c28f1629fd527fc60b73348d15b0e75b1a6fedb1dd973526339478ccd45c01566eee2cd703034200047c83c2860f283c515d36bc7971383522e5cc37faa555abecafd74f2cc3ed82dc56344a55bdca33dd5ed319025b0579e4ea412748a603f6b3fb30aaabfcc59181';
// 密文 (明文 "Hello SM9 国密标识密码!"): SEQUENCE { INTEGER(0), BIT STRING(65), OCTET STRING(32), OCTET STRING(29) }
const CT = '308188020100034200046723b25e8ecb83f909fe1fe1bcd194de320ce47a9296dfe985168fb879a48ca96da058bb825e474df743e22d19427b7cedd55a650da8b93d0c592931d4e9f2420420f14dbcba21c19defd28913f94dcf56dee6f98718e9e254f4595080a78abf801a041d3a89e1644240fbe27ba06e1082adc87af202dd41eedc4f273100ca1705';
// 签名主私钥 (smsk): SEQUENCE { INTEGER(32), BIT STRING(129) } = 170 字节
const MSK_SIGN = '3081a702206c3f6b003554f15576338dbaaa97c34037d75111ad302dd6065295901691d12103818200043ff1e5a7724598ef5199f73ed6b7a1e3d11de3d0ca1133b1e5d0dcd864bacb48a6aa5eb60880031729175353b5e2c5b1c7a453d2c2483f04816a57f8c7c962fd6f7ee4bd242383b73fb1bdd2dd13bdeb39c56590aeb32e118716b9cbbdf2bd793107898b2a1ecb207971c2caa87d1c300d7897d8e459d827c1b0ba07dfa87ef0';
// 签名主公钥 (smpk): 129 字节未压缩点
const MPK_SIGN = '043ff1e5a7724598ef5199f73ed6b7a1e3d11de3d0ca1133b1e5d0dcd864bacb48a6aa5eb60880031729175353b5e2c5b1c7a453d2c2483f04816a57f8c7c962fd6f7ee4bd242383b73fb1bdd2dd13bdeb39c56590aeb32e118716b9cbbdf2bd793107898b2a1ecb207971c2caa87d1c300d7897d8e459d827c1b0ba07dfa87ef0';
// 签名用户私钥 (ssk): SEQUENCE { BIT STRING(65), BIT STRING(129) } = 204 字节
const USK_SIGN = '3081c90342000434be0afb49270de83a27a5433b09093000fd736471801f940b3bbafd3ccc06f25448ea087a9c4256cdbaa469332407eb22ac6e4ef5a6cb600ad0c2f693d6b4a603818200043ff1e5a7724598ef5199f73ed6b7a1e3d11de3d0ca1133b1e5d0dcd864bacb48a6aa5eb60880031729175353b5e2c5b1c7a453d2c2483f04816a57f8c7c962fd6f7ee4bd242383b73fb1bdd2dd13bdeb39c56590aeb32e118716b9cbbdf2bd793107898b2a1ecb207971c2caa87d1c300d7897d8e459d827c1b0ba07dfa87ef0';
// 签名值: SEQUENCE { OCTET STRING(32 h), BIT STRING(65 S) } = 104 字节
const SIG = '306604208093b2065c23aa76bdda3db1a9fd8ec8a3892e80628ea5d5ece5de2668e6318903420004964361d4918958243500ec0523dcef8c0dafbdc9b018a62115a70a16ed74f7014a8b87aed2b1a06bff1eb6450d0a5512bd44275108157d222c41545b70908f3b';

// ---- 程序化构造 DER 用的辅助 (覆盖长度域两种形式) ----
const tlv = (tag :number, content :number[]) :number[] => {
  const len = content.length;
  if (len < 0x80) return [ tag, len, ...content ];
  if (len < 0x100) return [ tag, 0x81, len, ...content ];
  return [ tag, 0x82, len >> 8, len & 0xff, ...content ];
};
const seq = (...parts :number[][]) :Uint8Array => new Uint8Array(tlv(0x30, parts.flat()));
const tInt = (n :number[]) :number[] => tlv(0x02, n);
const tBit = (octets :number[]) :number[] => tlv(0x03, [ 0, ...octets ]);
const tOct = (b :number[]) :number[] => tlv(0x04, b);

describe('SM9Crypto lib - HEX 与文本', () => {
  it('HEX 编解码往返, 允许空格 / 换行 / 冒号', () => {
    const bytes = new Uint8Array([ 0x00, 0x0f, 0xa1, 0xff ]);
    expect(bytesToHex(bytes)).toBe('000fa1ff');
    expect(hexToBytes('000fa1ff')).toEqual(bytes);
    expect(hexToBytes('00 0f\na1:ff')).toEqual(bytes);
    expect(normalizeHex('00 0f\na1:ff')).toBe('000fa1ff');
  });

  it('非法 HEX 抛错', () => {
    expect(() => hexToBytes('abc')).toThrow('HEX 长度需为偶数');
    expect(() => hexToBytes('zz')).toThrow('内容不是合法的十六进制 (HEX)');
    expect(isHex('abc')).toBe(false);
    expect(isHex('ABC1')).toBe(true);
    expect(isHex('')).toBe(true);
  });

  it('UTF-8 长度与文本往返 (中文 1 字 = 3 字节)', () => {
    expect(utf8Length('abc')).toBe(3);
    expect(utf8Length('国密')).toBe(6);
    expect(bytesToText(textToBytes('Hello 国密'))).toBe('Hello 国密');
  });

  it('非 UTF-8 内容回退为 HEX 展示', () => {
    expect(bytesToText(new Uint8Array([ 0xff, 0xfe ]))).toBe('fffe');
    expect(bytesToText(new Uint8Array([ 0x61, 0x62 ]))).toBe('ab');
  });

  it('describeBytes', () => {
    expect(describeBytes(104)).toBe('104 字节');
  });
});

describe('SM9Crypto lib - DER 结构解析', () => {
  it('描述真实 GmSSL 产出 (长 / 短长度域均支持)', () => {
    expect(describeDer(fromHex(MSK_ENC))).toBe('SEQUENCE { INTEGER(32), BIT STRING(65) }');
    expect(describeDer(fromHex(MSK_SIGN))).toBe('SEQUENCE { INTEGER(32), BIT STRING(129) }');
    expect(describeDer(fromHex(USK_ENC))).toBe('SEQUENCE { BIT STRING(129), BIT STRING(65) }');
    expect(describeDer(fromHex(USK_SIGN))).toBe('SEQUENCE { BIT STRING(65), BIT STRING(129) }');
    expect(describeDer(fromHex(CT))).toBe('SEQUENCE { INTEGER(1), BIT STRING(65), OCTET STRING(32), OCTET STRING(29) }');
    expect(describeDer(fromHex(SIG))).toBe('SEQUENCE { OCTET STRING(32), BIT STRING(65) }');
  });

  it('解析程序化构造的元素', () => {
    const der = seq(tInt([ 0x00 ]), tBit(new Array(65).fill(4)), tOct(new Array(32).fill(0)));
    const nodes = parseDerNodes(der, 2);
    expect(nodes?.map((n) => `${n.name}(${n.bytes})`)).toEqual([ 'INTEGER(1)', 'BIT STRING(65)', 'OCTET STRING(32)' ]);
  });

  it('截断 / 非法结构返回 null', () => {
    const der = seq(tInt([ 0x01 ]), tBit(new Array(65).fill(4)));
    expect(parseDerNodes(der.subarray(0, 10), 2)).toBeNull();
    expect(parseDerNodes(new Uint8Array([ 0x30 ]), 2)).toBeNull();
    expect(describeDer(new Uint8Array([ 0x02, 0x01, 0x00 ]))).toBe('非 DER SEQUENCE');
    expect(describeDer(new Uint8Array([ 0x30, 0x7f ]))).toBe('DER 结构无法解析');
  });
});

describe('SM9Crypto lib - SM9 数据类型识别', () => {
  it('识别真实 GmSSL 密钥 / 密文 / 签名', () => {
    expect(identifySm9Data(fromHex(MSK_ENC))).toBe('enc-master');
    expect(identifySm9Data(fromHex(MPK_ENC))).toBe('enc-public');
    expect(identifySm9Data(fromHex(USK_ENC))).toBe('enc-user');
    expect(identifySm9Data(fromHex(CT))).toBe('ciphertext');
    expect(identifySm9Data(fromHex(MSK_SIGN))).toBe('sign-master');
    expect(identifySm9Data(fromHex(MPK_SIGN))).toBe('sign-public');
    expect(identifySm9Data(fromHex(USK_SIGN))).toBe('sign-user');
    expect(identifySm9Data(fromHex(SIG))).toBe('signature');
  });

  it('加密主私钥与签名值同为 104 字节, 但靠首元素标签 (INTEGER / OCTET STRING) 区分', () => {
    expect(MSK_ENC.length).toBe(104 * 2);
    expect(SIG.length).toBe(104 * 2);
    expect(MSK_ENC.slice(0, 8)).toBe('30660220');   // INTEGER(32)
    expect(SIG.slice(0, 8)).toBe('30660420');       // OCTET STRING(32)
    expect(identifySm9Data(fromHex(SIG))).not.toBe(identifySm9Data(fromHex(MSK_ENC)));
  });

  it('未识别的内容不误判', () => {
    expect(identifySm9Data(new Uint8Array(0))).toBe('unknown');
    expect(identifySm9Data(new Uint8Array(65))).toBe('unknown');          // 全 0, 非 04 开头
    expect(identifySm9Data(new Uint8Array(64))).toBe('unknown');
    const wrongKind = seq(tBit(new Array(65).fill(4)), tBit(new Array(65).fill(4)));
    expect(identifySm9Data(wrongKind)).toBe('unknown');
  });

  it('isKindOf 按用途白名单判断', () => {
    expect(isKindOf(fromHex(USK_ENC), [ 'enc-user' ])).toBe(true);
    expect(isKindOf(fromHex(USK_SIGN), [ 'enc-user' ])).toBe(false);
    expect(isKindOf(fromHex(USK_SIGN), [ 'enc-user', 'sign-user' ])).toBe(true);
  });

  it('KIND_LABELS 覆盖全部类型', () => {
    for (const k of [ 'enc-master', 'sign-master', 'enc-user', 'sign-user', 'enc-public', 'sign-public', 'ciphertext', 'signature', 'unknown' ] as const) {
      expect(KIND_LABELS[k]).toBeTruthy();
    }
  });
});

describe('SM9Crypto lib - 输入解析', () => {
  it('空内容返回 null, 非法内容返回错误说明', () => {
    expect(parseHexField('')).toBeNull();
    expect(parseHexField('   ')).toBeNull();
    expect(parseHexField('abc')).toEqual({ error: 'HEX 长度需为偶数' });
    expect(parseHexField('zz11')).toEqual({ error: '内容含非十六进制字符' });
    expect(parseHexField('04 7c')).toEqual({ bytes: new Uint8Array([ 0x04, 0x7c ]) });
  });
});

describe('SM9Crypto lib - 默认密钥', () => {
  beforeEach(() => localStorage.clear());

  it('保存 / 读取 / 清空', () => {
    expect(getSm9Defaults()).toEqual({ encMaster: '', encUser: '', signMaster: '', signUser: '', id: '' });
    setSm9Default('encMaster', ` ${MSK_ENC} `);
    setSm9Default('encUser', USK_ENC);
    setSm9Default('signMaster', MSK_SIGN);
    setSm9Default('signUser', USK_SIGN);
    setSm9Default('id', 'alice@example.com');
    const d = getSm9Defaults();
    expect(d.encMaster).toBe(MSK_ENC);   // 自动 trim
    expect(d.encUser).toBe(USK_ENC);
    expect(d.signMaster).toBe(MSK_SIGN);
    expect(d.signUser).toBe(USK_SIGN);
    expect(d.id).toBe('alice@example.com');
    expect(localStorage.getItem(SM9_DEFAULT_ITEMS.encMaster)).toBe(MSK_ENC);
    clearSm9Defaults();
    expect(getSm9Defaults()).toEqual({ encMaster: '', encUser: '', signMaster: '', signUser: '', id: '' });
    expect(localStorage.getItem(SM9_DEFAULT_ITEMS.encMaster)).toBeNull();
  });

  it('传空串等于清除该项', () => {
    setSm9Default('id', 'bob');
    expect(getSm9Defaults().id).toBe('bob');
    setSm9Default('id', '');
    expect(getSm9Defaults().id).toBe('');
  });
});
