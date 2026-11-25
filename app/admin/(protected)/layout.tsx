import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { adminLogout } from "../login/actions";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>QR Studio Admin — {admin.username} ({admin.role})</strong>
        <form action={adminLogout}>
          <button>Đăng xuất</button>
        </form>
      </header>
      {children}
    </div>
  );
}
