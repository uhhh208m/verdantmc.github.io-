# QR Studio — lõi xác thực & database (scaffold)

Đây là **phần nền tảng bảo mật** của QR Studio: schema đầy đủ 12 bảng, Admin tách biệt (`user_admin`),
Argon2id, session riêng, chống brute-force, script tạo Admin. **Chưa chạy thử** — hãy làm theo các bước dưới.

## Chạy trên Windows
1. Cài **Node.js LTS (>= 20)** từ nodejs.org và **PostgreSQL** từ postgresql.org (nhớ mật khẩu user `postgres`).
2. Tạo database: mở *SQL Shell (psql)* → `CREATE DATABASE qr_studio;`
3. Trong thư mục dự án: `copy .env.example .env`, rồi sửa `DATABASE_URL`.
4. Tạo `AUTH_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` → dán vào `.env`.
5. `npm install`
6. `npx prisma migrate dev --name init` (tạo migration + bảng)
7. `npm run admin:create` (nhập username, email, mật khẩu >= 12 ký tự)
8. `npm run dev` → mở http://localhost:3000/admin/login

## Quy tắc bảo mật khi viết tiếp
- Mỗi trang/layout/Server Action/Route Handler của Admin **phải tự gọi** `requireAdmin()` (hoặc `getAdmin()` → trả 401). Middleware chỉ là bộ lọc nhanh.
- Chỉ truy vấn `db.user` cho User và `db.userAdmin` cho Admin; không bao giờ gộp.
- Mọi truy vấn dữ liệu của User phải có `where: { userId: session.user.id }`.
- Không ghi mật khẩu/token vào `activity_logs`.

## Deploy (tóm tắt)
GitHub → import vào Vercel → khai báo biến môi trường như `.env.example` → `npx prisma migrate deploy`
với `DATABASE_URL` production → chạy `npm run admin:create` một lần với `DATABASE_URL` production → xóa biến `ADMIN_*` nếu đã dùng.

## Trạng thái
| Đã có | Chưa có |
|---|---|
| Schema 12 bảng, Admin login/logout, session Admin, rate limit, tạo Admin CLI | Landing, đăng ký/đăng nhập User, QR Designer, tạo QR các loại, upload/Storage, Dynamic QR `/q/[code]`, thống kê, các trang Admin CRUD, test, CI, README deploy chi tiết |
