import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth/constants";

// CHỈ là bộ lọc nhanh: không có cookie thì chuyển về trang đăng nhập.
// KHÔNG phải lớp bảo vệ thật — việc kiểm tra session nằm ở requireAdmin()/getAdmin()
// trong từng trang, Server Action và API (middleware từng có lỗ hổng bypass).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!req.cookies.get(ADMIN_COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
