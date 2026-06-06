import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient, isSupabaseConfigured } from "@/lib/supabase";
import { updateSession } from "@/utils/supabase/middleware";

function isPublicDashboardPath(pathname: string): boolean {
  return (
    pathname === "/dashboard/demo" ||
    pathname.startsWith("/dashboard/demo/") ||
    pathname === "/dashboard/local" ||
    pathname.startsWith("/dashboard/local/")
  );
}

function isPublicOsPath(pathname: string): boolean {
  return pathname === "/os/auth/login" || pathname.startsWith("/os/auth/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isSupabaseConfigured()) {
    await updateSession(request);
  }

  const isDashboard = pathname.startsWith("/dashboard");
  const isOs = pathname.startsWith("/os");

  if (!isDashboard && !isOs) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (isOs) {
    if (!isSupabaseConfigured() || isPublicOsPath(pathname)) {
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
        redirectUrl.pathname = "/os/auth/login";
        redirectUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(redirectUrl);
      }
    } catch {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/os/auth/login";
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  }

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
  matcher: ["/dashboard/:path*", "/os", "/os/:path*"],
};
