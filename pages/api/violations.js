const crypto = require("crypto");
const { sql, ensureSchema, checkEditPasscode } = require("../../lib/db");

function rowToViolation(r) {
  return {
    id: r.id,
    teacherId: r.teacher_id,
    quarter: r.quarter,
    level: r.level,
    desc: r.description || "",
    evaluator: r.evaluator || "",
    createdAt: r.created_at,
  };
}

module.exports = async function handler(req, res) {
  try {
    await ensureSchema();

    if (req.method === "GET") {
      const { rows } = await sql`SELECT * FROM violations ORDER BY created_at DESC;`;
      res.status(200).json({ violations: rows.map(rowToViolation) });
      return;
    }

    if (req.method === "POST") {
      if (!checkEditPasscode(req)) {
        res.status(401).json({ error: "Cần mã truy cập Học thuật để ghi dữ liệu." });
        return;
      }
      const { teacherId, quarter, level, desc, evaluator } = req.body || {};
      if (!teacherId || !quarter || !level) {
        res.status(400).json({ error: "Thiếu thông tin vi phạm." });
        return;
      }
      const id = crypto.randomUUID();
      await sql`
        INSERT INTO violations (id, teacher_id, quarter, level, description, evaluator, created_at)
        VALUES (${id}, ${teacherId}, ${quarter}, ${level}, ${desc || ""}, ${evaluator || ""}, now());
      `;
      res.status(200).json({ ok: true, id });
      return;
    }

    if (req.method === "DELETE") {
      if (!checkEditPasscode(req)) {
        res.status(401).json({ error: "Cần mã truy cập Học thuật để xoá dữ liệu." });
        return;
      }
      const id = req.query.id;
      if (!id) {
        res.status(400).json({ error: "Thiếu id." });
        return;
      }
      await sql`DELETE FROM violations WHERE id = ${id};`;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi máy chủ: " + (err && err.message) });
  }
};
