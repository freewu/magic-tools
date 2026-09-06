import { crc32, zipStore } from './lib';
import { ALL_PLATFORMS, ANDROID_FILES, IOS_FILES, PHONEGAP_FILES, TOTAL_ICONS } from './data';

// 简易解析 (仅 store 模式): 从 zip 字节按顺序读出各条目的 名称+数据
const parseZip = (b: Uint8Array): { name: string; data: Uint8Array }[] => {
  const v = new DataView(b.buffer);
  const out: { name: string; data: Uint8Array }[] = [];
  let pos = 0;
  while (v.getUint32(pos, true) === 0x04034b50) {
    const nameLen = v.getUint16(pos + 26, true);
    const extraLen = v.getUint16(pos + 28, true);
    const size = v.getUint32(pos + 18, true);
    const name = new TextDecoder().decode(b.subarray(pos + 30, pos + 30 + nameLen));
    const data = b.subarray(pos + 30 + nameLen + extraLen, pos + 30 + nameLen + extraLen + size);
    out.push({ name, data });
    pos += 30 + nameLen + extraLen + size;
  }
  return out;
};

describe('App Icon 生成 (zip/crc/尺寸集)', () => {
  it('crc32 标准向量', () => {
    const s = new TextEncoder().encode('123456789');
    expect(crc32(s)).toBe(0xCBF43926);
    expect(crc32(new Uint8Array(0))).toBe(0);
  });

  it('zipStore: 文件头/EOCD/条目数量正确', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const zip = zipStore([{ path: 'iOS/a.png', bytes: a }, { path: 'Android/b.png', bytes: b }]);
    // local header signature PK\x03\x04
    expect(zip[0]).toBe(0x50); expect(zip[1]).toBe(0x4b);
    expect(zip[2]).toBe(0x03); expect(zip[3]).toBe(0x04);
    // EOCD signature PK\x05\x06 在结尾前 22 字节
    const tail = zip.length - 22;
    expect(zip[tail]).toBe(0x50); expect(zip[tail + 1]).toBe(0x4b);
    expect(zip[tail + 2]).toBe(0x05); expect(zip[tail + 3]).toBe(0x06);
    const v = new DataView(zip.buffer);
    expect(v.getUint16(tail + 8, true)).toBe(2); // total entries
  });

  it('zipStore: 条目可逐条解析还原 (store 无压缩)', () => {
    const files = [
      { path: 'iOS/AppIcon-1024.png', bytes: new Uint8Array([9, 9, 9]) },
      { path: 'PhoneGap/res/icon/ios/icon@2x.png', bytes: new Uint8Array([1, 2, 3, 4, 5]) },
      { path: 'Android/mipmap-mdpi/ic_launcher.png', bytes: new Uint8Array([]) },
    ];
    const zip = zipStore(files);
    const entries = parseZip(zip);
    expect(entries.map((e) => e.name)).toEqual(files.map((f) => f.path));
    expect(Array.from(entries[0].data)).toEqual([9, 9, 9]);
    expect(Array.from(entries[1].data)).toEqual([1, 2, 3, 4, 5]);
    expect(entries[2].data.length).toBe(0);
  });

  it('zipStore: 空条目列表仍产出合法空 zip', () => {
    const zip = zipStore([]);
    const v = new DataView(zip.buffer);
    expect(zip.length).toBe(22);
    expect(v.getUint16(zip.length - 10, true)).toBe(0); // entries 0
  });

  it('平台尺寸集: 数量与唯一路径', () => {
    const all = [...IOS_FILES, ...ANDROID_FILES, ...PHONEGAP_FILES];
    expect(all.length).toBe(TOTAL_ICONS);
    expect(TOTAL_ICONS).toBe(36);
    const paths = new Set(all.map((f) => f.path));
    expect(paths.size).toBe(all.length); // 无重复路径
    all.forEach((f) => {
      expect(f.path.endsWith('.png')).toBe(true);
      expect(f.px).toBeGreaterThan(0);
    });
  });

  it('iOS 遵循 Apple HIG 关键尺寸', () => {
    const px = IOS_FILES.map((f) => f.px).sort((a, b) => a - b);
    // App Store 1024 必须存在且唯一最大
    expect(px).toContain(1024);
    expect(Math.max(...px)).toBe(1024);
    // iPhone 60pt @3x = 180, @2x = 120
    expect(px).toContain(180);
    expect(px).toContain(120);
    // iPad Pro 83.5pt @2x = 167
    expect(px).toContain(167);
    expect(IOS_FILES.filter((f) => f.path.includes('1024')).length).toBe(1);
  });

  it('Android 遵循 Google 密度规范 (mdpi 48 基准)', () => {
    const map = new Map(ANDROID_FILES.filter((f) => f.path.includes('mipmap')).map((f) => [f.path, f.px]));
    expect(map.get('Android/mipmap-mdpi/ic_launcher.png')).toBe(48);
    expect(map.get('Android/mipmap-hdpi/ic_launcher.png')).toBe(72);
    expect(map.get('Android/mipmap-xhdpi/ic_launcher.png')).toBe(96);
    expect(map.get('Android/mipmap-xxhdpi/ic_launcher.png')).toBe(144);
    expect(map.get('Android/mipmap-xxxhdpi/ic_launcher.png')).toBe(192);
    expect(ANDROID_FILES.some((f) => f.path.includes('playstore') && f.px === 512)).toBe(true);
  });

  it('PhoneGap 遵循 Cordova res/icon 模板', () => {
    expect(PHONEGAP_FILES.some((f) => f.path === 'PhoneGap/res/icon/ios/icon.png' && f.px === 57)).toBe(true);
    expect(PHONEGAP_FILES.some((f) => f.path === 'PhoneGap/res/icon/ios/icon@2x.png' && f.px === 114)).toBe(true);
    expect(PHONEGAP_FILES.some((f) => f.path === 'PhoneGap/res/icon/android/icon-192-xxxhdpi.png' && f.px === 192)).toBe(true);
    expect(PHONEGAP_FILES.some((f) => f.path === 'PhoneGap/res/icon/android/icon-36-ldpi.png' && f.px === 36)).toBe(true);
    // 全部路径都在 PhoneGap/res/icon 之下
    PHONEGAP_FILES.forEach((f) => expect(f.path.startsWith('PhoneGap/res/icon/')).toBe(true));
  });

  it('平台信息完整可展示', () => {
    expect(ALL_PLATFORMS).toHaveLength(3);
    const total = ALL_PLATFORMS.reduce((s, p) => s + p.files.length, 0);
    expect(total).toBe(TOTAL_ICONS);
    ALL_PLATFORMS.forEach((p) => {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.files.length).toBeGreaterThan(0);
    });
  });
});
