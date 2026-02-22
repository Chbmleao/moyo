"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const labelMap: Record<string, string> = {
	app: "Início",
	documentos: "Documentos",
	assinaturas: "Assinaturas",
	perfil: "Perfil",
};

export function Breadcrumbs() {
	const pathname = usePathname();

	// Only show breadcrumbs inside /app/*
	if (!pathname.startsWith("/app")) return null;

	// Build crumbs from path segments
	const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);
	// segments example: ["app", "documentos"] → crumbs: [{ label: "Início", href: "/app" }, { label: "Documentos" }]

	const crumbs: { label: string; href?: string }[] = [];
	let currentPath = "";

	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i];
		currentPath += `/${seg}`;
		const label = labelMap[seg] ?? seg;
		const isLast = i === segments.length - 1;
		crumbs.push({ label, href: isLast ? undefined : currentPath });
	}

	// If we only have "Início" (just /app), no need to render breadcrumbs
	if (crumbs.length <= 1) return null;

	return (
		<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
			{crumbs.map((crumb, i) => (
				<span key={i} className="flex items-center gap-1.5">
					{i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
					{i === 0 && <Home className="mr-0.5 h-3.5 w-3.5" />}
					{crumb.href ? (
						<Link
							href={crumb.href}
							className="transition hover:text-foreground">
							{crumb.label}
						</Link>
					) : (
						<span className="font-medium text-foreground">{crumb.label}</span>
					)}
				</span>
			))}
		</nav>
	);
}
