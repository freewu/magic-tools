// SM9 国密标识密码 (GM/T 0044-2016) — GmSSL WebAssembly 封装
//
// 实现来源: GmSSL v3.2.0 (C) 编译为 WebAssembly, 见 wasm/README.md 与
// scripts/build-gmssl-wasm.sh。wasm 在首次调用时懒加载 (Vite 会为 gmssl.wasm
// 生成带哈希的资源 URL, 通过 emscripten 的 locateFile 传入)。
//
// 密钥/数据编码 (与 GmSSL 一致, 界面上以 HEX 展示):
//   加密主私钥 (msk)  DER  约 104 B    加密主公钥 (mpk)  未压缩点 65 B
//   加密用户私钥 (usk) DER 约 204 B    签名主公钥 (smpk) 未压缩点 129 B
//   签名主私钥 (smsk) DER  约 170 B    密文 / 签名       DER
import createGmsslModule from './wasm/gmssl';
import type { GmsslModule } from './wasm/gmssl';
import wasmUrl from './wasm/gmssl.wasm?url';

/** GmSSL 中的长度上限 (见 wasm/sm9js.c 的 sm9js_limits) */
export const SM9_LIMITS = {
  /** 单个 SM9 分组的明文上限 (字节) */
  maxPlaintext: 255,
  /** 密文 DER 上限 (字节) */
  maxCiphertext: 367,
  /** 加密主公钥字节数 */
  encPublicKey: 65,
  /** 签名主公钥字节数 */
  signPublicKey: 129,
  /** 签名 DER 字节数 */
  signature: 104,
} as const;

/** wasm 侧输出缓冲区容量 (密文 DER 上限 367 B, 用户私钥 DER 204 B, 留足余量) */
const OUT_CAP = 1024;

const FAIL = 'SM9 运算失败: 密钥/ID/数据不匹配或参数不合法';

let modulePromise :Promise<GmsslModule> | null = null;

/**
 * 初始化 wasm 引擎 (幂等)。加载后做一次随机数自检: wasm 内需要宿主 CSPRNG,
 * 非安全上下文 (http 且非 localhost) 下 crypto.getRandomValues 不可用, 直接报错。
 */
export const initSm9 = () :Promise<GmsslModule> => {
  if (!modulePromise) {
    modulePromise = createGmsslModule({
      locateFile: (path) => (path.endsWith('.wasm') ? wasmUrl : path),
    }).then((m) => {
      const ptr = m._malloc(16);
      const ok = m._sm9js_rand_test(ptr, 16);
      m._free(ptr);
      if (ok !== 1) {
        throw new Error('当前环境不支持 crypto.getRandomValues (需要 HTTPS 或 localhost), 无法安全生成密钥');
      }
      return m;
    }).catch((e) => {
      // 失败后清空, 允许用户重试 (例如资源被拦截/网络恢复后再次点击)
      modulePromise = null;
      throw e;
    });
  }
  return modulePromise;
};

/** 仅测试用: 重置初始化状态 */
export const resetSm9 = () :void => { modulePromise = null; };

type Bytes = Uint8Array;

/** 保证 wasm 至少初始化一次 (modulePromise 已缓存, 不会重复加载) */
const ready = async () :Promise<{ m :GmsslModule }> => ({ m: await initSm9() });

/** 在 wasm 堆上准备入参 (返回扁平化的 ptr/len 参数与释放函数) */
const allocArgs = (m :GmsslModule, inputs :Bytes[]) => {
  const ptrs :number[] = [];
  const ptrList :number[] = [];
  for (const b of inputs) {
    const p = m._malloc(Math.max(1, b.length));
    ptrList.push(p);
    m.HEAPU8.set(b, p);
    ptrs.push(p, b.length);
  }
  return { ptrs, free: () => ptrList.forEach((p) => m._free(p)) };
};

/** 调用 "输出到调用方缓冲区" 形式的导出函数; 失败返回 null */
const callOut = (
  m :GmsslModule,
  fn :(...args :number[]) => number,
  inputs :Bytes[],
  cap = OUT_CAP,
) :Bytes | null => {
  const { ptrs, free } = allocArgs(m, inputs);
  const out = m._malloc(cap);
  const lenPtr = m._malloc(4);
  try {
    if (fn(...ptrs, out, cap, lenPtr) !== 1) return null;
    const len = m.HEAPU32[lenPtr >> 2];
    return m.HEAPU8.slice(out, out + len);
  } finally {
    free();
    m._free(out);
    m._free(lenPtr);
  }
};

/** 调用返回 0/1 的导出函数 (验签) */
const callBool = (m :GmsslModule, fn :(...args :number[]) => number, inputs :Bytes[]) :boolean => {
  const { ptrs, free } = allocArgs(m, inputs);
  try {
    return fn(...ptrs) === 1;
  } finally {
    free();
  }
};

const mustBytes = (r :Bytes | null, what :string) :Bytes => {
  if (r === null) throw new Error(`${FAIL} (${what})`);
  return r;
};

/** ID 统一按 UTF-8 编码 (GmSSL 侧只认字节) */
const enc = new TextEncoder();
const toBytes = (v :string | Bytes) :Bytes => (typeof v === 'string' ? enc.encode(v) : v);

// ------------------------------------------------------------------ //
// SM9-Enc (加密): 主密钥对 -> 用户私钥; 主公钥/主私钥加密, 用户私钥解密  //
// ------------------------------------------------------------------ //

/** 生成加密主密钥对: 返回主私钥 DER (约 104 B); 主公钥见 encMasterPublicKey */
export const encGenerateMasterKey = async () :Promise<Bytes> => {
  const { m } = await ready();
  return mustBytes(callOut(m, m._sm9js_enc_master_key_generate, [], 256), '生成加密主密钥');
};

/** 由加密主私钥 (DER) 导出加密主公钥 (65 B 未压缩点) */
export const encMasterPublicKey = async (masterDer :Bytes) :Promise<Bytes> => {
  const { m } = await ready();
  return mustBytes(callOut(m, m._sm9js_enc_master_key_public, [masterDer], 128), '导出加密主公钥');
};

/** 由加密主私钥 (DER) + ID 提取用户私钥 (DER, 约 204 B) */
export const encExtractUserKey = async (masterDer :Bytes, id :string | Bytes) :Promise<Bytes> => {
  const { m } = await ready();
  return mustBytes(callOut(m, m._sm9js_enc_master_key_extract, [masterDer, toBytes(id)], 512), '提取加密用户私钥');
};

/** SM9 加密 (用主私钥 DER), 明文 ≤ 255 字节 */
export const encryptWithMasterKey = async (masterDer :Bytes, id :string | Bytes, plain :Bytes) :Promise<Bytes> => {
  const { m } = await ready();
  return mustBytes(callOut(m, m._sm9js_encrypt, [masterDer, toBytes(id), plain], 512), '加密');
};

/** SM9 加密 (用主公钥 65 B), 明文 ≤ 255 字节 */
export const encryptWithPublicKey = async (publicKey :Bytes, id :string | Bytes, plain :Bytes) :Promise<Bytes> => {
  const { m } = await ready();
  return mustBytes(callOut(m, m._sm9js_encrypt_with_public, [publicKey, toBytes(id), plain], 512), '加密');
};

/** SM9 解密 (用户私钥 DER + ID + 密文 DER) */
export const decrypt = async (userKeyDer :Bytes, id :string | Bytes, cipher :Bytes) :Promise<Bytes> => {
  const { m } = await ready();
  return mustBytes(callOut(m, m._sm9js_decrypt, [userKeyDer, toBytes(id), cipher], 512), '解密');
};

// ------------------------------------------------------------------ //
// SM9-Sign (签名): 主密钥对 -> 用户私钥; 用户私钥签名, 主公钥/主私钥验签 //
// ------------------------------------------------------------------ //

/** 生成签名主密钥对: 返回主私钥 DER (约 170 B) */
export const signGenerateMasterKey = async () :Promise<Bytes> => {
  const { m } = await ready();
  return mustBytes(callOut(m, m._sm9js_sign_master_key_generate, [], 256), '生成签名主密钥');
};

/** 由签名主私钥 (DER) 导出签名主公钥 (129 B 未压缩点) */
export const signMasterPublicKey = async (masterDer :Bytes) :Promise<Bytes> => {
  const { m } = await ready();
  return mustBytes(callOut(m, m._sm9js_sign_master_key_public, [masterDer], 256), '导出签名主公钥');
};

/** 由签名主私钥 (DER) + ID 提取签名用户私钥 (DER, 约 204 B) */
export const signExtractUserKey = async (masterDer :Bytes, id :string | Bytes) :Promise<Bytes> => {
  const { m } = await ready();
  return mustBytes(callOut(m, m._sm9js_sign_master_key_extract, [masterDer, toBytes(id)], 512), '提取签名用户私钥');
};

/** SM9 签名 (用户私钥 DER + 数据), 返回签名 DER (104 B) */
export const sign = async (userKeyDer :Bytes, data :Bytes) :Promise<Bytes> => {
  const { m } = await ready();
  return mustBytes(callOut(m, m._sm9js_sign, [userKeyDer, data], 256), '签名');
};

/** SM9 验签 (签名主私钥 DER) */
export const verifyWithMasterKey = async (
  masterDer :Bytes, id :string | Bytes, data :Bytes, signature :Bytes,
) :Promise<boolean> => {
  const { m } = await ready();
  return callBool(m, m._sm9js_verify, [masterDer, toBytes(id), data, signature]);
};

/** SM9 验签 (签名主公钥 129 B) */
export const verifyWithPublicKey = async (
  publicKey :Bytes, id :string | Bytes, data :Bytes, signature :Bytes,
) :Promise<boolean> => {
  const { m } = await ready();
  return callBool(m, m._sm9js_verify_with_public, [publicKey, toBytes(id), data, signature]);
};

/** 引擎自检: wasm 是否加载成功且宿主 CSPRNG 可用 */
export const engineAvailable = async () :Promise<boolean> => {
  try {
    await initSm9();
    return true;
  } catch {
    return false;
  }
};
