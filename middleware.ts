import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { PARTICIPANT_ROLES } from "@/lib/participant-roles";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin/sessions")) {
      const roomsPath = path.replace(/^\/admin\/sessions/, "/admin/rooms");
      return NextResponse.redirect(new URL(roomsPath, req.url));
    }

    if (path.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (
      (path.startsWith("/onboarding") || path.startsWith("/dashboard")) &&
      token?.role === "admin"
    ) {
      return NextResponse.redirect(new URL("/admin/rooms", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        if (path.startsWith("/admin")) {
          return token?.role === "admin";
        }

        if (path.startsWith("/onboarding") || path.startsWith("/dashboard")) {
          return (
            !!token?.role &&
            PARTICIPANT_ROLES.includes(token.role as (typeof PARTICIPANT_ROLES)[number])
          );
        }

        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/onboarding/:path*", "/dashboard/:path*"],
};
