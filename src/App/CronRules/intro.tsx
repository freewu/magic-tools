const intro = `
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
`;

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
