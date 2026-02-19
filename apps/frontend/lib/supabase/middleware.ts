import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export type MiddlewareSupabaseResult = {
	supabase: ReturnType<typeof createServerClient>;
	response: NextResponse;
};

export function createSupabaseMiddlewareClient(request: NextRequest): MiddlewareSupabaseResult {
	const response = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
		{
			cookies: {
				getAll() {
					return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
				},
				setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
					cookiesToSet.forEach(({ name, value, options }) => {
						request.cookies.set(name, value);
						response.cookies.set(name, value, options ?? {});
					});
				},
			},
		},
	);

	return { supabase, response };
}
