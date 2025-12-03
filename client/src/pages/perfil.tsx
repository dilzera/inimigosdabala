import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { User, Trophy, Target, Crosshair, Shield, Star, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Perfil() {
  const { user } = useAuth();

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
              <div className="flex gap-2 mt-3">
                <Badge variant={user.isAdmin ? "default" : "secondary"}>
                  {user.isAdmin ? "Admin" : "Jogador"}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  Rating: {user.skillRating}
                </Badge>
              </div>
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

      <div className="grid gap-6 md:grid-cols-2">
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
      </div>
    </div>
  );
}
