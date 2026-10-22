// 俄罗斯方块说明 (帮助时间线 / 应用内说明区共用)
import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>经典 <b>俄罗斯方块</b> (Tetris): 方块从顶部落下, 用方向键移动与旋转, 把 <b>行填满即消除</b>; 一次消 4 行 (Tetris) 得分最高, 等级越高下落越快。全部在本地运行, 不联网、不上传任何数据。</p></blockquote>

<h2>操作</h2>
<ul>
<li><p><b>← / →</b> (或 <b>A / D</b>): 左右移动方块</p></li>
<li><p><b>↓</b> (或 <b>S</b>): 软降 —— 加速下落一格, 每格 +1 分</p></li>
<li><p><b>↑</b> / <b>X</b>: 顺时针旋转; <b>Z</b>: 逆时针旋转 (贴墙 / 贴方块时会自动左右微调)</p></li>
<li><p><b>空格</b>: 硬降 —— 直接落到底, 每格 +2 分</p></li>
<li><p><b>C</b> (或 <b>Shift</b>): 暂存当前方块, 之后随时可以换回来 (每个方块只能用一次)</p></li>
<li><p><b>P</b> / <b>Esc</b>: 暂停 / 继续; 页面上也有对应的操作按钮, 手机可直接点</p></li>
</ul>

<h2>计分</h2>
<ul>
<li><p>一次消 1 行 100 分、2 行 300 分、3 行 500 分、<b>4 行 800 分</b>, 以上分数<b>乘以当前等级</b></p></li>
<li><p>软降每格 +1 分, 硬降每格 +2 分</p></li>
<li><p>每消 10 行升 1 级, 等级越高下落间隔越短 (最快约 0.1 秒一格)</p></li>
<li><p>新方块在顶部出现的位置已被占满时游戏结束</p></li>
</ul>

<h2>界面说明</h2>
<ul>
<li><p><b>下一个</b>: 预览接下来的 3 个方块 (采用 <b>7-bag</b> 随机器, 七种方块在一轮里各出现一次, 不会长时间不来长条)</p></li>
<li><p><b>暂存</b>: 显示按 C 暂存的方块</p></li>
<li><p><b>幽灵方块</b>: 棋盘上淡淡的轮廓是当前方块硬降后的落点 (可在设置里关闭)</p></li>
<li><p><b>全屏</b>: 右上角「全屏」把棋盘铺满整个屏幕, 按 <b>Esc</b> 或点「退出全屏」返回</p></li>
</ul>

<h2>设置</h2>
<ul>
<li><p>设置中心 → 游戏 → 「俄罗斯方块」里可以修改<b>默认起始等级</b>、<b>幽灵方块</b>与<b>网格线</b>开关, 还能一键清空最高分记录</p></li>
<li><p>最高分只保存在本机, 换设备或清缓存即丢失, 不会同步到任何服务器</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>經典 <b>俄羅斯方塊</b> (Tetris): 方塊從頂部落下, 用方向鍵移動與旋轉, 把 <b>整行填滿即消除</b>; 一次消 4 行 (Tetris) 得分最高, 等級越高下落越快。全部在本機執行, 不連網、不上傳任何資料。</p></blockquote>

<h2>操作</h2>
<ul>
<li><p><b>← / →</b> (或 <b>A / D</b>): 左右移動方塊</p></li>
<li><p><b>↓</b> (或 <b>S</b>): 軟降 —— 加速下落一格, 每格 +1 分</p></li>
<li><p><b>↑</b> / <b>X</b>: 順時針旋轉; <b>Z</b>: 逆時針旋轉 (貼牆 / 貼方塊時會自動左右微調)</p></li>
<li><p><b>空白鍵</b>: 硬降 —— 直接落到底, 每格 +2 分</p></li>
<li><p><b>C</b> (或 <b>Shift</b>): 暫存目前方塊, 之後隨時可以換回來 (每個方塊只能用一次)</p></li>
<li><p><b>P</b> / <b>Esc</b>: 暫停 / 繼續; 頁面上也有對應的操作按鈕, 手機可直接點</p></li>
</ul>

<h2>計分</h2>
<ul>
<li><p>一次消 1 行 100 分、2 行 300 分、3 行 500 分、<b>4 行 800 分</b>, 以上分數<b>乘以目前等級</b></p></li>
<li><p>軟降每格 +1 分, 硬降每格 +2 分</p></li>
<li><p>每消 10 行升 1 級, 等級越高下落間隔越短 (最快約 0.1 秒一格)</p></li>
<li><p>新方塊在頂部出現的位置已被佔滿時遊戲結束</p></li>
</ul>

<h2>介面說明</h2>
<ul>
<li><p><b>下一個</b>: 預覽接下來的 3 個方塊 (採用 <b>7-bag</b> 隨機器, 七種方塊在一輪裡各出現一次, 不會長時間不來長條)</p></li>
<li><p><b>暫存</b>: 顯示按 C 暫存的方塊</p></li>
<li><p><b>幽靈方塊</b>: 棋盤上淡淡的輪廓是目前方塊硬降後的落點 (可在設定裡關閉)</p></li>
<li><p><b>全螢幕</b>: 右上角「全螢幕」把棋盤鋪滿整個畫面, 按 <b>Esc</b> 或點「退出全螢幕」返回</p></li>
</ul>

<h2>設定</h2>
<ul>
<li><p>設定中心 → 遊戲 → 「俄羅斯方塊」裡可以修改<b>預設起始等級</b>、<b>幽靈方塊</b>與<b>網格線</b>開關, 還能一鍵清空最高分記錄</p></li>
<li><p>最高分只儲存在本機, 換裝置或清快取即遺失, 不會同步到任何伺服器</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Classic <b>Tetris</b>: pieces fall from the top — move and rotate them to <b>fill complete rows and clear them</b>. Clearing 4 rows at once (a Tetris) scores the most, and each level falls faster. Everything runs locally: no network, no uploads.</p></blockquote>

<h2>Controls</h2>
<ul>
<li><p><b>← / →</b> (or <b>A / D</b>): move the piece</p></li>
<li><p><b>↓</b> (or <b>S</b>): soft drop — one cell faster, +1 point per cell</p></li>
<li><p><b>↑</b> / <b>X</b>: rotate clockwise; <b>Z</b>: rotate counter-clockwise (wall kicks nudge the piece when space is tight)</p></li>
<li><p><b>Space</b>: hard drop — straight to the bottom, +2 points per cell</p></li>
<li><p><b>C</b> (or <b>Shift</b>): hold the current piece and swap it back later (once per piece)</p></li>
<li><p><b>P</b> / <b>Esc</b>: pause / resume; the on-screen buttons do the same, so touch devices work too</p></li>
</ul>

<h2>Scoring</h2>
<ul>
<li><p>1 line = 100, 2 lines = 300, 3 lines = 500, <b>4 lines = 800</b> — all <b>multiplied by the current level</b></p></li>
<li><p>Soft drop +1 per cell, hard drop +2 per cell</p></li>
<li><p>Every 10 cleared lines raises the level, and higher levels fall faster (down to ~0.1 s per row)</p></li>
<li><p>The game ends when a new piece cannot spawn at the top</p></li>
</ul>

<h2>On screen</h2>
<ul>
<li><p><b>Next</b>: previews the coming 3 pieces (a <b>7-bag</b> randomiser gives each of the seven shapes once per bag, so no long droughts)</p></li>
<li><p><b>Hold</b>: the piece you parked with C</p></li>
<li><p><b>Ghost piece</b>: the faint outline shows where the current piece would land (can be turned off in settings)</p></li>
<li><p><b>Fullscreen</b> (top-right button) fills the screen with the board; press <b>Esc</b> or click “Exit fullscreen” to go back</p></li>
</ul>

<h2>Settings</h2>
<ul>
<li><p>Settings → Games → “Tetris” lets you change the <b>default start level</b>, toggle the <b>ghost piece</b> and <b>grid lines</b>, and clear the best score</p></li>
<li><p>The best score lives only in the browser's localStorage — clearing the cache or switching devices loses it, and nothing is ever synced</p></li>
</ul>`;

const TetrisIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
};

export default TetrisIntro;
