import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Copy, Check, Server, Globe, 
  Sparkles, Star, Trophy, Users, Calendar, 
  TrendingUp, ArrowRight, User, Gamepad2, 
  CheckCircle, Link2, Megaphone, Award, Target,
  DollarSign, ExternalLink, Handshake,
  Newspaper, ChevronDown, ChevronRight, Plus, Trash2, Send
} from "lucide-react";
import { SiInstagram } from "react-icons/si";
import type { User as UserType, Match, MatchStats, News } from "@shared/schema";
import skinsLabLogo from "@assets/skins_lab_logo1_1771007653832.png";
import thomaziniLogo from "@assets/thomazini_logo_1771007598394.jpeg";
import dukinhaLogo from "@assets/WhatsApp_Image_2026-02-13_at_15.40.31_1771008050723.jpeg";
import zenthorLogo from "@assets/zenthor_logo_1771007572398.png";

type NewsWithAuthor = News & { author: UserType };

export default function Mural() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const pixKey = "12982690148";

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: allNews = [] } = useQuery<NewsWithAuthor[]>({
    queryKey: ["/api/news"],
  });

  const createNewsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/news', { title: newsTitle, content: newsContent });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setNewsTitle("");
      setNewsContent("");
      setShowNewsForm(false);
      toast({ title: "Notícia publicada!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Erro ao publicar", variant: "destructive" });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/news/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "Notícia removida" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Erro ao remover", variant: "destructive" });
    },
  });

  const { data: latestMvp } = useQuery<{ match: Match; mvpStats: MatchStats; mvpUser: UserType } | null>({
    queryKey: ["/api/matches/latest-mvp"],
    queryFn: async () => {
      const res = await fetch("/api/matches/latest-mvp", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const latestAcePlayer = users
    .filter(u => (u.total5ks || 0) > 0)
    .sort((a, b) => (b.total5ks || 0) - (a.total5ks || 0))[0];

  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });

  const hasSteamId = !!user?.steamId64;
  const hasNickname = !!user?.nickname;
  const needsProfileUpdate = !hasSteamId || !hasNickname;

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      toast({
        title: "Chave PIX copiada!",
        description: "Cole no seu app de banco para fazer a transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Copie manualmente: " + pixKey,
        variant: "destructive",
      });
    }
  };

  const acePlayerName = latestAcePlayer 
    ? (latestAcePlayer.nickname || latestAcePlayer.firstName || "Jogador")
    : null;

  const mvpName = latestMvp?.mvpUser
    ? (latestMvp.mvpUser.nickname || latestMvp.mvpUser.firstName || "Jogador")
    : null;

  const mvpKd = latestMvp?.mvpStats
    ? ((latestMvp.mvpStats.kills || 0) / Math.max(1, latestMvp.mvpStats.deaths || 1)).toFixed(2)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Mural de Informações</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.nickname || user?.firstName || "Jogador"}! Confira as novidades da comunidade.
          </p>
        </div>
      </div>

      <Collapsible open={newsOpen} onOpenChange={setNewsOpen}>
        <Card className="border-primary/20" data-testid="card-news">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer select-none">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Newspaper className="h-6 w-6 text-primary" />
                  Jornal Inimigos da Bala
                </CardTitle>
                <div className="flex items-center gap-2">
                  {allNews.length > 0 && (
                    <Badge variant="secondary">{allNews.length} notícia{allNews.length > 1 ? "s" : ""}</Badge>
                  )}
                  {newsOpen ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                </div>
              </div>
              <CardDescription>
                Clique para {newsOpen ? "fechar" : "abrir"} o jornal da comunidade
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {user?.isAdmin && (
                <div className="space-y-3">
                  {!showNewsForm ? (
                    <Button
                      onClick={() => setShowNewsForm(true)}
                      variant="outline"
                      className="w-full"
                      data-testid="button-new-news"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Publicar Notícia
                    </Button>
                  ) : (
                    <Card className="border-primary/30">
                      <CardContent className="pt-4 space-y-3">
                        <Input
                          placeholder="Título da notícia..."
                          value={newsTitle}
                          onChange={(e) => setNewsTitle(e.target.value)}
                          data-testid="input-news-title"
                        />
                        <Textarea
                          placeholder="Escreva o conteúdo da notícia..."
                          value={newsContent}
                          onChange={(e) => setNewsContent(e.target.value)}
                          rows={4}
                          data-testid="input-news-content"
                        />
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            onClick={() => createNewsMutation.mutate()}
                            disabled={!newsTitle.trim() || !newsContent.trim() || createNewsMutation.isPending}
                            data-testid="button-publish-news"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Publicar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => { setShowNewsForm(false); setNewsTitle(""); setNewsContent(""); }}
                            data-testid="button-cancel-news"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {allNews.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Newspaper className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma notícia publicada ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allNews.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border bg-muted/30 space-y-2"
                      data-testid={`news-item-${item.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={item.author?.profileImageUrl || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {(item.author?.nickname || item.author?.firstName || "A").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {item.author?.nickname || item.author?.firstName || "Admin"}
                              {" · "}
                              {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        {user?.isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNewsMutation.mutate(item.id)}
                            disabled={deleteNewsMutation.isPending}
                            data-testid={`button-delete-news-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" data-testid="card-server-cost">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-6 w-6 text-primary" />
              Custos da Comunidade
            </CardTitle>
            <Badge variant="default" className="font-mono text-base px-3">
              R$ 179,90/mês
            </Badge>
          </div>
          <CardDescription className="text-base">
            Ajude a manter o servidor e o site funcionando! Qualquer valor faz diferença.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-lg bg-card border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="font-semibold">Servidor CS2</span>
                  <p className="text-xs text-muted-foreground">128 tick, plugins</p>
                </div>
              </div>
              <span className="font-mono font-bold text-lg">R$ 79,90</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-card border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="font-semibold">Site / Sistema</span>
                  <p className="text-xs text-muted-foreground">Hospedagem, domínio</p>
                </div>
              </div>
              <span className="font-mono font-bold text-lg">R$ 100,00</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-3">
            <p className="text-center font-semibold text-primary">
              Chave PIX (Celular)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 rounded-lg bg-background text-center font-mono text-xl tracking-wider border">
                {pixKey}
              </code>
              <Button
                onClick={copyPixKey}
                variant="default"
                data-testid="button-copy-pix-mural"
              >
                {copied ? (
                  <><Check className="h-4 w-4 mr-2" /> Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copiar</>
                )}
              </Button>
            </div>
            <p className="text-center text-sm font-medium text-primary/80">
              Não existe valor mínimo! R$ 1, R$ 2, R$ 5... toda ajuda conta!
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <Heart className="h-4 w-4 text-red-500" />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Obrigado a todos que contribuem para manter nossa comunidade viva!
            </p>
            <Heart className="h-4 w-4 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5" data-testid="card-steamid-reminder">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Atualize seu Perfil com o SteamID64
          </CardTitle>
          <CardDescription>
            Todos os jogadores devem cadastrar o SteamID64 no perfil para que suas estatísticas sejam vinculadas automaticamente!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium text-primary">
              Sem o SteamID64, suas partidas não serão contabilizadas no sistema. 
              Acesse seu perfil e cadastre agora!
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`flex items-center justify-between p-3 rounded-lg ${hasSteamId ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'}`}>
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">SteamID64</span>
                  <p className="text-xs text-muted-foreground">Vincula suas partidas</p>
                </div>
              </div>
              {hasSteamId ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Badge variant="destructive">Pendente</Badge>
              )}
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${hasNickname ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'}`}>
              <div className="flex items-center gap-3">
                <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">Nickname do Jogo</span>
                  <p className="text-xs text-muted-foreground">Nome no CS2</p>
                </div>
              </div>
              {hasNickname ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Badge variant="destructive">Pendente</Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Não sabe como encontrar seu SteamID64? Acesse a página "Como encontrar o SteamID64" no menu Servidor.
          </p>

          <Button onClick={() => setLocation("/perfil")} className="w-full" data-testid="button-update-profile">
            <User className="h-4 w-4 mr-2" />
            {needsProfileUpdate ? "Atualizar Perfil Agora" : "Ir para Meu Perfil"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {latestMvp && mvpName && (
          <Card className="border-blue-500/30 bg-blue-500/5" data-testid="card-mvp-last-match">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-500" />
                MVP da Última Partida
                <Award className="h-5 w-5 text-blue-500" />
              </CardTitle>
              <CardDescription>
                Destaque da partida mais recente no servidor!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-blue-500">
                    <AvatarImage src={latestMvp.mvpUser.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-blue-500/20 text-blue-600 text-xl font-bold">
                      {mvpName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1.5">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-primary">{mvpName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Melhor jogador na partida de {latestMvp.match.map}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 w-full">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                    <Target className="h-4 w-4 text-red-500 mb-1" />
                    <span className="font-mono font-bold">{latestMvp.mvpStats.kills}</span>
                    <span className="text-xs text-muted-foreground">Kills</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                    <TrendingUp className="h-4 w-4 text-green-500 mb-1" />
                    <span className="font-mono font-bold">{mvpKd}</span>
                    <span className="text-xs text-muted-foreground">K/D</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                    <Award className="h-4 w-4 text-blue-500 mb-1" />
                    <span className="font-mono font-bold">{latestMvp.mvpStats.mvps}</span>
                    <span className="text-xs text-muted-foreground">MVPs</span>
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono">
                  {latestMvp.match.map} - {latestMvp.match.team1Score} x {latestMvp.match.team2Score}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {latestAcePlayer && (
          <Card className="border-yellow-500/30 bg-yellow-500/5" data-testid="card-ace-player">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                ACE! 5K!
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </CardTitle>
              <CardDescription>Temos um jogador destruidor na comunidade!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-yellow-500">
                    <AvatarImage src={latestAcePlayer.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-yellow-500/20 text-yellow-600 text-xl font-bold">
                      {acePlayerName?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-1.5">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-primary">{acePlayerName}</h3>
                  <p className="text-sm text-muted-foreground">
                    conseguiu {latestAcePlayer.total5ks === 1 ? "um" : latestAcePlayer.total5ks} ACE{(latestAcePlayer.total5ks || 0) > 1 ? "s" : ""}!
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <Badge variant="default" className="font-mono">
                  {latestAcePlayer.total5ks} ACE{(latestAcePlayer.total5ks || 0) > 1 ? "s" : ""} no Total
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-monthly-ranking">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Ranking Mensal
            </CardTitle>
            <CardDescription>Confira quem está dominando neste mês!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="default" className="text-lg px-4 py-1 capitalize">
                {currentMonth}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              O ranking mensal mostra o desempenho dos jogadores apenas no mês atual. 
              Todos os dados são zerados automaticamente quando o mês vira!
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
                <Trophy className="h-6 w-6 text-yellow-500 mb-1" />
                <span className="text-xs font-medium">Top K/D</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
                <TrendingUp className="h-6 w-6 text-green-500 mb-1" />
                <span className="text-xs font-medium">Win Rate</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
                <Calendar className="h-6 w-6 text-primary mb-1" />
                <span className="text-xs font-medium">Atualizado</span>
              </div>
            </div>

            <Button onClick={() => setLocation("/ranking-mensal")} className="w-full" data-testid="button-go-monthly-ranking">
              <Calendar className="h-4 w-4 mr-2" />
              Ver Ranking Mensal
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-championship">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Campeonato Inimigos da Bala
            </CardTitle>
            <CardDescription>O primeiro campeonato oficial está chegando!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-4 py-1">
                Em Preparação
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Estamos preparando o primeiro campeonato competitivo 5v5 da comunidade. 
              Demonstre seu interesse e seja notificado quando tivermos mais detalhes!
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
                <Users className="h-6 w-6 text-primary mb-1" />
                <span className="text-xs font-medium">5v5</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
                <Calendar className="h-6 w-6 text-primary mb-1" />
                <span className="text-xs font-medium">Em breve</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
                <Trophy className="h-6 w-6 text-yellow-500 mb-1" />
                <span className="text-xs font-medium">Prêmios</span>
              </div>
            </div>

            <Button onClick={() => setLocation("/campeonato")} className="w-full" data-testid="button-go-championship">
              <Trophy className="h-4 w-4 mr-2" />
              Quero Participar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-apoiadores">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Apoiadores
          </CardTitle>
          <CardDescription>Marcas que apoiam a comunidade Inimigos da Bala</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div
              className="flex flex-col items-center gap-3 p-4 rounded-lg border"
              data-testid="card-sponsor-skinslab"
            >
              <img src={skinsLabLogo} alt="Skins Lab" className="h-16 w-auto object-contain rounded-md" />
              <span className="font-semibold text-sm">Skins Lab</span>
              <span className="text-xs text-muted-foreground text-center">Artesanato de Skins de CS2</span>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.skinslab.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-sponsor-skinslab-site"
                >
                  <Badge variant="outline" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Site
                  </Badge>
                </a>
                <a
                  href="https://www.instagram.com/skinslab/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-sponsor-skinslab-instagram"
                >
                  <Badge variant="outline" className="text-xs">
                    <SiInstagram className="h-3 w-3 mr-1" />
                    Instagram
                  </Badge>
                </a>
              </div>
            </div>

            <a
              href="https://www.instagram.com/thomazini.sp/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-4 rounded-lg border hover-elevate"
              data-testid="link-sponsor-thomazini"
            >
              <img src={thomaziniLogo} alt="Supermercados Thomazini" className="h-16 w-16 object-contain rounded-full" />
              <span className="font-semibold text-sm">Supermercados Thomazini</span>
              <Badge variant="outline" className="text-xs">
                <SiInstagram className="h-3 w-3 mr-1" />
                Instagram
              </Badge>
            </a>

            <a
              href="https://www.dukinhacamisas.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-4 rounded-lg border hover-elevate"
              data-testid="link-sponsor-dukinha"
            >
              <img src={dukinhaLogo} alt="Dukinha Camisas" className="h-16 w-auto object-contain rounded-md" />
              <span className="font-semibold text-sm">Dukinha Camisas</span>
              <span className="text-xs text-muted-foreground text-center">Camisas de Time</span>
              <Badge variant="outline" className="text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                Site
              </Badge>
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 py-4 border-t" data-testid="footer-built-by">
        <span className="text-xs text-muted-foreground">Built by</span>
        <a
          href="https://ZenthorTech.replit.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover-elevate rounded-md px-2 py-1"
        >
          <img src={zenthorLogo} alt="Zenthor Tech" className="h-6 w-6 rounded-md object-contain" />
          <span className="text-xs font-semibold text-primary">Zenthor Tech</span>
        </a>
      </div>
    </div>
  );
}
