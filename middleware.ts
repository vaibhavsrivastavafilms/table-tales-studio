import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient, isSupabaseConfigured } from "@/lib/supabase";

function isPublicDashboardPath(pathname: string): boolean {
  return (
    pathname === "/dashboard/demo" ||
    pathname.startsWith("/dashboard/demo/") ||
    pathname === "/dashboard/local" ||
    pathname.startsWith("/dashboard/local/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (!isSupabaseConfigured() || isPublicDashboardPath(pathname)) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  try {
    const supabase = await createMiddlewareClient(
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          set: (name, value) => {
            request.cookies.set(name, value);
          },
        },
      },
      {
        cookies: {
          set: (name, value, options) => {
            response.cookies.set(name, value, options);
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard/local";
      redirectUrl.searchParams.set("auth", "required");
      return NextResponse.redirect(redirectUrl);
    }
  } catch {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard/local";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
