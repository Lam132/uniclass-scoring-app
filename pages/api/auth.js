const { checkEditPasscode } = require("../../lib/db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { passcode } = req.body || {};
  const expected = process.env.EDIT_PASSCODE;
  if (!expected) {
    res.status(500).json({ error: "Server chưa cấu hình EDIT_PASSCODE." });
    return;
  }
  if (passcode === expected) {
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: "Mã truy cập không đúng." });
  }
};
