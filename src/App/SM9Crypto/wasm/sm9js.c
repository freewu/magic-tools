/*
 * sm9js.c --- GmSSL SM9 -> WebAssembly JS API shim
 *
 * SM9 实现来自 GmSSL (https://github.com/guanzhi/GmSSL, Apache-2.0),
 * 本文件只做一层薄封装, 把 GmSSL 的 "追加写缓冲区" 风格 API 包装成
 * 对 JavaScript 友好的形式:
 *
 *   - 调用方提供输出缓冲区与容量, 函数把输出长度写入 *outlen;
 *   - 成功返回 1, 失败返回 0 (细节见 GmSSL 的 error_print() 输出)。
 *
 * 密钥编码约定:
 *   - 主私钥/用户私钥 : GmSSL DER (GM/T 0080-2020 结构)
 *   - 加密主公钥      : 65  字节未压缩点 (04 || x || y)
 *   - 签名主公钥      : 129 字节未压缩点 (04 || x1 || x2 || y1 || y2)
 */

#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <stdlib.h>
#include <emscripten.h>

#include <gmssl/sm9.h>

#define SM9JS_MAX_DER_SIZE 1024

/*
 * GmSSL 的 rand_bytes() 默认从 /dev/urandom 读取, 在 WebAssembly 中不可用,
 * 因此替换为宿主环境的 CSPRNG (浏览器 crypto.getRandomValues)。
 */
EM_JS(int, sm9js_js_random, (uint8_t *buf, int len), {
	if (len < 0) {
		return 0;
	}
	var c = (typeof globalThis !== 'undefined' && globalThis.crypto) ? globalThis.crypto : null;
	if (!c || !c.getRandomValues) {
		return 0;
	}
	var off = 0;
	while (off < len) {
		var n = len - off;
		if (n > 65536) {
			n = 65536;
		}
		c.getRandomValues(new Uint8Array(HEAPU8.buffer, buf + off, n));
		off += n;
	}
	return 1;
});

int rand_bytes(uint8_t *buf, size_t len)
{
	if (!buf || !len) {
		return 0;
	}
	return sm9js_js_random(buf, (int)len);
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

static int copy_out(const uint8_t *buf, size_t n, uint8_t *out, size_t outbuf, size_t *outlen)
{
	if (n > outbuf) {
		return 0;
	}
	memcpy(out, buf, n);
	*outlen = n;
	return 1;
}

/* ------------------------------------------------------------------ */
/* SM9-Enc (加密): 主密钥 / 用户密钥                                    */
/* ------------------------------------------------------------------ */

int sm9js_enc_master_key_generate(uint8_t *out, size_t outbuf, size_t *outlen)
{
	SM9_ENC_MASTER_KEY msk;
	uint8_t der[SM9JS_MAX_DER_SIZE];
	uint8_t *p = der;
	size_t n = 0;

	if (sm9_enc_master_key_generate(&msk) != 1) {
		return 0;
	}
	if (sm9_enc_master_key_to_der(&msk, &p, &n) != 1) {
		return 0;
	}
	return copy_out(der, n, out, outbuf, outlen);
}

int sm9js_enc_master_key_extract(const uint8_t *mder, size_t mderlen,
	const uint8_t *id, size_t idlen,
	uint8_t *out, size_t outbuf, size_t *outlen)
{
	SM9_ENC_MASTER_KEY msk;
	SM9_ENC_KEY key;
	const uint8_t *in = mder;
	size_t inlen = mderlen;
	uint8_t der[SM9JS_MAX_DER_SIZE];
	uint8_t *p = der;
	size_t n = 0;

	if (sm9_enc_master_key_from_der(&msk, &in, &inlen) != 1) {
		return 0;
	}
	if (sm9_enc_master_key_extract_key(&msk, (const char *)id, idlen, &key) != 1) {
		return 0;
	}
	if (sm9_enc_key_to_der(&key, &p, &n) != 1) {
		return 0;
	}
	return copy_out(der, n, out, outbuf, outlen);
}

int sm9js_enc_master_key_public(const uint8_t *mder, size_t mderlen,
	uint8_t *out, size_t outbuf, size_t *outlen)
{
	SM9_ENC_MASTER_KEY msk;
	const uint8_t *in = mder;
	size_t inlen = mderlen;
	uint8_t buf[SM9_ENC_MASTER_PUBLIC_KEY_BYTES];
	uint8_t *p = buf;
	size_t n = 0;

	if (sm9_enc_master_key_from_der(&msk, &in, &inlen) != 1) {
		return 0;
	}
	if (sm9_enc_master_public_key_to_bytes(&msk, &p, &n) != 1) {
		return 0;
	}
	return copy_out(buf, n, out, outbuf, outlen);
}

/* SM9 加密: 明文长度上限为 SM9_MAX_PLAINTEXT_SIZE (255) 字节 */
static int enc_do_encrypt(const SM9_ENC_MASTER_KEY *mpk,
	const uint8_t *id, size_t idlen,
	const uint8_t *in, size_t inlen,
	uint8_t *out, size_t outbuf, size_t *outlen)
{
	uint8_t buf[SM9JS_MAX_DER_SIZE];
	size_t n = 0;

	if (inlen > SM9_MAX_PLAINTEXT_SIZE) {
		return 0;
	}
	if (sm9_encrypt(mpk, (const char *)id, idlen, in, inlen, buf, &n) != 1) {
		return 0;
	}
	return copy_out(buf, n, out, outbuf, outlen);
}

int sm9js_encrypt(const uint8_t *mder, size_t mderlen,
	const uint8_t *id, size_t idlen,
	const uint8_t *in, size_t inlen,
	uint8_t *out, size_t outbuf, size_t *outlen)
{
	SM9_ENC_MASTER_KEY msk;
	const uint8_t *p = mder;
	size_t n = mderlen;

	if (sm9_enc_master_key_from_der(&msk, &p, &n) != 1) {
		return 0;
	}
	return enc_do_encrypt(&msk, id, idlen, in, inlen, out, outbuf, outlen);
}

int sm9js_encrypt_with_public(const uint8_t *pk, size_t pklen,
	const uint8_t *id, size_t idlen,
	const uint8_t *in, size_t inlen,
	uint8_t *out, size_t outbuf, size_t *outlen)
{
	SM9_ENC_MASTER_KEY msk;
	const uint8_t *p = pk;
	size_t n = pklen;

	memset(&msk, 0, sizeof(msk));
	if (sm9_enc_master_public_key_from_bytes(&msk, &p, &n) != 1) {
		return 0;
	}
	return enc_do_encrypt(&msk, id, idlen, in, inlen, out, outbuf, outlen);
}

int sm9js_decrypt(const uint8_t *kder, size_t kderlen,
	const uint8_t *id, size_t idlen,
	const uint8_t *in, size_t inlen,
	uint8_t *out, size_t outbuf, size_t *outlen)
{
	SM9_ENC_KEY key;
	const uint8_t *p = kder;
	size_t n = kderlen;
	size_t m = 0;

	if (sm9_enc_key_from_der(&key, &p, &n) != 1) {
		return 0;
	}
	if (sm9_decrypt(&key, (const char *)id, idlen, in, inlen, out, &m) != 1) {
		return 0;
	}
	if (m > outbuf) {
		return 0;
	}
	*outlen = m;
	return 1;
}

/* ------------------------------------------------------------------ */
/* SM9-Sign (签名): 主密钥 / 用户密钥 / 签名 / 验签                     */
/* ------------------------------------------------------------------ */

int sm9js_sign_master_key_generate(uint8_t *out, size_t outbuf, size_t *outlen)
{
	SM9_SIGN_MASTER_KEY msk;
	uint8_t der[SM9JS_MAX_DER_SIZE];
	uint8_t *p = der;
	size_t n = 0;

	if (sm9_sign_master_key_generate(&msk) != 1) {
		return 0;
	}
	if (sm9_sign_master_key_to_der(&msk, &p, &n) != 1) {
		return 0;
	}
	return copy_out(der, n, out, outbuf, outlen);
}

int sm9js_sign_master_key_extract(const uint8_t *mder, size_t mderlen,
	const uint8_t *id, size_t idlen,
	uint8_t *out, size_t outbuf, size_t *outlen)
{
	SM9_SIGN_MASTER_KEY msk;
	SM9_SIGN_KEY key;
	const uint8_t *in = mder;
	size_t inlen = mderlen;
	uint8_t der[SM9JS_MAX_DER_SIZE];
	uint8_t *p = der;
	size_t n = 0;

	if (sm9_sign_master_key_from_der(&msk, &in, &inlen) != 1) {
		return 0;
	}
	if (sm9_sign_master_key_extract_key(&msk, (const char *)id, idlen, &key) != 1) {
		return 0;
	}
	if (sm9_sign_key_to_der(&key, &p, &n) != 1) {
		return 0;
	}
	return copy_out(der, n, out, outbuf, outlen);
}

int sm9js_sign_master_key_public(const uint8_t *mder, size_t mderlen,
	uint8_t *out, size_t outbuf, size_t *outlen)
{
	SM9_SIGN_MASTER_KEY msk;
	const uint8_t *in = mder;
	size_t inlen = mderlen;
	uint8_t buf[SM9_SIGN_MASTER_PUBLIC_KEY_BYTES];
	uint8_t *p = buf;
	size_t n = 0;

	if (sm9_sign_master_key_from_der(&msk, &in, &inlen) != 1) {
		return 0;
	}
	if (sm9_sign_master_public_key_to_bytes(&msk, &p, &n) != 1) {
		return 0;
	}
	return copy_out(buf, n, out, outbuf, outlen);
}

int sm9js_sign(const uint8_t *kder, size_t kderlen,
	const uint8_t *data, size_t datalen,
	uint8_t *out, size_t outbuf, size_t *outlen)
{
	SM9_SIGN_KEY key;
	SM9_SIGN_CTX ctx;
	const uint8_t *p = kder;
	size_t n = kderlen;
	uint8_t buf[SM9JS_MAX_DER_SIZE];
	size_t m = 0;

	if (sm9_sign_key_from_der(&key, &p, &n) != 1) {
		return 0;
	}
	if (sm9_sign_init(&ctx) != 1) {
		return 0;
	}
	if (sm9_sign_update(&ctx, data, datalen) != 1) {
		return 0;
	}
	if (sm9_sign_finish(&ctx, &key, buf, &m) != 1) {
		return 0;
	}
	return copy_out(buf, m, out, outbuf, outlen);
}

static int sign_do_verify(const SM9_SIGN_MASTER_KEY *mpk,
	const uint8_t *id, size_t idlen,
	const uint8_t *data, size_t datalen,
	const uint8_t *sig, size_t siglen)
{
	SM9_SIGN_CTX ctx;

	if (sm9_verify_init(&ctx) != 1) {
		return 0;
	}
	if (sm9_verify_update(&ctx, data, datalen) != 1) {
		return 0;
	}
	return sm9_verify_finish(&ctx, sig, siglen, mpk, (const char *)id, idlen) == 1 ? 1 : 0;
}

int sm9js_verify(const uint8_t *mder, size_t mderlen,
	const uint8_t *id, size_t idlen,
	const uint8_t *data, size_t datalen,
	const uint8_t *sig, size_t siglen)
{
	SM9_SIGN_MASTER_KEY msk;
	const uint8_t *p = mder;
	size_t n = mderlen;

	if (sm9_sign_master_key_from_der(&msk, &p, &n) != 1) {
		return 0;
	}
	return sign_do_verify(&msk, id, idlen, data, datalen, sig, siglen);
}

int sm9js_verify_with_public(const uint8_t *pk, size_t pklen,
	const uint8_t *id, size_t idlen,
	const uint8_t *data, size_t datalen,
	const uint8_t *sig, size_t siglen)
{
	SM9_SIGN_MASTER_KEY msk;
	const uint8_t *p = pk;
	size_t n = pklen;

	memset(&msk, 0, sizeof(msk));
	if (sm9_sign_master_public_key_from_bytes(&msk, &p, &n) != 1) {
		return 0;
	}
	return sign_do_verify(&msk, id, idlen, data, datalen, sig, siglen);
}

/* ------------------------------------------------------------------ */
/* misc                                                                */
/* ------------------------------------------------------------------ */

/* 自检: 填充 len 字节随机数, 成功返回 1 */
int sm9js_rand_test(uint8_t *out, size_t len)
{
	return rand_bytes(out, len) == 1 ? 1 : 0;
}

/*
 * 返回 GmSSL 的各项长度上限, 便于 JS 侧分配缓冲区:
 *   0: 明文上限   1: 密文(含 DER 包装)上限   2: 加密主公钥字节数
 *   3: 签名主公钥字节数   4: 签名 DER 上限   5: SM9_SIGN_CTX 大小
 */
int sm9js_limits(int which)
{
	switch (which) {
	case 0: return SM9_MAX_PLAINTEXT_SIZE;
	case 1: return SM9_MAX_CIPHERTEXT_SIZE;
	case 2: return SM9_ENC_MASTER_PUBLIC_KEY_BYTES;
	case 3: return SM9_SIGN_MASTER_PUBLIC_KEY_BYTES;
	case 4: return SM9_SIGNATURE_SIZE;
	case 5: return (int)sizeof(SM9_SIGN_CTX);
	default: return -1;
	}
}
