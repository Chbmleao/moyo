import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function Header() {
	const supabase = await createSupabaseServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-12">
				<Link
					href="/"
					className="text-xl font-semibold text-foreground transition hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1">
					Moyo
				</Link>
				<nav className="flex items-center gap-4" aria-label="Navegação principal">
					{user ? (
						<>
							<Link
								href="/app"
								className="text-base font-medium text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-3 py-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center">
								Painel
							</Link>
						</>
					) : (
						<>
							<Link
								href="/login"
								className="text-base font-medium text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-3 py-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center">
								Entrar
							</Link>
							<Link
								href="/signup"
								className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary px-5 py-2 text-base font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
								Criar conta
							</Link>
						</>
					)}
				</nav>
			</div>
		</header>
	);
}
