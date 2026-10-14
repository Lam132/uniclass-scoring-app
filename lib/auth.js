// Đăng nhập Học thuật bằng tài khoản/mật khẩu (ADMIN_USERNAME / ADMIN_PASSWORD),
// phiên đăng nhập được giữ bằng 1 cookie httpOnly tự ký (HMAC), không cần
// thư viện ngoài, không cần thêm database.
const crypto = require("crypto");

const COOKIE_NAME = "uniclass_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret() {
  // Khoá ký phiên đăng nhập lấy từ chính ADMIN_PASSWORD (+ 1 chuỗi muối cố
  // định) để không cần cấu hình thêm biến môi trường nào khác. Đổi
  // ADMIN_PASSWORD trên Vercel sẽ tự làm mọi phiên đăng nhập cũ hết hiệu lực.
  const pw = process.env.ADMIN_PASSWORD || "";
  return crypto.createHash("sha256").update("uniclass-session-salt:" + pw).digest();
}

function sign(payloadObj) {
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return payload + "." + sig;
}

function verify(token) {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  if (sig.length !== expected.length) return null;
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!obj.exp || Date.now() > obj.exp) return null;
    return obj;
  } catch (e) {
    return null;
  }
}

function makeCookie(username, secure) {
  const token = sign({ u: username, exp: Date.now() + THIRTY_DAYS_MS });
  let cookie = `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${Math.floor(THIRTY_DAYS_MS / 1000)}; SameSite=Lax`;
  if (secure) cookie += "; Secure";
  return cookie;
}

function clearCookie(secure) {
  let cookie = `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
  if (secure) cookie += "; Secure";
  return cookie;
}

function checkSession(req) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  return !!verify(token);
}

function isHttps(req) {
  return req.headers["x-forwarded-proto"] === "https";
}

module.exports = { COOKIE_NAME, makeCookie, clearCookie, checkSession, isHttps };
