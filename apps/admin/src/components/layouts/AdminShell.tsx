"use client";

import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { Logo } from "@repo/ui/logo";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { useAuthStore } from "@/lib/stores/authStore";
import { useLogout } from "@/features/auth/hooks";
import { AdminNavList } from "@/components/layouts/AdminNavList";
import { AdminMobileNav } from "@/components/layouts/AdminMobileNav";

function formatRole(role: string) {
	return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Sidebar() {
	return (
		<aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-background lg:flex">
			<div className="flex h-16 items-center border-b border-border px-6">
				<Logo size="sm" />
			</div>
			<AdminNavList className="flex-1 overflow-y-auto px-3 py-6" />
		</aside>
	);
}

function Topbar() {
	const email = useAuthStore((state) => state.email);
	const staffRole = useAuthStore((state) => state.staffRole);
	const logout = useLogout();
	const [navOpen, setNavOpen] = useState(false);

	return (
		<header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:pl-6">
			<div className="flex items-center gap-2 lg:hidden">
				<button
					type="button"
					onClick={() => setNavOpen(true)}
					aria-label="Open menu"
					className="flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
				>
					<Menu className="size-5" aria-hidden="true" />
				</button>
				<Logo size="sm" />
				<AdminMobileNav open={navOpen} onOpenChange={setNavOpen} />
			</div>
			<div className="hidden lg:block" />
			<div className="flex items-center gap-2 sm:gap-3">
				{staffRole && <Badge variant="outline" className="hidden sm:inline-flex">{formatRole(staffRole)}</Badge>}
				<span className="hidden text-b4 text-muted-foreground sm:inline">{email}</span>
				<Button type="button" variant="outline" size="small" onClick={() => logout()}>
					<LogOut className="size-4" aria-hidden="true" />
					<span className="hidden sm:inline">Sign Out</span>
				</Button>
			</div>
		</header>
	);
}

/** The ops-console shell — sidebar grouped by domain (see `navConfig`) +
 * topbar with the signed-in staff member's identity/role. Deliberately its
 * own, denser layout rather than reusing anything from apps/web's
 * `DashboardLayout` — this app has a completely different audience and
 * information density, and the two apps don't share a deployment to begin
 * with (see the build plan's own "why a separate app" note). */
function AdminShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen bg-muted">
			<Sidebar />
			<div className="flex flex-1 flex-col lg:ml-64">
				<Topbar />
				<main className="flex-1 p-4 sm:p-6">{children}</main>
			</div>
		</div>
	);
}

export { AdminShell };
