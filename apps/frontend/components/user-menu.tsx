"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LogOut, User, Users, FileText, PenTool, LayoutDashboard } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface UserMenuProps {
	email: string;
	role: string;
	avatarUrl?: string | null;
	name?: string | null;
}

function getInitials(name: string | null | undefined, email: string): string {
	if (name && name.trim()) {
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		return parts[0].slice(0, 2).toUpperCase();
	}
	const local = email.split("@")[0];
	if (local.length <= 2) return local.toUpperCase();
	return local.slice(0, 2).toUpperCase();
}

export function UserMenu({ email, role, avatarUrl, name }: UserMenuProps) {
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const supabase = createSupabaseBrowserClient();

	const isProfessional = role === "professional";
	const roleLabel = isProfessional ? "Profissional" : "Paciente";

	// Close on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		function handleEsc(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		if (open) {
			document.addEventListener("mousedown", handleClick);
			document.addEventListener("keydown", handleEsc);
		}
		return () => {
			document.removeEventListener("mousedown", handleClick);
			document.removeEventListener("keydown", handleEsc);
		};
	}, [open]);

	const handleSignOut = useCallback(async () => {
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	}, [supabase.auth, router]);

	return (
		<div ref={menuRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen(prev => !prev)}
				className="flex items-center gap-2 rounded-full border border-border p-1 pr-3 transition hover:border-primary/50 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
				aria-expanded={open}
				aria-haspopup="true">
				{avatarUrl ? (
					<img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
				) : (
					<span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
						{getInitials(name, email)}
					</span>
				)}
				<ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
			</button>

			{open && (
				<div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card p-2 shadow-xl animate-fade-slide-in">
					{/* User info */}
					<div className="border-b border-border px-3 py-3">
						{name && <p className="truncate text-sm font-semibold text-foreground">{name}</p>}
						<p className="truncate text-sm text-muted-foreground">{email}</p>
						<span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
							{roleLabel}
						</span>
					</div>

					{/* Nav links */}
					<nav className="py-1">
						<Link
							href="/app"
							onClick={() => setOpen(false)}
							className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/60">
							<LayoutDashboard className="h-4 w-4 text-muted-foreground" />
							Painel
						</Link>
						{isProfessional ? (
							<Link
								href="/app/documentos"
								onClick={() => setOpen(false)}
								className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/60">
								<FileText className="h-4 w-4 text-muted-foreground" />
								Documentos
							</Link>
						) : (
							<Link
								href="/app/assinaturas"
								onClick={() => setOpen(false)}
								className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/60">
								<PenTool className="h-4 w-4 text-muted-foreground" />
								Assinaturas
							</Link>
						)}
						{isProfessional && (
							<Link
								href="/app/pacientes"
								onClick={() => setOpen(false)}
								className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/60">
								<Users className="h-4 w-4 text-muted-foreground" />
								Pacientes
							</Link>
						)}
						<Link
							href="/app/perfil"
							onClick={() => setOpen(false)}
							className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/60">
							<User className="h-4 w-4 text-muted-foreground" />
							Perfil
						</Link>
					</nav>

					{/* Logout */}
					<div className="border-t border-border pt-1">
						<button
							type="button"
							onClick={handleSignOut}
							className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10">
							<LogOut className="h-4 w-4" />
							Sair
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
