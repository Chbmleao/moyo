import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "./lib/supabase/middleware";

const PROTECTED_PATHS = ["/app"];

function isProtectedPath(pathname: string): boolean {
	return PROTECTED_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
	const { supabase, response } = createSupabaseMiddlewareClient(request);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (isProtectedPath(request.nextUrl.pathname) && !user) {
		const loginUrl = new URL("/login", request.url);
		const redirectResponse = NextResponse.redirect(loginUrl);
		// Forward cookies set by Supabase middleware client (e.g. cleared stale tokens)
		response.cookies.getAll().forEach(cookie => {
			redirectResponse.cookies.set(cookie.name, cookie.value);
		});
		return redirectResponse;
	}

	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization)
		 * - favicon.ico
		 * - public assets
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
