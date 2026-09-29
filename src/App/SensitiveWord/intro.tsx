import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>把文案粘进来, 立刻标出其中的<b>平台敏感词 / 违规词</b>, 并按<b>高危 / 中危 / 低危</b>分级给出<b>替换建议</b>。词库分三个页签: <b>通用</b> (小红书 + 微信公众号的并集)、<b>小红书</b>、<b>微信公众号</b>; 检测全部在你的浏览器里完成, <b>文案不会上传</b>。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>把标题 / 正文 / 商品详情<b>粘贴</b>到输入框, 或点「<b>载入示例</b>」先看效果</p></li>
<li><p>输入框下方三张卡片显示三个词库各自的命中数量, 点卡片或页签即切换; 每个页签里是<b>命中高亮预览 + 命中明细表</b></p></li>
<li><p>明细表按<b>敏感词</b>汇总: 等级、次数、出现位置 (第几行第几字) 与<b>建议替换</b>; 点词后的复制按钮可单独取词, 便于批量替换</p></li>
<li><p>「<b>复制打码文本</b>」按<b>通用词库</b>把命中词替换成打码字符 (默认 <code>*</code>), 适合先跑一遍自动化再人工改写; 「<b>复制 / 保存检测报告</b>」导出一份中文报告留档</p></li>
<li><p>匹配选项 (宽松匹配 / 拉丁词边界 / 打码字符) 可在工具页临时调整; 默认值在「设置中心 → 其它 → 敏感词检测」里改</p></li>
</ul>

<h2>三个词库的区别</h2>
<ul>
<li><p><b>通用</b>: 小红书与微信公众号词库的并集, 用于发布前先做一遍全量自检</p></li>
<li><p><b>小红书</b>: 侧重<b>医疗 / 功效</b>宣称 (祛斑、美白、祛痘、医用…)、<b>站外导流</b> (微信、vx、加v、二维码、扫码、私我领福利、移步淘宝) 与<b>夸张网络用语</b> (yyds、绝绝子、闭眼买)</p></li>
<li><p><b>微信公众号</b>: 除广告法极限词与医疗功效外, 还有公众号特有的<b>诱导分享 / 导流</b> (集赞、转发领、分享到朋友圈、扫码加微信、点击领取) 与<b>涉赌</b>词 (赌博、博彩)</p></li>
</ul>

<h2>等级怎么用</h2>
<ul>
<li><p><b>高危</b>: 平台通常直接限流 / 删除 / 封号 (广告法极限词、医疗功效、站外导流、涉赌), 发布前务必改写</p></li>
<li><p><b>中危</b>: 容易被判定为诱导、夸大宣传 (仅限今日、最后一天、专家推荐、保本稳赚), 建议改写</p></li>
<li><p><b>低危</b>: 轻度营销夸张用词 (必入、闭眼买), 视平台风控宽严处理</p></li>
</ul>

<h2>匹配规则</h2>
<ul>
<li><p><b>宽松匹配</b> (默认开): 忽略空格、点、横线等间隔符与零宽字符, 并把全角字符折成半角 —— 因此「微 信」「ｖｘ」这类夹了间隔符 / 全角的绕过写法同样会被检出</p></li>
<li><p><b>拉丁词边界</b> (默认开): 纯字母数字词要求左右不是字母, 避免 <code>v</code> 命中 <code>version</code>、<code>qq</code> 命中 <code>qqmail</code>; 数字不算边界, 所以 <code>vx123456</code> 仍会命中 <code>vx</code></p></li>
<li><p>大小写不敏感: <code>VX</code> / <code>Vx</code> 与 <code>vx</code> 一样命中</p></li>
<li><p>同一处重叠命中会全部列出 (例如「最后一天」与「最」), 打码 / 高亮时按<b>最长命中</b>合并, 不会重复涂改</p></li>
</ul>

<h2>常见问题</h2>
<ul>
<li><p><b>为什么同一段文案两个平台结果不同?</b> 平台规则不同: 例如「集赞」是公众号明确禁止的诱导分享, 而「二维码 / 扫码」在小红书更容易被判站外导流</p></li>
<li><p><b>命中了一定会违规吗?</b> 不一定。词库是常见违规词的经验汇总, 平台会结合语境、资质与人工审核判断; 本工具帮你<b>在发布前把明显踩线的词挑出来</b>, 但不能保证一定通过审核</p></li>
<li><p><b>文案会上传吗?</b> 不会。检测在你的浏览器内存里完成, 断网也能用; 报告与打码文本都只在本地下载</p></li>
<li><p><b>匹配引擎是什么?</b> Aho-Corasick 多模式匹配 (与 Java 的 sensitive-word、JS 的 mint-filter 同思路) 本地实现: 每个词库只构建一次自动机, 之后线性扫过文本, 几万字也是毫秒级, 无需任何运行时依赖</p></li>
</ul>

<blockquote><p><b>免责说明</b>: 词库与替换建议为常见平台规则的经验整理, 平台规则会持续更新, 检测结果仅供发布前自检参考, 不构成法律意见, 也不代表平台的最终判定。</p></blockquote>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>把文案貼進來, 立刻標出其中的<b>平台敏感詞 / 違規詞</b>, 並按<b>高危 / 中危 / 低危</b>分級給出<b>替換建議</b>。詞庫分三個頁籤: <b>通用</b> (小紅書 + 微信公眾號的聯集)、<b>小紅書</b>、<b>微信公眾號</b>; 檢測全都在你的瀏覽器裡完成, <b>文案不會上傳</b>。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>把標題 / 內文 / 商品詳情<b>貼上</b>到輸入框, 或點「<b>載入範例</b>」先看效果</p></li>
<li><p>輸入框下方三張卡片顯示三個詞庫各自的命中數量, 點卡片或頁籤即切換; 每個頁籤裡是<b>命中高亮預覽 + 命中明細表</b></p></li>
<li><p>明細表按<b>敏感詞</b>彙總: 等級、次數、出現位置 (第幾行第幾字) 與<b>建議替換</b>; 點詞後的複製按鈕可單獨取詞, 便於批次替換</p></li>
<li><p>「<b>複製打碼文字</b>」按<b>通用詞庫</b>把命中詞換成打碼字元 (預設 <code>*</code>), 適合先跑一遍再人工改寫; 「<b>複製 / 儲存檢測報告</b>」匯出一份中文報告留檔</p></li>
<li><p>匹配選項 (寬鬆匹配 / 拉丁詞邊界 / 打碼字元) 可在工具頁臨時調整; 預設值在「設定中心 → 其他 → 敏感詞檢測」裡改</p></li>
</ul>

<h2>三個詞庫的差別</h2>
<ul>
<li><p><b>通用</b>: 小紅書與微信公眾號詞庫的聯集, 用於發布前先做一遍全量自檢</p></li>
<li><p><b>小紅書</b>: 側重<b>醫療 / 功效</b>宣稱 (祛斑、美白、祛痘、醫用…)、<b>站外導流</b> (微信、vx、加v、二維碼、掃碼、私我領福利、移步淘寶) 與<b>誇張網路用語</b> (yyds、絕絕子、閉眼買)</p></li>
<li><p><b>微信公眾號</b>: 除廣告法極限詞與醫療功效外, 還有公眾號特有的<b>誘導分享 / 導流</b> (集讚、轉發領、分享到朋友圈、掃碼加微信、點擊領取) 與<b>涉賭</b>詞 (賭博、博彩)</p></li>
</ul>

<h2>等級怎麼用</h2>
<ul>
<li><p><b>高危</b>: 平台通常直接限流 / 刪除 / 封號 (廣告法極限詞、醫療功效、站外導流、涉賭), 發布前務必改寫</p></li>
<li><p><b>中危</b>: 容易被判定為誘導、誇大宣傳 (僅限今日、最後一天、專家推薦、保本穩賺), 建議改寫</p></li>
<li><p><b>低危</b>: 輕度行銷誇張用詞 (必入、閉眼買), 視平台風控寬嚴處理</p></li>
</ul>

<h2>匹配規則</h2>
<ul>
<li><p><b>寬鬆匹配</b> (預設開): 忽略空格、點、橫線等間隔符與零寬字元, 並把全角字元折成半角 —— 因此「微 信」「ｖｘ」這類夾了間隔符 / 全角的繞過寫法同樣會被檢出</p></li>
<li><p><b>拉丁詞邊界</b> (預設開): 純英數字詞要求左右不是字母, 避免 <code>v</code> 命中 <code>version</code>、<code>qq</code> 命中 <code>qqmail</code>; 數字不算邊界, 所以 <code>vx123456</code> 仍會命中 <code>vx</code></p></li>
<li><p>大小寫不敏感: <code>VX</code> / <code>Vx</code> 與 <code>vx</code> 一樣命中</p></li>
<li><p>同一處重疊命中會全部列出 (例如「最後一天」與「最」), 打碼 / 高亮時按<b>最長命中</b>合併, 不會重複塗改</p></li>
</ul>

<h2>常見問題</h2>
<ul>
<li><p><b>為什麼同一段文案兩個平台結果不同?</b> 平台規則不同: 例如「集讚」是公眾號明確禁止的誘導分享, 而「二維碼 / 掃碼」在小紅書更容易被判站外導流</p></li>
<li><p><b>命中了一定會違規嗎?</b> 不一定。詞庫是常見違規詞的經驗彙總, 平台會結合語境、資質與人工審核判斷; 本工具幫你<b>在發布前把明顯踩線的詞挑出來</b>, 但不能保證一定通過審核</p></li>
<li><p><b>文案會上傳嗎?</b> 不會。檢測在你的瀏覽器記憶體裡完成, 斷網也能用; 報告與打碼文字都只在本機下載</p></li>
<li><p><b>匹配引擎是什麼?</b> Aho-Corasick 多模式匹配 (與 Java 的 sensitive-word、JS 的 mint-filter 同思路) 本機實作: 每個詞庫只建一次自動機, 之後線性掃過文字, 幾萬字也是毫秒級, 無需任何執行時依賴</p></li>
</ul>

<blockquote><p><b>免責說明</b>: 詞庫與替換建議為常見平台規則的經驗整理, 平台規則會持續更新, 檢測結果僅供發布前自檢參考, 不構成法律意見, 也不代表平台的最終判定。</p></blockquote>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Paste your copy and it immediately highlights <b>platform-sensitive words</b>, graded as <b>high / medium / low risk</b> with a <b>suggested rewrite</b> for each one. There are three word lists: <b>General</b> (Xiaohongshu + WeChat combined), <b>Xiaohongshu</b> and <b>WeChat Official Account</b>. Everything runs in your browser — <b>nothing is uploaded</b>.</p></blockquote>

<h2>How to use</h2>
<ul>
<li><p><b>Paste</b> a title, article or product description into the box, or click <b>Load sample</b> to see it in action</p></li>
<li><p>Three cards below the box show how many hits each word list found; click a card or a tab to switch. Each tab has a <b>highlighted preview</b> plus a <b>result table</b></p></li>
<li><p>The table groups hits by <b>word</b>: risk level, count, position (line and column) and the <b>suggested rewrite</b>; the copy button next to a word grabs it for a bulk replace</p></li>
<li><p><b>Copy masked text</b> replaces every hit from the <b>General</b> list with the mask character (default <code>*</code>) — handy before a manual rewrite. <b>Copy / Save report</b> exports a Chinese report for your records</p></li>
<li><p>Matching options (loose matching, Latin word boundary, mask character) can be tweaked per session; defaults live in <i>Settings → Misc → Sensitive word check</i></p></li>
</ul>

<h2>How the three lists differ</h2>
<ul>
<li><p><b>General</b>: the union of both platform lists — run this first for a full self-check</p></li>
<li><p><b>Xiaohongshu</b>: heavy on <b>medical / efficacy</b> claims (祛斑, 美白, 祛痘, 医用…), <b>off-platform diversion</b> (微信, vx, 加v, 二维码, 扫码, 私我领福利, 移步淘宝) and <b>exaggerated slang</b> (yyds, 绝绝子, 闭眼买)</p></li>
<li><p><b>WeChat Official Account</b>: adds the platform-specific <b>inducement / diversion</b> words (集赞, 转发领, 分享到朋友圈, 扫码加微信, 点击领取) and <b>gambling</b> terms (赌博, 博彩) on top of the advertising-law and medical words</p></li>
</ul>

<h2>Reading the risk levels</h2>
<ul>
<li><p><b>High</b>: usually throttled, removed or banned outright (superlatives banned by advertising law, medical claims, off-platform diversion, gambling) — rewrite before publishing</p></li>
<li><p><b>Medium</b>: often flagged as inducement or exaggeration (仅限今日, 最后一天, 专家推荐, 保本稳赚) — rewriting is recommended</p></li>
<li><p><b>Low</b>: mild marketing exaggeration (必入, 闭眼买) — handle according to how strict the platform is</p></li>
</ul>

<h2>Matching rules</h2>
<ul>
<li><p><b>Loose matching</b> (on by default): ignores spaces, dots, dashes and other separators plus zero-width characters, and folds full-width characters to half-width — so bypass tricks such as “微 信” or “ｖｘ” are still caught</p></li>
<li><p><b>Latin word boundary</b> (on by default): pure alphanumeric words must not be surrounded by letters, so <code>v</code> no longer matches inside <code>version</code> and <code>qq</code> not inside <code>qqmail</code>. Digits still count as a boundary, so <code>vx123456</code> does match <code>vx</code></p></li>
<li><p>Case-insensitive: <code>VX</code> and <code>Vx</code> match <code>vx</code></p></li>
<li><p>Overlapping hits are all listed (e.g. 「最后一天」 and 「最」), while masking / highlighting merges them into the <b>longest match</b> so nothing is painted twice</p></li>
</ul>

<h2>Troubleshooting</h2>
<ul>
<li><p><b>Why do the two platforms disagree on the same text?</b> Their rules differ: 集赞 is explicitly banned as inducement on WeChat, while 二维码 / 扫码 is more likely to be treated as off-platform diversion on Xiaohongshu</p></li>
<li><p><b>Does a hit mean I will be penalised?</b> Not necessarily. The lists summarise commonly flagged words; platforms also weigh context, credentials and human review. This tool helps you <b>spot the obvious risks before publishing</b>, but cannot guarantee approval</p></li>
<li><p><b>Is my copy uploaded?</b> No. Matching happens in browser memory and works offline; reports and masked text are only saved locally</p></li>
<li><p><b>What is the matching engine?</b> A locally implemented Aho-Corasick multi-pattern matcher (the same approach as Java's sensitive-word and JS's mint-filter): each list builds one automaton and the text is then scanned linearly, so even tens of thousands of characters finish in milliseconds with zero runtime dependencies</p></li>
</ul>

<blockquote><p><b>Disclaimer</b>: the word lists and rewrites summarise common platform rules. Rules change over time, the result is a pre-publish self-check only, and it is neither legal advice nor the platform's final decision.</p></blockquote>`;

const SensitiveWordIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default SensitiveWordIntro;
