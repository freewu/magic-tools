// 2048 游戏说明 (帮助时间线 / 应用内说明区共用)
import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>经典 <b>2048</b> 数字合并游戏: 在 <b>4×4</b> (也可切 5×5 / 6×6) 的棋盘上滑动方块, <b>相同数字相撞即合并成两倍</b>, 合成出 <b>2048</b> 即通关; 通关后还能继续挑战 4096、8192 等更大的数字。全部在本地运行, 不联网、不上传任何数据。</p></blockquote>

<h2>玩法</h2>
<ul>
<li><p>键盘: <b>方向键</b> 或 <b>W / A / S / D</b> 移动方块; 鼠标拖不动, 但可以点下方按钮</p></li>
<li><p>触屏: 直接在棋盘上<b>滑动</b>即可 (上下左右四个方向)</p></li>
<li><p>每次有效移动后, 空白格会随机出现一个 <b>2</b> (90%) 或 <b>4</b> (10%)</p></li>
<li><p>合并得分 = 合并出的新方块数字, 例如两个 64 合成 128 得 <b>128</b> 分</p></li>
<li><p>棋盘被填满且没有任何可合并的相邻方块时游戏结束</p></li>
</ul>

<h2>工具栏说明</h2>
<ul>
<li><p><b>新游戏</b>: 清空棋盘重新开局 (分数归零, 最高分按棋盘边长分别记录)</p></li>
<li><p><b>撤销</b>: 回退上一步 (最多 20 步, 刷新页面后失效), 走错了可以救一手</p></li>
<li><p><b>棋盘</b>: 4×4 / 5×5 / 6×6 即时切换, 切换会以新边长开一局</p></li>
<li><p><b>继续挑战</b>: 合成出目标数字后出现, 点一下继续往上打; 不点则停在结算界面</p></li>
</ul>

<h2>设置与存档</h2>
<ul>
<li><p>设置中心 → 游戏 → 「2048」里可以修改<b>默认棋盘</b>、<b>默认胜利目标</b> (512 ~ 8192) 和 <b>方块弹出动画</b>开关, 还能一键清空最高分记录</p></li>
<li><p>对局进度 (棋盘 / 分数 / 是否已通关) 自动保存在本机, 刷新页面或切到其它工具再回来可以接着玩</p></li>
<li><p>关闭动画在低性能设备上更流畅 (也兼容系统「减少动态效果」偏好)</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>参考经典 2048 的规则 (每个方块一次移动只能合并一次), 配色也沿用原版米色 / 橙色系</p></li>
<li><p>数据只存在浏览器 localStorage 里, 换设备或清缓存即丢失, 不会同步到任何服务器</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>經典 <b>2048</b> 數字合併遊戲: 在 <b>4×4</b> (也可切 5×5 / 6×6) 的棋盤上滑動方塊, <b>相同數字相撞即合併成兩倍</b>, 合成出 <b>2048</b> 即通關; 通關後還能繼續挑戰 4096、8192 等更大的數字。全部在本機執行, 不連網、不上傳任何資料。</p></blockquote>

<h2>玩法</h2>
<ul>
<li><p>鍵盤: <b>方向鍵</b> 或 <b>W / A / S / D</b> 移動方塊; 滑鼠拖不動, 但可以點下方按鈕</p></li>
<li><p>觸屏: 直接在棋盤上<b>滑動</b>即可 (上下左右四個方向)</p></li>
<li><p>每次有效移動後, 空白格會隨機出現一個 <b>2</b> (90%) 或 <b>4</b> (10%)</p></li>
<li><p>合併得分 = 合併出的新方塊數字, 例如兩個 64 合成 128 得 <b>128</b> 分</p></li>
<li><p>棋盤被填滿且沒有任何可合併的相鄰方塊時遊戲結束</p></li>
</ul>

<h2>工具列說明</h2>
<ul>
<li><p><b>新遊戲</b>: 清空棋盤重新開局 (分數歸零, 最高分按棋盤邊長分別記錄)</p></li>
<li><p><b>復原</b>: 回退上一步 (最多 20 步, 重新整理後失效), 走錯了可以救一手</p></li>
<li><p><b>棋盤</b>: 4×4 / 5×5 / 6×6 即時切換, 切換會以新邊長開一局</p></li>
<li><p><b>繼續挑戰</b>: 合成出目標數字後出現, 點一下繼續往上打; 不點則停在結算畫面</p></li>
</ul>

<h2>設定與存檔</h2>
<ul>
<li><p>設定中心 → 遊戲 → 「2048」裡可以修改<b>預設棋盤</b>、<b>預設勝利目標</b> (512 ~ 8192) 和 <b>方塊彈出動畫</b>開關, 還能一鍵清空最高分記錄</p></li>
<li><p>對局進度 (棋盤 / 分數 / 是否已通關) 自動儲存在本機, 重新整理或切到其它工具再回來可以接著玩</p></li>
<li><p>關閉動畫在低效能裝置上更流暢 (也相容系統「減少動態效果」偏好)</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>參考經典 2048 的規則 (每個方塊一次移動只能合併一次), 配色也沿用原版米色 / 橙色系</p></li>
<li><p>資料只存在瀏覽器 localStorage 裡, 換裝置或清快取即遺失, 不會同步到任何伺服器</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>The classic <b>2048</b> sliding-tile puzzle: swipe tiles on a <b>4×4</b> board (5×5 and 6×6 are also available) — <b>two equal tiles merge into their sum</b> — and reach <b>2048</b> to win. After winning you can keep going for 4096, 8192 and beyond. Everything runs locally: no network, no uploads.</p></blockquote>

<h2>How to play</h2>
<ul>
<li><p>Keyboard: <b>arrow keys</b> or <b>W / A / S / D</b> move the tiles; dragging with the mouse does nothing, but the on-screen buttons work</p></li>
<li><p>Touch: just <b>swipe</b> on the board (left / right / up / down)</p></li>
<li><p>After every effective move a new <b>2</b> (90%) or <b>4</b> (10%) appears in a random empty cell</p></li>
<li><p>Merging scores the value of the new tile — two 64s make a 128 and score <b>128</b></p></li>
<li><p>The game ends when the board is full and no neighbouring tiles can merge</p></li>
</ul>

<h2>Toolbar</h2>
<ul>
<li><p><b>New game</b>: clear the board and start over (score resets; best scores are tracked per board size)</p></li>
<li><p><b>Undo</b>: step back (up to 20 moves, in memory only — lost on reload)</p></li>
<li><p><b>Board</b>: switch between 4×4 / 5×5 / 6×6 instantly; switching starts a new round with that size</p></li>
<li><p><b>Keep playing</b>: appears once you hit the goal — continue for bigger tiles or stay on the result screen</p></li>
</ul>

<h2>Settings &amp; save</h2>
<ul>
<li><p>Settings → Games → “2048” lets you change the <b>default board</b>, the <b>default goal</b> (512 – 8192) and the <b>tile animations</b> switch, and clear the best scores</p></li>
<li><p>Your round (board, score, whether the goal was reached) is saved locally, so reloading or switching tools and coming back resumes the game</p></li>
<li><p>Turning animations off helps on slow devices (the system “reduce motion” preference is respected too)</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Rules follow the classic 2048 (a tile can merge only once per move); the colour palette mimics the original beige / orange theme</p></li>
<li><p>Data lives only in the browser's localStorage — clearing the cache or switching devices loses it, and nothing is ever synced</p></li>
</ul>`;

const Game2048Intro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
};

export default Game2048Intro;
