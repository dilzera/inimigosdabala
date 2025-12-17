import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { History, Trophy, Target, Skull, Calendar, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import type { MatchStats, Match } from "@shared/schema";

type MatchStatsWithMatch = {
  stats: MatchStats;
  match: Match;
};

export default function PartidasMinhas() {
  const { user } = useAuth();
  
  const { data: matchData = [], isLoading } = useQuery<MatchStatsWithMatch[]>({
    queryKey: ["/api/users", user?.id, "matches"],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const totalPartidas = matchData.length;
  const totalKills = matchData.reduce((sum, m) => sum + m.stats.kills, 0);
  const totalDeaths = matchData.reduce((sum, m) => sum + m.stats.deaths, 0);
  const avgKD = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);

  const getMatchResult = (item: MatchStatsWithMatch): "win" | "loss" | "unknown" => {
    const { stats, match } = item;
    const playerTeam = stats.team;
    
    if (match.winnerTeam) {
      return match.winnerTeam === playerTeam ? "win" : "loss";
    }
    
    const team1Name = match.team1Name;
    const isTeam1 = playerTeam === team1Name;
    const team1Score = match.team1Score || 0;
    const team2Score = match.team2Score || 0;
    
    if (team1Score === team2Score) return "unknown";
    
    if (isTeam1) {
      return team1Score > team2Score ? "win" : "loss";
    } else {
      return team2Score > team1Score ? "win" : "loss";
    }
  };

  const victories = matchData.filter(m => getMatchResult(m) === "win").length;
  const defeats = matchData.filter(m => getMatchResult(m) === "loss").length;
  const winRate = totalPartidas > 0 ? ((victories / totalPartidas) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Minhas Partidas</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold font-mono">{totalPartidas}</div>
              <div className="text-sm text-muted-foreground">Partidas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold font-mono text-green-500">{victories}</div>
              <div className="text-sm text-muted-foreground">Vitórias</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold font-mono text-red-500">{defeats}</div>
              <div className="text-sm text-muted-foreground">Derrotas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold font-mono text-blue-500">{winRate}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold font-mono text-yellow-500">{avgKD}</div>
              <div className="text-sm text-muted-foreground">K/D Médio</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Partidas</CardTitle>
          <CardDescription>
            {totalPartidas > 0 
              ? `Mostrando ${totalPartidas} partida(s) jogada(s)`
              : "Nenhuma partida registrada ainda"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {matchData.length > 0 ? (
            <div className="space-y-4">
              {matchData.map((item) => {
                const result = getMatchResult(item);
                const { stats, match } = item;
                const isTeam1 = stats.team === match.team1Name;
                const playerScore = isTeam1 ? match.team1Score : match.team2Score;
                const opponentScore = isTeam1 ? match.team2Score : match.team1Score;
                
                return (
                  <div
                    key={stats.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      result === "win" 
                        ? "bg-green-500/5 border-green-500/30" 
                        : result === "loss" 
                          ? "bg-red-500/5 border-red-500/30"
                          : "bg-background/50"
                    }`}
                    data-testid={`match-row-${stats.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded ${
                        result === "win" 
                          ? "bg-green-500/20" 
                          : result === "loss" 
                            ? "bg-red-500/20" 
                            : "bg-muted"
                      }`}>
                        {result === "win" ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : result === "loss" ? (
                          <XCircle className="h-6 w-6 text-red-500" />
                        ) : (
                          <Trophy className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {match.map}
                          <Badge variant={result === "win" ? "default" : result === "loss" ? "destructive" : "secondary"}>
                            {result === "win" ? "Vitória" : result === "loss" ? "Derrota" : "---"}
                          </Badge>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {match.date ? new Date(match.date).toLocaleDateString('pt-BR') : '-'}
                          </span>
                          <span className="font-mono font-bold">
                            {playerScore} - {opponentScore}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {stats.team}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="text-center">
                        <div className="font-mono font-bold text-green-500">{stats.kills}</div>
                        <div className="text-xs text-muted-foreground">K</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono font-bold text-red-500">{stats.deaths}</div>
                        <div className="text-xs text-muted-foreground">D</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono font-bold">{stats.assists}</div>
                        <div className="text-xs text-muted-foreground">A</div>
                      </div>
                      <div className="text-center hidden sm:block">
                        <div className="font-mono font-bold text-yellow-500">{stats.headshots}</div>
                        <div className="text-xs text-muted-foreground">HS</div>
                      </div>
                      <div className="text-center hidden sm:block">
                        <div className="font-mono font-bold text-blue-500">{stats.damage}</div>
                        <div className="text-xs text-muted-foreground">DMG</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhuma partida encontrada</h3>
              <p className="text-muted-foreground">
                Suas partidas aparecerão aqui depois que você jogar no servidor.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
