import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    }
  );

  // Awaiting getUser() refreshes the session cookie if it is expired
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  console.log(`[MIDDLEWARE LOG] Path: ${pathname} | User: ${user?.email ?? "None"} | Cookies:`, request.cookies.getAll().map(c => c.name));

  if (pathname.startsWith("/lms")) {
    if (!user) {
      if (pathname !== "/lms/login") {
        return NextResponse.redirect(new URL("/lms/login", request.url));
      }
    } else {
      // User is logged in. Fetch role to make sure they are a student.
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "student") {
        if (pathname !== "/lms/login") {
          return NextResponse.redirect(new URL("/lms/login", request.url));
        }
      } else if (pathname === "/lms/login") {
        // If they are a student and on the login page, redirect them to overview
        return NextResponse.redirect(new URL("/lms/overview", request.url));
      }
    }
  }

  if (pathname.startsWith("/mentor")) {
    if (pathname === "/mentor/login") {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role === "mentor") {
          return NextResponse.redirect(new URL("/mentor/overview", request.url));
        }
      }
      return supabaseResponse;
    }

    if (!user) {
      return NextResponse.redirect(new URL("/mentor/login", request.url));
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "mentor") {
        return NextResponse.redirect(new URL("/mentor/login", request.url));
      }
    }
  }

  return supabaseResponse;
}
