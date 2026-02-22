"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Pencil, Plus, Search, Trash2, User, UserPlus, Users, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { listPatients, createPatient, updatePatient, deletePatient, type PatientItem } from "@/lib/api/patients";
import { useToast } from "@/components/toast";

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	return parts[0].slice(0, 2).toUpperCase();
}

type ModalMode = "create" | "edit";

export default function PacientesPage() {
	const router = useRouter();
	const supabase = createSupabaseBrowserClient();
	const toast = useToast();
	const fileRef = useRef<HTMLInputElement>(null);

	const [patients, setPatients] = useState<PatientItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [token, setToken] = useState<string | null>(null);

	// Modal state
	const [modalOpen, setModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<ModalMode>("create");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formName, setFormName] = useState("");
	const [formEmail, setFormEmail] = useState("");
	const [formAvatarUrl, setFormAvatarUrl] = useState<string | null>(null);
	const [formAvatarFile, setFormAvatarFile] = useState<File | null>(null);
	const [formAvatarPreview, setFormAvatarPreview] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	// Delete confirmation
	const [deleteTarget, setDeleteTarget] = useState<PatientItem | null>(null);
	const [deleting, setDeleting] = useState(false);

	// ── Load patients ──────────────────────────────────────────────
	useEffect(() => {
		let cancelled = false;
		async function load() {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session?.access_token) {
				router.replace("/login");
				return;
			}
			const role = session.user?.user_metadata?.role ?? "patient";
			if (role !== "professional") {
				router.replace("/app/assinaturas");
				return;
			}
			setToken(session.access_token);
			try {
				const list = await listPatients(session.access_token);
				if (!cancelled) setPatients(list);
			} catch (e) {
				const message = e instanceof Error ? e.message : "Erro ao carregar";
				if (!cancelled) toast.error(message === "Failed to fetch" ? "Não foi possível conectar ao servidor." : message);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [supabase.auth, router, toast]);

	// ── Filtered list ──────────────────────────────────────────────
	const filtered = patients.filter(p => {
		const q = search.toLowerCase();
		return p.name.toLowerCase().includes(q) || (p.email?.toLowerCase().includes(q) ?? false);
	});

	// ── Modal helpers ──────────────────────────────────────────────
	function openCreate() {
		setModalMode("create");
		setEditingId(null);
		setFormName("");
		setFormEmail("");
		setFormAvatarUrl(null);
		setFormAvatarFile(null);
		setFormAvatarPreview(null);
		setModalOpen(true);
	}

	function openEdit(patient: PatientItem) {
		setModalMode("edit");
		setEditingId(patient.id);
		setFormName(patient.name);
		setFormEmail(patient.email ?? "");
		setFormAvatarUrl(patient.avatarUrl);
		setFormAvatarFile(null);
		setFormAvatarPreview(patient.avatarUrl);
		setModalOpen(true);
	}

	function closeModal() {
		setModalOpen(false);
		setEditingId(null);
		setFormAvatarFile(null);
		setFormAvatarPreview(null);
	}

	// ── Avatar file handling ───────────────────────────────────────
	function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
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
		setFormAvatarFile(file);
		setFormAvatarPreview(URL.createObjectURL(file));
	}

	// ── Upload avatar to Supabase storage ──────────────────────────
	async function uploadAvatar(patientId: string, file: File): Promise<string> {
		const ext = file.name.split(".").pop() ?? "jpg";
		const filePath = `patients/${patientId}/avatar.${ext}`;

		const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
			cacheControl: "3600",
			upsert: true,
		});
		if (uploadError) throw uploadError;

		const {
			data: { publicUrl },
		} = supabase.storage.from("avatars").getPublicUrl(filePath);

		return `${publicUrl}?t=${Date.now()}`;
	}

	// ── Save (create or update) ────────────────────────────────────
	const handleSave = useCallback(async () => {
		if (!token) return;
		if (!formName.trim()) {
			toast.error("O nome é obrigatório.");
			return;
		}

		setSaving(true);
		try {
			if (modalMode === "create") {
				const created = await createPatient(token, {
					name: formName.trim(),
					email: formEmail.trim() || null,
				});
				// Upload avatar after creation (we need the patient ID)
				if (formAvatarFile) {
					const url = await uploadAvatar(created.id, formAvatarFile);
					const updated = await updatePatient(token, created.id, { avatarUrl: url });
					setPatients(prev => [updated, ...prev]);
				} else {
					setPatients(prev => [created, ...prev]);
				}
				toast.success("Paciente adicionado!");
			} else if (editingId) {
				let avatarUrl: string | null | undefined = undefined;
				if (formAvatarFile) {
					avatarUrl = await uploadAvatar(editingId, formAvatarFile);
				}
				const updated = await updatePatient(token, editingId, {
					name: formName.trim(),
					email: formEmail.trim() || null,
					avatarUrl,
				});
				setPatients(prev => prev.map(p => (p.id === editingId ? updated : p)));
				toast.success("Paciente atualizado!");
			}
			closeModal();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar paciente.";
			toast.error(message);
		} finally {
			setSaving(false);
		}
	}, [token, formName, formEmail, formAvatarFile, modalMode, editingId, toast]);

	// ── Delete ─────────────────────────────────────────────────────
	const handleDelete = useCallback(async () => {
		if (!token || !deleteTarget) return;
		setDeleting(true);
		try {
			await deletePatient(token, deleteTarget.id);
			setPatients(prev => prev.filter(p => p.id !== deleteTarget.id));
			toast.success("Paciente excluído.");
			setDeleteTarget(null);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao excluir paciente.";
			toast.error(message);
		} finally {
			setDeleting(false);
		}
	}, [token, deleteTarget, toast]);

	// ── Skeleton loader ────────────────────────────────────────────
	if (loading) {
		return (
			<main className="min-h-[calc(100vh-4rem)] px-6 py-10 lg:px-12">
				<div className="mx-auto max-w-4xl">
					<div className="mb-8 flex items-center justify-between">
						<div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
						<div className="h-10 w-44 animate-pulse rounded-full bg-muted" />
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						{[1, 2, 3].map(i => (
							<div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
								<div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-32 animate-pulse rounded bg-muted" />
									<div className="h-3 w-48 animate-pulse rounded bg-muted" />
								</div>
							</div>
						))}
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] px-6 py-10 lg:px-12">
			<div className="mx-auto max-w-4xl">
				{/* ── Header ─────────────────────────────────────────── */}
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-semibold text-foreground">Pacientes</h1>
						{patients.length > 0 && (
							<span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
								{patients.length}
							</span>
						)}
					</div>
					<button
						onClick={openCreate}
						className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
						<UserPlus className="h-4 w-4" />
						Adicionar paciente
					</button>
				</div>

				{/* ── Search ─────────────────────────────────────────── */}
				{patients.length > 0 && (
					<div className="relative mb-6">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<input
							type="text"
							value={search}
							onChange={e => setSearch(e.target.value)}
							placeholder="Buscar por nome ou e-mail…"
							className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground ring-ring placeholder:text-muted-foreground focus:outline-none focus:ring-2"
						/>
						{search && (
							<button
								type="button"
								onClick={() => setSearch("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
								<X className="h-4 w-4" />
							</button>
						)}
					</div>
				)}

				{/* ── Empty state ────────────────────────────────────── */}
				{patients.length === 0 && (
					<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
						<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
							<Users className="h-8 w-8 text-muted-foreground" />
						</div>
						<p className="mb-1 text-lg font-medium text-foreground">Nenhum paciente cadastrado</p>
						<p className="mb-6 text-sm text-muted-foreground">Comece adicionando seu primeiro paciente.</p>
						<button
							onClick={openCreate}
							className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
							<Plus className="h-4 w-4" />
							Adicionar paciente
						</button>
					</div>
				)}

				{/* ── No results for search ──────────────────────────── */}
				{patients.length > 0 && filtered.length === 0 && (
					<div className="flex flex-col items-center py-16">
						<Search className="mb-3 h-8 w-8 text-muted-foreground" />
						<p className="text-muted-foreground">
							Nenhum resultado para &ldquo;<span className="font-medium text-foreground">{search}</span>&rdquo;
						</p>
					</div>
				)}

				{/* ── Patient list (grid) ────────────────────────────── */}
				{filtered.length > 0 && (
					<div className="grid gap-4 sm:grid-cols-2">
						{filtered.map(patient => (
							<div
								key={patient.id}
								className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-sm">
								{/* Avatar */}
								<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
									{patient.avatarUrl ? (
										<img src={patient.avatarUrl} alt="" className="h-full w-full object-cover" />
									) : (
										<span className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-bold text-primary">
											{getInitials(patient.name)}
										</span>
									)}
								</div>

								{/* Info */}
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className="truncate font-medium text-foreground">{patient.name}</p>
										{patient.linkedUserId && (
											<span
												className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500"
												title="Conta vinculada"
											/>
										)}
									</div>
									{patient.email ? (
										<p className="truncate text-sm text-muted-foreground">{patient.email}</p>
									) : (
										<p className="text-sm italic text-muted-foreground/60">Sem e-mail</p>
									)}
								</div>

								{/* Actions */}
								<div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
									<button
										type="button"
										onClick={() => openEdit(patient)}
										className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
										title="Editar">
										<Pencil className="h-4 w-4" />
									</button>
									<button
										type="button"
										onClick={() => setDeleteTarget(patient)}
										className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
										title="Excluir">
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* ── Create / Edit Modal ────────────────────────────────── */}
			{modalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeModal}>
					<div
						className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-fade-slide-in"
						onClick={e => e.stopPropagation()}>
						<div className="mb-6 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-foreground">
								{modalMode === "create" ? "Adicionar paciente" : "Editar paciente"}
							</h2>
							<button
								type="button"
								onClick={closeModal}
								className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Avatar upload */}
						<div className="mb-6 flex flex-col items-center">
							<button
								type="button"
								onClick={() => fileRef.current?.click()}
								className="group relative h-20 w-20 overflow-hidden rounded-full border-2 border-border transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
								{formAvatarPreview ? (
									<img src={formAvatarPreview} alt="" className="h-full w-full object-cover" />
								) : (
									<span className="flex h-full w-full items-center justify-center bg-muted">
										<User className="h-8 w-8 text-muted-foreground" />
									</span>
								)}
								<span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
									<Camera className="h-5 w-5 text-white" />
								</span>
							</button>
							<input
								ref={fileRef}
								type="file"
								accept="image/*"
								onChange={handleAvatarPick}
								className="hidden"
							/>
							<p className="mt-1.5 text-xs text-muted-foreground">Foto do paciente (opcional)</p>
						</div>

						{/* Form fields */}
						<div className="space-y-4">
							<div>
								<label htmlFor="patient-name" className="mb-1 block text-sm font-medium text-foreground">
									Nome completo <span className="text-destructive">*</span>
								</label>
								<input
									id="patient-name"
									type="text"
									value={formName}
									onChange={e => setFormName(e.target.value)}
									required
									placeholder="Ex: Maria Silva"
									className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground ring-ring placeholder:text-muted-foreground focus:outline-none focus:ring-2"
								/>
							</div>
							<div>
								<label htmlFor="patient-email" className="mb-1 block text-sm font-medium text-foreground">
									E-mail <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
								</label>
								<input
									id="patient-email"
									type="email"
									value={formEmail}
									onChange={e => setFormEmail(e.target.value)}
									placeholder="paciente@email.com"
									className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground ring-ring placeholder:text-muted-foreground focus:outline-none focus:ring-2"
								/>
								<p className="mt-1 text-xs text-muted-foreground">
									Se o paciente tiver uma conta, ela será vinculada automaticamente.
								</p>
							</div>
						</div>

						{/* Actions */}
						<div className="mt-6 flex items-center justify-end gap-3">
							<button
								type="button"
								onClick={closeModal}
								className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={saving}
								className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
								{saving && <Loader2 className="h-4 w-4 animate-spin" />}
								{modalMode === "create" ? "Adicionar" : "Salvar"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ── Delete Confirmation Modal ───────────────────────────── */}
			{deleteTarget && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
					onClick={() => setDeleteTarget(null)}>
					<div
						className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg animate-fade-slide-in"
						onClick={e => e.stopPropagation()}>
						<h2 className="mb-2 text-lg font-semibold text-foreground">Excluir paciente</h2>
						<p className="mb-6 text-sm text-muted-foreground">
							Tem certeza que deseja excluir{" "}
							<span className="font-medium text-foreground">{deleteTarget.name}</span>? Esta ação não pode ser
							desfeita.
						</p>
						<div className="flex items-center justify-end gap-3">
							<button
								type="button"
								onClick={() => setDeleteTarget(null)}
								className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={deleting}
								className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
								{deleting && <Loader2 className="h-4 w-4 animate-spin" />}
								Excluir
							</button>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}
