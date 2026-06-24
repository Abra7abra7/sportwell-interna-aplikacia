import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh user session if expired
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Ak nie je prihlásený a nejde na /login, presmeruj na /login
  if (!user && pathname !== '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Ak je prihlásený a ide na /login, presmeruj na /dashboard
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Server-side guard pre GDPR onboarding klientov
  if (user && pathname !== '/gdpr' && !pathname.startsWith('/api') && !pathname.startsWith('/auth')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, gdpr_signed_at')
      .eq('id', user.id)
      .single();

    if (profile && profile.role === 'klient' && !profile.gdpr_signed_at) {
      const url = request.nextUrl.clone();
      url.pathname = '/gdpr';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

