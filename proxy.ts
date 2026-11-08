export { auth as proxy } from "@/lib/auth"

export const config = {
  matcher: [
    "/perfil/:path*",
    "/carteira/:path*",
    "/premio/:path*",
  ],
}