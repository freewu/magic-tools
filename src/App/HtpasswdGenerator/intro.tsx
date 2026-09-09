import { useLocale } from '../../hook/locale-context';

const zh = `<h2>什么是 htpasswd 文件</h2>
<blockquote><p>htpasswd 是 Apache HTTP Server 提供的命令行工具, 用于维护 HTTP 基础认证 (Basic Auth) 的账号密码文件; Nginx 等其它 Web 服务器也可以直接使用该文件实现同样的认证。</p></blockquote>
<p>文件为纯文本, 每行一条记录, 格式: <code>用户名:密码哈希</code>。<br>
示例: <code>admin:$apr1$abc.defg$gGhyLLsOOo5nMIuohIrV.0</code></p>

<h2>四种加密方式对照</h2>
<ul>
<li><p><b>bcrypt ($2y$)</b> — 对应 <code>htpasswd -B</code>, 自带随机盐, 抗暴力破解能力最强, 推荐用于新密码</p></li>
<li><p><b>Apache MD5 ($apr1$)</b> — 对应 <code>htpasswd -m</code>, Apache 默认算法, 兼容性最好</p></li>
<li><p><b>SHA1 ({SHA})</b> — 对应 <code>htpasswd -s</code>, 无盐可加, 存在彩虹表风险, 仅用于兼容旧文件</p></li>
<li><p><b>明文</b> — 对应 <code>htpasswd -p</code>, 不推荐使用 (部分服务端编译时已禁用)</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>$apr1$ / bcrypt 每次生成都会使用<b>随机盐</b>, 因此同一密码多次生成结果不同属正常现象</p></li>
<li><p>用户名与密码均不能包含 <code>:</code> 或换行符 (文件以冒号分隔、按行存储)</p></li>
<li><p>bcrypt 只取密码前 72 字节</p></li>
<li><p>「保存为 .htpasswd 文件」会把当前记录写入 UTF-8 文本文件; 已有文件可直接在末尾追加新行</p></li>
<li><p>配置完成后可用命令 <code>htpasswd -vb .htpasswd 用户名 密码</code> 验证账号</p></li>
</ul>`;

const tw = `<h2>什麼是 htpasswd 檔案</h2>
<blockquote><p>htpasswd 是 Apache HTTP Server 提供的命令列工具, 用於維護 HTTP 基礎認證 (Basic Auth) 的帳號密碼檔; Nginx 等其他 Web 伺服器也可以直接使用該檔實現相同的認證。</p></blockquote>
<p>檔案為純文字, 每行一筆記錄, 格式: <code>使用者名稱:密碼雜湊</code>。<br>
範例: <code>admin:$apr1$abc.defg$gGhyLLsOOo5nMIuohIrV.0</code></p>

<h2>四種加密方式對照</h2>
<ul>
<li><p><b>bcrypt ($2y$)</b> — 對應 <code>htpasswd -B</code>, 內建隨機鹽, 抗暴力破解能力最強, 建議用於新密碼</p></li>
<li><p><b>Apache MD5 ($apr1$)</b> — 對應 <code>htpasswd -m</code>, Apache 預設演算法, 相容性最好</p></li>
<li><p><b>SHA1 ({SHA})</b> — 對應 <code>htpasswd -s</code>, 無法加鹽, 有彩虹表風險, 僅用於相容舊檔</p></li>
<li><p><b>明文</b> — 對應 <code>htpasswd -p</code>, 不建議使用 (部分伺服器編譯時已停用)</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>$apr1$ / bcrypt 每次產生都會使用<b>隨機鹽</b>, 因此同一密碼多次產生結果不同屬正常現象</p></li>
<li><p>使用者名稱與密碼皆不能包含 <code>:</code> 或換行符 (檔案以冒號分隔、按行儲存)</p></li>
<li><p>bcrypt 只取密碼前 72 位元組</p></li>
<li><p>「儲存為 .htpasswd 檔案」會把目前記錄寫入 UTF-8 文字檔; 已有檔案可直接在結尾追加新行</p></li>
<li><p>設定完成後可用指令 <code>htpasswd -vb .htpasswd 使用者名稱 密碼</code> 驗證帳號</p></li>
</ul>`;

const en = `<h2>What is an htpasswd file</h2>
<blockquote><p>htpasswd is a command-line tool shipped with Apache HTTP Server that maintains the account/password file used by HTTP Basic Auth; Nginx and other web servers can use the same file for identical authentication.</p></blockquote>
<p>The file is plain text, one record per line, formatted as <code>username:password-hash</code>.<br>
Example: <code>admin:$apr1$abc.defg$gGhyLLsOOo5nMIuohIrV.0</code></p>

<h2>Four encryption methods</h2>
<ul>
<li><p><b>bcrypt ($2y$)</b> — via <code>htpasswd -B</code>; embeds a random salt and offers the strongest brute-force resistance, recommended for new passwords</p></li>
<li><p><b>Apache MD5 ($apr1$)</b> — via <code>htpasswd -m</code>; the Apache default with the best compatibility</p></li>
<li><p><b>SHA1 ({SHA})</b> — via <code>htpasswd -s</code>; no salt available, rainbow-table risk, kept only for legacy file compatibility</p></li>
<li><p><b>Plain</b> — via <code>htpasswd -p</code>; not recommended (disabled at compile time on some servers)</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>$apr1$ / bcrypt use a <b>random salt</b> on every generation, so the same password producing different results each time is normal</p></li>
<li><p>The username and password must not contain <code>:</code> or line breaks (the file is colon-separated, one entry per line)</p></li>
<li><p>bcrypt only uses the first 72 bytes of the password</p></li>
<li><p>“Save as .htpasswd file” writes the current entry into a UTF-8 text file; existing files can simply append a new line at the end</p></li>
<li><p>After configuring, verify with <code>htpasswd -vb .htpasswd username password</code></p></li>
</ul>`;

const Intro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}

export default Intro;
