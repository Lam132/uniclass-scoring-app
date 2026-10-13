// Lớp kết nối + khởi tạo bảng cho Vercel Postgres (Neon).
// @vercel/postgres tự đọc biến môi trường POSTGRES_URL do Vercel Storage
// (Neon) tự thêm vào project khi bạn gắn database qua tab Storage.
const { sql } = require("@vercel/postgres");

let initialized = false;

async function ensureSchema() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      start_date TEXT DEFAULT '',
      level INTEGER DEFAULT 1,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      quarter TEXT NOT NULL,
      role TEXT NOT NULL,
      scores JSONB DEFAULT '{}'::jsonb,
      notes JSONB DEFAULT '{}'::jsonb,
      qc_links JSONB DEFAULT '[]'::jsonb,
      evaluator TEXT DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS violations (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      quarter TEXT NOT NULL,
      level TEXT NOT NULL,
      description TEXT DEFAULT '',
      evaluator TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  initialized = true;
}

// Kiểm tra mã truy cập Học thuật gửi lên từ client (header x-edit-passcode).
// Nếu biến môi trường EDIT_PASSCODE chưa được cấu hình, mặc định CHẶN ghi
// (an toàn hơn là vô tình mở quyền ghi cho tất cả mọi người).
function checkEditPasscode(req) {
  const expected = process.env.EDIT_PASSCODE;
  if (!expected) return false;
  const got = req.headers["x-edit-passcode"];
  return typeof got === "string" && got === expected;
}

module.exports = { sql, ensureSchema, checkEditPasscode };
