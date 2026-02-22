"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
	id: number;
	message: string;
	variant: ToastVariant;
}

interface ToastContextValue {
	success: (message: string) => void;
	error: (message: string) => void;
	info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function useToast(): ToastContextValue {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
	return ctx;
}

const variantStyles: Record<ToastVariant, string> = {
	success: "border-primary/40 bg-primary/10 text-foreground",
	error: "border-destructive/40 bg-destructive/10 text-foreground",
	info: "border-border bg-card text-foreground",
};

const variantDot: Record<ToastVariant, string> = {
	success: "bg-primary",
	error: "bg-destructive",
	info: "bg-muted-foreground",
};

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const addToast = useCallback((message: string, variant: ToastVariant) => {
		const id = ++nextId;
		setToasts(prev => [...prev, { id, message, variant }]);
		setTimeout(() => {
			setToasts(prev => prev.filter(t => t.id !== id));
		}, 4000);
	}, []);

	const dismiss = useCallback((id: number) => {
		setToasts(prev => prev.filter(t => t.id !== id));
	}, []);

	const value: ToastContextValue = {
		success: useCallback((msg: string) => addToast(msg, "success"), [addToast]),
		error: useCallback((msg: string) => addToast(msg, "error"), [addToast]),
		info: useCallback((msg: string) => addToast(msg, "info"), [addToast]),
	};

	return (
		<ToastContext.Provider value={value}>
			{children}
			{/* Toast container */}
			<div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2" aria-live="polite">
				{toasts.map(toast => (
					<div
						key={toast.id}
						className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-toast-in ${variantStyles[toast.variant]}`}>
						<span className={`h-2 w-2 shrink-0 rounded-full ${variantDot[toast.variant]}`} />
						<p className="flex-1 text-sm font-medium">{toast.message}</p>
						<button
							type="button"
							onClick={() => dismiss(toast.id)}
							className="shrink-0 rounded p-0.5 text-muted-foreground transition hover:text-foreground">
							<X className="h-4 w-4" />
						</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}
