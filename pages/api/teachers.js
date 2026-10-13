const { sql, ensureSchema, checkEditPasscode } = require("../../lib/db");

function rowToTeacher(r) {
  return {
    id: r.id,
    name: r.name,
    subject: r.subject || "",
    phone: r.phone || "",
    email: r.email || "",
    start: r.start_date || "",
    level: r.level,
    updatedAt: r.updated_at,
  };
}

module.exports = async function handler(req, res) {
  try {
    await ensureSchema();

    if (req.method === "GET") {
      const { rows } = await sql`SELECT * FROM teachers ORDER BY name;`;
      res.status(200).json({ teachers: rows.map(rowToTeacher) });
      return;
    }

    if (req.method === "POST") {
      if (!checkEditPasscode(req)) {
        res.status(401).json({ error: "Cần mã truy cập Học thuật để ghi dữ liệu." });
        return;
      }
      const { id, name, subject, phone, email, start, level } = req.body || {};
      if (!id || !name) {
        res.status(400).json({ error: "Thiếu Mã GV hoặc Họ tên." });
        return;
      }
      const lvl = Number(level) || 1;
      await sql`
        INSERT INTO teachers (id, name, subject, phone, email, start_date, level, updated_at)
        VALUES (${id}, ${name}, ${subject || ""}, ${phone || ""}, ${email || ""}, ${start || ""}, ${lvl}, now())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          subject = EXCLUDED.subject,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          start_date = EXCLUDED.start_date,
          level = EXCLUDED.level,
          updated_at = now();
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
      await sql`DELETE FROM teachers WHERE id = ${id};`;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi máy chủ: " + (err && err.message) });
  }
};
