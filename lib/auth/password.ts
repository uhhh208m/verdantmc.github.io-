import argon2 from "argon2";

// Tham số theo khuyến nghị OWASP cho Argon2id (19 MiB, t=2, p=1).
const OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export const hashPassword = (plain: string) => argon2.hash(plain, OPTIONS);

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

// Khi không tìm thấy tài khoản vẫn tốn thời gian băm tương đương,
// để kẻ tấn công không dò được username/email nào tồn tại qua thời gian phản hồi.
let dummyHash: Promise<string> | undefined;
export async function burnVerify(plain: string) {
  dummyHash ??= hashPassword("timing-equalizer");
  await verifyPassword(await dummyHash, plain);
}
