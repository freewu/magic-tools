// 贪吃蛇说明 (帮助时间线 / 应用内说明区共用)
import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>经典 <b>贪吃蛇</b>: 操控一条不断变长的蛇吃苹果, 撞到墙、障碍物或自己就结束。支持 <b>四档速度</b>、<b>穿墙</b>、<b>障碍物</b> 与限时出现的 <b>金苹果</b>, 最高分自动保存在本机。全部在本地运行, 不联网、不上传任何数据。</p></blockquote>

<h2>操作</h2>
<ul>
<li><p><b>方向键</b> (或 <b>W A S D</b>): 转向 —— 蛇每走一格吃一个转向指令, 连按两下可以连续拐两个弯 (不能 180 度掉头)</p></li>
<li><p><b>空格</b> / <b>回车</b>: 开局 / 暂停 / 继续; <b>P</b> 或 <b>Esc</b> 也能暂停</p></li>
<li><p>手机 / 平板: <b>在棋盘上滑动</b>即可转向, 也可以点右侧的 <b>方向盘</b> 按钮</p></li>
<li><p>右侧 <b>速度</b> 四档随时可换 (慢 280ms / 标准 200ms / 快 150ms / 极速 110ms 一格)</p></li>
</ul>

<h2>计分</h2>
<ul>
<li><p>吃到 <b>苹果</b> +10 分, 蛇身长 1 格</p></li>
<li><p>吃到 <b>金苹果</b> +30 分, 但它只在棋盘上停留 <b>9 秒</b>, 超时会变回普通苹果</p></li>
<li><p>难度更高不等于分数更高, 但 <b>穿墙 / 障碍物 / 速度</b> 会自动记在标签里, 方便对比自己的成绩</p></li>
<li><p>棋盘被蛇身填满 (没有空格放食物) 即 <b>通关</b></p></li>
</ul>

<h2>界面说明</h2>
<ul>
<li><p><b>穿墙</b>: 打开后从棋盘一边出去会从对边进来, 不会撞墙</p></li>
<li><p><b>障碍物</b>: 打开后棋盘上固定出现 12 格障碍 (开局时铺设, 进行中切换则下一局生效)</p></li>
<li><p><b>音效</b>: 吃到食物 / 撞到时用 Web Audio 现场合成提示音, 不加载任何音频文件</p></li>
<li><p><b>全屏</b>: 右上角「全屏」把棋盘铺满屏幕, 按 <b>Esc</b> 或点「退出全屏」返回</p></li>
</ul>

<h2>设置</h2>
<ul>
<li><p>设置中心 → 游戏 → 「贪吃蛇」里可以修改 <b>默认速度</b>、<b>默认穿墙</b>、<b>默认障碍物</b> 与 <b>默认音效</b>, 还能一键清空最高分记录</p></li>
<li><p>最高分只保存在本机, 换设备或清缓存即丢失, 不会同步到任何服务器</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>經典 <b>貪吃蛇</b>: 操控一條不斷變長的蛇吃蘋果, 撞到牆、障礙物或自己就結束。支援 <b>四段速度</b>、<b>穿牆</b>、<b>障礙物</b> 與限時出現的 <b>金蘋果</b>, 最高分自動保存在本機。全部在本機執行, 不連網、不上傳任何資料。</p></blockquote>

<h2>操作</h2>
<ul>
<li><p><b>方向鍵</b> (或 <b>W A S D</b>): 轉向 —— 蛇每走一格消耗一個轉向指令, 連按兩下可以連續拐兩個彎 (不能 180 度迴轉)</p></li>
<li><p><b>空白鍵</b> / <b>Enter</b>: 開局 / 暫停 / 繼續; <b>P</b> 或 <b>Esc</b> 也能暫停</p></li>
<li><p>手機 / 平板: <b>在棋盤上滑動</b>即可轉向, 也可以點右側的 <b>方向盤</b> 按鈕</p></li>
<li><p>右側 <b>速度</b> 四段隨時可換 (慢 280ms / 標準 200ms / 快 150ms / 極速 110ms 一格)</p></li>
</ul>

<h2>計分</h2>
<ul>
<li><p>吃到 <b>蘋果</b> +10 分, 蛇身長 1 格</p></li>
<li><p>吃到 <b>金蘋果</b> +30 分, 但它只在棋盤上停留 <b>9 秒</b>, 逾時會變回普通蘋果</p></li>
<li><p>難度更高不等於分數更高, 但 <b>穿牆 / 障礙物 / 速度</b> 會自動記在標籤裡, 方便比較自己的成績</p></li>
<li><p>棋盤被蛇身填滿 (沒有空格放食物) 即 <b>通關</b></p></li>
</ul>

<h2>介面說明</h2>
<ul>
<li><p><b>穿牆</b>: 打開後從棋盤一邊出去會從對邊進來, 不會撞牆</p></li>
<li><p><b>障礙物</b>: 打開後棋盤上固定出現 12 格障礙 (開局時鋪設, 進行中切換則下一局生效)</p></li>
<li><p><b>音效</b>: 吃到食物 / 撞到時用 Web Audio 現場合成提示音, 不載入任何音訊檔</p></li>
<li><p><b>全螢幕</b>: 右上角「全螢幕」把棋盤鋪滿畫面, 按 <b>Esc</b> 或點「退出全螢幕」返回</p></li>
</ul>

<h2>設定</h2>
<ul>
<li><p>設定中心 → 遊戲 → 「貪吃蛇」裡可以修改 <b>預設速度</b>、<b>預設穿牆</b>、<b>預設障礙物</b> 與 <b>預設音效</b>, 還能一鍵清空最高分記錄</p></li>
<li><p>最高分只儲存在本機, 換裝置或清快取即遺失, 不會同步到任何伺服器</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Classic <b>Snake</b>: steer a growing snake to eat apples — hitting a wall, an obstacle or yourself ends the round. Four speed levels, <b>wrap-around</b>, <b>obstacles</b> and a timed <b>golden apple</b> are all supported, and the best score is stored locally. Everything runs locally: no network, no uploads.</p></blockquote>

<h2>Controls</h2>
<ul>
<li><p><b>Arrow keys</b> (or <b>W A S D</b>): turn — one queued turn is consumed per cell, so two quick presses make two corners (180° turns are rejected)</p></li>
<li><p><b>Space</b> / <b>Enter</b>: start / pause / resume; <b>P</b> or <b>Esc</b> also pauses</p></li>
<li><p>Phone / tablet: <b>swipe on the board</b> to turn, or tap the <b>D-pad</b> buttons on the right</p></li>
<li><p>The <b>speed</b> segment switches instantly between slow 280 ms, normal 200 ms, fast 150 ms and insane 110 ms per cell</p></li>
</ul>

<h2>Scoring</h2>
<ul>
<li><p>An <b>apple</b> is +10 points and grows the snake by one cell</p></li>
<li><p>A <b>golden apple</b> is +30 points, but it only stays on the board for <b>9 seconds</b> and then turns back into a normal apple</p></li>
<li><p>Higher difficulty does not multiply the score, but <b>wrap / obstacles / speed</b> are shown as tags so you can compare your own runs</p></li>
<li><p>Filling the board (no free cell left for food) means you <b>win</b></p></li>
</ul>

<h2>On screen</h2>
<ul>
<li><p><b>Wrap</b>: going off one edge re-enters from the opposite side instead of crashing</p></li>
<li><p><b>Walls</b>: adds 12 fixed obstacle cells, laid out when a round starts (switching mid-round applies to the next round)</p></li>
<li><p><b>Sound</b>: eating and crashing beeps are synthesised with Web Audio — no audio files are loaded</p></li>
<li><p><b>Fullscreen</b> (top-right button) fills the screen with the board; press <b>Esc</b> or click “Exit fullscreen” to go back</p></li>
</ul>

<h2>Settings</h2>
<ul>
<li><p>Settings → Games → “Snake” sets the <b>default speed</b>, <b>wrap</b>, <b>obstacles</b> and <b>sound</b> defaults, and can clear the best score</p></li>
<li><p>The best score lives only in the browser's localStorage — clearing the cache or switching devices loses it, and nothing is ever synced</p></li>
</ul>`;

const SnakeIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
};

export default SnakeIntro;
