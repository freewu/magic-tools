// GameBoy 模拟器说明 (帮助时间线 / 应用内说明区共用)
import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>在浏览器里跑 <b>GameBoy / GameBoy Color</b> 游戏。选一个 <b>.gb / .gbc</b> ROM 文件即可开始, 画面、声音、手柄输入都由本地 <b>Rust + WebAssembly</b> 模拟核心 (<b>boytacean</b>) 实时运算, 文件不会上传到任何服务器。本工具<b>不内置任何游戏 ROM</b>, 请使用自己合法持有的卡带备份。</p></blockquote>

<h2>载入 ROM</h2>
<ul>
<li><p>点「选择 ROM」选文件, 或直接把 <b>.gb / .gbc</b> 文件<b>拖到画面区域</b>(拖到页面任意处也可以)</p></li>
<li><p>支持常见卡带类型 <b>MBC1 / MBC2 / MBC3 / MBC5</b>; 卡带头里的彩色标记会自动决定按 <b>DMG (灰机)</b> 还是 <b>CGB (彩色)</b> 模式运行</p></li>
<li><p>载入后下方会显示卡带的 <b>标题 / 类型 / 容量 / 卡带内存 / 运行模式 / 校验和</b>, 便于确认是否认对了卡带</p></li>
</ul>

<h2>操作</h2>
<ul>
<li><p><b>方向键</b> 或 <b>W A S D</b>: 十字键</p></li>
<li><p><b>Z</b> / <b>J</b>: A 键; <b>X</b> / <b>K</b>: B 键</p></li>
<li><p><b>Enter</b>: Start; <b>Shift</b> 或 <b>Backspace</b>: Select</p></li>
<li><p><b>P</b> / <b>Esc</b>: 暂停 / 继续; <b>R</b>: 重置; <b>M</b>: 静音; <b>F11</b>: 全屏</p></li>
<li><p><b>F5</b>: 快速存档; <b>F8</b>: 快速读档</p></li>
<li><p>手机 / 平板可以用页面上的虚拟十字键与 A / B / Start / Select 按钮</p></li>
<li><p>插上 <b>USB / 蓝牙手柄</b> 后无需设置, 按键自动映射 (标准 Gamepad 布局)</p></li>
<li><p>键位不顺手? 在「按键设置」里点一下对应按键, 再按下新的键即可 (每个按键都会即时生效)</p></li>
</ul>

<h2>存档</h2>
<ul>
<li><p><b>电池存档</b>: 带电池的卡带 (RPG 进度等) 会按 ROM 名称自动保存在本机浏览器, 下次载入同一个 ROM 自动读回; 换设备或清缓存即丢失</p></li>
<li><p><b>保存状态</b>: 把当前整机状态导出成 <b>.gbstate</b> 文件 (可长期保存、可换设备使用)</p></li>
<li><p><b>读取状态</b>: 选一个 .gbstate 文件继续玩 (存档与 ROM 要对应, 否则画面会异常)</p></li>
<li><p><b>快速存档 / 快速读档</b>: 一键存到浏览器本地 (只有一个槽位, 换设备或清缓存即丢失)</p></li>
<li><p>画面右上角的「截屏」把当前一帧存成 PNG 图片</p></li>
</ul>

<h2>常见问题</h2>
<ul>
<li><p><b>没有声音</b>: 浏览器要求先有用户操作才允许播放声音, 先点一下画面或按一个键即可</p></li>
<li><p><b>画面卡顿</b>: 可把倍速切到 2× 观察是性能问题还是模拟本身掉帧; 若电脑较慢, 可先暂停再继续</p></li>
<li><p><b>载入失败</b>: 确认文件是完整的 .gb / .gbc (卡带头里没有 Nintendo Logo 的文件会提示「不是有效的 GameBoy ROM 文件」)</p></li>
<li><p>ROM、存档、键位设置全部留在本机, 不联网、不上传</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>在瀏覽器裡跑 <b>GameBoy / GameBoy Color</b> 遊戲。選一個 <b>.gb / .gbc</b> ROM 檔案即可開始, 畫面、聲音、手把輸入都由本機 <b>Rust + WebAssembly</b> 模擬核心 (<b>boytacean</b>) 即時運算, 檔案不會上傳到任何伺服器。本工具<b>不內建任何遊戲 ROM</b>, 請使用自己合法持有的卡帶備份。</p></blockquote>

<h2>載入 ROM</h2>
<ul>
<li><p>點「選擇 ROM」選檔案, 或直接把 <b>.gb / .gbc</b> 檔案<b>拖到畫面區域</b>(拖到頁面任意處也可以)</p></li>
<li><p>支援常見卡帶類型 <b>MBC1 / MBC2 / MBC3 / MBC5</b>; 卡帶頭裡的彩色標記會自動決定按 <b>DMG (灰機)</b> 還是 <b>CGB (彩色)</b> 模式執行</p></li>
<li><p>載入後下方會顯示卡帶的 <b>標題 / 類型 / 容量 / 卡帶記憶體 / 執行模式 / 校驗和</b>, 便於確認是否認對了卡帶</p></li>
</ul>

<h2>操作</h2>
<ul>
<li><p><b>方向鍵</b> 或 <b>W A S D</b>: 十字鍵</p></li>
<li><p><b>Z</b> / <b>J</b>: A 鍵; <b>X</b> / <b>K</b>: B 鍵</p></li>
<li><p><b>Enter</b>: Start; <b>Shift</b> 或 <b>Backspace</b>: Select</p></li>
<li><p><b>P</b> / <b>Esc</b>: 暫停 / 繼續; <b>R</b>: 重置; <b>M</b>: 靜音; <b>F11</b>: 全螢幕</p></li>
<li><p><b>F5</b>: 快速存檔; <b>F8</b>: 快速讀檔</p></li>
<li><p>手機 / 平板可以用頁面上的虛擬十字鍵與 A / B / Start / Select 按鈕</p></li>
<li><p>插上 <b>USB / 藍牙手把</b> 後無需設定, 按鍵自動對應 (標準 Gamepad 佈局)</p></li>
<li><p>鍵位不順手? 在「按鍵設定」裡點一下對應按鍵, 再按下新的鍵即可 (每個按鍵都會即時生效)</p></li>
</ul>

<h2>存檔</h2>
<ul>
<li><p><b>電池存檔</b>: 帶電池的卡帶 (RPG 進度等) 會依 ROM 名稱自動保存在本機瀏覽器, 下次載入同一個 ROM 自動讀回; 換裝置或清快取即遺失</p></li>
<li><p><b>儲存狀態</b>: 把目前整機狀態匯出成 <b>.gbstate</b> 檔案 (可長期保存、可換裝置使用)</p></li>
<li><p><b>讀取狀態</b>: 選一個 .gbstate 檔案繼續玩 (存檔與 ROM 要對應, 否則畫面會異常)</p></li>
<li><p><b>快速存檔 / 快速讀檔</b>: 一鍵存到瀏覽器本機 (只有一個槽位, 換裝置或清快取即遺失)</p></li>
<li><p>畫面右上角的「截圖」把目前一幀存成 PNG 圖片</p></li>
</ul>

<h2>常見問題</h2>
<ul>
<li><p><b>沒有聲音</b>: 瀏覽器要求先有使用者操作才允許播放聲音, 先點一下畫面或按一個鍵即可</p></li>
<li><p><b>畫面卡頓</b>: 可把倍速切到 2× 觀察是效能問題還是模擬本身掉幀; 若電腦較慢, 可先暫停再繼續</p></li>
<li><p><b>載入失敗</b>: 確認檔案是完整的 .gb / .gbc (卡帶頭裡沒有 Nintendo Logo 的檔案會提示「不是有效的 GameBoy ROM 檔案」)</p></li>
<li><p>ROM、存檔、鍵位設定全部留在本機, 不連網、不上傳</p></li>
</ul>`;

const en = `<h2>What this does</h2>
<blockquote><p>Play <b>GameBoy / GameBoy Color</b> games right in the browser. Pick a <b>.gb / .gbc</b> ROM file and go — video, audio and pad input are all emulated locally by a <b>Rust + WebAssembly</b> core (<b>boytacean</b>). Nothing is uploaded. <b>No game ROMs are bundled</b>; please use backups of cartridges you own.</p></blockquote>

<h2>Loading a ROM</h2>
<ul>
<li><p>Click “Choose ROM”, or <b>drag a .gb / .gbc file onto the screen</b> (dropping it anywhere on the page works too)</p></li>
<li><p>Common cartridge types are supported (<b>MBC1 / MBC2 / MBC3 / MBC5</b>); the color flag in the cartridge header decides whether it runs as <b>DMG (mono)</b> or <b>CGB (color)</b></p></li>
<li><p>After loading, the cartridge panel shows <b>title, cart type, size, cart RAM, mode and checksum</b> so you can confirm the right game was picked</p></li>
</ul>

<h2>Controls</h2>
<ul>
<li><p><b>Arrow keys</b> or <b>W A S D</b>: D-pad</p></li>
<li><p><b>Z</b> / <b>J</b>: A button; <b>X</b> / <b>K</b>: B button</p></li>
<li><p><b>Enter</b>: Start; <b>Shift</b> or <b>Backspace</b>: Select</p></li>
<li><p><b>P</b> / <b>Esc</b>: pause / resume; <b>R</b>: reset; <b>M</b>: mute; <b>F11</b>: fullscreen</p></li>
<li><p><b>F5</b>: quick save; <b>F8</b>: quick load</p></li>
<li><p>On phones and tablets use the on-screen D-pad and A / B / Start / Select buttons</p></li>
<li><p>Plug in a <b>USB / Bluetooth gamepad</b> — standard Gamepad mapping works without setup</p></li>
<li><p>Prefer another layout? In “Controls” click a button, then press the new key (applies immediately)</p></li>
</ul>

<h2>Saving</h2>
<ul>
<li><p><b>Battery saves</b>: cartridges with a battery (RPG progress and so on) are stored per ROM name in this browser and restored automatically the next time you load the same ROM; they are lost on other devices or after clearing the cache</p></li>
<li><p><b>Save state</b> exports the whole machine state as a <b>.gbstate</b> file (keep it as long as you like, move it between devices)</p></li>
<li><p><b>Load state</b> restores one — it must match the loaded ROM, otherwise the picture will glitch</p></li>
<li><p><b>Quick save / quick load</b> stores a single slot in this browser (lost on other devices or a cache wipe)</p></li>
<li><p>“Screenshot” in the corner saves the current frame as a PNG</p></li>
</ul>

<h2>Troubleshooting</h2>
<ul>
<li><p><b>No sound</b>: browsers only allow audio after a user gesture — click the screen or press a key first</p></li>
<li><p><b>Stutter</b>: try 2× speed to tell a performance problem from the emulation itself catching up</p></li>
<li><p><b>Load failed</b>: make sure the .gb / .gbc file is complete (a file without the Nintendo logo in its header is reported as not a valid ROM)</p></li>
<li><p>ROMs, saves and key bindings stay on this machine — nothing is uploaded</p></li>
</ul>`;

const GameBoyIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
};

export default GameBoyIntro;
