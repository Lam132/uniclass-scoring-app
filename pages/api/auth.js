const { makeCookie, clearCookie, checkSession, isHttps } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json({ authenticated: checkSession(req) });
    return;
  }

  if (req.method === "POST") {
    const { username, password } = req.body || {};
    const expectedUser = process.env.ADMIN_USERNAME || "admin";
    const expectedPass = process.env.ADMIN_PASSWORD;
    if (!expectedPass) {
      res.status(500).json({ error: "Server chưa cấu hình ADMIN_PASSWORD." });
      return;
    }
    if (username === expectedUser && password === expectedPass) {
      res.setHeader("Set-Cookie", makeCookie(username, isHttps(req)));
      res.status(200).json({ ok: true });
    } else {
      res.status(401).json({ ok: false, error: "Sai tài khoản hoặc mật khẩu." });
    }
    return;
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearCookie(isHttps(req)));
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
