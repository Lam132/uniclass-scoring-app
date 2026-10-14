# Bảng điều khiển chấm điểm GV Uniclass — bản chạy độc lập (Vercel)

Đây là bản viết lại để chạy **ngoài claude.ai**, dùng được làm link nội bộ
công ty qua Vercel. Khác với bản Artifact trên claude.ai (dùng
`window.claude`), bản này lưu dữ liệu thật vào **Postgres của Vercel**
(Vercel Storage, chạy nền bằng Neon) qua các API route của Next.js.

## Cấu trúc

- `public/index.html` — toàn bộ giao diện (HTML/CSS/JS gộp 1 file), gọi các
  API bên dưới bằng `fetch`.
- `pages/api/teachers.js` — CRUD danh sách giáo viên.
- `pages/api/evaluations.js` — lưu/đọc điểm đánh giá theo tháng.
- `pages/api/violations.js` — lưu/đọc/xoá vi phạm kỷ luật.
- `pages/api/auth.js` — đăng nhập/đăng xuất, cấp & kiểm tra phiên đăng nhập.
- `lib/auth.js` — tạo/ký/kiểm tra cookie phiên đăng nhập (HMAC, không cần
  thư viện ngoài).
- `lib/db.js` — kết nối Postgres + tự tạo bảng nếu chưa có.

## Phân quyền (Học thuật sửa / Giáo viên xem)

Bản này dùng **1 tài khoản chung** cho vai trò "Học thuật" (được sửa), đặt
qua 2 biến môi trường `ADMIN_USERNAME` và `ADMIN_PASSWORD`. Ai bấm vào huy
hiệu góc trên bên trái, nhập đúng tài khoản/mật khẩu sẽ được cấp một
**cookie phiên đăng nhập** (tự ký bằng HMAC, httpOnly, hết hạn sau 30 ngày)
— từ đó trình duyệt của họ ở chế độ "Chỉnh sửa (Học thuật)"; ai không đăng
nhập chỉ xem được. Mọi API ghi dữ liệu đều tự kiểm tra lại cookie này ở phía
máy chủ, không thể bỏ qua bằng cách sửa giao diện. Bấm lại vào huy hiệu khi
đang ở chế độ Học thuật sẽ đăng xuất (xoá cookie).

Đây vẫn là **1 tài khoản dùng chung** cho cả nhóm Học thuật, không phải tài
khoản riêng cho từng người (không ghi lại ai đã sửa gì). Nếu sau này cần
phân quyền theo từng người dùng thật (mỗi người một tài khoản/email riêng),
có thể nâng cấp thêm (NextAuth, Clerk...) — phần này chưa làm vì ngoài phạm
vi yêu cầu ban đầu.

## Các bước đẩy lên GitHub rồi deploy Vercel

### 1. Tạo repo GitHub

```bash
cd uniclass-scoring-vercel
git init
git add .
git commit -m "Uniclass teacher scoring app (standalone, Vercel + Postgres)"
```

Vào https://github.com/new, tạo một repo mới (ví dụ `uniclass-scoring-app`),
**không** tick "Add README" (để tránh xung đột), sau đó:

```bash
git remote add origin https://github.com/<tên-user-github>/uniclass-scoring-app.git
git branch -M main
git push -u origin main
```

(Nếu được hỏi đăng nhập, dùng tài khoản GitHub của bạn hoặc một Personal
Access Token.)

### 2. Tạo project trên Vercel từ repo đó

1. Vào https://vercel.com/new, chọn "Import Git Repository", chọn repo vừa tạo.
2. Vercel tự nhận đây là project Next.js — cứ để mặc định, bấm **Deploy**
   (lần đầu sẽ lỗi vì chưa có database/tài khoản đăng nhập, không sao, làm
   tiếp bước 3–4 rồi deploy lại).

### 3. Gắn Postgres (Vercel Storage / Neon)

1. Vào project vừa tạo → tab **Storage** → **Create Database** → chọn
   **Postgres** (hoặn **Neon**, tuỳ giao diện Vercel hiện tại) → tạo.
2. Vercel sẽ tự động thêm các biến môi trường `POSTGRES_URL`,
   `POSTGRES_URL_NON_POOLING`... vào project — **không cần tự nhập**.

### 4. Đặt tài khoản đăng nhập Học thuật

1. Vào **Settings → Environment Variables**.
2. Thêm biến `ADMIN_USERNAME`, giá trị là tên tài khoản (ví dụ `admin`).
3. Thêm biến `ADMIN_PASSWORD`, giá trị là mật khẩu bạn muốn đặt (ví dụ
   `123edu`), áp dụng cho cả Production/Preview/Development.
4. Lưu lại.

### 5. Deploy lại

Vào tab **Deployments**, bấm **Redeploy** cho lần deploy mới nhất (hoặc chỉ
cần push thêm 1 commit bất kỳ lên `main`, Vercel sẽ tự deploy lại). Sau khi
xong, Vercel cho bạn một link dạng `https://uniclass-scoring-app.vercel.app`
— đây là link nội bộ bạn có thể chia sẻ.

### 6. Dùng thử

- Mở link, mặc định mọi người thấy chế độ **Xem (Giáo viên)**.
- Người thuộc Học thuật bấm vào huy hiệu góc trên, nhập đúng
  `ADMIN_USERNAME`/`ADMIN_PASSWORD` để chuyển sang chế độ **Chỉnh sửa (Học
  thuật)** — phiên đăng nhập lưu trong cookie, dùng được 30 ngày, bấm lại
  huy hiệu để đăng xuất bất cứ lúc nào.
- Nhập danh sách giáo viên ở tab "Danh sách GV" (thủ công hoặc nhập Excel).

## Lưu ý

- Vì không có kênh realtime, trang **tự làm mới dữ liệu mỗi 25 giây** và
  ngay sau mỗi lần bạn tự lưu — nếu 2 người sửa cùng lúc, người lưu sau sẽ
  ghi đè, giống hệt hành vi bản Artifact trước đây.
- Toàn bộ công thức tính điểm, xếp hạng (A/B/C/D), và giới hạn do vi phạm
  kỷ luật được giữ nguyên y hệt bản trên claude.ai, theo đúng Tờ trình.
- Muốn đổi tài khoản/mật khẩu Học thuật chỉ cần sửa `ADMIN_USERNAME`/
  `ADMIN_PASSWORD` trên Vercel rồi Redeploy — không cần sửa code. Đổi
  `ADMIN_PASSWORD` cũng tự làm mọi phiên đăng nhập cũ (đang mở ở máy người
  khác) hết hiệu lực ngay.
