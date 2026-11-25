"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { burnVerify, verifyPassword } from "@/lib/auth/password";
import { createAdminSession, destroyAdminSession } from "@/lib/auth/admin";
import { clientIpHash, recordFailure, tooManyFailures } from "@/lib/security/rate-limit";

const schema = z.object({
  identifier: z.string().min(1).max(254),
  password: z.string().min(1).max(200),
});

const FAIL = "ADMIN_LOGIN_FAILED";

export async function adminLogin(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Thông tin không hợp lệ." };

  const identifier = parsed.data.identifier.trim().toLowerCase();
  const ipHash = await clientIpHash();

  if (await tooManyFailures(FAIL, identifier, ipHash)) {
    return { error: "Quá nhiều lần thử. Vui lòng thử lại sau 15 phút." };
  }

  // Chỉ tra bảng user_admin — tài khoản trong bảng users không thể đăng nhập ở đây.
  const admin = await db.userAdmin.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
  });

  let ok = false;
  if (admin) ok = await verifyPassword(admin.passwordHash, parsed.data.password);
  else await burnVerify(parsed.data.password);

  // Một thông báo chung cho mọi lỗi (sai mật khẩu, không tồn tại, bị khóa).
  if (!admin || !ok || admin.status !== "ACTIVE") {
    await recordFailure(FAIL, identifier, ipHash);
    return { error: "Sai thông tin đăng nhập." };
  }

  await createAdminSession(admin.id, (await headers()).get("user-agent") ?? undefined);
  await db.userAdmin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await db.activityLog.create({
    data: { actorType: "ADMIN", actorId: admin.id, action: "ADMIN_LOGIN", ipHash },
  });
  redirect("/admin");
}

export async function adminLogout() {
  await destroyAdminSession();
  redirect("/admin/login");
}
