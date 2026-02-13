import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Copy, Check, Server, Globe, 
  Sparkles, Star, Trophy, Users, Calendar, 
  TrendingUp, ArrowRight, User, Gamepad2, 
  CheckCircle, Link2, Megaphone
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function Mural() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const pixKey = "12982690148";

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
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

      <div className="grid gap-6 md:grid-cols-2">
        {needsProfileUpdate && (
          <Card className="border-primary/30 bg-primary/5 md:col-span-2" data-testid="card-profile-update">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Atualize seu Perfil
              </CardTitle>
              <CardDescription>
                Precisamos de algumas informações para melhorar sua experiência
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium text-primary">
                  Para facilitar a gestão de acessos e vincular suas estatísticas, 
                  precisamos do seu SteamID64 e nickname do jogo!
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className={`flex items-center justify-between p-3 rounded-lg ${hasSteamId ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
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

                <div className={`flex items-center justify-between p-3 rounded-lg ${hasNickname ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
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

              <Button onClick={() => setLocation("/perfil")} className="w-full" data-testid="button-update-profile">
                <User className="h-4 w-4 mr-2" />
                Atualizar Perfil
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
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

        <Card className="md:col-span-2 border-red-500/20" data-testid="card-server-cost">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Ajude a Manter Nossa Comunidade
            </CardTitle>
            <CardDescription>
              O Inimigos da Bala precisa da sua ajuda para continuar funcionando!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">
                Qualquer valor ajuda! Pode ser R$ 1, R$ 5, R$ 10... o que você puder contribuir faz diferença para manter nossa comunidade ativa!
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">Servidor CS2</span>
                </div>
                <Badge variant="secondary" className="font-mono">R$ 79,90</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">Site</span>
                </div>
                <Badge variant="secondary" className="font-mono">R$ 100,00</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <span className="font-semibold text-sm">Total</span>
                <Badge variant="default" className="font-mono">R$ 179,90</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-center">Chave PIX (Celular)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 rounded-lg bg-muted text-center font-mono text-lg tracking-wider">
                  {pixKey}
                </code>
                <Button
                  onClick={copyPixKey}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  data-testid="button-copy-pix-mural"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-center font-medium text-green-600 dark:text-green-400">
                Não existe valor mínimo! R$ 1, R$ 2, R$ 5... toda ajuda conta!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
