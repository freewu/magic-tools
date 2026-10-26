// 蜘蛛纸牌说明 (帮助时间线 / 应用内说明区共用)
import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>经典纸牌 <b>蜘蛛纸牌</b> (Spider Solitaire): 两副牌共 <b>104 张</b>, 摆成 <b>10 列</b>牌桌, 剩下的 50 张放在牌堆里分 5 轮发。目标是把同一花色从 <b>K 到 A</b> 排成一条龙并收走, 收满 <b>8 组</b> 即通关。全部在本地运行, 不联网、不上传任何数据。</p></blockquote>

<h2>牌面布局</h2>
<ul>
<li><p><b>牌桌</b>: 10 列, 前 4 列各 6 张、后 6 列各 5 张; 只有每列最上面一张是明牌, 其余盖着</p></li>
<li><p><b>牌堆</b>: 开局剩下 50 张, 每轮给 10 列各发 1 张明牌, 共可发 5 轮</p></li>
<li><p><b>已收牌</b>: 收走的同花 K→A 组数, 收满 8 组通关</p></li>
<li><p><b>难度</b>: 一花色 (只有黑桃, 8 组) / 两花色 (黑桃 + 红桃, 各 4 组) / 四花色 (四种花色各 2 组, 最难)</p></li>
</ul>

<h2>移动规则</h2>
<ul>
<li><p>只有<b>同花色</b>且牌值<b>连续递减</b>的一组明牌才能整体搬动 (例如 ♠9 ♠8 ♠7); 混了花色就只能单张搬</p></li>
<li><p>落点必须比这组牌的第一张<b>大 1</b>, <b>花色不限</b> (♠7 可以放到任意花色的 8 上)</p></li>
<li><p><b>空列</b>可以放任何牌或任何一组连牌</p></li>
<li><p>搬走一张牌后, 若下面露出的是盖着的牌, 会自动翻开</p></li>
</ul>

<h2>收牌与发牌</h2>
<ul>
<li><p>某一列出现 <b>K→A 的同花顺</b> (13 张连续递减且花色相同) 时会自动收走, 计入「已收牌」</p></li>
<li><p>点 <b>发一轮牌</b> 或按 <b>D</b>: 10 列各补 1 张明牌, 消耗牌堆 10 张</p></li>
<li><p>经典规则: 牌桌上<b>有空列时不能发牌</b>; 想更宽松可在设置里关掉这个限制</p></li>
<li><p>发牌时机很关键 —— 牌堆是有限的, 把好牌留到确实需要的时候再发往往更容易过关</p></li>
</ul>

<h2>操作</h2>
<ul>
<li><p><b>拖动</b> 一张牌 (或一段同花连牌) 到目标列松手即可; 拖动时会高亮可以放下的位置, 放到不能接的地方会自动弹回</p></li>
<li><p><b>点击</b> 选中一张牌 (或一段连牌), 再 <b>点击目标列</b> 即可移动; 点自己一次取消选中</p></li>
<li><p><b>双击</b> 一张牌: 自动找一列能接住它的牌桌列放过去</p></li>
<li><p><b>N</b> 新局 (随机局号)、<b>R</b> 重开本局、<b>Z</b> 撤销、<b>H</b> 提示、<b>D</b> 发一轮牌、<b>C</b> 收牌、<b>Esc</b> 退出全屏</p></li>
<li><p><b>局号</b>: 1 ~ 1000000 之间任意数字, 相同局号 + 相同难度必定发出相同牌局, 方便分享和复盘; 上次的局号会自动记住</p></li>
</ul>

<h2>成绩与设置</h2>
<ul>
<li><p>页面显示 <b>用时</b>、<b>步数</b>、<b>已收牌</b>, 以及胜利次数 / 最快用时 / 最少步数</p></li>
<li><p>战绩只存在本机浏览器里, 清缓存或换设备就没了</p></li>
<li><p>设置 → 游戏 → 「蜘蛛纸牌」可以改 <b>默认难度</b>、<b>有空列时是否禁发</b>、<b>双击自动移牌</b>、<b>自动收走同花顺</b>, 还能清空战绩</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>經典紙牌 <b>蜘蛛紙牌</b> (Spider Solitaire): 兩副牌共 <b>104 張</b>, 擺成 <b>10 列</b>牌桌, 剩下的 50 張放在牌堆裡分 5 輪發。目標是把同一花色從 <b>K 到 A</b> 排成一條龍並收走, 收滿 <b>8 組</b> 即通關。全部在本機執行, 不連網、不上傳任何資料。</p></blockquote>

<h2>牌面配置</h2>
<ul>
<li><p><b>牌桌</b>: 10 列, 前 4 列各 6 張、後 6 列各 5 張; 只有每列最上面一張是明牌, 其餘蓋著</p></li>
<li><p><b>牌堆</b>: 開局剩下 50 張, 每輪給 10 列各發 1 張明牌, 共可發 5 輪</p></li>
<li><p><b>已收牌</b>: 收走的同花 K→A 組數, 收滿 8 組通關</p></li>
<li><p><b>難度</b>: 一花色 (只有黑桃, 8 組) / 兩花色 (黑桃 + 紅桃, 各 4 組) / 四花色 (四種花色各 2 組, 最難)</p></li>
</ul>

<h2>移動規則</h2>
<ul>
<li><p>只有<b>同花色</b>且牌值<b>連續遞減</b>的一組明牌才能整段搬動 (例如 ♠9 ♠8 ♠7); 混了花色就只能單張搬</p></li>
<li><p>落點必須比這組牌的第一張<b>大 1</b>, <b>花色不限</b> (♠7 可以放到任意花色的 8 上)</p></li>
<li><p><b>空列</b>可以放任何牌或任何一組連牌</p></li>
<li><p>搬走一張牌後, 若下面露出的是蓋著的牌, 會自動翻開</p></li>
</ul>

<h2>收牌與發牌</h2>
<ul>
<li><p>某一列出現 <b>K→A 的同花順</b> (13 張連續遞減且花色相同) 時會自動收走, 計入「已收牌」</p></li>
<li><p>點 <b>發一輪牌</b> 或按 <b>D</b>: 10 列各補 1 張明牌, 消耗牌堆 10 張</p></li>
<li><p>經典規則: 牌桌上<b>有空列時不能發牌</b>; 想更寬鬆可在設定裡關掉這個限制</p></li>
<li><p>發牌時機很關鍵 —— 牌堆是有限的, 把好牌留到確實需要的時候再發往往更容易過關</p></li>
</ul>

<h2>操作</h2>
<ul>
<li><p><b>拖動</b> 一張牌 (或一段同花連牌) 到目標列鬆手即可; 拖動時會高亮可以放下的位置, 放到不能接的地方會自動彈回</p></li>
<li><p><b>點擊</b> 選中一張牌 (或一段連牌), 再 <b>點擊目標列</b> 即可移動; 再點自己一次取消選取</p></li>
<li><p><b>雙擊</b> 一張牌: 自動找一列能接住它的牌桌列放過去</p></li>
<li><p><b>N</b> 新局 (隨機局號)、<b>R</b> 重開本局、<b>Z</b> 復原、<b>H</b> 提示、<b>D</b> 發一輪牌、<b>C</b> 收牌、<b>Esc</b> 退出全螢幕</p></li>
<li><p><b>局號</b>: 1 ~ 1000000 之間任意數字, 相同局號 + 相同難度必定發出相同牌局, 方便分享和復盤; 上次的局號會自動記住</p></li>
</ul>

<h2>成績與設定</h2>
<ul>
<li><p>頁面顯示 <b>用時</b>、<b>步數</b>、<b>已收牌</b>, 以及勝利次數 / 最快用時 / 最少步數</p></li>
<li><p>戰績只存在本機瀏覽器裡, 清快取或換裝置就沒了</p></li>
<li><p>設定 → 遊戲 → 「蜘蛛紙牌」可以改 <b>預設難度</b>、<b>有空列時是否禁發</b>、<b>雙擊自動移牌</b>、<b>自動收走同花順</b>, 還能清空戰績</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Classic <b>Spider Solitaire</b>: two decks (<b>104 cards</b>) are dealt into <b>10 tableau columns</b>, with the remaining 50 cards dealt from the stock in 5 rounds. Build same-suit runs from <b>King down to Ace</b> and clear them — collect <b>8 runs</b> to win. Everything runs locally; nothing is uploaded.</p></blockquote>

<h2>Layout</h2>
<ul>
<li><p><b>Tableau</b>: 10 columns — the first 4 hold 6 cards each, the other 6 hold 5. Only the top card of each column is face up</p></li>
<li><p><b>Stock</b>: 50 cards at the start; each round deals one face-up card to every column, so there are 5 deals</p></li>
<li><p><b>Completed</b>: how many same-suit King-to-Ace runs have been cleared — 8 wins the deal</p></li>
<li><p><b>Difficulty</b>: one suit (spades only, 8 runs) / two suits (spades + hearts, 4 each) / four suits (2 runs per suit, hardest)</p></li>
</ul>

<h2>Move rules</h2>
<ul>
<li><p>Only a <b>same-suit, consecutively descending</b> group of face-up cards can move as a unit (e.g. ♠9 ♠8 ♠7); mixed suits must move one card at a time</p></li>
<li><p>The destination must be exactly <b>one rank higher</b> than the first card being moved — <b>any suit</b> works (♠7 goes onto an 8 of any suit)</p></li>
<li><p>An <b>empty column</b> accepts any card or any run</p></li>
<li><p>When the last card of a column leaves, a face-down card underneath is flipped up automatically</p></li>
</ul>

<h2>Collecting &amp; dealing</h2>
<ul>
<li><p>A full <b>same-suit run from King down to Ace</b> (13 descending cards of one suit) is collected automatically and counted in “Completed”</p></li>
<li><p><b>Deal a row</b> (or press <b>D</b>) gives every column one face-up card and uses 10 cards of the stock</p></li>
<li><p>Classic rule: you may <b>not deal while a column is empty</b> — you can relax that in settings</p></li>
<li><p>Timing matters: the stock is limited, so saving deals for when you really need them usually wins more games</p></li>
</ul>

<h2>Controls</h2>
<ul>
<li><p><b>Drag</b> a card (or a same-suit run) onto a column and drop it — valid targets light up while dragging and an illegal drop bounces back</p></li>
<li><p><b>Click</b> a card (or run) to select it, then <b>click the destination</b> column; clicking it again deselects</p></li>
<li><p><b>Double-click</b> a card: it moves to the first column that accepts it</p></li>
<li><p><b>N</b> new deal (random number), <b>R</b> redeal, <b>Z</b> undo, <b>H</b> hint, <b>D</b> deal a row, <b>C</b> collect, <b>Esc</b> exit fullscreen</p></li>
<li><p><b>Deal number</b>: any value from 1 to 1,000,000; the same number with the same difficulty always produces the same layout, so deals can be shared and replayed. The last deal is remembered</p></li>
</ul>

<h2>Stats &amp; settings</h2>
<ul>
<li><p>The page shows <b>time</b>, <b>moves</b> and <b>completed runs</b>, plus wins / fastest time / fewest moves</p></li>
<li><p>Records stay in local storage only, so clearing the cache or switching devices loses them</p></li>
<li><p>Settings → Games → “Spider Solitaire” sets the <b>default difficulty</b>, <b>whether dealing needs a full board</b>, <b>double-click auto move</b> and <b>auto collect of completed runs</b>, and clears the records</p></li>
</ul>`;

const SpiderSolitaireIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
};

export default SpiderSolitaireIntro;
