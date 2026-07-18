import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

async function getUserRole(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_id, roles(name)")
      .eq("id", userId)
      .single();
    const roles = profile?.roles as unknown as { name: string } | null;
    return roles?.name ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // --- Routes compte : authentification + rôle client requis ---
  if (pathname.startsWith("/compte")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/connexion";
      return NextResponse.redirect(url);
    }
    const role = await getUserRole(supabase, user.id);
    if (role === "admin" || role === "manager") {
      // Admin n'a pas d'espace client — rediriger vers la page de connexion
      // pour qu'il puisse se déconnecter ou utiliser un compte client
      const url = request.nextUrl.clone();
      url.pathname = "/auth/connexion";
      return NextResponse.redirect(url);
    }
  }

  // --- Auth : rediriger si déjà connecté ---
  if (pathname.startsWith("/auth/") && user) {
    const role = await getUserRole(supabase, user.id);
    if (role === "admin" || role === "manager") {
      // Laisser l'admin accéder à /auth/ : la page de connexion lui montrera
      // un message de blocage et le déconnectera. S'il ne le fait pas,
      // il reste bloqué dans une boucle sans issue.
    } else {
      const url = request.nextUrl.clone();
      url.pathname = "/compte";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/auth/:path*", "/compte/:path*"],
};
