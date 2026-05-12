import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, AlertTriangle, CreditCard, RefreshCcw, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { isProfileActive } from "@/lib/subscription.functions";

export const Route = createFileRoute("/assinatura-expirada")({
  component: ExpiredSubscriptionPage,
});

function ExpiredSubscriptionPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const handleCheckAgain = async () => {
    toast.info("Verificando assinatura...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    let { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile && user.email) {
      const byEmail = await supabase
        .from("profiles")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
      profile = byEmail.data;
      error = byEmail.error;
    }

    if (error) {
      console.error(error);
      toast.error("Não foi possível verificar sua assinatura.");
      return;
    }

    if (isProfileActive(profile)) {
      toast.success("Assinatura ativa. Redirecionando...");
      window.location.href = "/dashboard";
      return;
    }

    toast.error("Assinatura ainda não está ativa para este e-mail.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[450px] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 mx-auto rounded-[24px] bg-red-500/10 flex items-center justify-center glow-strong mb-8 ring-1 ring-red-500/20">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight">Assinatura Expirada</h1>
          <p className="text-muted-foreground text-sm max-w-[300px] mx-auto leading-relaxed">
            Parece que sua assinatura não está mais ativa. Renove agora para continuar usando nossas ferramentas neurais.
          </p>
        </div>

        <div className="bg-card/40 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">STATUS</div>
              <div className="text-sm font-bold text-red-400">PAGAMENTO PENDENTE</div>
            </div>
          </div>

          <div className="space-y-3">
             <button
              onClick={() => window.open(import.meta.env.VITE_LASTLINK_CHECKOUT_URL || 'https://lastlink.com', '_blank')}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all glow-strong uppercase text-xs"
            >
              RENOVAR AGORA
            </button>
            
            <button
              onClick={handleCheckAgain}
              className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black tracking-tight hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs uppercase"
            >
              <RefreshCcw className="h-4 w-4" />
              JÁ PAGUEI, VERIFICAR
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <LogOut className="h-4 w-4" />
          SAIR DA CONTA
        </button>
      </div>
    </div>
  );
}
