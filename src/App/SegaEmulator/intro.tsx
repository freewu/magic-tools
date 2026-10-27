// Sega 模拟器说明 (帮助时间线 / 应用内说明区共用)
import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>在浏览器里跑 <b>Mega Drive / Genesis</b> (以及 <b>Master System / Game Gear</b>) 游戏。选一个 <b>.md / .bin / .gen / .smd</b> ROM 文件即可开始, 画面、声音、手柄输入都由本地 <b>WebAssembly</b> 模拟核心 <b>Genesis Plus GX</b> 实时运算, 文件不会上传到任何服务器。本工具<b>不内置任何游戏 ROM</b>, 请使用自己合法持有的卡带备份。</p></blockquote>

<h2>载入 ROM</h2>
<ul>
<li><p>点「选择 ROM」选文件, 或直接把 ROM <b>拖到黑色画面区域</b></p></li>
<li><p>支持的扩展名: <b>.md / .bin / .gen / .smd</b> (Mega Drive)、<b>.sms</b> (Master System)、<b>.gg</b> (Game Gear), 也支持 <b>.zip / .7z</b> 压缩包 (自动解压)</p></li>
<li><p>机型按扩展名自动判定 (<b>.sms / .gg</b> 走对应核心, 其余按 Mega Drive); 载入后下方信息区会显示当前机型与文件大小</p></li>
<li><p>32X / Sega CD 需要另外的光盘 / 扩展核心, 本工具未内置</p></li>
</ul>

<h2>操作</h2>
<ul>
<li><p>启动后点画面上的「播放」按钮开始; <b>首次出声需要先点一下画面或按一个键</b> (浏览器自动播放策略)</p></li>
<li><p>键盘: 默认 <b>方向键</b> 十字键, <b>Z / X / C</b> 对应 A / B / C, <b>A / S / D</b> 对应 X / Y / Z, <b>Enter</b> = Start。底部菜单的「控制器」里可以逐个重新绑定</p></li>
<li><p>手机 / 平板: 触摸屏会自动出现<b>虚拟按键</b>; 也可在底部菜单里换成外接手柄</p></li>
<li><p>插上 <b>USB / 蓝牙手柄</b> 后无需设置, 在底部菜单「控制器」里确认映射即可</p></li>
<li><p><b>全屏</b>: 用页面右上角的全屏按钮, 或用模拟器底部菜单的全屏按钮 (全屏后按 <b>Esc</b> 退出)</p></li>
</ul>

<h2>存档</h2>
<ul>
<li><p><b>电池存档</b> (卡带里的 SRAM) 按 ROM 名称保存在本机浏览器, 下次载入同名 ROM 自动读回; 换设备或清缓存即丢失</p></li>
<li><p><b>即时存档</b>: 底部菜单可存 / 读多个槽位, 也能导出成文件长期保存</p></li>
<li><p><b>加速 / 慢放 / 倒带</b>: 底部菜单里都有开关 (倒带会占用较多内存)</p></li>
<li><p>想清空本机的电池存档, 在浏览器里清掉本站数据即可 (本机不保存 ROM)</p></li>
</ul>

<h2>常见问题</h2>
<ul>
<li><p><b>载入后黑屏 / 停在加载</b>: 压缩包可能已损坏, 或 ROM 不是完整的 Mega Drive 转储 (试着自己先解压成 .bin)</p></li>
<li><p><b>画面卡顿</b>: 关闭底部菜单里的「画面滤镜 / 高级着色器」, 或换 1× 速度; 老机器上关闭倒带最省资源</p></li>
<li><p><b>没有声音</b>: 先点一下画面或按一个键; 再检查底部菜单里的音量与静音</p></li>
<li><p><b>手机横屏更好用</b>: 全屏 + 虚拟按键的布局在横屏下最接近真机</p></li>
<li><p>ROM、存档、键位设置全部留在本机, 不联网、不上传</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>在瀏覽器裡跑 <b>Mega Drive / Genesis</b> (以及 <b>Master System / Game Gear</b>) 遊戲。選一個 <b>.md / .bin / .gen / .smd</b> ROM 檔案即可開始, 畫面、聲音、手把輸入都由本機 <b>WebAssembly</b> 模擬核心 <b>Genesis Plus GX</b> 即時運算, 檔案不會上傳到任何伺服器。本工具<b>不內建任何遊戲 ROM</b>, 請使用自己合法持有的卡帶備份。</p></blockquote>

<h2>載入 ROM</h2>
<ul>
<li><p>點「選擇 ROM」選檔案, 或直接把 ROM <b>拖到黑色畫面區域</b></p></li>
<li><p>支援的副檔名: <b>.md / .bin / .gen / .smd</b> (Mega Drive)、<b>.sms</b> (Master System)、<b>.gg</b> (Game Gear), 也支援 <b>.zip / .7z</b> 壓縮檔 (自動解壓)</p></li>
<li><p>機型依副檔名自動判定 (<b>.sms / .gg</b> 走對應核心, 其餘依 Mega Drive); 載入後下方資訊區會顯示目前機型與檔案大小</p></li>
<li><p>32X / Sega CD 需要另外的光碟 / 擴充核心, 本工具未內建</p></li>
</ul>

<h2>操作</h2>
<ul>
<li><p>啟動後點畫面上的「播放」按鈕開始; <b>首次出聲需要先點一下畫面或按一個鍵</b> (瀏覽器自動播放策略)</p></li>
<li><p>鍵盤: 預設 <b>方向鍵</b> 十字鍵, <b>Z / X / C</b> 對應 A / B / C, <b>A / S / D</b> 對應 X / Y / Z, <b>Enter</b> = Start。底部選單的「控制器」裡可以逐個重新綁定</p></li>
<li><p>手機 / 平板: 觸控螢幕會自動出現<b>虛擬按鍵</b>; 也可在底部選單裡換成外接手把</p></li>
<li><p>插上 <b>USB / 藍牙手把</b> 後無需設定, 在底部選單「控制器」裡確認對應即可</p></li>
<li><p><b>全螢幕</b>: 用頁面右上角的全螢幕按鈕, 或用模擬器底部選單的全螢幕按鈕 (全螢幕後按 <b>Esc</b> 退出)</p></li>
</ul>

<h2>存檔</h2>
<ul>
<li><p><b>電池存檔</b> (卡帶裡的 SRAM) 依 ROM 名稱保存在本機瀏覽器, 下次載入同名 ROM 自動讀回; 換裝置或清快取即遺失</p></li>
<li><p><b>即時存檔</b>: 底部選單可存 / 讀多個槽位, 也能匯出成檔案長期保存</p></li>
<li><p><b>加速 / 慢放 / 倒帶</b>: 底部選單裡都有開關 (倒帶會佔用較多記憶體)</p></li>
<li><p>想清空本機的電池存檔, 在瀏覽器裡清掉本網站資料即可 (本機不保存 ROM)</p></li>
</ul>

<h2>常見問題</h2>
<ul>
<li><p><b>載入後黑屏 / 停在載入</b>: 壓縮檔可能已損壞, 或 ROM 不是完整的 Mega Drive 轉儲 (試著自己先解壓成 .bin)</p></li>
<li><p><b>畫面卡頓</b>: 關閉底部選單裡的「畫面濾鏡 / 進階著色器」, 或換 1× 速度; 老機器上關閉倒帶最省資源</p></li>
<li><p><b>沒有聲音</b>: 先點一下畫面或按一個鍵; 再檢查底部選單裡的音量與靜音</p></li>
<li><p><b>手機橫向更好用</b>: 全螢幕 + 虛擬按鍵的佈局在橫向最接近真機</p></li>
<li><p>ROM、存檔、鍵位設定全部留在本機, 不連網、不上傳</p></li>
</ul>`;

const en = `<h2>What this does</h2>
<blockquote><p>Play <b>Mega Drive / Genesis</b> (and <b>Master System / Game Gear</b>) games right in the browser. Pick a <b>.md / .bin / .gen / .smd</b> ROM file and go — video, audio and pad input are emulated locally by the <b>Genesis Plus GX</b> <b>WebAssembly</b> core. Nothing is uploaded. <b>No game ROMs are bundled</b>; please use backups of cartridges you own.</p></blockquote>

<h2>Loading a ROM</h2>
<ul>
<li><p>Click “Choose ROM”, or <b>drag a ROM onto the black screen area</b></p></li>
<li><p>Supported extensions: <b>.md / .bin / .gen / .smd</b> (Mega Drive), <b>.sms</b> (Master System), <b>.gg</b> (Game Gear) — <b>.zip / .7z</b> archives are unpacked automatically</p></li>
<li><p>The console is picked from the extension (<b>.sms / .gg</b> use their own core, everything else runs as Mega Drive); the info panel below shows the console and file size</p></li>
<li><p>32X / Sega CD need a different core (and disc images) and are not bundled</p></li>
</ul>

<h2>Controls</h2>
<ul>
<li><p>Press the play button on the screen to boot; <b>the first sound needs a click or key press</b> (browser autoplay policy)</p></li>
<li><p>Keyboard: <b>arrow keys</b> for the D-pad, <b>Z / X / C</b> for A / B / C, <b>A / S / D</b> for X / Y / Z, <b>Enter</b> = Start. Rebind any of them under “Control Settings” in the bottom menu</p></li>
<li><p>Phones and tablets get <b>on-screen buttons</b> automatically; an external pad can be selected in the bottom menu</p></li>
<li><p>Plug in a <b>USB / Bluetooth gamepad</b> — no setup needed, just confirm the mapping under “Control Settings”</p></li>
<li><p><b>Fullscreen</b>: use the button next to the title or the one in the bottom menu (<b>Esc</b> leaves fullscreen)</p></li>
</ul>

<h2>Saving</h2>
<ul>
<li><p><b>Battery saves</b> (SRAM inside the cartridge) are stored per ROM name in this browser and restored automatically the next time you load the same ROM; they are lost on other devices or after clearing the cache</p></li>
<li><p><b>Save states</b>: the bottom menu stores several slots and can export them as files</p></li>
<li><p><b>Fast forward / slow motion / rewind</b> are available in the bottom menu (rewind uses noticeably more memory)</p></li>
<li><p>To wipe battery saves, clear this site’s data in the browser — ROMs are never stored on the machine</p></li>
</ul>

<h2>Troubleshooting</h2>
<ul>
<li><p><b>Black screen or stuck on loading</b>: the archive may be damaged, or the ROM is not a complete Mega Drive dump (try unpacking it to a plain .bin)</p></li>
<li><p><b>Stutter</b>: turn off shaders / filters in the bottom menu or stay at 1× speed; disabling rewind helps most on older machines</p></li>
<li><p><b>No sound</b>: click the screen or press a key first, then check the volume and mute buttons in the bottom menu</p></li>
<li><p><b>Phones work best in landscape</b>: fullscreen + on-screen buttons is closest to the real hardware</p></li>
<li><p>ROMs, saves and key bindings stay on this machine — nothing is uploaded</p></li>
</ul>`;

const SegaEmulatorIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
};

export default SegaEmulatorIntro;
