import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { isProfileActive } from "@/lib/subscription.functions";
import {
  Sparkles, MessageSquare, Wand2, Library, Workflow, Users, 
  TrendingUp, Zap, Search, Bell, BarChart3, LayoutGrid,
  Copy, RotateCcw, Star, ChevronRight, CheckCircle2,
  FileText, ShieldCheck, Menu, X, Mic, Image, ScanText, Loader2, LogOut
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    let { data: profile } = await supabase
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
    }

    if (!isProfileActive(profile)) {
      throw redirect({ to: "/assinatura-expirada" });
    }
  },
  component: Dashboard,
});


type SectionKey = "home" | "responder" | "prompts" | "copy" | "funis" | "historico";

function Dashboard() {
  const [section, setSection] = useState<SectionKey>("home");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch Profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        setUserProfile(profile);

        // Fetch Usage
        const { data: usageLimit } = await supabase
          .from("usage_limits")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        setUsage(usageLimit);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };


  const navItems = [
    { key: "home", label: "Início", icon: LayoutGrid },
    { key: "responder", label: "Responder IA", icon: Zap, badge: "NOVO" },
    { key: "prompts", label: "Prompts", icon: Library },
    { key: "copy", label: "Copy", icon: Wand2 },
    { key: "funis", label: "Funis", icon: Workflow },
    { key: "historico", label: "Histórico", icon: MessageSquare },
  ];

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground selection:bg-primary/30">
      {/* Sidebar - Desktop & Mobile Overlay */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-card/95 backdrop-blur-2xl border-r border-white/10 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl
        ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 lg:w-72"}
      `}>
        <div className="h-20 flex items-center px-6 gap-3 mb-4">
          <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-strong ring-1 ring-white/20">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className={`flex flex-col transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100"}`}>
            <span className="font-display font-bold text-xl tracking-tight leading-none whitespace-nowrap">IA Vendedora</span>
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
              {userProfile?.plano || "VIP"}
            </span>
          </div>

        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setSection(item.key as SectionKey);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 relative group ${
                section === item.key 
                ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(var(--primary),0.05)] ring-1 ring-primary/20" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-300 ${section === item.key ? "scale-110" : "group-hover:scale-110"}`} />
              <span className={`text-sm font-semibold tracking-tight text-left whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100"}`}>
                {item.label}
              </span>
              {item.badge && (isSidebarOpen || window.innerWidth >= 1024) && (
                <span className="text-[9px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded-full ring-1 ring-primary/30">
                  {item.badge}
                </span>
              )}
              {section === item.key && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-gradient-to-br from-primary/15 via-accent/5 to-transparent rounded-3xl p-5 border border-white/10 relative overflow-hidden">
            <div className={`transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100"}`}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="font-bold text-xs uppercase tracking-tighter">Acesso Ativo</span>
              </div>
              <div className="text-[10px] text-muted-foreground mb-4">Sessão Segura</div>
              <div className="w-full py-2.5 rounded-xl bg-white/10 text-white text-[10px] font-black flex items-center justify-center border border-white/10 uppercase mb-2">Verificado</div>
              <button 
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black flex items-center justify-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all gap-2"
              >
                <LogOut className="h-3 w-3" />
                SAIR
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col lg:ml-72 transition-all duration-500 overflow-x-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-4 lg:px-10 w-full box-border">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl focus-within:ring-1 focus-within:ring-primary/50 transition-all group w-full lg:w-96">
              <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input placeholder="Buscar no sistema..." className="bg-transparent text-sm outline-none w-full placeholder:text-zinc-700 text-white" />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
             <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10 text-[10px] font-black uppercase tracking-wider text-primary">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               Online
             </div>
             <div className="relative cursor-pointer hover:scale-110 transition-transform">
               <Bell className="h-5 w-5 text-muted-foreground" />
               <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full ring-2 ring-background" />
             </div>
             <div className="h-10 w-10 lg:w-auto lg:px-5 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest text-primary truncate max-w-[150px]">
                  {userProfile?.nome?.split(' ')[0] || "USUÁRIO"}
                </span>
             </div>

          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 lg:px-6 py-6 lg:py-10 space-y-8 lg:space-y-12 pb-32 box-border">
          {section === "home" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <HomeView onNavigate={(s) => setSection(s)} />
            </div>
          )}
          {section === "responder" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <ResponderView usage={usage} setUsage={setUsage} />
            </div>
          )}
          {section === "prompts" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <PromptsView onNavigate={(s) => setSection(s)} />
            </div>
          )}
          {section === "copy" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <CopyGeneratorView setUsage={setUsage} />
            </div>
          )}
          {section === "funis" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <FunisView />
            </div>
          )}
          {section === "historico" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <HistoricoView />
            </div>
          )}
        </div>

        {/* Bottom Nav - Mobile Only */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-20 bg-card/90 backdrop-blur-3xl border-t border-white/10 flex items-center justify-around px-4 pb-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          {navItems.slice(0, 4).map((item) => (
            <button 
              key={item.key}
              onClick={() => setSection(item.key as SectionKey)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${section === item.key ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <item.icon className={`h-6 w-6 transition-transform ${section === item.key ? "scale-110" : ""}`} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
              {section === item.key && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary glow shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
              )}
            </button>
          ))}
          <button 
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="h-6 w-6 flex items-center justify-center">
              <Menu className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Mais</span>
          </button>
        </nav>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function HomeView({ onNavigate }: { onNavigate: (s: SectionKey) => void }) {
  const [stats, setStats] = useState({
    generations: 0,
    conversions: 0,
    rate: "0%",
    time: "0h"
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from("ai_generations")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", user.id);
        
        setStats(prev => ({ ...prev, generations: count || 0 }));
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="w-full space-y-8 lg:space-y-12 overflow-x-hidden">
      {/* Hero */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-accent/5 to-transparent p-6 lg:p-12 rounded-[32px] lg:rounded-[40px] border border-white/10 relative overflow-hidden group box-border">
         <div className="absolute inset-0 grid-bg opacity-30" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 lg:h-[500px] lg:w-[500px] bg-primary/20 blur-[80px] lg:blur-[120px] rounded-full opacity-20" />
         
         <div className="relative z-10">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] lg:text-[10px] font-bold text-primary uppercase tracking-widest mb-4 lg:mb-6">
             <Sparkles className="h-3 w-3" /> HUB DE VENDAS IA
           </div>
           <h1 className="text-4xl lg:text-6xl font-display font-black tracking-tight leading-[0.9] mb-4">
             Seu Centro <br className="hidden sm:block"/> <span className="gradient-text">de Vendas</span>
           </h1>
           <p className="text-sm lg:text-lg text-muted-foreground mt-4 max-w-xl leading-relaxed">
             Automatize respostas e feche clientes de alto valor usando redes neurais personalizadas.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 mt-8">
             <button onClick={() => onNavigate("responder")} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black tracking-tight hover:scale-105 transition-all glow-strong uppercase text-sm">INICIAR GERADOR AGORA</button>
           </div>
         </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: "Geradas Total", v: stats.generations, icon: Zap, trend: "+100%", color: "text-primary" },
          { label: "Clientes Fechados", v: stats.conversions, icon: Users, trend: "0%", color: "text-accent" },
          { label: "Taxa de Conv.", v: stats.rate, icon: BarChart3, trend: "0%", color: "text-primary" },
          { label: "Tempo Otimizado", v: stats.time, icon: TrendingUp, trend: "0h", color: "text-accent" },
        ].map(s => (
          <div key={s.label} className="bg-card/40 border border-white/5 p-6 lg:p-8 rounded-3xl hover:border-primary/30 transition-all duration-500 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
            <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform ${s.color}`}>
              <s.icon className="h-5 w-5 lg:h-6 lg:h-6" />
            </div>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <div className="text-2xl lg:text-3xl font-black font-display tracking-tighter mb-1 text-white">{s.v}</div>
                <div className="text-[10px] lg:text-[11px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">{s.label}</div>
              </div>
              <div className={`text-[9px] lg:text-[10px] font-black px-2 py-1 rounded-lg bg-white/5 ring-1 ring-white/10 ${s.color}`}>
                {s.trend}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResponderView({ usage, setUsage }: { usage: any, setUsage: (u: any) => void }) {
  const [typed, setTyped] = useState("");
  const [generating, setGenerating] = useState(false);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"text" | "audio" | "image">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTone, setSelectedTone] = useState("Profissional");
  const [selectedCategory, setSelectedCategory] = useState("Vendas");
  const [lastGeneratedId, setLastGeneratedId] = useState<string | null>(null);

  const handleGenerate = async (retryCount = 0) => {
    if (!input.trim() && mode === "text") return;
    
    // Check usage limits
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: usage } = await supabase
      .from("usage_limits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (usage && (usage.generations_today ?? 0) >= (usage.generation_limit ?? 10000)) {
      toast.error("Limite de uso atingido. Por favor, entre em contato com o suporte.");
      return;
    }

    setGenerating(true);
    setTyped("");
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-response", {
        body: {
          input_text: input,
          tone: selectedTone,
          category: selectedCategory,
        },
      });

      if (error) {
        console.error("Supabase Edge Function error:", error);
        throw error;
      }

      if (!data || !data.output_text) {
        console.error("Invalid response format from AI function:", data);
        throw new Error("Resposta inválida da IA");
      }

      const responseText = data.output_text;
      
      setGenerating(false);
      let i = 0;
      const interval = setInterval(() => {
        setTyped(responseText.slice(0, i));
        i += 3;
        if (i > responseText.length + 3) {
          clearInterval(interval);
          
          // Refresh statistics if on home or history view
          // The increment_usage is now handled server-side in the edge function
          // But we update the local state for immediate feedback
          if (usage) {
            setUsage({
              ...usage,
              generations_today: (usage.generations_today || 0) + 1
            });
          }
          
          // O histórico é salvo pela Edge Function generate-ai-response usando o usuário autenticado.
          
          toast.success("Resposta gerada e salva com sucesso!");
        }
      }, 15);

    } catch (err: any) {
      console.error("Error generating AI response:", err);
      
      if (retryCount < 2) {
        toast.info("Conexão instável. Tentando novamente...");
        setTimeout(() => handleGenerate(retryCount + 1), 1000);
      } else {
        setGenerating(false);
        toast.error("Erro ao gerar resposta. Verifique sua conexão e tente novamente.");
      }
    }
  };

  const simulateAudioTranscription = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setInput("O cliente perguntou se o software tem integração com CRM e se o suporte é 24 horas.");
      setMode("text");
    }, 3000);
  };

  const simulateImageOCR = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setInput("[Conteúdo extraído do Print]: Cliente: 'Gostei muito, mas o preço está fora do meu orçamento agora. Tem algum desconto?'");
      setMode("text");
    }, 2500);
  };

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
      <div className="px-2 lg:px-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-display font-black tracking-tight mb-2 text-white">Resposta Inteligente</h2>
          <p className="text-sm text-muted-foreground">Análise neural multimodal para conversão instantânea.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10 text-[10px] font-black uppercase tracking-wider text-primary self-start sm:self-center">
           <Loader2 className="h-3 w-3 animate-spin" />
           Processador Ativo
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card/30 border border-white/5 rounded-[32px] p-6 lg:p-8 space-y-6">
            
            {/* Mode Selector - Text Only */}
            <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5">
              <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg">
                <MessageSquare className="h-4 w-4" />
                <span>Texto</span>
              </div>
            </div>

            <div className="min-h-[250px] flex flex-col">
              <div className="space-y-4 flex-1 flex flex-col">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Mensagem do Cliente</label>
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 outline-none focus:border-primary/50 transition-all text-sm leading-relaxed placeholder:text-zinc-800 resize-none"
                  placeholder="Cole a mensagem do cliente aqui..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Categoria da Resposta</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["Vendas", "Fechamento", "Objeções", "Follow-up", "Recuperação"].map((c) => (
                  <button 
                    key={c} 
                    onClick={() => setSelectedCategory(c)}
                    className={`py-2.5 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest ${
                      selectedCategory === c ? "bg-primary/20 text-primary border-primary/40" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Tom da Conversa</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
                {["Profissional", "Agressivo", "Amigável", "Premium"].map((t) => (
                  <button 
                    key={t} 
                    onClick={() => setSelectedTone(t)}
                    className={`py-3 lg:py-4 rounded-xl border transition-all text-[9px] lg:text-[10px] font-black uppercase tracking-widest ${
                      selectedTone === t ? "bg-primary/20 text-primary border-primary/40" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => handleGenerate()}
              disabled={generating || (!input.trim() && mode === "text") || isRecording || isUploading}
              className="w-full h-16 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all glow-strong disabled:opacity-50 disabled:scale-100"
            >
              <Zap className="h-5 w-5 fill-current" />
              {generating ? "Processando..." : "Gerar Resposta IA"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {["Pedido de desconto", "Sem dinheiro", "Vou pensar"].map(opt => (
              <button key={opt} onClick={() => { setMode("text"); setInput(`O cliente está com a seguinte objeção: ${opt}`); }} className="px-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-bold hover:bg-white/10 transition-all text-zinc-400 active:scale-95">
                Ação Rápida: {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <div className="flex-1 bg-gradient-to-b from-card/50 to-card/20 border border-white/10 rounded-[32px] lg:rounded-[40px] p-6 lg:p-10 relative overflow-hidden flex flex-col min-h-[300px]">
             
             <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-bold text-sm tracking-tight">SUGESTÃO DA IA</span>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => typed && navigator.clipboard.writeText(typed)} className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"><Copy className="h-3.5 w-3.5" /></button>
                   <button onClick={() => setTyped("")} className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"><RotateCcw className="h-3.5 w-3.5" /></button>
                </div>
             </div>

             <div className="flex-1 relative z-10">
                {generating ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                     <div className="h-12 w-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Analisando...</span>
                  </div>
                ) : typed ? (
                  <div className="space-y-4">
                    <p className="text-base lg:text-lg font-medium leading-relaxed text-zinc-200 typing-cursor">{typed}</p>
                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-500 delay-500">
                      <button onClick={() => navigator.clipboard.writeText(typed)} className="flex-1 bg-primary/10 border border-primary/20 text-primary py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center justify-center gap-2">
                        <Copy className="h-3 w-3" /> Copiar Resposta
                      </button>
                      <button onClick={() => handleGenerate()} className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <RotateCcw className="h-3 w-3" /> Regenerar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                      <div className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center relative z-10">
                        <Sparkles className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                  </div>
                )}
             </div>

             <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4 relative z-10">
                <div className="space-y-2">
                   <div className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confiança</div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-[94%] bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Taxa de Conv.</div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-[88%] bg-accent shadow-[0_0_10px_rgba(var(--accent),0.5)]" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromptsView({ onNavigate }: { onNavigate: (s: SectionKey) => void }) {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrompts = async () => {
      const { data } = await supabase
        .from("prompt_library")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setPrompts(data);
      setLoading(false);
    };
    fetchPrompts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-display font-black tracking-tight mb-2 text-white">Biblioteca de Prompts</h2>
          <p className="text-muted-foreground">Frameworks premium para todos os nichos de mercado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {prompts.map((prompt, i) => (
          <div key={prompt.id} onClick={() => onNavigate("responder")} className="bg-card/30 border border-white/5 rounded-[32px] p-6 lg:p-8 group hover:border-primary/40 transition-all duration-500 cursor-pointer overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 lg:mb-6 text-primary group-hover:scale-110 transition-transform">
                <Star className="h-5 w-5 lg:h-6 lg:h-6" />
              </div>
              <h3 className="text-lg lg:text-xl font-black text-white mb-2">{prompt.title}</h3>
              <p className="text-[11px] lg:text-xs text-muted-foreground leading-relaxed mb-6 italic line-clamp-2">"{prompt.description}"</p>
              <div className="flex items-center justify-between">
                 <div className="text-[9px] lg:text-[10px] font-bold text-primary uppercase">{prompt.niche || "Geral"}</div>
                 <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                    <ChevronRight className="h-4 w-4" />
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopyGeneratorView({ setUsage }: { setUsage: (u: any) => void }) {
  const [typed, setTyped] = useState("");
  const [generating, setGenerating] = useState(false);
  const [input, setInput] = useState("");
  const [target, setTarget] = useState("");
  const [objective, setObjective] = useState("Venda Direta");
  
  const handleGenerate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setGenerating(true);
    setTyped("");
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-response", {
        body: { 
          input_text: `Gere uma copy de vendas para: ${input}. Público: ${target}. Objetivo: ${objective}.`, 
          tone: "Persuasivo", 
          category: "Copywriting",
          userId: user.id 
        },
      });

      if (error) throw error;

      const responseText = data.output_text;
      
      setGenerating(false);
      let i = 0;
      const interval = setInterval(() => {
        setTyped(responseText.slice(0, i));
        i += 3;
        if (i > responseText.length) {
          clearInterval(interval);
          // Update local usage state
          setUsage((prev: any) => ({
            ...prev,
            generations_today: (prev?.generations_today || 0) + 1
          }));
          toast.success("Copy gerada com sucesso!");
        }
      }, 10);
    } catch (error: any) {
      console.error("Erro ao gerar copy:", error);
      toast.error("Erro ao gerar copy. Tente novamente.");
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl lg:text-4xl font-display font-black tracking-tight mb-2">Gerador de Copy</h2>
          <p className="text-sm text-muted-foreground">Crie anúncios e mensagens de vendas de alta conversão.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-7 bg-card/30 border border-white/5 rounded-[32px] p-6 lg:p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Produto ou Serviço</label>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl p-4 outline-none focus:border-primary/50 transition-all text-sm" 
              placeholder="Ex: Curso de Marketing Digital" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Público-Alvo</label>
            <input 
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl p-4 outline-none focus:border-primary/50 transition-all text-sm" 
              placeholder="Ex: Empreendedores iniciantes" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Objetivo</label>
            <select 
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl p-4 outline-none focus:border-primary/50 transition-all appearance-none text-sm"
            >
              <option>Venda Direta</option>
              <option>Lead Generation</option>
              <option>Agendamento</option>
            </select>
          </div>
          <button 
            onClick={handleGenerate}
            className="w-full h-16 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all glow-strong text-sm"
          >
            {generating ? "Gerando..." : "GERAR COPY AGORA"}
          </button>
        </div>

        <div className="lg:col-span-5 bg-gradient-to-b from-card/50 to-card/20 border border-white/10 rounded-[32px] lg:rounded-[40px] p-6 lg:p-10 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-sm">COPY GERADA</span>
          </div>
          <div className="flex-1 whitespace-pre-wrap font-medium text-zinc-200 text-sm lg:text-base">
            {generating ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Criando...</span>
              </div>
            ) : typed ? typed : (
              <div className="h-full flex items-center justify-center opacity-20 text-center uppercase tracking-widest text-[10px] font-black">Aguardando Parâmetros</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FunisView() {
  const [funnels, setFunnels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunnels = async () => {
      const { data } = await supabase
        .from("funnels")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setFunnels(data);
      setLoading(false);
    };
    fetchFunnels();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-10">
      <div>
        <h2 className="text-3xl lg:text-4xl font-display font-black tracking-tight mb-2 text-white">Funis Prontos</h2>
        <p className="text-sm text-muted-foreground">Estruturas validadas para automatizar seu processo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {funnels.map((f) => (
          <div key={f.id} className="bg-card/30 border border-white/5 rounded-[32px] p-6 lg:p-8 flex items-center justify-between group hover:border-primary/40 transition-all cursor-pointer">
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="h-12 w-12 lg:h-16 lg:w-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Workflow className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg lg:text-xl font-black text-white">{f.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[9px] lg:text-[10px] font-bold text-muted-foreground uppercase">{f.niche}</span>
                  <div className="h-1 w-1 rounded-full bg-zinc-700" />
                  <span className={`text-[9px] lg:text-[10px] font-bold uppercase ${f.is_premium ? "text-primary" : "text-zinc-500"}`}>{f.is_premium ? "Premium" : "Free"}</span>
                </div>
              </div>
            </div>
            <button className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 font-bold text-[10px] uppercase hover:bg-white/10 transition-all text-white">Ver Funil</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoricoView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("ai_generations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (data) setLogs(data);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl lg:text-4xl font-display font-black tracking-tight mb-2 text-white">Histórico de IA</h2>
          <p className="text-sm text-muted-foreground">Registro de todas as interações neurais.</p>
        </div>
      </div>

      <div className="bg-card/30 border border-white/5 rounded-[32px] overflow-x-auto overflow-y-hidden">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
             <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 text-muted-foreground opacity-20" />
             </div>
             <h3 className="text-lg font-bold text-white mb-2">Nenhum histórico ainda</h3>
             <p className="text-sm text-muted-foreground max-w-xs">Suas gerações de IA aparecerão aqui assim que você começar a usar a plataforma.</p>
             <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Começar Agora</button>
          </div>
        ) : (
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 lg:px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data</th>
                <th className="px-6 lg:px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mensagem</th>
                <th className="px-6 lg:px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo</th>
                <th className="px-6 lg:px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/5 last:border-0">
                  <td className="px-6 lg:px-8 py-6">
                    <div className="font-bold text-sm text-white">
                      {new Date(log.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase mt-1">
                      {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 lg:px-8 py-6 text-xs lg:text-sm text-muted-foreground truncate max-w-[200px]">{log.input_text}</td>
                  <td className="px-6 lg:px-8 py-6">
                    <span className={`px-2.5 py-1 rounded-full text-[8px] lg:text-[9px] font-black uppercase bg-primary/20 text-primary`}>
                      {log.category || "Geral"}
                    </span>
                  </td>
                  <td className="px-6 lg:px-8 py-6 text-right">
                    <button className="h-8 w-8 rounded-lg bg-white/5 inline-flex items-center justify-center hover:bg-primary hover:text-black transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PlaceholderView({ title, icon: Icon, onNavigate }: { title: string; icon: any; onNavigate: (s: SectionKey) => void }) {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="h-24 w-24 rounded-[40px] bg-primary/10 border border-primary/20 flex items-center justify-center glow-strong">
          <Icon className="h-10 w-10 text-primary" />
       </div>
       <div className="text-center space-y-2">
          <h2 className="text-3xl font-display font-black tracking-tight">{title}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Esta ferramenta de elite está sendo sincronizada com seu banco de dados neural. Disponível em breve para sua conta Enterprise.</p>
       </div>
       <button onClick={() => onNavigate("home")} className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all">VOLTAR AO INÍCIO</button>
    </div>
  );
}
