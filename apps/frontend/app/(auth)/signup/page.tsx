"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type UserRole = "professional" | "patient";

export default function SignupPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<UserRole>("patient");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const router = useRouter();
	const supabase = createSupabaseBrowserClient();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setMessage(null);
		if (password !== passwordConfirm) {
			setError("As senhas não coincidem.");
			return;
		}
		setLoading(true);

		const { error: signUpError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: { role, name: name.trim() || undefined },
			},
		});

		setLoading(false);

		if (signUpError) {
			setError(signUpError.message);
			return;
		}

		setMessage(
			"Conta criada. Se o seu projeto exige confirmação de e-mail, verifique sua caixa de entrada antes de entrar.",
		);
		setTimeout(() => {
			router.push("/login");
			router.refresh();
		}, 3000);
	}

	return (
		<main className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<h1 className="text-2xl font-semibold text-foreground">Criar conta</h1>
				<p className="text-sm text-muted-foreground">Cadastre-se para usar a plataforma.</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
							Nome completo <span className="text-destructive">*</span>
						</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={e => setName(e.target.value)}
							required
							autoComplete="name"
							placeholder="Ex: Maria Silva"
							className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground ring-ring focus:outline-none focus:ring-2"
						/>
					</div>
					<fieldset>
						<legend className="mb-2 block text-sm font-medium text-foreground">
							Tipo de conta <span className="text-destructive">*</span>
						</legend>
						<div className="flex gap-4">
							<label className="flex min-h-[48px] min-w-[44px] flex-1 cursor-pointer items-center gap-2 rounded-lg border-2 border-input bg-background px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
								<input
									type="radio"
									name="role"
									value="professional"
									checked={role === "professional"}
									onChange={() => setRole("professional")}
									className="h-4 w-4"
								/>
								<span className="text-sm font-medium">Profissional</span>
							</label>
							<label className="flex min-h-[48px] min-w-[44px] flex-1 cursor-pointer items-center gap-2 rounded-lg border-2 border-input bg-background px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
								<input
									type="radio"
									name="role"
									value="patient"
									checked={role === "patient"}
									onChange={() => setRole("patient")}
									className="h-4 w-4"
								/>
								<span className="text-sm font-medium">Paciente</span>
							</label>
						</div>
						<p className="mt-1 text-xs text-muted-foreground">
							Profissionais gerenciam documentos e enviam para assinatura. Pacientes apenas assinam documentos enviados
							a eles.
						</p>
					</fieldset>
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
							autoComplete="new-password"
							minLength={6}
							className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground ring-ring focus:outline-none focus:ring-2"
						/>
						<p className="mt-1 text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
					</div>
					<div>
						<label htmlFor="passwordConfirm" className="mb-1 block text-sm font-medium text-foreground">
							Confirmar senha <span className="text-destructive">*</span>
						</label>
						<input
							id="passwordConfirm"
							type="password"
							value={passwordConfirm}
							onChange={e => setPasswordConfirm(e.target.value)}
							required
							autoComplete="new-password"
							minLength={6}
							className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground ring-ring focus:outline-none focus:ring-2"
						/>
						<p className="mt-1 text-xs text-muted-foreground">Digite a senha novamente.</p>
					</div>
					{error && (
						<div
							className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 mb-2 animate-fade-in"
							role="alert">
							<AlertCircle className="h-5 w-5 text-destructive" />
							<span className="text-sm font-medium text-destructive">{error}</span>
						</div>
					)}
					{message && (
						<div
							className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 mb-2 animate-fade-in"
							role="status">
							<CheckCircle className="h-5 w-5 text-primary" />
							<span className="text-sm font-medium text-primary">{message}</span>
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
								Criando conta…
							</span>
						) : (
							"Criar conta"
						)}
					</button>
				</form>

				<p className="text-center text-sm text-muted-foreground">
					Já tem conta?{" "}
					<Link href="/login" className="font-medium text-primary hover:underline">
						Entrar
					</Link>
				</p>
			</div>
		</main>
	);
}
