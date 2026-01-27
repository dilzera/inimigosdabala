import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import {
  Users,
  LogOut,
  Trophy,
  User,
  Server,
  Terminal,
  Map,
  Palette,
  Key,
  Heart,
  Link2,
  MessageCircle,
  Phone,
  Gamepad2,
  History,
  Settings,
  ChevronRight,
  Swords,
  FileUp,
  DollarSign,
  Copy,
  Check,
  AlertTriangle,
  Skull,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import logoUrl from "@assets/WhatsApp_Image_2025-11-17_at_01.47.14_(1)_1764723428520.jpeg";

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const copyToClipboard = async (text: string, linkType: string) => {
    let copied = false;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (err) {
      copied = false;
    }
    
    if (!copied) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand("copy");
        document.body.removeChild(textArea);
        copied = result;
      } catch (err) {
        copied = false;
      }
    }
    
    if (copied) {
      setCopiedLink(linkType);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopiedLink(null), 2000);
    } else {
      toast({
        title: "Erro ao copiar",
        description: `Copie manualmente: ${text}`,
        variant: "destructive",
      });
    }
  };

  const getInitials = (user: typeof userType) => {
    if (!user) return "?";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.nickname) {
      return user.nickname.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "IB";
  };

  const userType = user;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img 
            src={logoUrl} 
            alt="Inimigos da Bala" 
            className="h-12 w-12 rounded-md object-contain"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">Inimigos da Bala</span>
            <span className="text-xs text-muted-foreground">Counter-Strike 2</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider text-xs">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton data-testid="nav-mix">
                      <Swords className="h-4 w-4" />
                      <span>MIX</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === "/mix/escolher-time"}
                          data-testid="nav-escolher-time"
                        >
                          <Link href="/mix/escolher-time">
                            <Users className="h-4 w-4" />
                            <span>Escolher Time do Mix</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/perfil"}
                  data-testid="nav-perfil"
                >
                  <Link href="/perfil">
                    <User className="h-4 w-4" />
                    <span>Perfil de Usuário</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/jogadores"}
                  data-testid="nav-jogadores"
                >
                  <Link href="/jogadores">
                    <Users className="h-4 w-4" />
                    <span>Jogadores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/rankings"}
                  data-testid="nav-rankings"
                >
                  <Link href="/rankings">
                    <Trophy className="h-4 w-4" />
                    <span>Melhores Jogadores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/piores-jogadores"}
                  data-testid="nav-piores-jogadores"
                >
                  <Link href="/piores-jogadores">
                    <Skull className="h-4 w-4" />
                    <span>Piores Jogadores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/ranking-mensal"}
                  data-testid="nav-ranking-mensal"
                >
                  <Link href="/ranking-mensal">
                    <Calendar className="h-4 w-4" />
                    <span>Ranking Mensal</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/comparar-jogadores"}
                  data-testid="nav-comparar-jogadores"
                >
                  <Link href="/comparar-jogadores">
                    <Users className="h-4 w-4" />
                    <span>Comparar Players</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton data-testid="nav-servidor">
                      <Server className="h-4 w-4" />
                      <span>Servidor</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === "/servidor/comandos"}
                          data-testid="nav-comandos"
                        >
                          <Link href="/servidor/comandos">
                            <Terminal className="h-4 w-4" />
                            <span>Comandos do Servidor</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === "/servidor/mapas"}
                          data-testid="nav-mapas"
                        >
                          <Link href="/servidor/mapas">
                            <Map className="h-4 w-4" />
                            <span>Mapas de Treino</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === "/servidor/skins"}
                          data-testid="nav-skins"
                        >
                          <Link href="/servidor/skins">
                            <Palette className="h-4 w-4" />
                            <span>Como Colocar as Skins</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === "/servidor/steamid"}
                          data-testid="nav-steamid"
                        >
                          <Link href="/servidor/steamid">
                            <Key className="h-4 w-4" />
                            <span>SteamID64</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          className="justify-between cursor-pointer"
                          onClick={() => copyToClipboard("connect 103.14.27.41:27273; password 539102", "serverip")}
                          data-testid="button-copy-serverip"
                        >
                          <div className="flex items-center gap-2">
                            <Gamepad2 className="h-4 w-4" />
                            <span>IP Servidor Privado</span>
                          </div>
                          {copiedLink === "serverip" ? (
                            <Check className="h-4 w-4 text-green-500" data-testid="icon-copied-serverip" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" data-testid="icon-copy-serverip" />
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/campeonato"}
                  data-testid="nav-campeonato"
                >
                  <Link href="/campeonato">
                    <Trophy className="h-4 w-4" />
                    <span>Campeonato</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/patrocinadores"}
                  data-testid="nav-patrocinadores"
                >
                  <Link href="/patrocinadores">
                    <Heart className="h-4 w-4" />
                    <span>Patrocinadores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/denuncias"}
                  data-testid="nav-denuncias"
                >
                  <Link href="/denuncias">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Denúncias</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton data-testid="nav-links">
                      <Link2 className="h-4 w-4" />
                      <span>Links</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          className="justify-between cursor-pointer"
                          onClick={() => copyToClipboard("https://discord.gg/2mXFJj88", "discord")}
                          data-testid="button-copy-discord"
                        >
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>Discord</span>
                          </div>
                          {copiedLink === "discord" ? (
                            <Check className="h-4 w-4 text-green-500" data-testid="icon-copied-discord" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" data-testid="icon-copy-discord" />
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          className="justify-between cursor-pointer"
                          onClick={() => copyToClipboard("https://chat.whatsapp.com/GzgiTtipgNX1sOPF3ybtYt", "whatsapp")}
                          data-testid="button-copy-whatsapp"
                        >
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>WhatsApp</span>
                          </div>
                          {copiedLink === "whatsapp" ? (
                            <Check className="h-4 w-4 text-green-500" data-testid="icon-copied-whatsapp" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" data-testid="icon-copy-whatsapp" />
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton data-testid="nav-partidas">
                      <Gamepad2 className="h-4 w-4" />
                      <span>Partidas</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === "/partidas/minhas"}
                          data-testid="nav-minhas-partidas"
                        >
                          <Link href="/partidas/minhas">
                            <History className="h-4 w-4" />
                            <span>Jogadas por você</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === "/partidas/todas"}
                          data-testid="nav-todas-partidas"
                        >
                          <Link href="/partidas/todas">
                            <Gamepad2 className="h-4 w-4" />
                            <span>Todas</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === "/partidas/mapas"}
                          data-testid="nav-mapas-mais-jogados"
                        >
                          <Link href="/partidas/mapas">
                            <Map className="h-4 w-4" />
                            <span>Mapas Mais Jogados</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {user?.isAdmin && (
                <Collapsible className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton data-testid="nav-admin">
                        <Settings className="h-4 w-4" />
                        <span>Painel Admin</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location === "/admin/users"}
                            data-testid="nav-gerenciar-usuarios"
                          >
                            <Link href="/admin/users">
                              <Users className="h-4 w-4" />
                              <span>Gerenciar Usuários</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location === "/admin/import"}
                            data-testid="nav-importar-partida"
                          >
                            <Link href="/admin/import">
                              <FileUp className="h-4 w-4" />
                              <span>Importar Partida</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location === "/admin/financeiro"}
                            data-testid="nav-financeiro"
                          >
                            <Link href="/admin/financeiro">
                              <DollarSign className="h-4 w-4" />
                              <span>Financeiro</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location === "/admin/denuncias"}
                            data-testid="nav-admin-denuncias"
                          >
                            <Link href="/admin/denuncias">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Denúncias</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location === "/admin/campeonato"}
                            data-testid="nav-admin-campeonato"
                          >
                            <Link href="/admin/campeonato">
                              <Trophy className="h-4 w-4" />
                              <span>Campeonato</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user?.profileImageUrl || undefined}
              alt={user?.nickname || "User"}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.nickname || user?.firstName || user?.email?.split("@")[0] || "Jogador"}
            </span>
            <Badge
              variant={user?.isAdmin ? "default" : "secondary"}
              className="w-fit text-xs"
              data-testid="badge-user-role"
            >
              {user?.isAdmin ? "Admin" : "Jogador"}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full mt-3 justify-start"
          asChild
          data-testid="button-logout"
        >
          <a href="/api/logout">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </a>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
