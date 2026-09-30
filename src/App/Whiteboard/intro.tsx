import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>一个**无限画布白板** (由开源的 <b>Excalidraw</b> 驱动) : 自由绘制矩形 / 椭圆 / 箭头 / 连线 / 文字 / 手绘线条, 支持橡皮擦、框选、对齐与图层、箭头吸附与文字绑定, 内置十余套手绘风格与深浅主题。**全部功能都在本机完成**: 画布自动保存在浏览器本地 (localStorage), 重新打开自动恢复; 不联网、不上传、无协作账号。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>打开即是一张空白画布, 直接绘制即可; 画布尺寸无限, 可拖动平移、滚轮缩放</p></li>
<li><p>左侧工具栏选工具 (选择 / 矩形 / 椭圆 / 菱形 / 箭头 / 线段 / 手绘 / 文字 …), 顶部可调颜色 / 粗细 / 填充; 选中元素可拖动、缩放、旋转、复制 (Ctrl/Cmd+C/V), 支持框选多选与编组</p></li>
<li><p><b>右上角菜单</b>保留本地操作: «打开文件» (读入 .excalidraw / 图片)、«导出图片» (PNG / SVG)、«导出文件» (.excalidraw / SVG + JSON)、«命令面板» (快捷搜索)、«搜索元素»、«清除画布»、«画布背景» 与 «主题» (浅 / 深色); 帮助、社交链接与协作入口已移除</p></li>
<li><p>画布会在停止操作片刻后<b>自动保存到本机浏览器</b>: 标题处有提示, 下次打开本工具自动恢复上次内容; 想清空重画, 用菜单里的«清除画布»即可</p></li>
<li><p>界面语言与深浅色自动跟随当前应用设置; 也可以打开右上角菜单手动切换主题</p></li>
</ul>

<h2>小贴士</h2>
<ul>
<li><p>文字工具点击画布输入, 支持换行与拖拽绑定到形状上; 箭头拖到别的形状边缘会自动吸附 (变蓝提示)</p></li>
<li><p>按住空格可临时切换为平移抓手, <code>Shift</code> 拖拽可保持比例绘制; 快捷键清单见菜单里的«命令面板»</p></li>
<li><p>数学公式 / 流程图 / 架构图都能画: 配合胶带、激光指针、手绘箭头等元素, 适合截图贴进文档或直接导出 PNG / SVG 嵌入 Markdown</p></li>
<li><p>「清除画布」也会清掉已保存的本地场景, 之后打开的将是全新空白画布</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>一個**無限畫布白板** (由開源的 <b>Excalidraw</b> 驅動) : 自由繪製矩形 / 橢圓 / 箭頭 / 連線 / 文字 / 手繪線條, 支援橡皮擦、框選、對齊與圖層、箭頭吸附與文字綁定, 內建十餘套手繪風格與深淺主題。**全部功能都在本機完成**: 畫布自動儲存在瀏覽器本機 (localStorage), 重新開啟自動恢復; 不連網、不上傳、無協作帳號。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>開啟即是一張空白畫布, 直接繪製即可; 畫布尺寸無限, 可拖曳平移、滾輪縮放</p></li>
<li><p>左側工具列選工具 (選取 / 矩形 / 橢圓 / 菱形 / 箭頭 / 線段 / 手繪 / 文字 …), 頂部可調顏色 / 粗細 / 填滿; 選中元素可拖曳、縮放、旋轉、複製 (Ctrl/Cmd+C/V), 支援框選多選與編組</p></li>
<li><p><b>右上角選單</b>保留本機操作: «開啟檔案» (讀入 .excalidraw / 圖片)、«匯出圖片» (PNG / SVG)、«匯出檔案» (.excalidraw / SVG + JSON)、«命令面板» (快捷搜尋)、«搜尋元素»、«清除畫布»、«畫布背景» 與 «主題» (淺 / 深色); 說明、社交連結與協作入口已移除</p></li>
<li><p>畫布會在停止操作片刻後<b>自動儲存到本機瀏覽器</b>: 標題處有提示, 下次開啟本工具自動恢復上次內容; 想清空重畫, 用選單裡的«清除畫布»即可</p></li>
<li><p>介面語言與深淺色自動跟隨目前應用設定; 也可以開啟右上角選單手動切換主題</p></li>
</ul>

<h2>小提示</h2>
<ul>
<li><p>文字工具點畫布輸入, 支援換行與拖曳綁定到形狀上; 箭頭拖到別的形狀邊緣會自動吸附 (變藍提示)</p></li>
<li><p>按住空白鍵可暫時切換為平移抓手, <code>Shift</code> 拖曳可保持比例繪製; 快捷鍵清單見選單裡的«命令面板»</p></li>
<li><p>數學公式 / 流程圖 / 架構圖都能畫: 配合膠帶、雷射指標、手繪箭頭等元素, 適合截圖貼進文件或直接匯出 PNG / SVG 嵌入 Markdown</p></li>
<li><p>「清除畫布」也會清掉已儲存的本機場景, 之後開啟的將是全新空白畫布</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>An <b>infinite-canvas whiteboard</b> powered by the open-source <b>Excalidraw</b>: draw rectangles, ellipses, arrows, lines, text and freehand strokes, with eraser, box selection, alignment and layers, arrow snapping and text binding, a dozen hand-drawn styles and light/dark themes. <b>Everything stays local</b>: the canvas autosaves to your browser (localStorage) and is restored the next time you open the tool — no network, no uploads, no collaboration accounts.</p></blockquote>

<h2>How to use</h2>
<ul>
<li><p>Open a blank canvas and start drawing; the canvas is unlimited, pan by dragging and zoom with the wheel</p></li>
<li><p>Pick a tool from the left toolbar (selection / rectangle / ellipse / diamond / arrow / line / freehand / text …) and tune colour, stroke width and fill at the top; selected elements can be dragged, resized, rotated and copied (Ctrl/Cmd+C/V), with multi-select and grouping</p></li>
<li><p>The <b>menu at the top right</b> keeps only local actions: «Open file» (.excalidraw / images), «Export image» (PNG / SVG), «Export file» (.excalidraw / SVG + JSON), «Command palette» (quick search), «Search element», «Clear canvas», «Canvas background» and «Theme» (light / dark); help, social links and collaboration entries have been removed</p></li>
<li><p>The canvas <b>autosaves to your browser</b> shortly after you stop drawing (see the note next to the title) and is restored next time; use «Clear canvas» in the menu to start from scratch</p></li>
<li><p>UI language and light/dark colour follow your app settings; you can also switch the theme manually from the menu</p></li>
</ul>

<h2>Tips</h2>
<ul>
<li><p>Click the canvas with the text tool to type (multi-line, draggable onto shapes); dragging an arrow near a shape snaps to its edge (blue hint)</p></li>
<li><p>Hold Space to pan temporarily, hold <code>Shift</code> while dragging to keep proportions; the shortcut list lives in the «Command palette» in the menu</p></li>
<li><p>Ideal for mind maps, flowcharts and architecture sketches: combine tape, laser pointer and freehand arrows, then screenshot it or export PNG / SVG to embed in Markdown</p></li>
<li><p>«Clear canvas» also clears the saved local scene, so the next open starts truly empty</p></li>
</ul>`;

const WhiteboardIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default WhiteboardIntro;