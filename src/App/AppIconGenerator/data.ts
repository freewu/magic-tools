// App Icon 生成: 三平台官方图标尺寸集
// iOS  遵循 Apple Human Interface Guidelines (pt × scale)
// Android 遵循 Google material/launcher 规范 (mdpi 基准 48px, 各密度倍率)
// PhoneGap 遵循 Cordova res/icon 模板目录

export interface IconFile {
  /** zip 内完整路径 (含文件名) */
  path: string;
  /** 生成像素尺寸 (正方形) */
  px: number;
}

// ---- iOS (Apple HIG: App Icon 无透明、主图 1024) ----
export const IOS_FILES: IconFile[] = [
  // iPhone
  { path: 'iOS/AppIcon-20@2x.png', px: 40 },     // 20pt 通知
  { path: 'iOS/AppIcon-20@3x.png', px: 60 },
  { path: 'iOS/AppIcon-29@2x.png', px: 58 },     // 29pt 设置
  { path: 'iOS/AppIcon-29@3x.png', px: 87 },
  { path: 'iOS/AppIcon-40@2x.png', px: 80 },     // 40pt Spotlight
  { path: 'iOS/AppIcon-40@3x.png', px: 120 },
  { path: 'iOS/AppIcon-60@2x.png', px: 120 },    // 60pt 主屏
  { path: 'iOS/AppIcon-60@3x.png', px: 180 },
  // iPad
  { path: 'iOS/AppIcon-20@1x.png', px: 20 },
  { path: 'iOS/AppIcon-29@1x.png', px: 29 },
  { path: 'iOS/AppIcon-40@1x.png', px: 40 },
  { path: 'iOS/AppIcon-76@1x.png', px: 76 },     // 76pt iPad 主屏
  { path: 'iOS/AppIcon-76@2x.png', px: 152 },
  { path: 'iOS/AppIcon-83.5@2x.png', px: 167 },  // iPad Pro
  // App Store
  { path: 'iOS/AppIcon-1024.png', px: 1024 },
];

// ---- Android (Google: mdpi 1x=48 基准) ----
export const ANDROID_FILES: IconFile[] = [
  { path: 'Android/mipmap-mdpi/ic_launcher.png', px: 48 },
  { path: 'Android/mipmap-hdpi/ic_launcher.png', px: 72 },
  { path: 'Android/mipmap-xhdpi/ic_launcher.png', px: 96 },
  { path: 'Android/mipmap-xxhdpi/ic_launcher.png', px: 144 },
  { path: 'Android/mipmap-xxxhdpi/ic_launcher.png', px: 192 },
  { path: 'Android/playstore-icon-512.png', px: 512 }, // Google Play 商店 512
];

// ---- PhoneGap / Cordova (官方 res/icon 模板目录) ----
export const PHONEGAP_FILES: IconFile[] = [
  { path: 'PhoneGap/res/icon/ios/icon.png', px: 57 },
  { path: 'PhoneGap/res/icon/ios/icon@2x.png', px: 114 },
  { path: 'PhoneGap/res/icon/ios/icon-72.png', px: 72 },
  { path: 'PhoneGap/res/icon/ios/icon-72@2x.png', px: 144 },
  { path: 'PhoneGap/res/icon/ios/icon-76.png', px: 76 },
  { path: 'PhoneGap/res/icon/ios/icon-76@2x.png', px: 152 },
  { path: 'PhoneGap/res/icon/ios/icon-120.png', px: 120 },
  { path: 'PhoneGap/res/icon/ios/icon-152.png', px: 152 },
  { path: 'PhoneGap/res/icon/ios/icon-180.png', px: 180 },
  { path: 'PhoneGap/res/icon/android/icon-36-ldpi.png', px: 36 },
  { path: 'PhoneGap/res/icon/android/icon-48-mdpi.png', px: 48 },
  { path: 'PhoneGap/res/icon/android/icon-72-hdpi.png', px: 72 },
  { path: 'PhoneGap/res/icon/android/icon-96-xhdpi.png', px: 96 },
  { path: 'PhoneGap/res/icon/android/icon-144-xxhdpi.png', px: 144 },
  { path: 'PhoneGap/res/icon/android/icon-192-xxxhdpi.png', px: 192 },
];

export const ALL_PLATFORMS = [
  { key: 'ios', title: 'iOS', desc: 'Apple HIG 规范 (含 iPhone/iPad/App Store 1024)', files: IOS_FILES },
  { key: 'android', title: 'Android', desc: 'Google 官方 mipmap 密度目录', files: ANDROID_FILES },
  { key: 'phonegap', title: 'PhoneGap', desc: 'Cordova res/icon 官方目录结构', files: PHONEGAP_FILES },
] as const;

export const TOTAL_ICONS = IOS_FILES.length + ANDROID_FILES.length + PHONEGAP_FILES.length;
