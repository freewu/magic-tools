// ZIP (store 无压缩) 打包: 把多张 PNG 图标打包为单个 zip 供批量下载
// 不依赖第三方库; PNG 本身已压缩, store 模式体积与原始接近, 所有解压工具兼容

// ---- CRC32 (zlib 多项式 0xEDB88320) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

export const crc32 = (data: Uint8Array): number => {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) c = (CRC_TABLE[(c ^ data[i]) & 0xFF] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xFFFFFFFF) >>> 0;
};

export interface ZipEntry {
  /** zip 内路径, 如 'iOS/AppIcon-1024.png' */
  path: string;
  bytes: Uint8Array;
}

const dosTime = (): { time: number; date: number } => {
  // 固定 1980-01-01 00:00 (DOS 最早可表示时间), 兼容性最好
  return { time: 0, date: 0x21 }; // 0x21 = 1980-01-01
};

/** 将多个条目打包为无压缩 ZIP 字节 */
export const zipStore = (entries: ZipEntry[]): Uint8Array => {
  const enc = new TextEncoder();
  const parts = entries.map((e) => ({ name: enc.encode(e.path), data: e.bytes }));

  // 统计大小: local header(30) + name + data; central(46) + name; EOCD(22)
  let localSize = 0;
  parts.forEach((p) => { localSize += 30 + p.name.length + p.data.length; });
  let centralSize = 0;
  parts.forEach((p) => { centralSize += 46 + p.name.length; });
  const out = new Uint8Array(localSize + centralSize + 22);
  const v = new DataView(out.buffer);
  const { time, date } = dosTime();

  let pos = 0;
  const centralOffsets: number[] = [];

  parts.forEach((p) => {
    centralOffsets.push(pos);
    // local file header
    v.setUint32(pos, 0x04034b50, true); pos += 4; // PK\x03\x04
    v.setUint16(pos, 20, true); pos += 2;   // version needed
    v.setUint16(pos, 0, true); pos += 2;    // flags
    v.setUint16(pos, 0, true); pos += 2;    // method: store
    v.setUint16(pos, time, true); pos += 2;
    v.setUint16(pos, date, true); pos += 2;
    v.setUint32(pos, crc32(p.data), true); pos += 4;
    v.setUint32(pos, p.data.length, true); pos += 4; // compressed size
    v.setUint32(pos, p.data.length, true); pos += 4; // uncompressed size
    v.setUint16(pos, p.name.length, true); pos += 2;
    v.setUint16(pos, 0, true); pos += 2;    // extra len
    out.set(p.name, pos); pos += p.name.length;
    out.set(p.data, pos); pos += p.data.length;
  });

  const cdStart = pos;
  parts.forEach((p, i) => {
    // central directory file header
    v.setUint32(pos, 0x02014b50, true); pos += 4; // PK\x01\x02
    v.setUint16(pos, 20, true); pos += 2;   // version made by
    v.setUint16(pos, 20, true); pos += 2;   // version needed
    v.setUint16(pos, 0, true); pos += 2;    // flags
    v.setUint16(pos, 0, true); pos += 2;    // method
    v.setUint16(pos, time, true); pos += 2;
    v.setUint16(pos, date, true); pos += 2;
    v.setUint32(pos, crc32(p.data), true); pos += 4;
    v.setUint32(pos, p.data.length, true); pos += 4;
    v.setUint32(pos, p.data.length, true); pos += 4;
    v.setUint16(pos, p.name.length, true); pos += 2;
    v.setUint16(pos, 0, true); pos += 2;    // extra len
    v.setUint16(pos, 0, true); pos += 2;    // comment len
    v.setUint16(pos, 0, true); pos += 2;    // disk number start
    v.setUint16(pos, 0, true); pos += 2;    // internal attrs
    v.setUint32(pos, 0, true); pos += 4;    // external attrs
    v.setUint32(pos, centralOffsets[i], true); pos += 4; // local header offset
    out.set(p.name, pos); pos += p.name.length;
  });
  const cdSize = pos - cdStart;

  // end of central directory record
  v.setUint32(pos, 0x06054b50, true); pos += 4; // PK\x05\x06
  v.setUint16(pos, 0, true); pos += 2;    // disk number
  v.setUint16(pos, 0, true); pos += 2;    // cd start disk
  v.setUint16(pos, parts.length, true); pos += 2;  // entries this disk
  v.setUint16(pos, parts.length, true); pos += 2;  // total entries
  v.setUint32(pos, cdSize, true); pos += 4;
  v.setUint32(pos, cdStart, true); pos += 4;
  v.setUint16(pos, 0, true); pos += 2;    // comment len

  return out;
};
