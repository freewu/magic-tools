const intro = `
<h2>什么是 htpasswd 文件</h2>
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
</ul>
`;

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
