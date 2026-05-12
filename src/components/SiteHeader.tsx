import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navItem = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-sm transition-colors hover:text-foreground ${
        path === to ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            IA Vendedora
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navItem("/dashboard", "Dashboard")}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
          >
            Entrar
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow"
          >
            Testar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}
