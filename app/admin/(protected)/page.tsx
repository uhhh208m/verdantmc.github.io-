import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

export default async function AdminHome() {
  await requireAdmin(); // layout không đủ: mỗi trang tự kiểm tra lại

  const [users, admins, qrCodes, dynamicQr] = await Promise.all([
    db.user.count(),
    db.userAdmin.count(),
    db.qrCode.count(),
    db.qrCode.count({ where: { mode: "DYNAMIC" } }),
  ]);

  return (
    <ul>
      <li>Người dùng: {users}</li>
      <li>Admin: {admins}</li>
      <li>Mã QR: {qrCodes}</li>
      <li>Dynamic QR: {dynamicQr}</li>
    </ul>
  );
}
