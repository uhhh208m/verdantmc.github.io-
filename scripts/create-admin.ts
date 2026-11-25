import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { z } from "zod";
import { db } from "../lib/db";
import { hashPassword } from "../lib/auth/password";

const schema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_.-]{3,32}$/, "Username 3-32 ký tự: a-z, 0-9, _ . -"),
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string().min(12, "Mật khẩu tối thiểu 12 ký tự").max(200),
});

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let buf = "";
    const onData = (chunk: string) => {
      for (const c of chunk) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(buf);
        }
        if (c === "\u0003") process.exit(1); // Ctrl+C
        if (c === "\u007f" || c === "\b") buf = buf.slice(0, -1);
        else buf += c;
      }
    };
    stdin.on("data", onData);
  });
}

async function readInput() {
  const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_USERNAME && ADMIN_EMAIL && ADMIN_PASSWORD) {
    return { username: ADMIN_USERNAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const username = await rl.question("Username: ");
  const email = await rl.question("Email: ");
  rl.close();
  const password = await askHidden("Mật khẩu: ");
  const confirm = await askHidden("Nhập lại mật khẩu: ");
  if (password !== confirm) throw new Error("Mật khẩu xác nhận không khớp.");
  return { username, email, password };
}

async function main() {
  const parsed = schema.safeParse(await readInput());
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  const { username, email, password } = parsed.data;

  const existing = await db.userAdmin.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existing) throw new Error("Username hoặc email Admin đã tồn tại.");

  const admin = await db.userAdmin.create({
    data: { username, email, passwordHash: await hashPassword(password), role: "SUPER_ADMIN" },
  });
  await db.activityLog.create({
    data: { actorType: "SYSTEM", action: "ADMIN_CREATED_CLI", entityType: "user_admin", entityId: admin.id },
  });
  console.log(`Đã tạo Super Admin "${username}". Đăng nhập tại /admin/login`);
}

main()
  .catch((e) => {
    console.error("Lỗi:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
