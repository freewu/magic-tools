// TcRules 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "tc 規則" },
  en: { appName: "tc Rules" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const tclangRows: Record<string, [string, string]> = {
  '网卡': ['網路卡', 'Interface'],
  '限速方式': ['限速方式', 'Mode'],
  '方向': ['方向', 'Direction'],
  'ifb 设备': ['ifb 裝置', 'ifb device'],
  '限速值': ['限速值', 'Rate'],
  '总带宽': ['總頻寬', 'Total bandwidth'],
  '峰值 (ceil)': ['峰值 (ceil)', 'Ceil'],
  '突发 (burst)': ['突發 (burst)', 'Burst'],
  '延迟 (latency)': ['延遲 (latency)', 'Latency'],
  '延迟 (ms)': ['延遲 (ms)', 'Delay (ms)'],
  '抖动 (ms)': ['抖動 (ms)', 'Jitter (ms)'],
  '丢包 (%)': ['丟包 (%)', 'Loss (%)'],
  '重复 (%)': ['重複 (%)', 'Duplicate (%)'],
  '损坏 (%)': ['損壞 (%)', 'Corrupt (%)'],
  '乱序 (%)': ['亂序 (%)', 'Reorder (%)'],
  '乱序间隔': ['亂序間隔', 'Gap'],
  '队列长度': ['佇列長度', 'Queue limit'],
  '分流条件': ['分流條件', 'Classify by'],
  '端口': ['連接埠', 'Port'],
  '目标 IP / 网段': ['目標 IP / 網段', 'Destination IP / CIDR'],
  '协议': ['協定', 'Protocol'],
  '限速类编号': ['限速類編號', 'Class id'],
  '默认类编号': ['預設類編號', 'Default class'],
  '优先级': ['優先級', 'Priority'],
  '根 handle': ['根 handle', 'Root handle'],
  '每个类挂 sfq 队列': ['每個類掛 sfq 佇列', 'Attach sfq to each class'],
  '场景示例': ['場景範例', 'Preset'],
  '请选择场景示例': ['請選擇場景範例', 'Select a preset'],
  '已应用示例: {name}': ['已套用範例: {name}', 'Preset applied: {name}'],
  '自动计算 (速率的 1%)': ['自動計算 (速率的 1%)', 'Auto (1% of rate)'],
  '默认延迟 400ms': ['預設延遲 400ms', 'Default 400ms'],
  '留空则等于限速值': ['留空則等於限速值', 'Empty = same as rate'],
  '留空则使用限速值': ['留空則使用限速值', 'Empty = use rate'],
  '生成指令': ['產生指令', 'Generate commands'],
  '重置': ['重設', 'Reset'],
  '添加 / 生效指令': ['新增 / 生效指令', 'Add / apply commands'],
  '查看指令': ['查看指令', 'Inspect commands'],
  '清除指令': ['清除指令', 'Cleanup commands'],
  '在需要撤销限速时执行, 全部带 || true 可重复执行': ['在需要撤銷限速時執行, 全部帶 || true 可重複執行', 'Run these to undo the shaping; they are idempotent (|| true)'],
  '复制': ['複製', 'Copy'],
  '点击复制': ['點擊複製', 'Click to copy'],
  '复制全部': ['複製全部', 'Copy all'],
  '保存为 .sh': ['儲存為 .sh', 'Save as .sh'],
  'Shell 脚本': ['Shell 指令碼', 'Shell script'],
  '复制到粘贴板成功!!!': ['複製到剪貼簿成功!!!', 'Copied to clipboard!!!'],
  '校验未通过, 请检查以下问题:': ['校驗未通過, 請檢查以下問題:', 'Validation failed, please check the following:'],
  '请填写网卡名称': ['請填寫網路卡名稱', 'Interface name is required'],
  '网卡名称只能包含字母, 数字, 点, 下划线, 冒号, @ 和减号': ['網路卡名稱只能包含字母, 數字, 點, 底線, 冒號, @ 和減號', 'Interface name may only contain letters, digits, dot, underscore, colon, @ and dash'],
  '入口方向需要填写 ifb 设备名': ['入口方向需要填寫 ifb 裝置名', 'Ingress mode requires an ifb device'],
  '限速方式不正确': ['限速方式不正確', 'Invalid mode'],
  '限速值必须是大于 0 的数字': ['限速值必須是大於 0 的數字', 'Rate must be a number greater than 0'],
  '峰值必须是大于 0 的数字': ['峰值必須是大於 0 的數字', 'Ceil must be a number greater than 0'],
  '总带宽必须是大于 0 的数字': ['總頻寬必須是大於 0 的數字', 'Total bandwidth must be a number greater than 0'],
  '限速值不能大于总带宽': ['限速值不能大於總頻寬', 'Rate cannot exceed total bandwidth'],
  '突发必须是大于 0 的数字': ['突發必須是大於 0 的數字', 'Burst must be a number greater than 0'],
  '延迟必须是大于 0 的数字': ['延遲必須是大於 0 的數字', 'Latency must be a number greater than 0'],
  '请至少填写一项 netem 参数 (延迟 / 丢包 / 重复 / 损坏 / 乱序)': ['請至少填寫一項 netem 參數 (延遲 / 丟包 / 重複 / 損壞 / 亂序)', 'Fill in at least one netem parameter (delay / loss / duplicate / corrupt / reorder)'],
  '抖动需要先设置延迟': ['抖動需要先設定延遲', 'Jitter requires a delay value'],
  '抖动必须是数字': ['抖動必須是數字', 'Jitter must be a number'],
  '丢包率必须在 0-100 之间': ['丟包率必須在 0-100 之間', 'Loss must be between 0 and 100'],
  '重复率必须在 0-100 之间': ['重複率必須在 0-100 之間', 'Duplicate must be between 0 and 100'],
  '损坏率必须在 0-100 之间': ['損壞率必須在 0-100 之間', 'Corrupt must be between 0 and 100'],
  '乱序率必须在 0-100 之间': ['亂序率必須在 0-100 之間', 'Reorder must be between 0 and 100'],
  '队列长度必须是数字': ['佇列長度必須是數字', 'Queue limit must be a number'],
  '乱序间隔必须是数字': ['亂序間隔必須是數字', 'Gap must be a number'],
  '类编号必须是 2-9999 的数字 (1 是根类)': ['類編號必須是 2-9999 的數字 (1 是根類)', 'Class id must be 2-9999 (1 is the root class)'],
  '默认类编号不合法': ['預設類編號不合法', 'Invalid default class id'],
  '默认类不能与限速类相同': ['預設類不能與限速類相同', 'Default class cannot equal the shaped class'],
  '端口必须是 1-65535': ['連接埠必須是 1-65535', 'Port must be 1-65535'],
  '协议不合法': ['協定不合法', 'Invalid protocol'],
  'IP / 网段格式不正确': ['IP / 網段格式不正確', 'Invalid IP / CIDR'],
  '优先级必须是数字': ['優先級必須是數字', 'Priority must be a number'],
  '需要 root 权限执行 (命令前加 sudo 或切换到 root)': ['需要 root 權限執行 (命令前加 sudo 或切換到 root)', 'Requires root (prefix with sudo or switch to root)'],
  'netem / tbf 作用于整张网卡, 无法只针对个别端口': ['netem / tbf 作用於整張網路卡, 無法只針對個別連接埠', 'netem / tbf apply to the whole interface — they cannot target individual ports'],
  '入口限速需要 ifb 内核模块, 重定向会略微增加 CPU 开销': ['入口限速需要 ifb 核心模組, 重定向會略微增加 CPU 開銷', 'Ingress shaping needs the ifb kernel module; redirection adds a little CPU overhead'],
  '只有 HTB 支持按条件分流, 其余方式只能限制整卡': ['只有 HTB 支援依條件分流, 其餘方式只能限制整卡', 'Only HTB can classify traffic; the other modes shape the whole interface'],
  'tc 规则重启后失效, 需写入开机脚本或 systemd 服务': ['tc 規則重開機後失效, 需寫入開機指令碼或 systemd 服務', 'tc rules are lost on reboot — add them to a startup script or systemd unit'],
};

// 取词: 无命中回退 zh 原文 (与项目其它语言包行为一致)
export const tcr = (locale: string, zh: string): string => {
  const e = tclangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const tcrT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = tcr(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
