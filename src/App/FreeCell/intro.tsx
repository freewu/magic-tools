// 空档接龙说明 (帮助时间线 / 应用内说明区共用)
import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>经典纸牌 <b>空档接龙</b> (FreeCell): 52 张牌全部明牌摆成 <b>8 列</b>, 另配 <b>4 个自由格</b> 与 <b>4 个收集区</b>; 目标是把牌按花色从 <b>A 到 K</b> 依次收进收集区。空档接龙几乎每局都有解, 靠的是想清楚先腾哪张牌。全部在本地运行, 不联网、不上传任何数据。</p></blockquote>

<h2>牌面布局</h2>
<ul>
<li><p><b>牌桌</b>: 8 列, 前 4 列各 7 张、后 4 列各 6 张, 全部明牌</p></li>
<li><p><b>自由格</b>: 4 个, 每格只能临时存放 <b>1 张</b>牌</p></li>
<li><p><b>收集区</b>: 4 个, 每个只收 <b>同一花色</b>的牌, 从 A 开始依次向上, 收到 K 即该花色完成</p></li>
</ul>

<h2>移动规则</h2>
<ul>
<li><p><b>牌桌内</b>: 牌要放到比它 <b>大 1 且颜色相反</b>的牌上面 (红桃/方块 ↔ 黑桃/梅花); 空列可以放任意一张牌</p></li>
<li><p><b>进收集区</b>: 必须是该花色当前的点数 +1 (A 只能放到空收集区)</p></li>
<li><p><b>进自由格</b>: 一次只能放一张, 空格才行</p></li>
<li><p><b>多处移动</b>: 想把收集区的牌取回来重排也可以, 一次取一张</p></li>
</ul>

<h2>一次搬一叠 (多张移动)</h2>
<ul>
<li><p>牌桌上一段<b>连续降序异色</b>的牌可以整体搬走, 一次最多搬 <b>(空自由格 + 1) × 2<sup>空列数</sup></b> 张</p></li>
<li><p>例: 4 个自由格全空、有 2 个空列时, 一次最多搬 (4+1)×2² = 20 张</p></li>
<li><p>目标列本身是空列时它不能当周转位, 所以按「空列数 − 1」计算</p></li>
<li><p>设置里可以关掉多张移动, 变成只能一张一张搬 (经典硬核玩法)</p></li>
</ul>

<h2>操作</h2>
<ul>
<li><p><b>点击</b> 选中一张牌 (或一段连牌), 再 <b>点击目标列 / 自由格 / 收集区</b> 即可移动; 点自己一次取消选中</p></li>
<li><p><b>双击</b> 一张牌: 自动送到收集区, 送不进去就找能接住它的牌桌列, 再不行就放进空自由格</p></li>
<li><p><b>N</b> 新局 (随机局号)、<b>R</b> 重开本局、<b>Z</b> 撤销、<b>H</b> 提示、<b>A</b> 自动收牌、<b>Esc</b> 退出全屏</p></li>
<li><p><b>局号</b>: 1 ~ 1000000 之间任意数字, 相同局号必定发出相同牌局, 方便分享和复盘; 上次的局号会自动记住</p></li>
</ul>

<h2>自动收牌与提示</h2>
<ul>
<li><p><b>自动收牌</b>: 每次移动后自动把「安全牌」送上收集区。安全牌的判定: 牌值 ≤ 2, 或两个反色花色的收集区都已经到 牌值 − 1 (此时收上去绝不会堵死别的牌)</p></li>
<li><p>想手动控节奏可以在设置里关掉自动收牌, 需要时点「自动收牌」按钮一次收一遍</p></li>
<li><p><b>提示</b>: 会高亮一步可行移动 (优先上收, 其次牌桌之间搬牌, 最后才考虑退到自由格)</p></li>
<li><p>没有可走的牌时会提示「无路可走」, 这时可以撤销或重开本局 —— 撤销步数不限</p></li>
</ul>

<h2>成绩与设置</h2>
<ul>
<li><p>页面上显示 <b>用时</b>、<b>步数</b>、<b>已收牌数</b>, 以及通关次数 / 最快用时 / 最少步数</p></li>
<li><p>四个收集区都收满 K 即通关, 成绩只保存在本机, 换设备或清缓存即丢失</p></li>
<li><p>设置中心 → 游戏 → 「空档接龙」可以开关<b>自动收牌</b>、<b>多张移动</b>、<b>双击自动移牌</b>, 并一键清空战绩</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>經典紙牌 <b>新接龍</b> (FreeCell): 52 張牌全部翻開排成 <b>8 列</b>, 另配 <b>4 個自由格</b> 與 <b>4 個收集區</b>; 目標是把牌依花色從 <b>A 到 K</b> 依序收進收集區。新接龍幾乎每局都有解, 靠的是想清楚先騰哪張牌。全部在本機執行, 不連網、不上傳任何資料。</p></blockquote>

<h2>牌面配置</h2>
<ul>
<li><p><b>牌桌</b>: 8 列, 前 4 列各 7 張、後 4 列各 6 張, 全部翻開</p></li>
<li><p><b>自由格</b>: 4 個, 每格只能暫放 <b>1 張</b>牌</p></li>
<li><p><b>收集區</b>: 4 個, 每個只收 <b>同一花色</b>的牌, 從 A 開始依序往上, 收到 K 即該花色完成</p></li>
</ul>

<h2>移動規則</h2>
<ul>
<li><p><b>牌桌內</b>: 牌要放到比它 <b>大 1 且顏色相反</b>的牌上 (紅桃/方塊 ↔ 黑桃/梅花); 空列可以放任意一張牌</p></li>
<li><p><b>進收集區</b>: 必須是該花色目前點數 +1 (A 只能放到空收集區)</p></li>
<li><p><b>進自由格</b>: 一次只能放一張, 且必須是空格</p></li>
<li><p><b>取回</b>: 想把收集區的牌拿回來重排也可以, 一次取一張</p></li>
</ul>

<h2>一次搬一疊 (多張移動)</h2>
<ul>
<li><p>牌桌上一段<b>連續降序異色</b>的牌可以整段搬走, 一次最多搬 <b>(空自由格 + 1) × 2<sup>空列數</sup></b> 張</p></li>
<li><p>例: 4 個自由格全空、有 2 個空列時, 一次最多搬 (4+1)×2² = 20 張</p></li>
<li><p>目標列本身是空列時它不能當週轉位, 所以按「空列數 − 1」計算</p></li>
<li><p>設定裡可以關掉多張移動, 變成只能一張一張搬 (經典硬派玩法)</p></li>
</ul>

<h2>操作</h2>
<ul>
<li><p><b>點擊</b> 選中一張牌 (或一段連牌), 再 <b>點擊目標列 / 自由格 / 收集區</b> 即可移動; 再點自己一次取消選取</p></li>
<li><p><b>雙擊</b> 一張牌: 自動送到收集區, 送不進去就找能接住它的牌桌列, 再不行就放進空自由格</p></li>
<li><p><b>N</b> 新局 (隨機局號)、<b>R</b> 重開本局、<b>Z</b> 復原、<b>H</b> 提示、<b>A</b> 自動收牌、<b>Esc</b> 退出全螢幕</p></li>
<li><p><b>局號</b>: 1 ~ 1000000 之間任意數字, 相同局號必定發出相同牌局, 方便分享和復盤; 上次的局號會自動記住</p></li>
</ul>

<h2>自動收牌與提示</h2>
<ul>
<li><p><b>自動收牌</b>: 每次移動後自動把「安全牌」送上收集區。安全牌的判定: 牌值 ≤ 2, 或兩個反色花色的收集區都已經到 牌值 − 1 (此時收上去絕不會堵死別的牌)</p></li>
<li><p>想手動控節奏可以在設定裡關掉自動收牌, 需要時點「自動收牌」按鈕收一遍</p></li>
<li><p><b>提示</b>: 會高亮一步可行移動 (優先上收, 其次牌桌之間搬牌, 最後才考慮退到自由格)</p></li>
<li><p>沒有可走的牌時會提示「無路可走」, 這時可以復原或重開本局 —— 復原步數不限</p></li>
</ul>

<h2>成績與設定</h2>
<ul>
<li><p>頁面上顯示 <b>用時</b>、<b>步數</b>、<b>已收牌數</b>, 以及通關次數 / 最快用時 / 最少步數</p></li>
<li><p>四個收集區都收滿 K 即通關, 成績只儲存在本機, 換裝置或清快取即遺失</p></li>
<li><p>設定中心 → 遊戲 → 「新接龍」可以開關<b>自動收牌</b>、<b>多張移動</b>、<b>雙擊自動移牌</b>, 並一鍵清空戰績</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Classic <b>FreeCell</b> solitaire: all 52 cards are dealt face up into <b>8 tableau columns</b>, with <b>4 free cells</b> and <b>4 foundations</b>. The goal is to move every card, by suit, from <b>Ace to King</b> onto the foundations. Almost every FreeCell deal is solvable — the trick is planning which card to free first. Everything runs locally: no network, no uploads.</p></blockquote>

<h2>Layout</h2>
<ul>
<li><p><b>Tableau</b>: 8 columns — the first 4 hold 7 cards each, the last 4 hold 6 each, all face up</p></li>
<li><p><b>Free cells</b>: 4 slots, each holding a single card</p></li>
<li><p><b>Foundations</b>: 4 piles, one per <b>suit</b>, built from Ace upwards; reaching King completes that suit</p></li>
</ul>

<h2>Move rules</h2>
<ul>
<li><p><b>On the tableau</b>: a card goes onto a card that is <b>one rank higher and the opposite colour</b> (hearts/diamonds ↔ spades/clubs). Any single card may start an empty column</p></li>
<li><p><b>Onto a foundation</b>: must be the next rank of that suit (only an Ace may start an empty foundation)</p></li>
<li><p><b>Into a free cell</b>: one card at a time, and the slot must be empty</p></li>
<li><p><b>Taking back</b>: a card can also be taken off a foundation to rearrange, one at a time</p></li>
</ul>

<h2>Moving a sequence</h2>
<ul>
<li><p>A <b>descending, alternating-colour</b> run on the tableau moves as a unit; the maximum is <b>(empty free cells + 1) × 2<sup>empty columns</sup></b> cards</p></li>
<li><p>Example: 4 empty free cells and 2 empty columns allow (4+1)×2² = 20 cards in one move</p></li>
<li><p>When the destination itself is an empty column it cannot serve as a staging slot, so the empty-column count is reduced by one</p></li>
<li><p>Multi-card moves can be disabled in settings for the strict, one-card-at-a-time game</p></li>
</ul>

<h2>Controls</h2>
<ul>
<li><p><b>Click</b> a card (or a run) to select it, then <b>click the destination</b> column / free cell / foundation; clicking it again deselects</p></li>
<li><p><b>Double-click</b> a card: it goes to a foundation if possible, otherwise to a tableau column that accepts it, otherwise to an empty free cell</p></li>
<li><p><b>N</b> new deal (random number), <b>R</b> redeal, <b>Z</b> undo, <b>H</b> hint, <b>A</b> auto collect, <b>Esc</b> exit fullscreen</p></li>
<li><p><b>Deal number</b>: any value from 1 to 1,000,000; the same number always produces the same layout, so deals can be shared and replayed. The last deal is remembered</p></li>
</ul>

<h2>Auto collect &amp; hints</h2>
<ul>
<li><p><b>Auto collect</b> sends “safe” cards to the foundations after each move. A card is safe when its rank is 2 or lower, or when both opposite-colour foundations have reached rank − 1 (so playing it can never block another card)</p></li>
<li><p>Turn it off in settings to control the pace yourself; the “Auto collect” button then sweeps the safe cards on demand</p></li>
<li><p><b>Hint</b> highlights a legal move (foundation first, then tableau-to-tableau, then parking on a free cell)</p></li>
<li><p>When nothing can be moved the page says so — undo (unlimited) or redeal and try another plan</p></li>
</ul>

<h2>Stats &amp; settings</h2>
<ul>
<li><p>The page shows <b>time</b>, <b>moves</b>, <b>cards collected</b>, plus wins / fastest time / fewest moves</p></li>
<li><p>Filling all four foundations up to King wins the deal; records stay in local storage only, so clearing the cache or switching devices loses them</p></li>
<li><p>Settings → Games → “FreeCell” toggles <b>auto collect</b>, <b>multi-card moves</b> and <b>double-click auto move</b>, and clears the records</p></li>
</ul>`;

const FreeCellIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
};

export default FreeCellIntro;
