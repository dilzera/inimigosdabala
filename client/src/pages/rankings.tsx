import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Award, Target, Crosshair, Star } from "lucide-react";
import type { User } from "@shared/schema";

export default function Rankings() {
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

  const sortedByRating = [...users].sort((a, b) => b.skillRating - a.skillRating);
  const sortedByKD = [...users].sort((a, b) => {
    const kdA = a.totalDeaths > 0 ? a.totalKills / a.totalDeaths : a.totalKills;
    const kdB = b.totalDeaths > 0 ? b.totalKills / b.totalDeaths : b.totalKills;
    return kdB - kdA;
  });
  const sortedByHeadshots = [...users].sort((a, b) => {
    const hsA = a.totalKills > 0 ? (a.totalHeadshots / a.totalKills) * 100 : 0;
    const hsB = b.totalKills > 0 ? (b.totalHeadshots / b.totalKills) * 100 : 0;
    return hsB - hsA;
  });
  const sortedByMVPs = [...users].sort((a, b) => b.totalMvps - a.totalMvps);

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
        <Avatar className="h-10 w-10">
          <AvatarImage src={player.profileImageUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {player.nickname?.slice(0, 2).toUpperCase() || player.firstName?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{player.nickname || player.firstName || "Jogador"}</div>
          <div className="text-xs text-muted-foreground">{player.totalMatches} partidas</div>
        </div>
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
              <Medal className="h-5 w-5 text-purple-500" />
              Ranking por MVPs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedByMVPs.slice(0, 10).map((player, index) => (
              <PlayerRow
                key={player.id}
                player={player}
                index={index}
                stat={player.totalMvps.toString()}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
