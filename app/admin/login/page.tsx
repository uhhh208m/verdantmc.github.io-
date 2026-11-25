"use client";

import { useActionState } from "react";
import { adminLogin } from "./actions";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLogin, {} as { error?: string });

  return (
    <main style={{ maxWidth: 360, margin: "10vh auto", fontFamily: "sans-serif" }}>
      <h1>QR Studio – Quản trị</h1>
      <form action={action} style={{ display: "grid", gap: 12 }}>
        <label>
          Username hoặc email
          <input name="identifier" autoComplete="username" required style={{ display: "block", width: "100%" }} />
        </label>
        <label>
          Mật khẩu
          <input name="password" type="password" autoComplete="current-password" required style={{ display: "block", width: "100%" }} />
        </label>
        {state.error && <p role="alert">{state.error}</p>}
        <button disabled={pending}>{pending ? "Đang đăng nhập…" : "Đăng nhập"}</button>
      </form>
    </main>
  );
}
