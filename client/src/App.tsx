import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminUsers from "@/pages/admin-users";
import MixEscolherTime from "@/pages/mix-escolher-time";
import Perfil from "@/pages/perfil";
import Rankings from "@/pages/rankings";
import ServidorComandos from "@/pages/servidor-comandos";
import ServidorMapas from "@/pages/servidor-mapas";
import ServidorSkins from "@/pages/servidor-skins";
import ServidorSteamId from "@/pages/servidor-steamid";
import Patrocinadores from "@/pages/patrocinadores";
import PartidasMinhas from "@/pages/partidas-minhas";
import PartidasTodas from "@/pages/partidas-todas";
import AdminImport from "@/pages/admin-import";
import AdminFinanceiro from "@/pages/admin-financeiro";
import Denuncias from "@/pages/denuncias";
import AdminDenuncias from "@/pages/admin-denuncias";
import PioresJogadores from "@/pages/piores-jogadores";
import PerfilJogador from "@/pages/perfil-jogador";
import CompararJogadores from "@/pages/comparar-jogadores";
import MapasMaisJogados from "@/pages/mapas-mais-jogados";
import Jogadores from "@/pages/jogadores";
import Campeonato from "@/pages/campeonato";
import { ServerCostPopup } from "@/components/server-cost-popup";
import { AcePopup } from "@/components/ace-popup";
import logoUrl from "@assets/WhatsApp_Image_2025-11-17_at_01.47.14_(1)_1764723428520.jpeg";

function Router() {
  const { user, isAuthenticated, isLoading, isError } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <img 
          src={logoUrl} 
          alt="Inimigos da Bala" 
          className="h-24 w-24 rounded-lg object-contain animate-pulse"
        />
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated || isError) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={user?.isAdmin ? AdminDashboard : Dashboard} />
      <Route path="/perfil" component={Perfil} />
      <Route path="/mix/escolher-time" component={MixEscolherTime} />
      <Route path="/jogadores" component={Jogadores} />
      <Route path="/rankings" component={Rankings} />
      <Route path="/piores-jogadores" component={PioresJogadores} />
      <Route path="/jogador/:id" component={PerfilJogador} />
      <Route path="/comparar-jogadores" component={CompararJogadores} />
      <Route path="/servidor/comandos" component={ServidorComandos} />
      <Route path="/servidor/mapas" component={ServidorMapas} />
      <Route path="/servidor/skins" component={ServidorSkins} />
      <Route path="/servidor/steamid" component={ServidorSteamId} />
      <Route path="/patrocinadores" component={Patrocinadores} />
      <Route path="/campeonato" component={Campeonato} />
      <Route path="/denuncias" component={Denuncias} />
      <Route path="/partidas/minhas" component={PartidasMinhas} />
      <Route path="/partidas/todas" component={PartidasTodas} />
      <Route path="/partidas/mapas" component={MapasMaisJogados} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/import" component={AdminImport} />
      <Route path="/admin/financeiro" component={AdminFinanceiro} />
      <Route path="/admin/denuncias" component={AdminDenuncias} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <img 
                src={logoUrl} 
                alt="Inimigos da Bala" 
                className="h-8 w-8 rounded object-contain"
              />
              <span className="font-semibold hidden sm:inline">Inimigos da Bala</span>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, isError } = useAuth();

  if (isLoading) {
    return <Router />;
  }

  if (!isAuthenticated || isError) {
    return <Router />;
  }

  return (
    <AuthenticatedLayout>
      <Router />
      <ServerCostPopup />
      <AcePopup />
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
