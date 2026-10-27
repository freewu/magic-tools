// 扫雷说明 (帮助时间线 / 应用内说明区共用)
import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>经典 <b>扫雷</b> (Minesweeper): 在布满地雷的棋盘上, 根据数字提示找出所有非雷格子; 翻开全部安全格即通关, 踩到地雷则本局结束。数字表示该格周围 <b>8 个格子</b>里的地雷数量。全部在本地运行, 不联网、不上传任何数据。</p></blockquote>

<h2>操作</h2>
<ul>
<li><p><b>左键</b>: 翻开格子 (第一次点击的位置及其 3×3 邻域内不会放雷, 开局必定安全)</p></li>
<li><p><b>右键</b>: 插旗 → 问号 → 清空 (问号档可在设置中心关闭)</p></li>
<li><p><b>双击</b> 已翻开的数字格 (或 <b>中键</b> 点击): 周围<strong>未翻开</strong>的格子会闪烁 3 下提示; 当周围旗子数量<strong>等于</strong>该数字时, 同时一次翻开其余未插旗的格子 (一键连开)</p></li>
<li><p><b>触屏</b>: 轻点翻开, <b>长按</b>插旗</p></li>
<li><p><b>R</b>: 重开一局; 点表情按钮 <b>🙂</b> 同样是重开</p></li>
</ul>

<h2>难度</h2>
<ul>
<li><p><b>初级</b>: 9×9, 10 雷 · <b>中级</b>: 16×16, 40 雷 · <b>高级</b>: 30×16, 99 雷</p></li>
<li><p><b>自定义</b>: 宽 5~40、高 5~30、雷数 1 ~ (宽×高 − 9), 雷数上限会留出首点 3×3 安全区</p></li>
<li><p>每个规格 (宽×高 + 雷数) 分别记录<b>最快通关用时</b>, 显示在「最高纪录」</p></li>
</ul>

<h2>界面说明</h2>
<ul>
<li><p><b>剩余雷数</b>: 总雷数 − 已插旗数 (插多了会显示负数, 说明有旗插错)</p></li>
<li><p><b>用时</b>: 从第一次翻开格子开始计时, 通关 / 踩雷后停表</p></li>
<li><p><b>格子大小</b>: 小 / 中 / 大三档, 高级棋盘建议用小格以便一屏放下</p></li>
<li><p><b>结算</b>: 踩雷后亮出全部地雷 (踩中的那颗显示为 💥, 插错的旗标记 ❌); 通关后显示用时与是否刷新纪录</p></li>
<li><p><b>全屏</b>: 右上角「全屏」铺满屏幕, 按 <b>Esc</b> 或点「退出全屏」返回</p></li>
</ul>

<h2>设置</h2>
<ul>
<li><p>设置中心 → 游戏 → 「扫雷」里可以修改<b>默认难度</b>、<b>默认格子大小</b>、<b>插旗是否经过问号</b>, 还能一键清空全部最高纪录</p></li>
<li><p>最高纪录只保存在本机, 换设备或清缓存即丢失, 不会同步到任何服务器</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>經典 <b>掃雷</b> (Minesweeper): 在佈滿地雷的棋盤上, 依數字提示找出所有非雷格子; 翻開全部安全格即通關, 踩到地雷則本局結束。數字表示該格周圍 <b>8 個格子</b>裡的地雷數量。全部在本機執行, 不連網、不上傳任何資料。</p></blockquote>

<h2>操作</h2>
<ul>
<li><p><b>左鍵</b>: 翻開格子 (第一次點擊的位置及其 3×3 鄰域內不會放雷, 開局必定安全)</p></li>
<li><p><b>右鍵</b>: 插旗 → 問號 → 清空 (問號檔可在設定中心關閉)</p></li>
<li><p><b>雙擊</b> 已翻開的數字格 (或 <b>中鍵</b> 點擊): 周圍<strong>未翻開</strong>的格子會閃爍 3 下提示; 當周圍旗子數量<strong>等於</strong>該數字時, 同時一次翻開其餘未插旗的格子 (一鍵連開)</p></li>
<li><p><b>觸屏</b>: 輕點翻開, <b>長按</b>插旗</p></li>
<li><p><b>R</b>: 重開一局; 點表情按鈕 <b>🙂</b> 同樣是重開</p></li>
</ul>

<h2>難度</h2>
<ul>
<li><p><b>初級</b>: 9×9, 10 雷 · <b>中級</b>: 16×16, 40 雷 · <b>高級</b>: 30×16, 99 雷</p></li>
<li><p><b>自訂</b>: 寬 5~40、高 5~30、雷數 1 ~ (寬×高 − 9), 雷數上限會留出首點 3×3 安全區</p></li>
<li><p>每個規格 (寬×高 + 雷數) 分別記錄<b>最快通關用時</b>, 顯示在「最高紀錄」</p></li>
</ul>

<h2>介面說明</h2>
<ul>
<li><p><b>剩餘雷數</b>: 總雷數 − 已插旗數 (插多了會顯示負數, 說明有旗插錯)</p></li>
<li><p><b>用時</b>: 從第一次翻開格子開始計時, 通關 / 踩雷後停表</p></li>
<li><p><b>格子大小</b>: 小 / 中 / 大三檔, 高級棋盤建議用小格以便一螢幕放下</p></li>
<li><p><b>結算</b>: 踩雷後亮出全部地雷 (踩中的那顆顯示為 💥, 插錯的旗標記 ❌); 通關後顯示用時與是否刷新紀錄</p></li>
<li><p><b>全螢幕</b>: 右上角「全螢幕」鋪滿畫面, 按 <b>Esc</b> 或點「退出全螢幕」返回</p></li>
</ul>

<h2>設定</h2>
<ul>
<li><p>設定中心 → 遊戲 → 「掃雷」裡可以修改<b>預設難度</b>、<b>預設格子大小</b>、<b>插旗是否經過問號</b>, 還能一鍵清空全部最高紀錄</p></li>
<li><p>最高紀錄只儲存在本機, 換裝置或清快取即遺失, 不會同步到任何伺服器</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Classic <b>Minesweeper</b>: clear every safe square on a minefield using the number clues, and you win; step on a mine and the round ends. A number tells you how many of the <b>8 surrounding squares</b> hold mines. Everything runs locally: no network, no uploads.</p></blockquote>

<h2>Controls</h2>
<ul>
<li><p><b>Left click</b>: dig a square (the first click and its 3×3 neighbourhood never contain mines, so the opening move is always safe)</p></li>
<li><p><b>Right click</b>: flag → question mark → clear (the question stage can be disabled in Settings)</p></li>
<li><p><b>Double click</b> a revealed number (or <b>middle click</b>): the hidden cells around it <strong>flash three times</strong> as a hint; when the flags around it <strong>equal</strong> the number, the remaining unflagged neighbours open at once (chord)</p></li>
<li><p><b>Touch</b>: tap to dig, <b>long press</b> to flag</p></li>
<li><p><b>R</b>: restart; the face button <b>🙂</b> does the same</p></li>
</ul>

<h2>Difficulty</h2>
<ul>
<li><p><b>Beginner</b> 9×9 / 10 mines · <b>Intermediate</b> 16×16 / 40 mines · <b>Expert</b> 30×16 / 99 mines</p></li>
<li><p><b>Custom</b>: width 5–40, height 5–30, mines 1 – (width × height − 9); the cap leaves the 3×3 first-click area free</p></li>
<li><p>Each board (width × height + mine count) keeps its own <b>fastest clear time</b>, shown as “Best”</p></li>
</ul>

<h2>On screen</h2>
<ul>
<li><p><b>Mines left</b>: total mines − flags placed (it goes negative if you over-flag, which is a hint that a flag is wrong)</p></li>
<li><p><b>Time</b>: starts on your first dig, stops when you clear the board or hit a mine</p></li>
<li><p><b>Cell size</b>: small / medium / large — small is handy for the 30-column expert board</p></li>
<li><p><b>After the round</b>: mines are revealed (the one you hit shows 💥, wrong flags show ❌); a win shows the time and whether it beat the record</p></li>
<li><p><b>Fullscreen</b> (top-right button) fills the screen; press <b>Esc</b> or click “Exit fullscreen” to go back</p></li>
</ul>

<h2>Settings</h2>
<ul>
<li><p>Settings → Games → “Minesweeper” sets the <b>default difficulty</b>, the <b>default cell size</b> and whether <b>right click cycles through a question mark</b>, and can clear all best times</p></li>
<li><p>Best times live only in the browser's localStorage — clearing the cache or switching devices loses them, and nothing is ever synced</p></li>
</ul>`;

const MinesweeperIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
};

export default MinesweeperIntro;
