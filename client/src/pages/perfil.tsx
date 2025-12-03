import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, Trophy, Target, Crosshair, Shield, Star, TrendingUp, 
  Zap, Award, Bomb, Eye, Link2, Check, AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Perfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [steamId, setSteamId] = useState("");

  const linkSteamMutation = useMutation({
    mutationFn: async (steamId64: string) => {
      const response = await apiRequest("POST", "/api/users/link-steam", { steamId64 });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Steam Vinculado!",
        description: "Seu SteamID64 foi vinculado com sucesso.",
      });
      setSteamId("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Vincular",
        description: error.message || "Não foi possível vincular o SteamID64.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const kdRatio = user.totalDeaths > 0
    ? (user.totalKills / user.totalDeaths).toFixed(2)
    : user.totalKills.toFixed(2);

  const headshotPercent = user.totalKills > 0
    ? ((user.totalHeadshots / user.totalKills) * 100).toFixed(1)
    : "0.0";

  const winRate = user.totalMatches > 0
    ? ((user.matchesWon / user.totalMatches) * 100).toFixed(1)
    : "0.0";

  const roundWinRate = user.totalRoundsPlayed > 0
    ? ((user.roundsWon / user.totalRoundsPlayed) * 100).toFixed(1)
    : "0.0";

  const accuracy = user.totalShotsFired > 0
    ? ((user.totalShotsOnTarget / user.totalShotsFired) * 100).toFixed(1)
    : "0.0";

  const adr = user.totalMatches > 0
    ? (user.totalDamage / user.totalMatches).toFixed(0)
    : "0";

  const clutchWinRate1v1 = user.total1v1Count > 0
    ? ((user.total1v1Wins / user.total1v1Count) * 100).toFixed(0)
    : "0";

  const entryWinRate = user.totalEntryCount > 0
    ? ((user.totalEntryWins / user.totalEntryCount) * 100).toFixed(0)
    : "0";

  const flashSuccessRate = user.totalFlashCount > 0
    ? ((user.totalFlashSuccesses / user.totalFlashCount) * 100).toFixed(0)
    : "0";

  const handleLinkSteam = (e: React.FormEvent) => {
    e.preventDefault();
    if (steamId.trim()) {
      linkSteamMutation.mutate(steamId.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {user.nickname?.slice(0, 2).toUpperCase() || user.firstName?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">
                {user.nickname || user.firstName || "Jogador"}
              </h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                <Badge variant={user.isAdmin ? "default" : "secondary"}>
                  {user.isAdmin ? "Admin" : "Jogador"}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  Rating: {user.skillRating}
                </Badge>
              </div>
              {user.steamId64 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="font-mono">{user.steamId64}</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Skill Rating</span>
                  <span className="font-mono">{user.skillRating} / 3000</span>
                </div>
                <Progress value={(user.skillRating / 3000) * 100} />
              </div>
            </div>

            {!user.steamId64 && (
              <div className="mt-6 pt-6 border-t">
                <form onSubmit={handleLinkSteam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="steam-id" className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Vincular SteamID64
                    </Label>
                    <Input
                      id="steam-id"
                      placeholder="76561198000000000"
                      value={steamId}
                      onChange={(e) => setSteamId(e.target.value)}
                      data-testid="input-steam-id"
                    />
                    <p className="text-xs text-muted-foreground">
                      Vincule seu SteamID64 para sincronizar suas estatísticas do servidor.
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={linkSteamMutation.isPending || !steamId.trim()}
                    data-testid="button-link-steam"
                  >
                    {linkSteamMutation.isPending ? "Vinculando..." : "Vincular Steam"}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Estatísticas Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <Crosshair className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono">{kdRatio}</div>
                <div className="text-sm text-muted-foreground">K/D Ratio</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono">{headshotPercent}%</div>
                <div className="text-sm text-muted-foreground">Headshot %</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono">{winRate}%</div>
                <div className="text-sm text-muted-foreground">Taxa de Vitória</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono">{user.totalMatches}</div>
                <div className="text-sm text-muted-foreground">Partidas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {user.totalMatches === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você ainda não tem partidas registradas. {!user.steamId64 && "Vincule seu SteamID64 para sincronizar suas estatísticas."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Combate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Kills</span>
              <span className="font-mono font-bold text-green-500">{user.totalKills}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Deaths</span>
              <span className="font-mono font-bold text-red-500">{user.totalDeaths}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Assistências</span>
              <span className="font-mono font-bold">{user.totalAssists}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Headshots</span>
              <span className="font-mono font-bold text-yellow-500">{user.totalHeadshots}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Dano Total</span>
              <span className="font-mono font-bold">{user.totalDamage}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">ADR (Média)</span>
              <span className="font-mono font-bold text-primary">{adr}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Partidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Vitórias</span>
              <span className="font-mono font-bold text-green-500">{user.matchesWon}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Derrotas</span>
              <span className="font-mono font-bold text-red-500">{user.matchesLost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Rounds Jogados</span>
              <span className="font-mono font-bold">{user.totalRoundsPlayed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Rounds Ganhos</span>
              <span className="font-mono font-bold">{user.roundsWon}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa de Rounds</span>
              <span className="font-mono font-bold">{roundWinRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de MVPs</span>
              <Badge variant="default" className="font-mono">
                <Star className="h-3 w-3 mr-1" />
                {user.totalMvps}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Multi-Kills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                ACE (5K)
              </span>
              <span className="font-mono font-bold text-yellow-500">{user.total5ks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">4K</span>
              <span className="font-mono font-bold">{user.total4ks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">3K</span>
              <span className="font-mono font-bold">{user.total3ks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">2K</span>
              <span className="font-mono font-bold">{user.total2ks}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clutches & Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">1v1 Wins</span>
              <span className="font-mono font-bold">{user.total1v1Wins} / {user.total1v1Count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">1v1 Win Rate</span>
              <span className="font-mono font-bold text-primary">{clutchWinRate1v1}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">1v2 Wins</span>
              <span className="font-mono font-bold">{user.total1v2Wins} / {user.total1v2Count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Entry Frags</span>
              <span className="font-mono font-bold">{user.totalEntryWins} / {user.totalEntryCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Entry Win Rate</span>
              <span className="font-mono font-bold text-primary">{entryWinRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilitários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Flashes Lançadas
              </span>
              <span className="font-mono font-bold">{user.totalFlashCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Flashes Efetivas</span>
              <span className="font-mono font-bold">{user.totalFlashSuccesses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Inimigos Cegados</span>
              <span className="font-mono font-bold text-primary">{user.totalEnemiesFlashed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Dano de Utility</span>
              <span className="font-mono font-bold">{user.totalUtilityDamage}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa de Sucesso</span>
              <span className="font-mono font-bold">{flashSuccessRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precisão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Tiros Disparados
              </span>
              <span className="font-mono font-bold">{user.totalShotsFired}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tiros no Alvo</span>
              <span className="font-mono font-bold">{user.totalShotsOnTarget}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa de Acerto</span>
              <span className="font-mono font-bold text-primary">{accuracy}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
