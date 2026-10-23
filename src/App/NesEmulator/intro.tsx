// NES 模拟器说明 (帮助时间线 / 应用内说明区共用)
import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>在浏览器里跑 <b>NES (FC / 红白机)</b> 游戏。选择一个 <b>.nes</b> ROM 文件即可开始, 画面、声音、手柄输入都由本地模拟器 (<b>jsnes</b> 核心, 功能参考 <b>tetanes</b>) 实时运算, 文件不会上传到任何服务器。本工具<b>不内置任何游戏 ROM</b>, 请使用自己合法持有的卡带备份。</p></blockquote>

<h2>载入 ROM</h2>
<ul>
<li><p>点「选择 ROM」选文件, 或直接把 <b>.nes</b> 文件<b>拖到画面区域</b></p></li>
<li><p>只支持 <b>iNES / NES 2.0</b> 格式的 .nes 文件 (常见的 mapper 0 / 1 / 2 / 3 / 4 / 7 卡带都能跑); 压缩包请先解压</p></li>
<li><p>载入后右侧会显示卡带的 <b>Mapper / 容量 / 制式 / 镜像 / 电池存档</b> 等信息, 便于确认是否认对了卡带</p></li>
</ul>

<h2>操作</h2>
<ul>
<li><p><b>方向键</b> 或 <b>W A S D</b>: 十字键</p></li>
<li><p><b>X</b> / <b>J</b>: A 键; <b>Z</b> / <b>K</b>: B 键</p></li>
<li><p><b>Enter</b>: Start; <b>Shift</b> 或 <b>Backspace</b>: Select</p></li>
<li><p><b>P</b> / <b>Esc</b>: 暂停 / 继续; <b>R</b>: 重置; <b>M</b>: 静音; <b>F11</b>: 全屏</p></li>
<li><p><b>F5</b>: 快速存档; <b>F8</b>: 快速读档</p></li>
<li><p>手机 / 平板可以用页面上的虚拟十字键与 A / B / Start / Select 按钮</p></li>
<li><p><b>全屏</b>时画面下方会浮出半透明虚拟按键, 触摸即可操作, 按下有缩放高亮动效; 不需要时可在设置里关闭, 或调低「按键透明度」减少遮挡</p></li>
<li><p>插上 <b>USB / 蓝牙手柄</b> 后无需设置, 按键自动映射 (标准 Gamepad 布局)</p></li>
<li><p>键位不顺手? 在「按键设置」里点一下对应按键, 再按下新的键即可 (每个按键都会即时生效)</p></li>
</ul>

<h2>存档</h2>
<ul>
<li><p><b>保存状态</b>: 把当前整机状态导出成 <b>.nesstate</b> 文件 (可长期保存、可换设备使用)</p></li>
<li><p><b>读取状态</b>: 选一个 .nesstate 文件继续玩 (存档与 ROM 要对应, 否则画面会异常)</p></li>
<li><p><b>快速存档 / 快速读档</b>: 一键存到浏览器本地 (只有一个槽位, 换设备或清缓存即丢失)</p></li>
<li><p>画面右上角的「截屏」把当前一帧存成 PNG 图片</p></li>
</ul>

<h2>常见问题</h2>
<ul>
<li><p><b>没有声音</b>: 浏览器要求先有用户操作才允许播放声音, 先点一下画面或按一个键即可</p></li>
<li><p><b>画面卡顿</b>: 可把倍速切到 2× 观察是性能问题还是模拟本身掉帧; 若电脑较慢, 可先暂停再继续</p></li>
<li><p><b>载入失败</b>: 确认文件是完整的 .nes (下载未完成的文件会提示「文件不完整」)</p></li>
<li><p>ROM、存档、键位设置全部留在本机, 不联网、不上传</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>在瀏覽器裡跑 <b>NES (FC / 紅白機)</b> 遊戲。選一個 <b>.nes</b> ROM 檔案即可開始, 畫面、聲音、手把輸入都由本機模擬器 (<b>jsnes</b> 核心, 功能參考 <b>tetanes</b>) 即時運算, 檔案不會上傳到任何伺服器。本工具<b>不內建任何遊戲 ROM</b>, 請使用自己合法持有的卡帶備份。</p></blockquote>

<h2>載入 ROM</h2>
<ul>
<li><p>點「選擇 ROM」選檔案, 或直接把 <b>.nes</b> 檔案<b>拖到畫面區域</b></p></li>
<li><p>只支援 <b>iNES / NES 2.0</b> 格式的 .nes 檔案 (常見的 mapper 0 / 1 / 2 / 3 / 4 / 7 卡帶都能跑); 壓縮檔請先解壓</p></li>
<li><p>載入後右側會顯示卡帶的 <b>Mapper / 容量 / 制式 / 鏡像 / 電池存檔</b> 等資訊, 便於確認是否認對了卡帶</p></li>
</ul>

<h2>操作</h2>
<ul>
<li><p><b>方向鍵</b> 或 <b>W A S D</b>: 十字鍵</p></li>
<li><p><b>X</b> / <b>J</b>: A 鍵; <b>Z</b> / <b>K</b>: B 鍵</p></li>
<li><p><b>Enter</b>: Start; <b>Shift</b> 或 <b>Backspace</b>: Select</p></li>
<li><p><b>P</b> / <b>Esc</b>: 暫停 / 繼續; <b>R</b>: 重置; <b>M</b>: 靜音; <b>F11</b>: 全螢幕</p></li>
<li><p><b>F5</b>: 快速存檔; <b>F8</b>: 快速讀檔</p></li>
<li><p>手機 / 平板可以用頁面上的虛擬十字鍵與 A / B / Start / Select 按鈕</p></li>
<li><p><b>全螢幕</b>時畫面下方會浮出半透明虛擬按鍵, 觸控即可操作, 按下有縮放高亮動效; 不需要時可在設定裡關閉, 或調低「按鍵透明度」減少遮擋</p></li>
<li><p>插上 <b>USB / 藍牙手把</b> 後無需設定, 按鍵自動對應 (標準 Gamepad 佈局)</p></li>
<li><p>鍵位不順手? 在「按鍵設定」裡點一下對應按鍵, 再按下新的鍵即可 (每個按鍵都會即時生效)</p></li>
</ul>

<h2>存檔</h2>
<ul>
<li><p><b>儲存狀態</b>: 把目前整機狀態匯出成 <b>.nesstate</b> 檔案 (可長期保存、可換裝置使用)</p></li>
<li><p><b>讀取狀態</b>: 選一個 .nesstate 檔案繼續玩 (存檔與 ROM 要對應, 否則畫面會異常)</p></li>
<li><p><b>快速存檔 / 快速讀檔</b>: 一鍵存到瀏覽器本機 (只有一個槽位, 換裝置或清快取即遺失)</p></li>
<li><p>畫面右上角的「截圖」把目前一幀存成 PNG 圖片</p></li>
</ul>

<h2>常見問題</h2>
<ul>
<li><p><b>沒有聲音</b>: 瀏覽器要求先有使用者操作才允許播放聲音, 先點一下畫面或按一個鍵即可</p></li>
<li><p><b>畫面卡頓</b>: 可把倍速切到 2× 觀察是效能問題還是模擬本身掉幀; 若電腦較慢, 可先暫停再繼續</p></li>
<li><p><b>載入失敗</b>: 確認檔案是完整的 .nes (下載未完成的檔案會提示「檔案不完整」)</p></li>
<li><p>ROM、存檔、鍵位設定全部留在本機, 不連網、不上傳</p></li>
</ul>`;

const en = `<h2>What this does</h2>
<blockquote><p>Play <b>NES</b> games right in the browser. Pick a <b>.nes</b> ROM file and go — video, audio and pad input are all emulated locally with the <b>jsnes</b> core (feature set inspired by <b>tetanes</b>). Nothing is uploaded. <b>No game ROMs are bundled</b>; please use backups of cartridges you own.</p></blockquote>

<h2>Loading a ROM</h2>
<ul>
<li><p>Click “Choose ROM”, or <b>drag a .nes file onto the screen</b></p></li>
<li><p>Only <b>iNES / NES 2.0</b> .nes files are supported (mappers 0 / 1 / 2 / 3 / 4 / 7 and friends); unpack archives first</p></li>
<li><p>After loading, the cartridge panel shows <b>mapper, size, region, mirroring and battery save</b> so you can confirm the right game was picked</p></li>
</ul>

<h2>Controls</h2>
<ul>
<li><p><b>Arrow keys</b> or <b>W A S D</b>: D-pad</p></li>
<li><p><b>X</b> / <b>J</b>: A button; <b>Z</b> / <b>K</b>: B button</p></li>
<li><p><b>Enter</b>: Start; <b>Shift</b> or <b>Backspace</b>: Select</p></li>
<li><p><b>P</b> / <b>Esc</b>: pause / resume; <b>R</b>: reset; <b>M</b>: mute; <b>F11</b>: fullscreen</p></li>
<li><p><b>F5</b>: quick save; <b>F8</b>: quick load</p></li>
<li><p>On phones and tablets use the on-screen D-pad and A / B / Start / Select buttons</p></li>
<li><p>In <b>fullscreen</b> a translucent button pad floats over the bottom of the screen for touch play, with a scale / highlight animation on press; turn it off or lower its opacity in settings</p></li>
<li><p>Plug in a <b>USB / Bluetooth gamepad</b> — standard Gamepad mapping works without setup</p></li>
<li><p>Prefer another layout? In “Controls” click a button, then press the new key (applies immediately)</p></li>
</ul>

<h2>Save states</h2>
<ul>
<li><p><b>Save state</b> exports the whole console state as a <b>.nesstate</b> file (keep it as long as you like, move it between devices)</p></li>
<li><p><b>Load state</b> restores one — it must match the loaded ROM, otherwise the picture will glitch</p></li>
<li><p><b>Quick save / quick load</b> stores a single slot in this browser (lost on other devices or a cache wipe)</p></li>
<li><p>“Screenshot” in the corner saves the current frame as a PNG</p></li>
</ul>

<h2>Troubleshooting</h2>
<ul>
<li><p><b>No sound</b>: browsers only allow audio after a user gesture — click the screen or press a key first</p></li>
<li><p><b>Stutter</b>: try 2× speed to tell a performance problem from the emulation itself catching up</p></li>
<li><p><b>Load failed</b>: make sure the .nes file is complete (an unfinished download is reported as truncated)</p></li>
<li><p>ROMs, states and key bindings stay on this machine — nothing is uploaded</p></li>
</ul>`;

const NesEmulatorIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
};

export default NesEmulatorIntro;
