import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminRole } from "@prisma/client";
import { db } from "@/lib/db";
import { ADMIN_COOKIE } from "./constants";

const TTL_MS = 8 * 60 * 60 * 1000; // phiên Admin hết hạn tuyệt đối sau 8 giờ
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function createAdminSession(adminId: string, userAgent?: string) {
  const jar = await cookies();

  // Chống session fixation: luôn cấp token MỚI khi đăng nhập, thu hồi token cũ nếu có.
  const old = jar.get(ADMIN_COOKIE)?.value;
  if (old) {
    await db.adminSession.updateMany({
      where: { tokenHash: sha256(old) },
      data: { revokedAt: new Date() },
    });
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.adminSession.create({
    data: { tokenHash: sha256(token), adminId, expiresAt, userAgent: userAgent?.slice(0, 300) },
  });

  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

/** Trả về Admin hợp lệ hoặc null. Dùng trong Route Handler / Server Action. */
export async function getAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const session = await db.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { admin: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.admin.status !== "ACTIVE") return null;
  return session.admin;
}

/** Gọi ở ĐẦU mỗi trang, layout, Server Action của khu vực Admin. */
export async function requireAdmin(role?: AdminRole) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (role && admin.role !== role) redirect("/admin");
  return admin;
}

export async function destroyAdminSession() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) {
    await db.adminSession.updateMany({
      where: { tokenHash: sha256(token) },
      data: { revokedAt: new Date() },
    });
  }
  jar.delete(ADMIN_COOKIE);
}

/** Thu hồi mọi phiên của một Admin (khóa tài khoản, nghi bị lộ mật khẩu...). */
export const revokeAllAdminSessions = (adminId: string) =>
  db.adminSession.updateMany({
    where: { adminId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
