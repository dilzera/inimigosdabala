import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Skull, AlertTriangle, Target, Crosshair, TrendingDown, Handshake } from "lucide-react";
import { Link } from "wouter";
import type { User } from "@shared/schema";

export default function PioresJogadores() {
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

  const usersWithMatches = users.filter(u => u.totalMatches >= 3);

  const sortedByRating = [...usersWithMatches].sort((a, b) => a.skillRating - b.skillRating);
  
  const sortedByKD = [...usersWithMatches].sort((a, b) => {
    const kdA = a.totalDeaths > 0 ? a.totalKills / a.totalDeaths : a.totalKills;
    const kdB = b.totalDeaths > 0 ? b.totalKills / b.totalDeaths : b.totalKills;
    return kdA - kdB;
  });
  
  const sortedByHeadshots = [...usersWithMatches].sort((a, b) => {
    const hsA = a.totalKills > 0 ? (a.totalHeadshots / a.totalKills) * 100 : 0;
    const hsB = b.totalKills > 0 ? (b.totalHeadshots / b.totalKills) * 100 : 0;
    return hsA - hsB;
  });
  
  const sortedByWinRate = [...usersWithMatches].sort((a, b) => {
    const wrA = a.totalMatches > 0 ? (a.matchesWon / a.totalMatches) * 100 : 0;
    const wrB = b.totalMatches > 0 ? (b.matchesWon / b.totalMatches) * 100 : 0;
    return wrA - wrB;
  });

  const sortedByAssists = [...usersWithMatches].sort((a, b) => {
    const avgA = a.totalMatches > 0 ? a.totalAssists / a.totalMatches : 0;
    const avgB = b.totalMatches > 0 ? b.totalAssists / b.totalMatches : 0;
    return avgA - avgB;
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Skull className="h-6 w-6 text-red-500" />;
      case 1:
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case 2:
        return <TrendingDown className="h-6 w-6 text-yellow-500" />;
      default:
        return <span className="w-6 text-center font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Badge variant="destructive">Pior</Badge>;
      case 1:
        return <Badge className="bg-orange-500 text-white">2º Pior</Badge>;
      case 2:
        return <Badge className="bg-yellow-600 text-white">3º Pior</Badge>;
      default:
        return <Badge variant="outline">{index + 1}º</Badge>;
    }
  };

  const PlayerRow = ({ player, index, stat }: { player: User; index: number; stat: string }) => (
    <div 
      className={`flex items-center justify-between p-4 rounded-lg ${
        index < 3 ? 'bg-red-500/5 border border-red-500/20' : 'bg-background/50'
      }`}
      data-testid={`worst-player-row-${player.id}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8">
          {getRankIcon(index)}
        </div>
        <Link href={`/jogador/${player.id}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity" data-testid={`link-worst-player-${player.id}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={player.profileImageUrl || undefined} />
            <AvatarFallback className="bg-red-500/10 text-red-500">
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
        <span className="font-mono font-bold text-xl text-red-400">{stat}</span>
        {getRankBadge(index)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skull className="h-8 w-8 text-red-500" />
        <h1 className="text-3xl font-bold">Piores Jogadores</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Pior Skill Rating
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
            {sortedByRating.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum jogador com partidas registradas
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-red-500" />
              Pior K/D
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
            {sortedByKD.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum jogador com partidas registradas
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              Pior Headshot %
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
            {sortedByHeadshots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum jogador com partidas registradas
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skull className="h-5 w-5 text-red-500" />
              Pior Taxa de Vitória
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedByWinRate.slice(0, 10).map((player, index) => {
              const wr = player.totalMatches > 0
                ? ((player.matchesWon / player.totalMatches) * 100).toFixed(1)
                : "0.0";
              return (
                <PlayerRow
                  key={player.id}
                  player={player}
                  index={index}
                  stat={`${wr}%`}
                />
              );
            })}
            {sortedByWinRate.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum jogador com partidas registradas
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-red-500" />
              Pior Média de Assistências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedByAssists.slice(0, 10).map((player, index) => {
              const avg = player.totalMatches > 0
                ? (player.totalAssists / player.totalMatches).toFixed(1)
                : "0.0";
              return (
                <PlayerRow
                  key={player.id}
                  player={player}
                  index={index}
                  stat={`${avg}/partida`}
                />
              );
            })}
            {sortedByAssists.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum jogador com partidas registradas
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
