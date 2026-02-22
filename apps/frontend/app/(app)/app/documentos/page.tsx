"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Copy, Eye, FileText, Link2, Loader2, Plus, Search, Upload, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { listDocuments, uploadDocument, getDocument, createSigningLink, type DocumentItem } from "@/lib/api/documents";
import { listPatients, type PatientItem } from "@/lib/api/patients";
import { useToast } from "@/components/toast";

export default function DocumentosPage() {
	const router = useRouter();
	const supabase = createSupabaseBrowserClient();
	const toast = useToast();
	const fileRef = useRef<HTMLInputElement>(null);

	const [documents, setDocuments] = useState<DocumentItem[]>([]);
	const [patients, setPatients] = useState<PatientItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [token, setToken] = useState<string | null>(null);

	// Upload modal state
	const [modalOpen, setModalOpen] = useState(false);
	const [formFile, setFormFile] = useState<File | null>(null);
	const [formSignerEmail, setFormSignerEmail] = useState("");
	const [formDeadline, setFormDeadline] = useState("");
	const [formPatientId, setFormPatientId] = useState("");
	const [uploading, setUploading] = useState(false);

	// Signing link modal state
	const [signingLinkUrl, setSigningLinkUrl] = useState<string | null>(null);
	const [signingLinkCopied, setSigningLinkCopied] = useState(false);

	// ── Load documents & patients ──────────────────────────────────
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
				const [docList, patList] = await Promise.all([
					listDocuments(session.access_token),
					listPatients(session.access_token),
				]);
				if (!cancelled) {
					setDocuments(docList);
					setPatients(patList);
				}
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

	// ── Helpers ────────────────────────────────────────────────────
	const patientMap = new Map(patients.map(p => [p.id, p]));

	const filtered = documents.filter(doc => {
		const q = search.toLowerCase();
		if (doc.fileName.toLowerCase().includes(q)) return true;
		if (doc.signerEmail?.toLowerCase().includes(q)) return true;
		if (doc.patientId) {
			const p = patientMap.get(doc.patientId);
			if (p?.name.toLowerCase().includes(q)) return true;
		}
		return false;
	});

	function openUpload() {
		setFormFile(null);
		setFormSignerEmail("");
		setFormDeadline("");
		setFormPatientId("");
		setModalOpen(true);
	}

	function closeModal() {
		setModalOpen(false);
		setFormFile(null);
	}

	function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
			toast.error("Apenas arquivos PDF são aceitos.");
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			toast.error("O arquivo deve ter no máximo 10MB.");
			return;
		}
		setFormFile(file);
	}

	// ── Upload ─────────────────────────────────────────────────────
	const handleUpload = useCallback(async () => {
		if (!token || !formFile) return;
		setUploading(true);
		try {
			const newDoc = await uploadDocument(
				token,
				formFile,
				formSignerEmail.trim() || null,
				formDeadline.trim() || null,
				formPatientId || null,
			);
			setDocuments(prev => [newDoc, ...prev]);
			closeModal();
			toast.success("Documento enviado com sucesso!");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao enviar documento.";
			toast.error(message === "Failed to fetch" ? "Não foi possível conectar ao servidor." : message);
		} finally {
			setUploading(false);
		}
	}, [token, formFile, formSignerEmail, formDeadline, formPatientId, toast]);

	// ── View ───────────────────────────────────────────────────────
	async function handleView(id: string) {
		if (!token) return;
		try {
			const { viewUrl } = await getDocument(id, token);
			window.open(viewUrl, "_blank");
		} catch {
			toast.error("Não foi possível abrir o documento.");
		}
	}

	async function handleViewSigned(id: string) {
		if (!token) return;
		try {
			const { signedViewUrl } = await getDocument(id, token);
			if (signedViewUrl) window.open(signedViewUrl, "_blank");
		} catch {
			toast.error("Não foi possível abrir o documento assinado.");
		}
	}

	// ── Generate signing link ──────────────────────────────────────
	async function handleGenerateLink(id: string) {
		if (!token) return;
		try {
			const result = await createSigningLink(id, token);
			setSigningLinkUrl(result.signingUrl);
			setSigningLinkCopied(false);
		} catch (e) {
			const message = e instanceof Error ? e.message : "Erro ao gerar link";
			toast.error(message);
		}
	}

	function handleCopyLink() {
		if (!signingLinkUrl) return;
		navigator.clipboard.writeText(signingLinkUrl).then(() => {
			setSigningLinkCopied(true);
			setTimeout(() => setSigningLinkCopied(false), 2000);
		});
	}

	// ── Skeleton loader ────────────────────────────────────────────
	if (loading) {
		return (
			<main className="min-h-[calc(100vh-4rem)] px-6 py-10 lg:px-12">
				<div className="mx-auto max-w-4xl">
					<div className="mb-8 flex items-center justify-between">
						<div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
						<div className="h-10 w-44 animate-pulse rounded-full bg-muted" />
					</div>
					<div className="space-y-4">
						{[1, 2, 3].map(i => (
							<div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
								<div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-48 animate-pulse rounded bg-muted" />
									<div className="h-3 w-64 animate-pulse rounded bg-muted" />
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
						<h1 className="text-2xl font-semibold text-foreground">Documentos</h1>
						{documents.length > 0 && (
							<span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
								{documents.length}
							</span>
						)}
					</div>
					<button
						onClick={openUpload}
						className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
						<Upload className="h-4 w-4" />
						Novo documento
					</button>
				</div>

				{/* ── Search ─────────────────────────────────────────── */}
				{documents.length > 0 && (
					<div className="relative mb-6">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<input
							type="text"
							value={search}
							onChange={e => setSearch(e.target.value)}
							placeholder="Buscar por nome do arquivo, e-mail ou paciente…"
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
				{documents.length === 0 && (
					<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
						<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
							<FileText className="h-8 w-8 text-muted-foreground" />
						</div>
						<p className="mb-1 text-lg font-medium text-foreground">Nenhum documento enviado</p>
						<p className="mb-6 text-sm text-muted-foreground">Comece enviando seu primeiro documento PDF.</p>
						<button
							onClick={openUpload}
							className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
							<Plus className="h-4 w-4" />
							Enviar documento
						</button>
					</div>
				)}

				{/* ── No search results ──────────────────────────────── */}
				{documents.length > 0 && filtered.length === 0 && (
					<div className="flex flex-col items-center py-16">
						<Search className="mb-3 h-8 w-8 text-muted-foreground" />
						<p className="text-muted-foreground">
							Nenhum resultado para &ldquo;<span className="font-medium text-foreground">{search}</span>&rdquo;
						</p>
					</div>
				)}

				{/* ── Document list ──────────────────────────────────── */}
				{filtered.length > 0 && (
					<div className="space-y-3">
						{filtered.map(doc => {
							const patient = doc.patientId ? patientMap.get(doc.patientId) : null;
							const isSigned = doc.status === "signed";

							return (
								<div
									key={doc.id}
									className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-sm">
									{/* Icon */}
									<div
										className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
											isSigned ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
										}`}>
										{isSigned ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
									</div>

									{/* Info */}
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-foreground">{doc.fileName}</p>
										<div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
											{patient && <span>{patient.name}</span>}
											{doc.signerEmail && <span>{doc.signerEmail}</span>}
											{doc.deadlineAt && <span>Prazo: {new Date(doc.deadlineAt).toLocaleDateString("pt-BR")}</span>}
											<span>{isSigned ? "Assinado" : "Pendente"}</span>
										</div>
									</div>

									{/* Actions */}
									<div className="flex shrink-0 items-center gap-1">
										{!isSigned && (
											<button
												type="button"
												onClick={() => handleGenerateLink(doc.id)}
												className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
												title="Gerar link de assinatura">
												<Link2 className="h-4 w-4" />
											</button>
										)}
										<button
											type="button"
											onClick={() => handleView(doc.id)}
											className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
											title="Ver original">
											<Eye className="h-4 w-4" />
										</button>
										{isSigned && (
											<button
												type="button"
												onClick={() => handleViewSigned(doc.id)}
												className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-ring"
												title="Ver assinado">
												<CheckCircle2 className="h-4 w-4" />
											</button>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* ── Upload Modal ────────────────────────────────────────── */}
			{modalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeModal}>
					<div
						className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-fade-slide-in"
						onClick={e => e.stopPropagation()}>
						<div className="mb-6 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-foreground">Enviar documento</h2>
							<button
								type="button"
								onClick={closeModal}
								className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="space-y-4">
							{/* File picker */}
							<div>
								<label className="mb-1 block text-sm font-medium text-foreground">
									Arquivo PDF <span className="text-destructive">*</span>
								</label>
								{formFile ? (
									<div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
										<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
										<span className="flex-1 truncate text-sm text-foreground">{formFile.name}</span>
										<button
											type="button"
											onClick={() => {
												setFormFile(null);
												if (fileRef.current) fileRef.current.value = "";
											}}
											className="text-muted-foreground hover:text-foreground">
											<X className="h-4 w-4" />
										</button>
									</div>
								) : (
									<button
										type="button"
										onClick={() => fileRef.current?.click()}
										className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-3 py-6 text-sm text-muted-foreground transition hover:border-primary hover:text-primary">
										<Upload className="h-5 w-5" />
										Selecionar arquivo PDF
									</button>
								)}
								<input
									ref={fileRef}
									type="file"
									accept="application/pdf,.pdf"
									onChange={handleFilePick}
									className="hidden"
								/>
							</div>

							{/* Patient picker */}
							<div>
								<label htmlFor="doc-patient" className="mb-1 block text-sm font-medium text-foreground">
									Paciente <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
								</label>
								<select
									id="doc-patient"
									value={formPatientId}
									onChange={e => {
										const pid = e.target.value;
										setFormPatientId(pid);
										const selected = patients.find(p => p.id === pid);
										if (selected?.email) {
											setFormSignerEmail(selected.email);
										} else if (pid) {
											setFormSignerEmail("");
										}
									}}
									className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ring-ring focus:outline-none focus:ring-2">
									<option value="">Nenhum paciente</option>
									{patients.map(p => (
										<option key={p.id} value={p.id}>
											{p.name}
											{p.email ? ` (${p.email})` : ""}
										</option>
									))}
								</select>
							</div>

							{/* Signer email — hidden when the selected patient already has an email */}
							{!(formPatientId && patients.find(p => p.id === formPatientId)?.email) && (
								<div>
									<label htmlFor="doc-signer" className="mb-1 block text-sm font-medium text-foreground">
										E-mail do signatário{" "}
										<span className="text-xs font-normal text-muted-foreground">(opcional)</span>
									</label>
									<input
										id="doc-signer"
										type="email"
										value={formSignerEmail}
										onChange={e => setFormSignerEmail(e.target.value)}
										placeholder="paciente@email.com"
										className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ring-ring placeholder:text-muted-foreground focus:outline-none focus:ring-2"
									/>
								</div>
							)}

							{/* Deadline */}
							<div>
								<label htmlFor="doc-deadline" className="mb-1 block text-sm font-medium text-foreground">
									Prazo <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
								</label>
								<input
									id="doc-deadline"
									type="datetime-local"
									value={formDeadline}
									onChange={e => {
										const raw = e.target.value;
										if (raw) {
											setFormDeadline(new Date(raw).toISOString());
										} else {
											setFormDeadline("");
										}
									}}
									className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ring-ring focus:outline-none focus:ring-2"
								/>
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
								onClick={handleUpload}
								disabled={uploading || !formFile}
								className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
								{uploading && <Loader2 className="h-4 w-4 animate-spin" />}
								Enviar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ── Signing Link Modal ─────────────────────────────────── */}
			{signingLinkUrl && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
					onClick={() => setSigningLinkUrl(null)}>
					<div
						className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg animate-fade-slide-in"
						onClick={e => e.stopPropagation()}>
						<h3 className="mb-2 text-lg font-semibold text-foreground">Link de assinatura gerado</h3>
						<p className="mb-4 text-sm text-muted-foreground">
							Envie este link para o paciente assinar o documento. Não é necessário login.
						</p>
						<div className="mb-4 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
							<input
								type="text"
								readOnly
								value={signingLinkUrl}
								className="flex-1 bg-transparent text-sm text-foreground outline-none"
							/>
							<button
								type="button"
								onClick={handleCopyLink}
								className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
								<Copy className="h-3.5 w-3.5" />
								{signingLinkCopied ? "Copiado!" : "Copiar"}
							</button>
						</div>
						<button
							type="button"
							onClick={() => setSigningLinkUrl(null)}
							className="w-full rounded-full border border-border py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary">
							Fechar
						</button>
					</div>
				</div>
			)}
		</main>
	);
}
