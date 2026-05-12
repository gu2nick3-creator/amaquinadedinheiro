import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, ShoppingBag, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/boas-vindas")({
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[500px] space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 mx-auto rounded-[24px] bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-strong mb-8 ring-1 ring-white/20">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-black tracking-tight leading-tight">
            Seja bem-vindo à <br />
            <span className="gradient-text">IA Vendedora</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto">
            A ferramenta definitiva para escalar suas vendas com inteligência artificial.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="bg-card/40 border border-white/10 rounded-3xl p-6 flex gap-4 items-start">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-1">Aviso Importante</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Você deve criar sua conta usando o <span className="text-white font-bold italic">mesmo e-mail</span> utilizado no momento da compra para liberar o acesso automaticamente.
              </p>
            </div>
          </div>

          <div className="bg-card/40 border border-white/10 rounded-3xl p-6 flex gap-4 items-start">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20">
              <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-1">Acesso Imediato</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Após o cadastro, nosso sistema validará sua assinatura em tempo real para liberar todas as ferramentas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate({ to: "/signup" })}
            className="w-full bg-primary text-primary-foreground py-5 rounded-2xl font-black tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all glow-strong flex items-center justify-center gap-2 group text-sm uppercase"
          >
            CRIAR CONTA AGORA
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => navigate({ to: "/login" })}
            className="w-full bg-white/5 border border-white/10 text-white py-5 rounded-2xl font-black tracking-tight hover:bg-white/10 transition-all text-sm uppercase"
          >
            JÁ TENHO UMA CONTA
          </button>
        </div>
      </div>
    </div>
  );
}
