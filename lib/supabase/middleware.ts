import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session cookie on every request, and gates
// two routes: signed-out users are sent to /join, and signed-in users
// without a username yet are pinned to /pick-username (the post-OAuth
// gate — Google gives an email and real name, not a unique display name).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    pathname.startsWith("/join") ||
    pathname.startsWith("/j/") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js";

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/join";
    return NextResponse.redirect(url);
  }

  // One profile read covers both gates: pick a username, then see the intro
  // once. Adding a second query here would tax every request in the app.
  if (user && !isPublic && pathname !== "/pick-username" && pathname !== "/welcome") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, onboarded")
      .eq("id", user.id)
      .single();

    if (!profile?.username) {
      const url = request.nextUrl.clone();
      url.pathname = "/pick-username";
      return NextResponse.redirect(url);
    }

    if (!profile.onboarded) {
      const url = request.nextUrl.clone();
      url.pathname = "/welcome";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
