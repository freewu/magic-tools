import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>随机生成<b>唯一解的数独题</b>, 并按 A4 纸版式排好版, 点一下就能打印: 支持 <b>4 宫格</b> (4×4, 适合儿童入门)、<b>6 宫格</b> (6×6, 2 行 3 列宫)、<b>9 宫格</b> (9×9 标准数独); 难度分高 / 中 / 低三档, 可以选择只打印题目、只打印答案, 或者题目与答案都打印 (答案用<b>红色</b>数字标出)。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>选择「宫格」: 4 / 6 / 9 宫格 —— 每页会自动排布 4 个 (4 宫)、2 个 (6 宫, 上下排) 或 1 个 (9 宫)</p></li>
<li><p>选择「难度」: 高 / 中 / 低, 难度越高题目里保留的提示数越少</p></li>
<li><p>设置「页数」与「打印内容」(仅题目 / 仅答案 (红色) / 题目 + 答案), 右侧 A4 预览会实时刷新</p></li>
<li><p>点「🔄 重新生成」换一批新题; 点「🖨️ 打印 A4」打开系统打印对话框, 选择打印机 (或「另存为 PDF」) 即可</p></li>
</ul>

<h2>版式与难度说明</h2>
<ul>
<li><p>题目由「随机回溯生成完整解 → 中心对称挖空 → 校验唯一解」三步产生, <b>保证每道题只有唯一解</b>, 不会出现多解或需要猜的题</p></li>
<li><p>4 宫 4 个 / A4 一页, 6 宫上下 2 个 / A4 一页, 9 宫 1 个 / A4 一页; 宫与宫之间的粗线加粗, 打印后便于分辨</p></li>
<li><p>打印答案时, <b>题目原有提示数为黑色, 答案为新填的数字, 用红色</b>标出, 方便对照批改</p></li>
<li><p>提示数参考: 4 宫 低 10 / 中 8 / 高 6; 6 宫 低 22 / 中 17 / 高 13; 9 宫 低 45 / 中 34 / 高 26 (为保证唯一解, 实际提示数可能略多)</p></li>
<li><p>设置里可配置默认宫格 / 默认难度 / 默认页数 / 默认打印内容, 打开工具即生效</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>出题与排版全部在本地完成 (浏览器或桌面端 WebView), 不需要联网, 也不会保存任何数据</p></li>
<li><p>打印用的是系统打印对话框: 桌面端直接调用打印机, Web 版会在浏览器里打开打印预览, 也可以选择「另存为 PDF」留档</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>隨機產生<b>唯一解的數獨題</b>, 並依 A4 紙版式排好版, 點一下就能列印: 支援 <b>4 宮格</b> (4×4, 適合兒童入門)、<b>6 宮格</b> (6×6, 2 行 3 列宮)、<b>9 宮格</b> (9×9 標準數獨); 難度分高 / 中 / 低三檔, 可以選擇只列印題目、只列印答案, 或者題目與答案都列印 (答案用<b>紅色</b>數字標出)。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>選擇「宮格」: 4 / 6 / 9 宮格 —— 每頁會自動排布 4 個 (4 宮)、2 個 (6 宮, 上下排) 或 1 個 (9 宮)</p></li>
<li><p>選擇「難度」: 高 / 中 / 低, 難度越高題目裡保留的提示數越少</p></li>
<li><p>設定「頁數」與「列印內容」(僅題目 / 僅答案 (紅色) / 題目 + 答案), 右側 A4 預覽會即時更新</p></li>
<li><p>點「🔄 重新產生」換一批新題; 點「🖨️ 列印 A4」開啟系統列印對話框, 選擇印表機 (或「另存為 PDF」) 即可</p></li>
</ul>

<h2>版式與難度說明</h2>
<ul>
<li><p>題目由「隨機回溯產生完整解 → 中心對稱挖空 → 校驗唯一解」三步產生, <b>保證每道題只有唯一解</b>, 不會出現多解或需要猜的題</p></li>
<li><p>4 宮 4 個 / A4 一頁, 6 宮上下 2 個 / A4 一頁, 9 宮 1 個 / A4 一頁; 宮與宮之間的粗線加粗, 列印後便於分辨</p></li>
<li><p>列印答案時, <b>題目原有提示數為黑色, 答案為新填的數字, 用紅色</b>標出, 方便對照批改</p></li>
<li><p>提示數參考: 4 宮 低 10 / 中 8 / 高 6; 6 宮 低 22 / 中 17 / 高 13; 9 宮 低 45 / 中 34 / 高 26 (為保證唯一解, 實際提示數可能略多)</p></li>
<li><p>設定裡可配置預設宮格 / 預設難度 / 預設頁數 / 預設列印內容, 開啟工具即生效</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>出題與排版全部在本機完成 (瀏覽器或桌面端 WebView), 不需要連網, 也不會儲存任何資料</p></li>
<li><p>列印用的是系統列印對話框: 桌面端直接呼叫印表機, Web 版會在瀏覽器裡開啟列印預覽, 也可以選擇「另存為 PDF」留存</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Generate random <b>unique-solution sudoku puzzles</b>, laid out ready for A4 paper and printed in one click: <b>4×4</b> (great for kids), <b>6×6</b> (six 2×3 boxes) and <b>9×9</b> (classic sudoku). Pick a difficulty (easy / medium / hard) and print the puzzles only, the answers only, or both — answers are shown in <b>red</b>.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Choose the grid: 4 / 6 / 9 — each A4 page automatically holds 4 (4×4), 2 stacked (6×6) or 1 (9×9) puzzle</p></li>
<li><p>Choose the difficulty; harder puzzles keep fewer given clues</p></li>
<li><p>Set the number of pages and what to print (puzzle only / answers only (red) / puzzle + answers); the A4 preview updates instantly</p></li>
<li><p>Click "🔄 Regenerate" for a fresh set, then "🖨️ Print A4" to open the system print dialog and pick a printer (or "Save as PDF")</p></li>
</ul>

<h2>Layout and difficulty</h2>
<ul>
<li><p>Puzzles are built in three steps — randomized backtracking to a full solution, centre-symmetric hole digging, then a uniqueness check — so <b>every puzzle has exactly one solution</b> and never requires guessing</p></li>
<li><p>4×4 gives four puzzles per A4 page, 6×6 two stacked, 9×9 one; box borders are drawn thicker so they stay easy to read on paper</p></li>
<li><p>On answer pages the <b>original clues stay black while the filled-in answers are red</b>, which makes marking easy</p></li>
<li><p>Clue counts for reference: 4×4 easy 10 / medium 8 / hard 6; 6×6 22 / 17 / 13; 9×9 45 / 34 / 26 (a few extra clues may remain to keep the solution unique)</p></li>
<li><p>Settings let you configure the default grid, difficulty, page count and print content, applied as soon as the tool opens</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Generation and layout happen entirely offline in the local browser (or desktop WebView); nothing is uploaded or stored</p></li>
<li><p>Printing goes through the system print dialog: the desktop build talks to your printer directly, while the web build opens the browser print preview where you can also "Save as PDF"</p></li>
</ul>`;

const SudokuGeneratorIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default SudokuGeneratorIntro;
