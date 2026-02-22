"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getDocumentByToken, signDocumentByToken, type SigningDocument } from "@/lib/api/documents";

// All react-pdf imports must be SSR-safe. We use dynamic() for the components
// and configure the worker inside the dynamic callback.
const PDFDocument = dynamic(
	() =>
		import("react-pdf").then(mod => {
			mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.js`;
			return mod.Document;
		}),
	{ ssr: false },
);
const PDFPage = dynamic(() => import("react-pdf").then(mod => mod.Page), { ssr: false });

// react-signature-canvas needs a ref, so we use lazy import via useEffect
import type ReactSignatureCanvas from "react-signature-canvas";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

type PlacedSignature = {
	page: number;
	/** fraction 0..1 of page width */
	x: number;
	/** fraction 0..1 of page height */
	y: number;
	/** fraction 0..1 of page width */
	width: number;
	/** fraction 0..1 of page height */
	height: number;
	dataUrl: string;
};

type ClickTarget = {
	page: number;
	/** fraction 0..1 */
	x: number;
	/** fraction 0..1 */
	y: number;
};

const SIGNATURE_WIDTH_FRACTION = 0.25;
const SIGNATURE_HEIGHT_FRACTION = 0.06;

export default function AssinarPage() {
	const params = useParams<{ token: string }>();
	const token = params.token;

	const [docData, setDocData] = useState<SigningDocument | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [numPages, setNumPages] = useState(0);
	const [pageWidth, setPageWidth] = useState(0);

	// Signing flow state
	const [clickTarget, setClickTarget] = useState<ClickTarget | null>(null);
	const [showSigPad, setShowSigPad] = useState(false);
	const [placedSignature, setPlacedSignature] = useState<PlacedSignature | null>(null);
	const [signing, setSigning] = useState(false);
	const [signedAt, setSignedAt] = useState<string | null>(null);

	const sigCanvasRef = useRef<ReactSignatureCanvas | null>(null);
	const sigCanvasComponentRef = useRef<React.ComponentType<
		ReactSignatureCanvas["props"] & { ref?: React.Ref<ReactSignatureCanvas> }
	> | null>(null);
	const [sigCanvasReady, setSigCanvasReady] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);

	// Lazily load react-signature-canvas + react-pdf CSS on the client
	useEffect(() => {
		import("react-signature-canvas").then(mod => {
			sigCanvasComponentRef.current = mod.default as unknown as typeof sigCanvasComponentRef.current;
			setSigCanvasReady(true);
		});
	}, []);

	// Load document data
	useEffect(() => {
		if (!token) return;
		let cancelled = false;
		async function load() {
			try {
				const data = await getDocumentByToken(token);
				if (!cancelled) {
					setDocData(data);
					if (data.document.status === "signed") {
						setSignedAt(data.document.signedAt);
					}
				}
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Erro ao carregar documento");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [token]);

	// Responsive page width
	useEffect(() => {
		function updateWidth() {
			if (containerRef.current) {
				setPageWidth(Math.min(containerRef.current.clientWidth, 900));
			}
		}
		updateWidth();
		window.addEventListener("resize", updateWidth);
		return () => window.removeEventListener("resize", updateWidth);
	}, []);

	function onDocumentLoadSuccess({ numPages: n }: { numPages: number }) {
		setNumPages(n);
	}

	// Click on PDF to place signature
	const handlePageClick = useCallback(
		(pageIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
			if (placedSignature || signedAt) return; // already placed or signed

			const rect = e.currentTarget.getBoundingClientRect();
			const xFrac = (e.clientX - rect.left) / rect.width;
			const yFrac = (e.clientY - rect.top) / rect.height;

			setClickTarget({ page: pageIndex, x: xFrac, y: yFrac });
			setShowSigPad(true);
		},
		[placedSignature, signedAt],
	);

	function handleSigConfirm() {
		if (!sigCanvasRef.current || !clickTarget) return;
		if (sigCanvasRef.current.isEmpty()) return;

		const dataUrl = sigCanvasRef.current.getCanvas().toDataURL("image/png");

		// Center the signature on the click point
		const centeredX = Math.max(0, Math.min(clickTarget.x - SIGNATURE_WIDTH_FRACTION / 2, 1 - SIGNATURE_WIDTH_FRACTION));
		const centeredY = Math.max(
			0,
			Math.min(clickTarget.y - SIGNATURE_HEIGHT_FRACTION / 2, 1 - SIGNATURE_HEIGHT_FRACTION),
		);

		setPlacedSignature({
			page: clickTarget.page,
			x: centeredX,
			y: centeredY,
			width: SIGNATURE_WIDTH_FRACTION,
			height: SIGNATURE_HEIGHT_FRACTION,
			dataUrl,
		});
		setShowSigPad(false);
		setClickTarget(null);
	}

	function handleSigClear() {
		sigCanvasRef.current?.clear();
	}

	function handleSigCancel() {
		setShowSigPad(false);
		setClickTarget(null);
	}

	function handleRemovePlacement() {
		setPlacedSignature(null);
	}

	async function handleSign() {
		if (!placedSignature || signing) return;
		setSigning(true);
		try {
			const result = await signDocumentByToken(token, {
				signatureImage: placedSignature.dataUrl,
				page: placedSignature.page,
				x: placedSignature.x,
				y: placedSignature.y,
				width: placedSignature.width,
				height: placedSignature.height,
			});
			setSignedAt(result.signedAt);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao assinar");
		} finally {
			setSigning(false);
		}
	}

	// ── Render states ────────────────────────────────────

	if (loading) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background">
				<p className="text-muted-foreground">Carregando documento…</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background px-6">
				<div className="mx-auto max-w-md text-center">
					<h1 className="mb-2 text-xl font-semibold text-foreground">Não foi possível abrir o documento</h1>
					<p className="text-muted-foreground">{error}</p>
				</div>
			</main>
		);
	}

	if (signedAt) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background px-6">
				<div className="mx-auto max-w-md text-center">
					<div className="mb-4 text-5xl">✅</div>
					<h1 className="mb-2 text-xl font-semibold text-foreground">Documento assinado com sucesso!</h1>
					<p className="text-muted-foreground">Assinado em {new Date(signedAt).toLocaleString("pt-BR")}</p>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-background px-4 py-8">
			<div className="mx-auto max-w-4xl" ref={containerRef}>
				{/* Header */}
				<div className="mb-6 text-center">
					<h1 className="text-xl font-semibold text-foreground">Assinar documento</h1>
					<p className="mt-1 text-sm text-muted-foreground">{docData?.document.fileName}</p>
					<p className="mt-2 text-sm text-muted-foreground">
						Clique no local do documento onde deseja posicionar sua assinatura.
					</p>
				</div>

				{/* PDF Viewer */}
				{docData && (
					<div className="rounded-xl border border-border bg-card p-4 overflow-hidden">
						<PDFDocument
							file={docData.viewUrl}
							onLoadSuccess={onDocumentLoadSuccess}
							loading={<p className="py-8 text-center text-muted-foreground">Carregando PDF…</p>}
							error={<p className="py-8 text-center text-destructive">Erro ao carregar PDF</p>}>
							{Array.from({ length: numPages }, (_, i) => (
								<div
									key={i}
									className="relative mb-4 cursor-crosshair last:mb-0 w-fit mx-auto"
									onClick={e => handlePageClick(i, e)}>
									<PDFPage
										pageNumber={i + 1}
										width={pageWidth > 0 ? pageWidth - 32 : undefined}
										renderTextLayer={true}
										renderAnnotationLayer={true}
									/>

									{/* Placed signature preview overlay */}
									{placedSignature && placedSignature.page === i && (
										<div
											style={{
												position: "absolute",
												left: `${placedSignature.x * 100}%`,
												top: `${placedSignature.y * 100}%`,
												width: `${placedSignature.width * 100}%`,
												height: `${placedSignature.height * 100}%`,
											}}
											className="pointer-events-none border-2 border-dashed border-primary/60">
											<img
												src={placedSignature.dataUrl}
												alt="Sua assinatura"
												className="h-full w-full object-contain"
											/>
										</div>
									)}

									{/* Page number label */}
									<div className="mt-1 text-center text-xs text-muted-foreground">
										Página {i + 1} de {numPages}
									</div>
								</div>
							))}
						</PDFDocument>
					</div>
				)}

				{/* Action bar */}
				{placedSignature && (
					<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
						<button
							type="button"
							onClick={handleRemovePlacement}
							className="min-h-[44px] rounded-full border border-border px-6 py-2 text-sm font-medium text-foreground transition hover:border-destructive hover:text-destructive">
							Reposicionar
						</button>
						<button
							type="button"
							onClick={handleSign}
							disabled={signing}
							className="min-h-[44px] rounded-full bg-primary px-8 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
							{signing ? "Assinando…" : "Assinar documento"}
						</button>
					</div>
				)}
			</div>

			{/* Signature pad modal */}
			{showSigPad && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
					<div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
						<h3 className="mb-2 text-lg font-semibold text-foreground">Desenhe sua assinatura</h3>
						<p className="mb-4 text-sm text-muted-foreground">
							Use o mouse ou o dedo para desenhar sua assinatura abaixo.
						</p>
						<div className="rounded-lg border border-input bg-white">
							{sigCanvasReady &&
								sigCanvasComponentRef.current &&
								(() => {
									const SigCanvas = sigCanvasComponentRef.current!;
									return (
										<SigCanvas
											ref={sigCanvasRef}
											penColor="black"
											canvasProps={{
												width: 460,
												height: 160,
												className: "w-full rounded-lg",
											}}
										/>
									);
								})()}
						</div>
						<div className="mt-4 flex items-center justify-end gap-3">
							<button
								type="button"
								onClick={handleSigCancel}
								className="min-h-[44px] rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:border-destructive hover:text-destructive">
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSigClear}
								className="min-h-[44px] rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary">
								Limpar
							</button>
							<button
								type="button"
								onClick={handleSigConfirm}
								className="min-h-[44px] rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
								Confirmar
							</button>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}
