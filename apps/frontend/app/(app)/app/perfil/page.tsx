"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save, User } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";

export default function PerfilPage() {
	const router = useRouter();
	const supabase = createSupabaseBrowserClient();
	const toast = useToast();
	const fileRef = useRef<HTMLInputElement>(null);

	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [role, setRole] = useState("");
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [savingName, setSavingName] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session?.user) {
				router.replace("/login");
				return;
			}
			const user = session.user;
			setEmail(user.email ?? "");
			setName((user.user_metadata?.name as string) ?? "");
			setRole((user.user_metadata?.role as string) ?? "patient");
			setAvatarUrl((user.user_metadata?.avatar_url as string) ?? null);
			setLoading(false);
		}
		load();
	}, [supabase.auth, router]);

	const handleAvatarUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			if (!file.type.startsWith("image/")) {
				toast.error("Por favor selecione uma imagem.");
				return;
			}
			if (file.size > 2 * 1024 * 1024) {
				toast.error("A imagem deve ter no máximo 2MB.");
				return;
			}

			setUploading(true);
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (!session?.user) return;

				const userId = session.user.id;
				const ext = file.name.split(".").pop() ?? "jpg";
				const filePath = `${userId}/avatar.${ext}`;

				const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
					cacheControl: "3600",
					upsert: true,
				});
				if (uploadError) throw uploadError;

				const {
					data: { publicUrl },
				} = supabase.storage.from("avatars").getPublicUrl(filePath);

				// Add cache-buster to force refresh
				const url = `${publicUrl}?t=${Date.now()}`;

				const { error: updateError } = await supabase.auth.updateUser({
					data: { avatar_url: url },
				});
				if (updateError) throw updateError;

				setAvatarUrl(url);
				toast.success("Foto atualizada com sucesso!");
				router.refresh(); // refresh server components (header)
			} catch (err) {
				const message = err instanceof Error ? err.message : "Erro ao enviar foto.";
				toast.error(message);
			} finally {
				setUploading(false);
			}
		},
		[supabase, toast, router],
	);

	const handleSaveName = useCallback(async () => {
		setSavingName(true);
		try {
			const { error } = await supabase.auth.updateUser({
				data: { name: name.trim() },
			});
			if (error) throw error;
			toast.success("Nome atualizado com sucesso!");
			router.refresh();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar nome.";
			toast.error(message);
		} finally {
			setSavingName(false);
		}
	}, [supabase.auth, name, toast, router]);

	const roleLabel = role === "professional" ? "Profissional" : "Paciente";

	if (loading) {
		return (
			<main className="min-h-[calc(100vh-4rem)] px-6 py-16 lg:px-12">
				<div className="mx-auto max-w-xl">
					<p className="text-muted-foreground">Carregando…</p>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] px-6 py-16 lg:px-12">
			<div className="mx-auto max-w-xl">
				<h1 className="mb-8 text-2xl font-semibold text-foreground">Meu perfil</h1>

				<div className="rounded-xl border border-border bg-card p-6">
					{/* Avatar */}
					<div className="mb-6 flex flex-col items-center">
						<button
							type="button"
							onClick={() => fileRef.current?.click()}
							disabled={uploading}
							className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-border transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
							{avatarUrl ? (
								<img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
							) : (
								<span className="flex h-full w-full items-center justify-center bg-muted">
									<User className="h-10 w-10 text-muted-foreground" />
								</span>
							)}
							<span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
								{uploading ? (
									<Loader2 className="h-6 w-6 animate-spin text-white" />
								) : (
									<Camera className="h-6 w-6 text-white" />
								)}
							</span>
						</button>
						<input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
						<p className="mt-2 text-xs text-muted-foreground">Clique para alterar a foto</p>
					</div>

					{/* Info */}
					<div className="space-y-4">
						<div>
							<label htmlFor="name" className="mb-1 block text-sm font-medium text-muted-foreground">
								Nome
							</label>
							<div className="flex gap-2">
								<input
									id="name"
									type="text"
									value={name}
									onChange={e => setName(e.target.value)}
									placeholder="Seu nome completo"
									className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-foreground ring-ring focus:outline-none focus:ring-2"
								/>
								<button
									type="button"
									onClick={handleSaveName}
									disabled={savingName}
									className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
									{savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
									Salvar
								</button>
							</div>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-muted-foreground">E-mail</label>
							<p className="rounded-lg border border-input bg-background px-3 py-2 text-foreground">{email}</p>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-muted-foreground">Tipo de conta</label>
							<span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
								{roleLabel}
							</span>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
