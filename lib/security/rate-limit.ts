import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

// Đếm lần đăng nhập thất bại ngay trong bảng activity_logs (PostgreSQL),
// nên hoạt động đúng cả trên serverless (Vercel) — không phụ thuộc bộ nhớ tiến trình.

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET chưa được cấu hình (>= 32 ký tự).");
  return s;
}

/** IP chỉ được lưu dưới dạng HMAC, không lưu IP gốc.
 *  Lưu ý: x-forwarded-for chỉ đáng tin khi chạy sau proxy của nền tảng (vd. Vercel). */
export async function clientIpHash() {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHmac("sha256", secret()).update(ip).digest("hex").slice(0, 32);
}

export async function tooManyFailures(
  action: string,
  identifier: string,
  ipHash: string,
  max = 5,
  windowMinutes = 15,
) {
  const since = new Date(Date.now() - windowMinutes * 60_000);
  const [byIdentifier, byIp] = await Promise.all([
    db.activityLog.count({ where: { action, entityId: identifier, createdAt: { gte: since } } }),
    db.activityLog.count({ where: { action, ipHash, createdAt: { gte: since } } }),
  ]);
  return byIdentifier >= max || byIp >= max * 4;
}

export const recordFailure = (action: string, identifier: string, ipHash: string) =>
  db.activityLog.create({
    data: { actorType: "ANONYMOUS", action, entityType: "login", entityId: identifier, ipHash },
  });
