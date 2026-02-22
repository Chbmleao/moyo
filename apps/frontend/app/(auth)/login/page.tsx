"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const supabase = createSupabaseBrowserClient();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const { data, error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		setLoading(false);

		if (signInError) {
			setError(signInError.message);
			return;
		}

		const role = data.user?.user_metadata?.role ?? "patient";
		router.push(role === "professional" ? "/app" : "/app/assinaturas");
		router.refresh();
	}

	return (
		<main className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<h1 className="text-2xl font-semibold text-foreground">Entrar</h1>
				<p className="text-sm text-muted-foreground">Acesse sua conta para continuar.</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
							E-mail <span className="text-destructive">*</span>
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
							autoComplete="email"
							className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground ring-ring focus:outline-none focus:ring-2"
						/>
					</div>
					<div>
						<label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
							Senha <span className="text-destructive">*</span>
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
							autoComplete="current-password"
							className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground ring-ring focus:outline-none focus:ring-2"
						/>
					</div>
					{error && (
						<div
							className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 mb-2 animate-fade-in"
							role="alert">
							<AlertCircle className="h-5 w-5 text-destructive" />
							<span className="text-sm font-medium text-destructive">{error}</span>
						</div>
					)}
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
						{loading ? (
							<span className="flex items-center justify-center gap-2">
								<svg
									className="animate-spin h-4 w-4 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
								</svg>{" "}
								Entrando…
							</span>
						) : (
							"Entrar"
						)}
					</button>
				</form>

				<p className="text-center text-sm text-muted-foreground">
					Não tem conta?{" "}
					<Link href="/signup" className="font-medium text-primary hover:underline">
						Criar conta
					</Link>
				</p>
			</div>
		</main>
	);
}
