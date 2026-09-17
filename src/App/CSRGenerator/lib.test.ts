/** @jest-environment node */

import {
  SIGN_ALGORITHM,
  assembleCsrDer,
  b64ToBytes,
  buildCertificationRequestInfo,
  buildExtensionsDer,
  buildSubjectDer,
  bytesToB64,
  bytesToHex,
  bytesToHexColon,
  csrAvailable,
  defaultSanFor,
  derToPem,
  generateCsr,
  isDomainName,
  isIpAddress,
  ipToBytes,
  parseSanText,
  pemToDer,
  pkcs8ToPkcs1,
  readTlv,
  readTlvBytes,
  sanLabel,
  subjectLineOf,
  validateCsrInput,
  type CsrSubjectInput,
} from './lib';

// 密钥生成依赖 WebCrypto (jsdom 无 crypto.subtle, 本文件用 node 环境)
const hasSubtle = csrAvailable();
const suite = hasSubtle ? describe : describe.skip;

const subject = (over: Partial<CsrSubjectInput> = {}): CsrSubjectInput => ({
  commonName: 'example.com',
  organization: '测试科技有限公司',
  organizationalUnit: '运维部',
  locality: '深圳市',
  state: '广东省',
  country: 'CN',
  email: 'admin@example.com',
  ...over,
});

describe('CSR 基础编解码', () => {
  it('base64 往返一致 (含二进制字节)', () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(Array.from(b64ToBytes(bytesToB64(bytes)))).toEqual(Array.from(bytes));
  });

  it('b64ToBytes 容忍换行与空白', () => {
    expect(Array.from(b64ToBytes('AAEC\n  Aw=='))).toEqual([ 0, 1, 2, 3 ]);
  });

  it('hex 输出小写连续 / 大写冒号分隔', () => {
    expect(bytesToHex(Uint8Array.of(0, 15, 255))).toBe('000fff');
    expect(bytesToHexColon(Uint8Array.of(0, 15, 255))).toBe('00:0F:FF');
  });

  it('PEM 生成与解析 (64 字符换行, 可往返)', () => {
    const der = Uint8Array.from({ length: 200 }, (_, i) => (i * 7) & 0xff);
    const pem = derToPem(der, 'CERTIFICATE REQUEST');
    const lines = pem.split('\n');
    expect(lines[0]).toBe('-----BEGIN CERTIFICATE REQUEST-----');
    expect(lines[lines.length - 2]).toBe('-----END CERTIFICATE REQUEST-----');
    // 除首尾与最后一空行外每行不超过 64 字符
    for (const l of lines.slice(1, -2)) expect(l.length).toBeLessThanOrEqual(64);
    expect(Array.from(pemToDer(pem, 'CERTIFICATE REQUEST'))).toEqual(Array.from(der));
  });

  it('pemToDer 找不到标签时抛错', () => {
    expect(() => pemToDer('-----BEGIN OTHER-----\nAA==\n-----END OTHER-----', 'CERTIFICATE REQUEST')).toThrow(/未找到 PEM 段/);
  });

  it('readTlv 解析短/长长度字段', () => {
    // SEQUENCE { INTEGER 1 }
    const der = Uint8Array.of(0x30, 0x03, 0x02, 0x01, 0x01);
    const outer = readTlv(der, 0);
    expect(outer.tag).toBe(0x30);
    expect(outer.length).toBe(3);
    expect(outer.headerLength).toBe(2);
    expect(outer.contentOffset).toBe(2);
    const inner = readTlv(der, outer.contentOffset);
    expect(inner.tag).toBe(0x02);
    expect(inner.length).toBe(1);

    // 长长度: 内容 130 字节 -> 0x81 0x82
    const long = new Uint8Array(3 + 130);
    long.set([ 0x04, 0x81, 0x82 ], 0);
    const h = readTlv(long, 0);
    expect(h.length).toBe(130);
    expect(h.headerLength).toBe(3);
    expect(readTlvBytes(long, 0).length).toBe(133);
  });

  it('readTlv 对损坏数据抛错', () => {
    expect(() => readTlv(Uint8Array.of(0x30), 0)).toThrow(/不完整/);
    expect(() => readTlv(Uint8Array.of(0x30, 0x05, 0x01), 0)).toThrow(/不完整/);
    expect(() => readTlv(Uint8Array.of(0x30, 0x82, 0x01), 0)).toThrow(/长度字段不合法/);
  });

  it('pkcs8ToPkcs1 取出内层 RSAPrivateKey (SEQUENCE)', () => {
    const inner = Uint8Array.of(0x30, 0x03, 0x02, 0x01, 0x01);
    // SEQ { INT 0, SEQ { OID rsaEncryption, NULL }, OCTET STRING(inner) }
    // 内容长度 = 3 (INT) + 15 (AlgId) + 7 (OCTET STRING) = 25 = 0x19
    const pkcs8 = Uint8Array.of(
      0x30, 0x19,
      0x02, 0x01, 0x00,
      0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
      0x04, inner.length, ...inner,
    );
    const out = pkcs8ToPkcs1(pkcs8);
    expect(Array.from(out)).toEqual(Array.from(inner));
    expect(readTlv(out, 0).tag).toBe(0x30);
  });

  it('pkcs8ToPkcs1 结构异常时抛错', () => {
    expect(() => pkcs8ToPkcs1(Uint8Array.of(0x02, 0x01, 0x01))).toThrow(/缺少 SEQUENCE/);
  });
});

describe('CSR IP / 域名识别', () => {
  it('识别 IPv4 (拒绝前导零与越界值)', () => {
    expect(isIpAddress('192.168.1.10')).toBe(true);
    expect(Array.from(ipToBytes('1.2.3.4')!)).toEqual([ 1, 2, 3, 4 ]);
    expect(isIpAddress('256.1.1.1')).toBe(false);
    expect(isIpAddress('192.168.01.1')).toBe(false);
  });

  it('识别 IPv6 (压缩 / 内嵌 IPv4 / 网卡后缀)', () => {
    expect(Array.from(ipToBytes('::1')!)).toEqual([ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ]);
    expect(Array.from(ipToBytes('fe80::1%eth0')!.slice(0, 2))).toEqual([ 0xfe, 0x80 ]);
    expect(Array.from(ipToBytes('::ffff:192.168.1.1')!.slice(12))).toEqual([ 192, 168, 1, 1 ]);
    expect(isIpAddress('2001:db8::8a2e:370:7334')).toBe(true);
    expect(isIpAddress('2001:db8::8a2e::7334')).toBe(false);
    expect(isIpAddress('12345::1')).toBe(false);
  });

  it('识别域名 (允许最左通配符与末尾点)', () => {
    expect(isDomainName('example.com')).toBe(true);
    expect(isDomainName('*.example.com')).toBe(true);
    expect(isDomainName('example.com.')).toBe(true);
    expect(isDomainName('-bad.example.com')).toBe(false);
    expect(isDomainName('*.*.example.com')).toBe(false);
    expect(isDomainName('')).toBe(false);
  });
});

describe('CSR SAN 解析', () => {
  it('按换行 / 逗号 / 分号 / 空格分隔并去重', () => {
    const { entries, invalid } = parseSanText('example.com, www.example.com\n*.example.com; example.com 192.168.1.10');
    expect(entries.map(sanLabel)).toEqual([ 'DNS:example.com', 'DNS:www.example.com', 'DNS:*.example.com', 'IP:192.168.1.10' ]);
    expect(invalid).toEqual([]);
  });

  it('域名统一小写并去掉末尾点, IP 保留原文', () => {
    const { entries } = parseSanText('Example.COM.\n::1');
    expect(entries.map(sanLabel)).toEqual([ 'DNS:example.com', 'IP:::1' ]);
    expect(entries[0].bytes).toBeUndefined();
    expect(entries[1].bytes!.length).toBe(16);
  });

  it('支持 DNS: / IP: 前缀强制类型', () => {
    expect(parseSanText('DNS:1.2.3.4').entries[0].type).toBe('dns');
    expect(parseSanText('IP:example.com').invalid).toEqual([ 'IP:example.com' ]);
    expect(parseSanText('IP:192.168.1.1').entries[0].type).toBe('ip');
    expect(parseSanText('ipaddress=10.0.0.1').entries[0].type).toBe('ip');
  });

  it('无法识别的条目进入 invalid (原文保留)', () => {
    const { entries, invalid } = parseSanText('example.com\nhttp://a.com\n*.*.b.com');
    expect(entries.map(sanLabel)).toEqual([ 'DNS:example.com' ]);
    expect(invalid).toEqual([ 'http://a.com', '*.*.b.com' ]);
  });

  it('空白输入返回空结果', () => {
    expect(parseSanText('  \n , ; ')).toEqual({ entries: [], invalid: [] });
  });

  it('未填 SAN 时用 CN 兜底 (IP 的 CN 也识别)', () => {
    expect(defaultSanFor('example.com').map(sanLabel)).toEqual([ 'DNS:example.com' ]);
    expect(defaultSanFor(' Example.COM. ').map(sanLabel)).toEqual([ 'DNS:example.com' ]);
    expect(defaultSanFor('10.0.0.1').map(sanLabel)).toEqual([ 'IP:10.0.0.1' ]);
    expect(defaultSanFor('不是域名')).toEqual([]);
    expect(defaultSanFor('  ')).toEqual([]);
  });
});

describe('CSR 主体与结构', () => {
  it('subjectLineOf 按 openssl 顺序输出 (空字段省略)', () => {
    expect(subjectLineOf(subject())).toBe('C=CN, ST=广东省, L=深圳市, O=测试科技有限公司, OU=运维部, CN=example.com, emailAddress=admin@example.com');
    expect(subjectLineOf({ commonName: 'example.com' })).toBe('CN=example.com');
    expect(subjectLineOf({ commonName: 'a.com', country: 'cn' })).toBe('C=CN, CN=a.com');
  });

  it('buildSubjectDer 为 SEQUENCE 且空主体也合法', () => {
    expect(readTlv(buildSubjectDer(subject()), 0).tag).toBe(0x30);
    const empty = buildSubjectDer({ commonName: '' });
    expect(readTlv(empty, 0).length).toBe(0);
  });

  it('buildExtensionsDer 含 SAN OID 且 DNS 用 context[2] / IP 用 context[7]', () => {
    const { entries } = parseSanText('example.com\n10.0.0.1');
    const ext = buildExtensionsDer(entries);
    // 2.5.29.17 = 06 03 55 1D 11
    expect(Array.from(ext).join(',')).toContain([ 0x06, 0x03, 0x55, 0x1d, 0x11 ].join(','));
    // context-specific primitive 标签: DNS = 0x82, IP = 0x87
    expect(Array.from(ext)).toContain(0x82);
    expect(Array.from(ext)).toContain(0x87);
  });

  it('CertificationRequestInfo = SEQ{ version 0, subject, spki, [0] attributes }', () => {
    const spki = Uint8Array.of(0x30, 0x03, 0x02, 0x01, 0x01);
    const cri = buildCertificationRequestInfo(spki, subject(), defaultSanFor('example.com'));
    const outer = readTlv(cri, 0);
    expect(outer.tag).toBe(0x30);
    let off = outer.contentOffset;
    const version = readTlv(cri, off);
    expect(version.tag).toBe(0x02);
    expect(cri[version.contentOffset]).toBe(0); // INTEGER 0
    off = version.contentOffset + version.length;
    off += readTlv(cri, off).length + readTlv(cri, off).headerLength; // subject
    off += readTlv(cri, off).length + readTlv(cri, off).headerLength; // spki
    const attrs = readTlv(cri, off);
    expect(attrs.tag).toBe(0xa0); // attributes [0] IMPLICIT, 构造类型
    expect(attrs.contentOffset + attrs.length).toBe(cri.length);

    // SAN 为空时 attributes 内容长度为 0
    const noSan = buildCertificationRequestInfo(spki, subject(), []);
    const o2 = readTlv(noSan, 0);
    expect(noSan[o2.contentOffset + o2.length - 2]).toBe(0xa0);
    expect(noSan[noSan.length - 1]).toBe(0x00);
  });

  it('assembleCsrDer 拼出 SEQ{ CRI, AlgId(sha256WithRSA+NULL), BIT STRING }', () => {
    const cri = Uint8Array.of(0x30, 0x03, 0x02, 0x01, 0x01);
    const sig = Uint8Array.of(1, 2, 3);
    const der = assembleCsrDer(cri, sig);
    const outer = readTlv(der, 0);
    expect(outer.tag).toBe(0x30);
    const criBack = readTlvBytes(der, outer.contentOffset);
    expect(Array.from(criBack)).toEqual(Array.from(cri));
    const alg = readTlv(der, outer.contentOffset + criBack.length);
    expect(alg.tag).toBe(0x30);
    const bit = readTlv(der, outer.contentOffset + criBack.length + alg.headerLength + alg.length);
    expect(bit.tag).toBe(0x03);
    expect(der[bit.contentOffset]).toBe(0); // 未用位数 0
    expect(Array.from(der.subarray(bit.contentOffset + 1))).toEqual([ 1, 2, 3 ]);
  });
});

describe('CSR 表单校验', () => {
  it('CN 必填且不超 64 字符', () => {
    expect(validateCsrInput({ subject: { commonName: '' } })).toEqual([ { key: '通用名称 (CN) 不能为空' } ]);
    expect(validateCsrInput({ subject: { commonName: 'a'.repeat(65) } })[0]).toEqual({ key: '通用名称 (CN) 不能超过 {n} 个字符', vars: { n: 64 } });
    expect(validateCsrInput({ subject: subject() })).toEqual([]);
  });

  it('国家代码需 2 位字母 / 邮箱需合法', () => {
    expect(validateCsrInput({ subject: subject({ country: 'CHN' }) })[0].key).toBe('国家代码 (C) 需为 2 位字母, 如 CN / US');
    expect(validateCsrInput({ subject: subject({ email: 'bad@' }) })[0].key).toBe('邮箱格式不正确');
    // 空值都视为未填, 不报错
    expect(validateCsrInput({ subject: subject({ country: '', email: '' }) })).toEqual([]);
  });

  it('SAN 非法条目逐个报错 (含变量)', () => {
    const issues = validateCsrInput({ subject: subject(), san: 'ok.com\nhttp://x\n*.*.y' });
    expect(issues).toHaveLength(2);
    expect(issues[0]).toEqual({ key: 'SAN 中的 {v} 不是合法的域名或 IP', vars: { v: 'http://x' } });
    expect(issues[1].vars).toEqual({ v: '*.*.y' });
  });
});

/** 从 CSR DER 里取出 CertificationRequestInfo / 公钥 / 签名 (供自验证签名用) */
const parseCsr = (der: Uint8Array) => {
  const outer = readTlv(der, 0);
  const cri = readTlvBytes(der, outer.contentOffset);
  const alg = readTlv(der, outer.contentOffset + cri.length);
  const bit = readTlv(der, outer.contentOffset + cri.length + alg.headerLength + alg.length);
  // CRI = SEQ{ version, subject, spki, attributes }
  const criOuter = readTlv(cri, 0);
  let off = criOuter.contentOffset;
  off += readTlv(cri, off).headerLength + readTlv(cri, off).length;
  off += readTlv(cri, off).headerLength + readTlv(cri, off).length;
  const spki = readTlvBytes(cri, off);
  const signature = der.subarray(bit.contentOffset + 1, bit.contentOffset + bit.length);
  return { cri, spki, signature, algBytes: der.subarray(outer.contentOffset + cri.length, outer.contentOffset + cri.length + alg.headerLength + alg.length) };
};

suite('CSR 生成 (WebCrypto)', () => {
  it('2048 位: 私钥 / CSR 结构正确, 签名可自验证', async () => {
    const r = await generateCsr({ subject: subject(), san: 'example.com\n*.example.com\n192.168.1.10', keyBits: 2048 });
    expect(r.keyBits).toBe(2048);
    expect(r.keyFormat).toBe('pkcs8');
    expect(r.signatureAlgorithm).toBe(SIGN_ALGORITHM);
    expect(r.privateKeyPem.startsWith('-----BEGIN PRIVATE KEY-----')).toBe(true);
    expect(r.csrPem.startsWith('-----BEGIN CERTIFICATE REQUEST-----')).toBe(true);
    expect(r.subjectLine).toContain('CN=example.com');
    expect(r.san).toEqual([ 'DNS:example.com', 'DNS:*.example.com', 'IP:192.168.1.10' ]);
    expect(r.fingerprint).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);

    const der = pemToDer(r.csrPem, 'CERTIFICATE REQUEST');
    // 指纹 = DER 的 SHA-256
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', der));
    expect(bytesToHexColon(digest)).toBe(r.fingerprint);

    // 签名算法 OID = 1.2.840.113549.1.1.11 (sha256WithRSAEncryption) + NULL
    const { cri, spki, signature, algBytes } = parseCsr(der);
    expect(Array.from(algBytes).slice(0, 2)).toEqual([ 0x30, 0x0d ]);
    expect(Array.from(algBytes.subarray(2, 13))).toEqual([ 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b ]);
    expect(signature.length).toBe(256); // 2048 位签名

    // 用 CSR 里的公钥验证自签名
    const pub = await crypto.subtle.importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, [ 'verify' ]);
    expect(await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, pub, signature, cri)).toBe(true);
    // 篡改 CRI 后验证失败
    const tampered = Uint8Array.from(cri);
    tampered[tampered.length - 1] ^= 0xff;
    expect(await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, pub, signature, tampered)).toBe(false);
  });

  it('私钥与公钥配对, PKCS#1 输出为同一把密钥的不同封装', async () => {
    const r = await generateCsr({ subject: subject({ commonName: 'a.com', country: 'cn' }), san: '', keyBits: 2048, keyFormat: 'pkcs1' });
    expect(r.keyFormat).toBe('pkcs1');
    expect(r.privateKeyPem.startsWith('-----BEGIN RSA PRIVATE KEY-----')).toBe(true);
    // SAN 留空 -> 用 CN 兜底; 国家代码自动大写
    expect(r.san).toEqual([ 'DNS:a.com' ]);
    expect(r.subjectLine).toBe('C=CN, ST=广东省, L=深圳市, O=测试科技有限公司, OU=运维部, CN=a.com, emailAddress=admin@example.com');

    const pkcs1 = pemToDer(r.privateKeyPem, 'RSA PRIVATE KEY');
    expect(readTlv(pkcs1, 0).tag).toBe(0x30); // RSAPrivateKey ::= SEQUENCE
    // PKCS#1 内层 = 9 个 INTEGER (version, n, e, d, p, q, dp, dq, qinv)
    const outer = readTlv(pkcs1, 0);
    let off = outer.contentOffset;
    let ints = 0;
    while (off < pkcs1.length) {
      const t = readTlv(pkcs1, off);
      expect(t.tag).toBe(0x02);
      ints += 1;
      off = t.contentOffset + t.length;
    }
    expect(ints).toBe(9);
  });

  it('4096 位可选 (签名长度 512 字节), 中文主体按 UTF8String 编码', async () => {
    const r = await generateCsr({ subject: subject({ commonName: '中文域名.example.com' }), keyBits: 4096, keyFormat: 'pkcs8' });
    const der = pemToDer(r.csrPem, 'CERTIFICATE REQUEST');
    const { cri, signature } = parseCsr(der);
    expect(signature.length).toBe(512);
    // 中文以 UTF8String (0x0c) 出现在主体里 (PrintableString 装不下中文)
    expect(Array.from(cri)).toContain(0x0c);
    expect(new TextDecoder().decode(cri)).toContain('中文域名.example.com');
    expect(r.subjectLine).toBe('C=CN, ST=广东省, L=深圳市, O=测试科技有限公司, OU=运维部, CN=中文域名.example.com, emailAddress=admin@example.com');
  });

  it('只填 CN 时也能生成 (主体仅 CN, SAN 由 CN 兜底)', async () => {
    const r = await generateCsr({ subject: { commonName: 'only-cn.com' }, keyBits: 2048 });
    expect(r.subjectLine).toBe('CN=only-cn.com');
    expect(r.san).toEqual([ 'DNS:only-cn.com' ]);
    expect(r.csrPem.endsWith('\n')).toBe(true);
  });

  it('输入不合法时抛错 (不生成密钥)', async () => {
    await expect(generateCsr({ subject: { commonName: '' } })).rejects.toThrow('通用名称 (CN) 不能为空');
    await expect(generateCsr({ subject: subject(), san: 'http://x' })).rejects.toThrow('SAN 中的 {v} 不是合法的域名或 IP');
  });

  it('相同主体两次生成的密钥与 CSR 都不同 (随机性)', async () => {
    const a = await generateCsr({ subject: subject(), keyBits: 2048 });
    const b = await generateCsr({ subject: subject(), keyBits: 2048 });
    expect(a.privateKeyPem).not.toBe(b.privateKeyPem);
    expect(a.csrPem).not.toBe(b.csrPem);
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });
});
