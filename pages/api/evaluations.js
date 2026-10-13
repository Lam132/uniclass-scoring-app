const { sql, ensureSchema, checkEditPasscode } = require("../../lib/db");

function rowToEval(r) {
  return {
    id: r.id,
    teacherId: r.teacher_id,
    year: r.year,
    month: r.month,
    quarter: r.quarter,
    role: r.role,
    scores: r.scores || {},
    notes: r.notes || {},
    qcLinks: r.qc_links || [],
    evaluator: r.evaluator || "",
    updatedAt: r.updated_at,
  };
}

module.exports = async function handler(req, res) {
  try {
    await ensureSchema();

    if (req.method === "GET") {
      const { rows } = await sql`SELECT * FROM evaluations;`;
      res.status(200).json({ evaluations: rows.map(rowToEval) });
      return;
    }

    if (req.method === "POST") {
      if (!checkEditPasscode(req)) {
        res.status(401).json({ error: "Cần mã truy cập Học thuật để ghi dữ liệu." });
        return;
      }
      const { id, teacherId, year, month, quarter, role, scores, notes, qcLinks, evaluator } = req.body || {};
      if (!id || !teacherId || !quarter || !role) {
        res.status(400).json({ error: "Thiếu thông tin đánh giá." });
        return;
      }
      await sql`
        INSERT INTO evaluations (id, teacher_id, year, month, quarter, role, scores, notes, qc_links, evaluator, updated_at)
        VALUES (${id}, ${teacherId}, ${Number(year)}, ${Number(month)}, ${quarter}, ${role},
                ${JSON.stringify(scores || {})}::jsonb, ${JSON.stringify(notes || {})}::jsonb,
                ${JSON.stringify(qcLinks || [])}::jsonb, ${evaluator || ""}, now())
        ON CONFLICT (id) DO UPDATE SET
          teacher_id = EXCLUDED.teacher_id,
          year = EXCLUDED.year,
          month = EXCLUDED.month,
          quarter = EXCLUDED.quarter,
          role = EXCLUDED.role,
          scores = EXCLUDED.scores,
          notes = EXCLUDED.notes,
          qc_links = EXCLUDED.qc_links,
          evaluator = EXCLUDED.evaluator,
          updated_at = now();
      `;
      res.status(200).json({ ok: true, id });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi máy chủ: " + (err && err.message) });
  }
};
