import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 mt-32">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">IA Vendedora</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} IA Vendedora. A central de IA que vende por você.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground">App</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
