// Cookie Admin và User dùng TÊN KHÁC NHAU và bảng session khác nhau.
// Tiền tố __Host- (production) bắt buộc Secure + path=/ và chặn subdomain ghi đè cookie.
const prod = process.env.NODE_ENV === "production";

export const ADMIN_COOKIE = prod ? "__Host-qrs_admin" : "qrs_admin";
export const USER_COOKIE = prod ? "__Host-qrs_user" : "qrs_user";
