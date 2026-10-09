//! ZUC (祖冲之) 序列密码 — WebAssembly 薄封装
//!
//! 算法实现来自 [`zuc`](https://github.com/Nugine/zuc) crate (MIT):
//!   * **ZUC-128**: GB/T 33133.1-2016 (即 128-EEA3, GB/T 33133.2-2021 的保密性算法)
//!   * **ZUC-256**: ZUC256-version1.1 (密钥 256 位 / IV 184 位)
//!
//! 本文件只做「JS 友好」的最小适配, 不实现任何密码学逻辑:
//!   1. 用 C ABI 暴露内存分配 / 释放 (`zuc_alloc` / `zuc_free`), 供 JS 写入明文与密钥;
//!   2. 暴露原地 XOR 密钥流接口 (`zuc128_apply` / `zuc256_apply`) —— 序列密码的加密与解密是
//!      同一个操作 (明文 XOR 密钥流 = 密文, 密文 XOR 同一密钥流 = 明文);
//!   3. 参数非法一律**返回负数**而不 panic (panic 会让 wasm 实例报废, 页面必须重新加载);
//!   4. 提供 `zuc_selftest` 用 GB/T 33133.1-2016 附录 A.1 的标准向量做引擎自检。
//!
//! 构建: `bash scripts/build-zuc-wasm.sh` (需要 `wasm32-unknown-unknown` target)。
//! 产物: `src/App/ZucCrypto/wasm/zuc.wasm`。

use std::alloc::{alloc, dealloc, Layout};
use std::slice;

use zuc::zuc128::zuc128_xor_inplace;
use zuc::zuc256::Zuc256Keystream;

/// ZUC-128 密钥长度 (字节, 128 位)
pub const KEY_LEN_128: usize = 16;
/// ZUC-128 IV 长度 (字节, 128 位)
pub const IV_LEN_128: usize = 16;
/// ZUC-256 密钥长度 (字节, 256 位)
pub const KEY_LEN_256: usize = 32;
/// ZUC-256 IV 长度 (字节, 184 位)
pub const IV_LEN_256: usize = 23;

/// 返回值: 成功
const OK: i32 = 0;
/// 返回值: 密钥长度不合法
const ERR_KEY_LEN: i32 = -1;
/// 返回值: IV 长度不合法
const ERR_IV_LEN: i32 = -2;
/// 返回值: 指针为空 (或数据长度为 0 但指针非空)
const ERR_PTR: i32 = -3;

/// 在 wasm 线性内存中分配 `len` 字节 (对齐 1), 返回指针。
///
/// `len == 0` 时按 1 字节分配, 便于 JS 侧「空数据」也能拿到一个合法指针;
/// 分配失败 (内存不足) 返回空指针。释放时必须用同一个 `len` 调 `zuc_free`。
#[no_mangle]
pub extern "C" fn zuc_alloc(len: usize) -> *mut u8 {
    let size = if len == 0 { 1 } else { len };
    match Layout::from_size_align(size, 1) {
        Ok(layout) => unsafe { alloc(layout) },
        Err(_) => std::ptr::null_mut(),
    }
}

/// 释放 `zuc_alloc` 分配的内存 (`len` 必须与分配时一致)。
#[no_mangle]
pub extern "C" fn zuc_free(ptr: *mut u8, len: usize) {
    if ptr.is_null() {
        return;
    }
    let size = if len == 0 { 1 } else { len };
    if let Ok(layout) = Layout::from_size_align(size, 1) {
        unsafe { dealloc(ptr, layout) };
    }
}

/// 长度查询: 供 JS 侧读取各算法的密钥 / IV 长度, 避免在 TS 里重复写死。
///
/// | which | 返回 |
/// |-------|------|
/// | 0 | ZUC-128 密钥长度 (16) |
/// | 1 | ZUC-128 IV 长度 (16) |
/// | 2 | ZUC-256 密钥长度 (32) |
/// | 3 | ZUC-256 IV 长度 (23) |
/// | 其它 | 0 (未知) |
#[no_mangle]
pub extern "C" fn zuc_limits(which: u32) -> u32 {
    match which {
        0 => KEY_LEN_128 as u32,
        1 => IV_LEN_128 as u32,
        2 => KEY_LEN_256 as u32,
        3 => IV_LEN_256 as u32,
        _ => 0,
    }
}

/// ZUC-128 (EEA3): 对 `data[0..data_len]` 原地 XOR 密钥流。
///
/// 加密与解密是同一调用。返回 0 成功, 负数见 `ERR_*` 常量。
///
/// # Safety
/// `key` / `iv` / `data` 必须指向 `zuc_alloc` 分配的、长度分别不小于
/// [`KEY_LEN_128`] / [`IV_LEN_128`] / `data_len` 的可写内存。
#[no_mangle]
pub extern "C" fn zuc128_apply(
    key: *const u8,
    key_len: usize,
    iv: *const u8,
    iv_len: usize,
    data: *mut u8,
    data_len: usize,
) -> i32 {
    if key_len != KEY_LEN_128 {
        return ERR_KEY_LEN;
    }
    if iv_len != IV_LEN_128 {
        return ERR_IV_LEN;
    }
    if key.is_null() || iv.is_null() || (data_len > 0 && data.is_null()) {
        return ERR_PTR;
    }

    // 定长密钥 / IV: 长度已校验, 按固定数组读取 (u8 数组对齐为 1)
    let key = unsafe { &*(key as *const [u8; KEY_LEN_128]) };
    let iv = unsafe { &*(iv as *const [u8; IV_LEN_128]) };
    let data = unsafe { slice::from_raw_parts_mut(data, data_len) };

    // bitlen 传满字节数, 表示整段数据都参与运算
    zuc128_xor_inplace(key, iv, data, data_len * 8);
    OK
}

/// ZUC-256: 对 `data[0..data_len]` 原地 XOR 密钥流 (加密 / 解密同一调用)。
///
/// 返回 0 成功, 负数见 `ERR_*` 常量。
///
/// # Safety
/// 同 [`zuc128_apply`], 但密钥 / IV 长度为 256 位 / 184 位。
#[no_mangle]
pub extern "C" fn zuc256_apply(
    key: *const u8,
    key_len: usize,
    iv: *const u8,
    iv_len: usize,
    data: *mut u8,
    data_len: usize,
) -> i32 {
    if key_len != KEY_LEN_256 {
        return ERR_KEY_LEN;
    }
    if iv_len != IV_LEN_256 {
        return ERR_IV_LEN;
    }
    if key.is_null() || iv.is_null() || (data_len > 0 && data.is_null()) {
        return ERR_PTR;
    }

    let key = unsafe { &*(key as *const [u8; KEY_LEN_256]) };
    let iv = unsafe { &*(iv as *const [u8; IV_LEN_256]) };
    let data = unsafe { slice::from_raw_parts_mut(data, data_len) };

    // ZUC256 与 ZUC128 一样逐 32 位字产生密钥流, 字按大端字节序异或到数据上
    // (zuc crate 未导出 zuc256 的 xor_inplace, 故此处按同一规则自行展开)
    let mut keystream = Zuc256Keystream::new(key, iv);
    let mut offset = 0;
    while offset + 4 <= data.len() {
        let word = keystream.generate().to_be_bytes();
        for i in 0..4 {
            data[offset + i] ^= word[i];
        }
        offset += 4;
    }
    if offset < data.len() {
        let word = keystream.generate().to_be_bytes();
        for i in 0..(data.len() - offset) {
            data[offset + i] ^= word[i];
        }
    }
    OK
}

/// 引擎自检: 用 GB/T 33133.1-2016 附录 A.1 的标准向量
/// (密钥、IV 全 0) 计算前 8 字节密钥流, 与标准值 `27 be de 74 01 80 82 da` 比对。
///
/// 返回 1 表示一致, 0 表示不一致。
#[no_mangle]
pub extern "C" fn zuc_selftest() -> i32 {
    const EXPECTED: [u8; 8] = [0x27, 0xbe, 0xde, 0x74, 0x01, 0x80, 0x82, 0xda];

    let key = [0u8; KEY_LEN_128];
    let iv = [0u8; IV_LEN_128];
    let mut buf = [0u8; 8];
    let bitlen = buf.len() * 8;
    zuc128_xor_inplace(&key, &iv, &mut buf, bitlen);

    if buf == EXPECTED {
        1
    } else {
        0
    }
}

/// 算法标识查询: 返回 "ZUC-128" / "ZUC-256" / "zuc" 的实现名 (供页面显示来源)。
///
/// | which | 返回 |
/// |-------|------|
/// | 0 | ZUC-128 标准号 (GB/T 33133.1-2016) |
/// | 1 | ZUC-256 规范版本 (ZUC256-version1.1) |
/// 其它返回值由 JS 侧读取: 写 UTF-8 到 `out` (容量 `cap`), 返回写入字节数。
#[no_mangle]
pub extern "C" fn zuc_spec(which: u32, out: *mut u8, cap: usize) -> usize {
    let text: &[u8] = match which {
        0 => b"GB/T 33133.1-2016",
        1 => b"ZUC256-version1.1",
        _ => b"",
    };
    if out.is_null() || text.len() > cap {
        return 0;
    }
    unsafe { std::ptr::copy_nonoverlapping(text.as_ptr(), out, text.len()) };
    text.len()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 走一遍 `zuc_alloc` / 指针 / `zuc128_apply` 的完整链路 (与 JS 侧调用方式一致)
    fn apply128(key: &[u8], iv: &[u8], data: &[u8]) -> Vec<u8> {
        let kp = zuc_alloc(key.len());
        let vp = zuc_alloc(iv.len());
        let dp = zuc_alloc(data.len());
        unsafe {
            std::ptr::copy_nonoverlapping(key.as_ptr(), kp, key.len());
            std::ptr::copy_nonoverlapping(iv.as_ptr(), vp, iv.len());
            std::ptr::copy_nonoverlapping(data.as_ptr(), dp, data.len());
        }
        assert_eq!(zuc128_apply(kp, key.len(), vp, iv.len(), dp, data.len()), OK);
        let out = unsafe { slice::from_raw_parts(dp, data.len()) }.to_vec();
        zuc_free(kp, key.len());
        zuc_free(vp, iv.len());
        zuc_free(dp, data.len());
        out
    }

    fn apply256(key: &[u8], iv: &[u8], data: &[u8]) -> Vec<u8> {
        let kp = zuc_alloc(key.len());
        let vp = zuc_alloc(iv.len());
        let dp = zuc_alloc(data.len());
        unsafe {
            std::ptr::copy_nonoverlapping(key.as_ptr(), kp, key.len());
            std::ptr::copy_nonoverlapping(iv.as_ptr(), vp, iv.len());
            std::ptr::copy_nonoverlapping(data.as_ptr(), dp, data.len());
        }
        assert_eq!(zuc256_apply(kp, key.len(), vp, iv.len(), dp, data.len()), OK);
        let out = unsafe { slice::from_raw_parts(dp, data.len()) }.to_vec();
        zuc_free(kp, key.len());
        zuc_free(vp, iv.len());
        zuc_free(dp, data.len());
        out
    }

    fn hex(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{b:02x}")).collect()
    }

    /// GB/T 33133.1-2016 附录 A 的三组标准向量 (密钥 / IV 定长, 明文取 8 个 0 字节)
    #[test]
    fn spec_vectors_zuc128() {
        let zeros = [0u8; 8];

        let a1 = apply128(&[0u8; 16], &[0u8; 16], &zeros);
        assert_eq!(hex(&a1), "27bede74018082da");

        let a2 = apply128(&[0xffu8; 16], &[0xffu8; 16], &zeros);
        assert_eq!(hex(&a2), "0657cfa07096398b");

        let k3: [u8; 16] = [
            0x3d, 0x4c, 0x4b, 0xe9, 0x6a, 0x82, 0xfd, 0xae, 0xb5, 0x8f, 0x64, 0x1d, 0xb1, 0x7b,
            0x45, 0x5b,
        ];
        let iv3: [u8; 16] = [
            0x84, 0x31, 0x9a, 0xa8, 0xde, 0x69, 0x15, 0xca, 0x1f, 0x6b, 0xda, 0x6b, 0xfb, 0xd8,
            0xc7, 0x66,
        ];
        let a3 = apply128(&k3, &iv3, &zeros);
        assert_eq!(hex(&a3), "14f1c2723279c419");
    }

    /// ZUC256-version1.1 附录标准向量 (密钥 / IV 全 0 与全 ff)
    #[test]
    fn spec_vector_zuc256() {
        let zeros = [0u8; 8];
        let out = apply256(&[0u8; 32], &[0u8; 23], &zeros);
        assert_eq!(hex(&out), "58d03ad62e032ce2");

        let out = apply256(&[0xffu8; 32], &[0xffu8; 23], &zeros);
        assert_eq!(hex(&out), "3356cbaed1a1c18b");
    }

    /// 加密与解密是对称的 (同一密钥流异或两次回到原文), 且支持非 4 字节整数倍长度
    #[test]
    fn roundtrip_and_partial_block() {
        let key: [u8; 16] = *b"0123456789abcdef";
        let iv: [u8; 16] = *b"fedcba9876543210";
        for len in [0usize, 1, 3, 4, 5, 17, 64] {
            let plain: Vec<u8> = (0..len).map(|i| (i as u8).wrapping_mul(37)).collect();
            let cipher = apply128(&key, &iv, &plain);
            if len > 0 {
                assert_ne!(hex(&cipher), hex(&plain));
            }
            assert_eq!(apply128(&key, &iv, &cipher), plain);

            let key256: [u8; 32] = [7u8; 32];
            let iv256: [u8; 23] = [9u8; 23];
            let cipher256 = apply256(&key256, &iv256, &plain);
            assert_eq!(apply256(&key256, &iv256, &cipher256), plain);
        }
    }

    /// 长度校验: 密钥 / IV 长度不符时返回负数而不是 panic
    #[test]
    fn rejects_bad_lengths() {
        let kp = zuc_alloc(16);
        let vp = zuc_alloc(16);
        let dp = zuc_alloc(8);
        assert_eq!(zuc128_apply(kp, 15, vp, 16, dp, 8), ERR_KEY_LEN);
        assert_eq!(zuc128_apply(kp, 16, vp, 17, dp, 8), ERR_IV_LEN);
        assert_eq!(zuc128_apply(kp, 16, vp, 16, std::ptr::null_mut(), 8), ERR_PTR);
        assert_eq!(zuc256_apply(kp, 16, vp, 16, dp, 8), ERR_KEY_LEN);
        zuc_free(kp, 16);
        zuc_free(vp, 16);
        zuc_free(dp, 8);
    }

    #[test]
    fn limits_and_selftest() {
        assert_eq!(zuc_limits(0), 16);
        assert_eq!(zuc_limits(1), 16);
        assert_eq!(zuc_limits(2), 32);
        assert_eq!(zuc_limits(3), 23);
        assert_eq!(zuc_limits(99), 0);
        assert_eq!(zuc_selftest(), 1);
    }

    #[test]
    fn spec_names() {
        let mut buf = [0u8; 32];
        let n = zuc_spec(0, buf.as_mut_ptr(), buf.len());
        assert_eq!(&buf[..n], b"GB/T 33133.1-2016");
        assert_eq!(zuc_spec(9, buf.as_mut_ptr(), buf.len()), 0);
        assert_eq!(zuc_spec(0, std::ptr::null_mut(), 32), 0);
    }
}
