import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient, isSupabaseConfigured } from "@/lib/supabase";
import { isOsDevAuthBypass } from "@/lib/os/auth/dev-bypass";
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

function mergeSessionCookies(target: NextResponse, source: NextResponse): NextResponse {
  source.cookies.getAll().forEach(({ name, value }) => {
    target.cookies.set(name, value);
  });
  return target;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (isSupabaseConfigured()) {
    const sessionResponse = await updateSession(request);
    response = mergeSessionCookies(response, sessionResponse);
  }

  const isDashboard = pathname.startsWith("/dashboard");
  const isOs = pathname.startsWith("/os");

  if (!isDashboard && !isOs) {
    return response;
  }

  if (isOs) {
    if (
      isOsDevAuthBypass() ||
      !isSupabaseConfigured() ||
      isPublicOsPath(pathname)
    ) {
      return response;
    }

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

      if (process.env.NODE_ENV === "development") {
        console.log("[os/proxy]", {
          pathname,
          userId: user?.id ?? null,
          email: user?.email ?? null,
        });
      }

      if (!user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/os/auth/login";
        redirectUrl.searchParams.set("next", pathname);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        return mergeSessionCookies(redirectResponse, response);
      }
    } catch {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/os/auth/login";
      const redirectResponse = NextResponse.redirect(redirectUrl);
      return mergeSessionCookies(redirectResponse, response);
    }

    return response;
  }

  if (!isSupabaseConfigured() || isPublicDashboardPath(pathname)) {
    return response;
  }

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
      const redirectResponse = NextResponse.redirect(redirectUrl);
      return mergeSessionCookies(redirectResponse, response);
    }
  } catch {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard/local";
    const redirectResponse = NextResponse.redirect(redirectUrl);
    return mergeSessionCookies(redirectResponse, response);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/os", "/os/:path*"],
};
