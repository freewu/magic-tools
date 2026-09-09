import { useLocale } from '../../hook/locale-context';

const zh = `
<h2>Cron 表达式</h2>
<blockquote><p>Cron 是 Linux/类 Unix 下定时任务的调度语法, 以空格分隔的若干「时间字段」描述触发时刻, 由 <code>crontab</code>、<code>systemd timer</code> 等工具解析。</p>
</blockquote>
<h2>字段说明</h2>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>位置</th><th>含义</th><th>取值范围</th><th>说明</th></tr>
<tr><td>1</td><td>秒</td><td>0-59</td><td>仅标准格式 (含秒的实现, 如 Quartz/部分调度器)</td></tr>
<tr><td>2</td><td>分</td><td>0-59</td><td> </td></tr>
<tr><td>3</td><td>时</td><td>0-23</td><td> </td></tr>
<tr><td>4</td><td>日</td><td>1-31</td><td> </td></tr>
<tr><td>5</td><td>月</td><td>1-12</td><td> </td></tr>
<tr><td>6</td><td>周</td><td>0-7</td><td>0 与 7 均代表周日; Linux 传统实现中 1=周一 … 6=周六</td></tr>
<tr><td>7</td><td>年</td><td>四位数</td><td>可选, 仅部分实现支持 (标准格式默认补 *)</td></tr>
</table>
<h2>语法片段</h2>
<ul>
<li><p><code>*</code> 任意值 &nbsp; <code>a-b</code> 区间 &nbsp; <code>*/n</code> 每隔 n 个 &nbsp; <code>a,b,c</code> 指定多个值</p></li>
<li><p>Linux <code>crontab</code> 只有 <b>分 时 日 月 周</b> 5 个字段, 不支持秒与年; 选择「Linux」格式后工具会自动隐藏秒与年的配置行</p></li>
<li><p>「日」与「周」同时被限制时, 不同实现存在「或」/「与」两种语义, 建议只限制其中一个</p></li>
</ul>
<h2>常见示例</h2>
<ul>
<li><p>每 5 分钟: <code>*/5 * * * *</code> (Linux) / <code>0 */5 * * * * *</code> (标准)</p></li>
<li><p>每天 03:30: <code>30 3 * * *</code> (Linux) / <code>0 30 3 * * * *</code> (标准)</p></li>
<li><p>每周一至周五 09:00: <code>0 9 * * 1-5</code> (Linux)</p></li>
<li><p>每月 1 日与 15 日 08:00: <code>0 8 1,15 * *</code> (Linux)</p></li>
</ul>
<h2>「解析」页签</h2>
<ul>
<li><p>在「解析」页签粘贴已有 cron 表达式并选择对应格式, 即可得到<b>逐字段中文解读</b>与<b>未来 10 次触发时间</b> (含星期与相对天数, 一键复制全部)；支持字段英文名 (JAN/DEC、MON-SUN) 与 */n、a-b、列表等写法</p></li>
<li><p>触发时间计算按 Vixie cron 语义:「日」与「周」同时受限按<b>或</b>匹配, 单限其一按该条件; 单个规则在 2024-2099 年内不可达 (如 2 月 30 日) 会给出提示</p></li>
</ul>
`;

const tw = `
<h2>Cron 表達式</h2>
<blockquote><p>Cron 是 Linux/類 Unix 下定時任務的排程語法, 以空格分隔的若干「時間欄位」描述觸發時刻, 由 <code>crontab</code>、<code>systemd timer</code> 等工具解析。</p>
</blockquote>
<h2>欄位說明</h2>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>位置</th><th>含義</th><th>取值範圍</th><th>說明</th></tr>
<tr><td>1</td><td>秒</td><td>0-59</td><td>僅標準格式 (含秒的實作, 如 Quartz/部分排程器)</td></tr>
<tr><td>2</td><td>分</td><td>0-59</td><td> </td></tr>
<tr><td>3</td><td>時</td><td>0-23</td><td> </td></tr>
<tr><td>4</td><td>日</td><td>1-31</td><td> </td></tr>
<tr><td>5</td><td>月</td><td>1-12</td><td> </td></tr>
<tr><td>6</td><td>週</td><td>0-7</td><td>0 與 7 均代表週日; Linux 傳統實作中 1=週一 … 6=週六</td></tr>
<tr><td>7</td><td>年</td><td>四位數</td><td>可選, 僅部分實作支援 (標準格式預設補 *)</td></tr>
</table>
<h2>語法片段</h2>
<ul>
<li><p><code>*</code> 任意值 &nbsp; <code>a-b</code> 區間 &nbsp; <code>*/n</code> 每隔 n 個 &nbsp; <code>a,b,c</code> 指定多個值</p></li>
<li><p>Linux <code>crontab</code> 只有 <b>分 時 日 月 週</b> 5 個欄位, 不支援秒與年; 選擇「Linux」格式後工具會自動隱藏秒與年的設定列</p></li>
<li><p>「日」與「週」同時被限制時, 不同實作存在「或」/「與」兩種語意, 建議只限制其中一個</p></li>
</ul>
<h2>常見範例</h2>
<ul>
<li><p>每 5 分鐘: <code>*/5 * * * *</code> (Linux) / <code>0 */5 * * * * *</code> (標準)</p></li>
<li><p>每天 03:30: <code>30 3 * * *</code> (Linux) / <code>0 30 3 * * * *</code> (標準)</p></li>
<li><p>每週一至週五 09:00: <code>0 9 * * 1-5</code> (Linux)</p></li>
<li><p>每月 1 日與 15 日 08:00: <code>0 8 1,15 * *</code> (Linux)</p></li>
</ul>
<h2>「解析」頁籤</h2>
<ul>
<li><p>在「解析」頁籤貼上已有 cron 表達式並選擇對應格式, 即可得到<b>逐欄位解讀</b>與<b>未來 10 次觸發時間</b> (含星期與相對天數, 一鍵複製全部)；支援欄位英文名 (JAN/DEC、MON-SUN) 與 */n、a-b、列表等寫法</p></li>
<li><p>觸發時間計算依 Vixie cron 語意:「日」與「週」同時受限按<b>或</b>匹配, 單限其一按該條件; 單一規則在 2024-2099 年內不可達 (如 2 月 30 日) 會給出提示</p></li>
</ul>
`;

const en = `
<h2>Cron expression</h2>
<blockquote><p>Cron is the scheduling syntax for timed tasks on Linux/Unix-like systems: a handful of whitespace-separated "time fields" describe when to fire, parsed by tools such as <code>crontab</code> and <code>systemd timer</code>.</p>
</blockquote>
<h2>Fields</h2>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>#</th><th>Field</th><th>Range</th><th>Notes</th></tr>
<tr><td>1</td><td>Second</td><td>0-59</td><td>Standard format only (implementations with seconds, e.g. Quartz / some schedulers)</td></tr>
<tr><td>2</td><td>Minute</td><td>0-59</td><td> </td></tr>
<tr><td>3</td><td>Hour</td><td>0-23</td><td> </td></tr>
<tr><td>4</td><td>Day of month</td><td>1-31</td><td> </td></tr>
<tr><td>5</td><td>Month</td><td>1-12</td><td> </td></tr>
<tr><td>6</td><td>Day of week</td><td>0-7</td><td>0 and 7 both mean Sunday; classic Linux uses 1=Monday … 6=Saturday</td></tr>
<tr><td>7</td><td>Year</td><td>4 digits</td><td>Optional; supported by some implementations (standard format fills in * by default)</td></tr>
</table>
<h2>Syntax pieces</h2>
<ul>
<li><p><code>*</code> any value &nbsp; <code>a-b</code> range &nbsp; <code>*/n</code> every n &nbsp; <code>a,b,c</code> specific values</p></li>
<li><p>Linux <code>crontab</code> only has the 5 fields <b>minute hour day month week</b> and does not support seconds or years; picking the "Linux" format hides those rows automatically.</p></li>
<li><p>When both "day of month" and "day of week" are restricted, implementations differ between OR / AND semantics — try to restrict only one of them.</p></li>
</ul>
<h2>Common examples</h2>
<ul>
<li><p>Every 5 minutes: <code>*/5 * * * *</code> (Linux) / <code>0 */5 * * * * *</code> (standard)</p></li>
<li><p>Every day at 03:30: <code>30 3 * * *</code> (Linux) / <code>0 30 3 * * * *</code> (standard)</p></li>
<li><p>Mon–Fri at 09:00: <code>0 9 * * 1-5</code> (Linux)</p></li>
<li><p>At 08:00 on the 1st and 15th: <code>0 8 1,15 * *</code> (Linux)</p></li>
</ul>
<h2>The "Parse" tab</h2>
<ul>
<li><p>Paste an existing cron expression in the "Parse" tab and pick the matching format to get a <b>field-by-field reading</b> and the <b>next 10 fire times</b> (with weekday and relative offset, copy all in one click); it understands field names (JAN/DEC, MON–SUN) plus */n, a-b and comma lists.</p></li>
<li><p>Fire-time calculation follows Vixie cron semantics: when both "day of month" and "day of week" are restricted they match with <b>OR</b>; a single restriction is used alone. A rule that can never fire within 2024–2099 (e.g. Feb 30) is flagged.</p></li>
</ul>
`;

const Intro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}
export default Intro;
