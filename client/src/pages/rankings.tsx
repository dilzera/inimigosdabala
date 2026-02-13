import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Award, Target, Crosshair, Star, Info, ChevronDown, Handshake } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import type { User } from "@shared/schema";

export default function Rankings() {
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const playersWithMatches = users.filter(u => u.totalMatches >= 3);
  
  const sortedByRating = [...playersWithMatches].sort((a, b) => b.skillRating - a.skillRating);
  const sortedByKD = [...playersWithMatches].sort((a, b) => {
    const kdA = a.totalDeaths > 0 ? a.totalKills / a.totalDeaths : a.totalKills;
    const kdB = b.totalDeaths > 0 ? b.totalKills / b.totalDeaths : b.totalKills;
    return kdB - kdA;
  });
  const sortedByHeadshots = [...playersWithMatches].sort((a, b) => {
    const hsA = a.totalKills > 0 ? (a.totalHeadshots / a.totalKills) * 100 : 0;
    const hsB = b.totalKills > 0 ? (b.totalHeadshots / b.totalKills) * 100 : 0;
    return hsB - hsA;
  });
  const sortedByWinRate = [...playersWithMatches].sort((a, b) => {
    const winRateA = (a.matchesWon / a.totalMatches) * 100;
    const winRateB = (b.matchesWon / b.totalMatches) * 100;
    return winRateB - winRateA;
  });
  const sortedByMvps = [...playersWithMatches].sort((a, b) => b.totalMvps - a.totalMvps);
  const sortedByAssists = [...playersWithMatches].sort((a, b) => {
    const avgA = a.totalMatches > 0 ? a.totalAssists / a.totalMatches : 0;
    const avgB = b.totalMatches > 0 ? b.totalAssists / b.totalMatches : 0;
    return avgB - avgA;
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="w-6 text-center font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Badge className="bg-yellow-500 text-black">1º Lugar</Badge>;
      case 1:
        return <Badge variant="secondary">2º Lugar</Badge>;
      case 2:
        return <Badge className="bg-amber-600 text-white">3º Lugar</Badge>;
      default:
        return <Badge variant="outline">{index + 1}º</Badge>;
    }
  };

  const PlayerRow = ({ player, index, stat }: { player: User; index: number; stat: string }) => (
    <div className={`flex items-center justify-between p-4 rounded-lg ${index < 3 ? 'bg-primary/5 border border-primary/20' : 'bg-background/50'}`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8">
          {getRankIcon(index)}
        </div>
        <Link href={`/jogador/${player.id}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity" data-testid={`link-player-${player.id}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={player.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {player.nickname?.slice(0, 2).toUpperCase() || player.firstName?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium hover:text-primary transition-colors">{player.nickname || player.firstName || "Jogador"}</div>
            <div className="text-xs text-muted-foreground">{player.totalMatches} partidas</div>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-xl">{stat}</span>
        {getRankBadge(index)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Melhores Jogadores</h1>
      </div>

      <Collapsible open={isLegendOpen} onOpenChange={setIsLegendOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover-elevate">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Como o Skill Rating é Calculado
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${isLegendOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                O Skill Rating começa em <strong>1000</strong> (valor médio) e é ajustado baseado no desempenho do jogador. O rating final fica entre 100 e 3000.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Fator</th>
                      <th className="text-left py-2 font-medium">Fórmula</th>
                      <th className="text-left py-2 font-medium">Explicação</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">K/D Ratio</td>
                      <td className="py-2 font-mono text-xs">(K/D - 1) × 150</td>
                      <td className="py-2">K/D acima de 1.0 aumenta, abaixo diminui</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">Headshot %</td>
                      <td className="py-2 font-mono text-xs">(HS% - 30) × 2</td>
                      <td className="py-2">30% é a média esperada</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">ADR</td>
                      <td className="py-2 font-mono text-xs">(ADR - 70) × 1.5</td>
                      <td className="py-2">Dano por round - 70 é a média</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">Win Rate</td>
                      <td className="py-2 font-mono text-xs">(WinRate - 50) × 3</td>
                      <td className="py-2">50% é neutro, vitórias dão bônus</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">MVP Rate</td>
                      <td className="py-2 font-mono text-xs">(MVP% - 10) × 5</td>
                      <td className="py-2">% de partidas como MVP (10% é média)</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">MVPs</td>
                      <td className="py-2 font-mono text-xs">MVPs × 3</td>
                      <td className="py-2">Cada MVP dá +3 pontos</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">ACE (5K)</td>
                      <td className="py-2 font-mono text-xs">5Ks × 30</td>
                      <td className="py-2">Cada ACE dá +30 pontos</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">4K</td>
                      <td className="py-2 font-mono text-xs">4Ks × 15</td>
                      <td className="py-2">Cada 4K dá +15 pontos</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium text-foreground">3K</td>
                      <td className="py-2 font-mono text-xs">3Ks × 5</td>
                      <td className="py-2">Cada 3K dá +5 pontos</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Exemplo Prático
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Um jogador com K/D 1.5, 40% HS, 90 ADR, 70% Win Rate e 2 ACEs:
                </p>
                <div className="font-mono text-sm space-y-1">
                  <div>Base: <span className="text-primary">1000</span></div>
                  <div>K/D 1.5: <span className="text-green-500">+75</span> pontos</div>
                  <div>40% HS: <span className="text-green-500">+20</span> pontos</div>
                  <div>90 ADR: <span className="text-green-500">+30</span> pontos</div>
                  <div>70% Win Rate: <span className="text-green-500">+60</span> pontos</div>
                  <div>2 ACEs: <span className="text-green-500">+60</span> pontos</div>
                  <div className="border-t border-border/50 pt-1 mt-2">
                    <strong>Total: <span className="text-primary">1245</span> Skill Rating</strong>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Ranking por Skill Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedByRating.slice(0, 10).map((player, index) => (
              <PlayerRow
                key={player.id}
                player={player}
                index={index}
                stat={player.skillRating.toString()}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-red-500" />
              Ranking por K/D
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedByKD.slice(0, 10).map((player, index) => {
              const kd = player.totalDeaths > 0
                ? (player.totalKills / player.totalDeaths).toFixed(2)
                : player.totalKills.toFixed(2);
              return (
                <PlayerRow
                  key={player.id}
                  player={player}
                  index={index}
                  stat={kd}
                />
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Ranking por Headshot %
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedByHeadshots.slice(0, 10).map((player, index) => {
              const hs = player.totalKills > 0
                ? ((player.totalHeadshots / player.totalKills) * 100).toFixed(1)
                : "0.0";
              return (
                <PlayerRow
                  key={player.id}
                  player={player}
                  index={index}
                  stat={`${hs}%`}
                />
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              Ranking por Taxa de Vitória
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedByWinRate.slice(0, 10).map((player, index) => {
              const winRate = player.totalMatches > 0
                ? ((player.matchesWon / player.totalMatches) * 100).toFixed(1)
                : "0.0";
              return (
                <PlayerRow
                  key={player.id}
                  player={player}
                  index={index}
                  stat={`${winRate}%`}
                />
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Ranking por MVPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {sortedByMvps.slice(0, 10).map((player, index) => {
                const mvpRate = player.totalMatches > 0
                  ? ((player.totalMvps / player.totalMatches) * 100).toFixed(1)
                  : "0.0";
                return (
                  <div 
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${index < 3 ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-background/50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(index)}
                      </div>
                      <Link href={`/jogador/${player.id}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity" data-testid={`link-mvp-player-${player.id}`}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={player.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-amber-500/10 text-amber-500">
                            {player.nickname?.slice(0, 2).toUpperCase() || player.firstName?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium hover:text-amber-500 transition-colors">{player.nickname || player.firstName || "Jogador"}</div>
                          <div className="text-xs text-muted-foreground">{mvpRate}% das partidas</div>
                        </div>
                      </Link>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-xl text-amber-500">{player.totalMvps}</span>
                        <div className="text-xs text-muted-foreground">MVPs</div>
                      </div>
                      {getRankBadge(index)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-cyan-500" />
              Ranking por Assistências (Média por Partida)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {sortedByAssists.slice(0, 10).map((player, index) => {
                const avgAssists = player.totalMatches > 0
                  ? (player.totalAssists / player.totalMatches).toFixed(1)
                  : "0.0";
                return (
                  <div 
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${index < 3 ? 'bg-cyan-500/5 border border-cyan-500/20' : 'bg-background/50'}`}
                    data-testid={`rank-assists-${player.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(index)}
                      </div>
                      <Link href={`/jogador/${player.id}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity" data-testid={`link-assists-player-${player.id}`}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={player.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-cyan-500/10 text-cyan-500">
                            {player.nickname?.slice(0, 2).toUpperCase() || player.firstName?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium hover:text-cyan-500 transition-colors">{player.nickname || player.firstName || "Jogador"}</div>
                          <div className="text-xs text-muted-foreground">{player.totalAssists} assists em {player.totalMatches} partidas</div>
                        </div>
                      </Link>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-xl text-cyan-500">{avgAssists}</span>
                        <div className="text-xs text-muted-foreground">por partida</div>
                      </div>
                      {getRankBadge(index)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
