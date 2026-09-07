// 对称分组密码共享层 (算法无关)
// 提供: 32 位循环移位 / 五种填充 / 五种工作模式 (ECB CBC CFB OFB CTR) / HEX Base64 编码 / 字节<->字
// 纯 TS、无第三方依赖; 各算法目录只负责各自的密钥扩展与单块加解密, 再复用本层组装。

// ---------- 32 位循环移位 (JS 位运算按 32 位有符号处理, 结果统一 >>> 0) ----------
export const rotl32 = (v :number, s :number) :number =>
  ((v << (s & 31)) | (v >>> ((32 - (s & 31)) & 31))) >>> 0;

export const rotr32 = (v :number, s :number) :number =>
  ((v >>> (s & 31)) | (v << ((32 - (s & 31)) & 31))) >>> 0;

// ---------- 工作模式与填充 ----------
export type SymMode = 'ECB' | 'CBC' | 'CFB' | 'OFB' | 'CTR';
export type SymPadding = 'Pkcs7' | 'AnsiX923' | 'Iso10126' | 'Iso97971' | 'ZeroPadding';

// 单块变换回调: 就地加/解密 blockSize 字节的一块
export type BlockCodec = {
  encryptBlock :(block :Uint8Array) => void;
  decryptBlock :(block :Uint8Array) => void;
};

export const isStreamingMode = (mode :SymMode) :boolean => mode !== 'ECB' && mode !== 'CBC';

// ---------- 填充 (行为与 crypto-js 同名实现一致) ----------
export const padBytes = (data :Uint8Array, blockSize :number, padding :SymPadding) :Uint8Array => {
  const rem = data.length % blockSize;
  const need = rem === 0 && padding === 'ZeroPadding' ? 0 : blockSize - rem;
  const out = new Uint8Array(data.length + need);
  out.set(data);

  if (need === 0) return out;

  switch (padding) {
    case 'Pkcs7': {
      out.fill(need, data.length);
      break;
    }
    case 'ZeroPadding': {
      out.fill(0, data.length);
      break;
    }
    case 'Iso97971': {
      out[data.length] = 0x80;
      out.fill(0, data.length + 1);
      break;
    }
    case 'AnsiX923': {
      out.fill(0, data.length, out.length - 1);
      out[out.length - 1] = need;
      break;
    }
    case 'Iso10126': {
      for (let i = data.length; i < out.length - 1; i++) out[i] = Math.floor(Math.random() * 256);
      out[out.length - 1] = need;
      break;
    }
  }
  return out;
};

export const unpadBytes = (data :Uint8Array, blockSize :number, padding :SymPadding) :Uint8Array => {
  if (data.length === 0 || data.length % blockSize !== 0) {
    throw new Error('密文长度非法 (非块长整数倍)');
  }
  switch (padding) {
    case 'Pkcs7': {
      const n = data[data.length - 1];
      if (n < 1 || n > blockSize) throw new Error('Pkcs7 填充校验失败');
      for (let i = data.length - n; i < data.length; i++) {
        if (data[i] !== n) throw new Error('Pkcs7 填充校验失败');
      }
      return data.slice(0, data.length - n);
    }
    case 'ZeroPadding': {
      let end = data.length;
      while (end > 0 && data[end - 1] === 0) end--;
      return data.slice(0, end);
    }
    case 'Iso97971': {
      let end = data.length - 1;
      while (end > 0 && data[end] === 0) end--;
      if (data[end] !== 0x80) throw new Error('Iso97971 填充校验失败');
      return data.slice(0, end);
    }
    case 'AnsiX923':
    case 'Iso10126': {
      const n = data[data.length - 1];
      if (n < 1 || n > blockSize) throw new Error(`${padding} 填充校验失败`);
      if (padding === 'AnsiX923') {
        for (let i = data.length - n; i < data.length - 1; i++) {
          if (data[i] !== 0) throw new Error('AnsiX923 填充校验失败');
        }
      }
      return data.slice(0, data.length - n);
    }
  }
};

// ---------- 工作模式 ----------
// CFB/OFB/CTR 的密钥流均由 encryptBlock 产生, 与加解密方向无关 (CFB 仅反馈源不同)
const cryptBlocks = (
  data :Uint8Array,
  blockSize :number,
  codec :BlockCodec,
  mode :SymMode,
  iv :Uint8Array,
  decrypt :boolean,
) :Uint8Array => {
  if (iv.length !== blockSize) throw new Error(`IV 长度必须为 ${blockSize} 字节`);
  const out = new Uint8Array(data.length);
  const enc = codec.encryptBlock;
  const buf = new Uint8Array(blockSize);

  switch (mode) {
    case 'ECB': {
      if (data.length % blockSize !== 0) throw new Error('数据长度不是块长的整数倍 (ECB/CBC 需使用填充)');
      const t = decrypt ? codec.decryptBlock : enc;
      for (let off = 0; off < data.length; off += blockSize) {
        buf.set(data.subarray(off, off + blockSize));
        t(buf);
        out.set(buf, off);
      }
      return out;
    }
    case 'CBC': {
      if (data.length % blockSize !== 0) throw new Error('数据长度不是块长的整数倍 (ECB/CBC 需使用填充)');
      const prev = new Uint8Array(blockSize);
      prev.set(iv);
      if (!decrypt) {
        for (let off = 0; off < data.length; off += blockSize) {
          for (let i = 0; i < blockSize; i++) buf[i] = data[off + i] ^ prev[i];
          enc(buf);
          out.set(buf, off);
          prev.set(buf);
        }
      } else {
        for (let off = 0; off < data.length; off += blockSize) {
          const cur = new Uint8Array(blockSize);
          cur.set(data.subarray(off, off + blockSize));
          buf.set(cur);
          codec.decryptBlock(buf);
          for (let i = 0; i < blockSize; i++) out[off + i] = buf[i] ^ prev[i];
          prev.set(cur);
        }
      }
      return out;
    }
    case 'CFB': {
      // 密钥流 = E(prev); 加解密共享; 反馈用「密文块」: 加密时密文=out, 解密时密文=data
      const prev = new Uint8Array(blockSize);
      prev.set(iv);
      for (let off = 0; off < data.length; off += blockSize) {
        buf.set(prev);
        enc(buf); // buf = E(prev) 密钥流
        const n = Math.min(blockSize, data.length - off);
        const ct = new Uint8Array(blockSize);
        for (let i = 0; i < n; i++) {
          const c = data[off + i] ^ buf[i];
          out[off + i] = c;
          ct[i] = c;
        }
        // 反馈用密文块: 解密取收到的 data (密文原样), 加密取刚产出的 ct (与 data 异或结果)
        prev.set(decrypt ? data.subarray(off, off + n) : ct, 0);
      }
      return out;
    }
    case 'OFB': {
      const ks = new Uint8Array(blockSize);
      ks.set(iv);
      for (let off = 0; off < data.length; off += blockSize) {
        buf.set(ks);
        enc(buf);
        ks.set(buf);
        const n = Math.min(blockSize, data.length - off);
        for (let i = 0; i < n; i++) out[off + i] = data[off + i] ^ buf[i];
      }
      return out;
    }
    case 'CTR': {
      const counter = new Uint8Array(blockSize);
      counter.set(iv);
      for (let off = 0; off < data.length; off += blockSize) {
        buf.set(counter);
        enc(buf);
        const n = Math.min(blockSize, data.length - off);
        for (let i = 0; i < n; i++) out[off + i] = data[off + i] ^ buf[i];
        // 大端整块自增
        for (let i = blockSize - 1; i >= 0; i--) {
          counter[i] = (counter[i] + 1) & 0xff;
          if (counter[i] !== 0) break;
        }
      }
      return out;
    }
  }
};

// ---------- 高层封装 ----------
export type SymOpts = { mode :SymMode; padding :SymPadding };

// 加密字节流 (ECB/CBC 自动填充; CFB/OFB/CTR 无需填充, 任意长度)
export const encryptBytes = (
  plain :Uint8Array,
  blockSize :number,
  codec :BlockCodec,
  opts :SymOpts,
  iv :Uint8Array,
) :Uint8Array => {
  if (plain.length === 0) throw new Error('明文为空');
  const data = isStreamingMode(opts.mode) ? plain : padBytes(plain, blockSize, opts.padding);
  return cryptBlocks(data, blockSize, codec, opts.mode, iv, false);
};

// 解密字节流 (ECB/CBC 自动去填充)
export const decryptBytes = (
  cipher :Uint8Array,
  blockSize :number,
  codec :BlockCodec,
  opts :SymOpts,
  iv :Uint8Array,
) :Uint8Array => {
  if (cipher.length === 0) throw new Error('密文为空');
  const plain = cryptBlocks(cipher, blockSize, codec, opts.mode, iv, true);
  return isStreamingMode(opts.mode) ? plain : unpadBytes(plain, blockSize, opts.padding);
};

// ---------- 编码 ----------
export const bytesToHex = (bytes :Uint8Array) :string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export const hexToBytes = (hex :string) :Uint8Array => {
  const clean = hex.replace(/[\s:,-]+/g, '');
  if (clean.length % 2 !== 0) throw new Error('HEX 长度必须为偶数');
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error('HEX 包含非法字符');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
};

export const bytesToBase64 = (bytes :Uint8Array) :string => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(bin);
};

export const base64ToBytes = (b64 :string) :Uint8Array => {
  const s = b64.trim();
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4 === 1) throw new Error('Base64 内容解析失败');
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

// ---------- 字节 <-> 32 位字 (大端/小端) ----------
export const bytesToWordsBE = (bytes :Uint8Array) :number[] => {
  const words :number[] = [];
  for (let i = 0; i + 4 <= bytes.length; i += 4) {
    words.push(((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0);
  }
  return words;
};

export const wordsToBytesBE = (words :number[]) :Uint8Array => {
  const out = new Uint8Array(words.length * 4);
  words.forEach((w, i) => {
    out[i * 4] = (w >>> 24) & 0xff;
    out[i * 4 + 1] = (w >>> 16) & 0xff;
    out[i * 4 + 2] = (w >>> 8) & 0xff;
    out[i * 4 + 3] = w & 0xff;
  });
  return out;
};

export const bytesToWordsLE = (bytes :Uint8Array) :number[] => {
  const words :number[] = [];
  for (let i = 0; i + 4 <= bytes.length; i += 4) {
    words.push((bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24)) >>> 0);
  }
  return words;
};

export const wordsToBytesLE = (words :number[]) :Uint8Array => {
  const out = new Uint8Array(words.length * 4);
  words.forEach((w, i) => {
    out[i * 4] = w & 0xff;
    out[i * 4 + 1] = (w >>> 8) & 0xff;
    out[i * 4 + 2] = (w >>> 16) & 0xff;
    out[i * 4 + 3] = (w >>> 24) & 0xff;
  });
  return out;
};
