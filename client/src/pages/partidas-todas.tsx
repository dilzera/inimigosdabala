import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Gamepad2, Calendar, MapPin, Trophy, Target, Skull, Crosshair, Star } from "lucide-react";
import type { Match, MatchStats } from "@shared/schema";

type MatchWithStats = {
  match: Match;
  stats: MatchStats[];
  aggregated: {
    totalKills: number;
    totalDeaths: number;
    totalDamage: number;
    totalHeadshots: number;
    playerCount: number;
    topKiller: MatchStats | null;
    mvpPlayer: MatchStats | null;
  };
};

export default function PartidasTodas() {
  const { data: matchesWithStats = [], isLoading } = useQuery<MatchWithStats[]>({
    queryKey: ["/api/matches/with-stats"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const sortedMatches = [...matchesWithStats].sort((a, b) => {
    const dateA = a.match.date ? new Date(a.match.date).getTime() : 0;
    const dateB = b.match.date ? new Date(b.match.date).getTime() : 0;
    return dateB - dateA;
  });

  const totalKills = matchesWithStats.reduce((sum, m) => sum + m.aggregated.totalKills, 0);
  const totalDamage = matchesWithStats.reduce((sum, m) => sum + m.aggregated.totalDamage, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Gamepad2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Todas as Partidas</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Gamepad2 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold font-mono">{matchesWithStats.length}</div>
              <div className="text-sm text-muted-foreground">Total de Partidas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold font-mono text-blue-500">
                {matchesWithStats.filter(m => m.match.team1Score > m.match.team2Score).length}
              </div>
              <div className="text-sm text-muted-foreground">Vitórias CT</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold font-mono text-orange-500">
                {matchesWithStats.filter(m => m.match.team2Score > m.match.team1Score).length}
              </div>
              <div className="text-sm text-muted-foreground">Vitórias TR</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Crosshair className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold font-mono text-green-500">{totalKills.toLocaleString('pt-BR')}</div>
              <div className="text-sm text-muted-foreground">Total Kills</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold font-mono text-red-500">{totalDamage.toLocaleString('pt-BR')}</div>
              <div className="text-sm text-muted-foreground">Total Dano</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Partidas</CardTitle>
          <CardDescription>
            {matchesWithStats.length > 0 
              ? `Mostrando ${matchesWithStats.length} partida(s)`
              : "Nenhuma partida registrada ainda"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedMatches.length > 0 ? (
            <div className="space-y-4">
              {sortedMatches.map(({ match, aggregated }) => {
                const ctWon = match.team1Score > match.team2Score;
                const trWon = match.team2Score > match.team1Score;
                return (
                  <div
                    key={match.id}
                    className="p-4 bg-background/50 rounded-lg border space-y-3"
                    data-testid={`match-card-${match.id}`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded bg-muted">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{match.map}</div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1" data-testid={`text-match-date-${match.id}`}>
                              <Calendar className="h-3 w-3" />
                              {match.date 
                                ? new Date(match.date).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`text-center px-4 py-2 rounded ${ctWon ? 'bg-blue-500/20' : ''}`}>
                          <div className="text-xs text-blue-400 font-medium">CT</div>
                          <div className={`text-2xl font-mono font-bold ${ctWon ? 'text-blue-400' : ''}`}>
                            {match.team1Score}
                          </div>
                        </div>
                        <div className="text-xl font-bold text-muted-foreground">VS</div>
                        <div className={`text-center px-4 py-2 rounded ${trWon ? 'bg-orange-500/20' : ''}`}>
                          <div className="text-xs text-orange-400 font-medium">TR</div>
                          <div className={`text-2xl font-mono font-bold ${trWon ? 'text-orange-400' : ''}`}>
                            {match.team2Score}
                          </div>
                        </div>
                        <Badge variant={ctWon ? "default" : trWon ? "secondary" : "outline"}>
                          {ctWon ? "Vitória CT" : trWon ? "Vitória TR" : "Empate"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-2 border-t border-border/50 flex-wrap" data-testid={`match-stats-${match.id}`}>
                      <div className="flex items-center gap-2 text-sm" data-testid={`stat-kills-${match.id}`}>
                        <Crosshair className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">Kills:</span>
                        <span className="font-mono font-bold text-green-500">{aggregated.totalKills}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm" data-testid={`stat-deaths-${match.id}`}>
                        <Skull className="h-4 w-4 text-red-500" />
                        <span className="text-muted-foreground">Deaths:</span>
                        <span className="font-mono font-bold text-red-500">{aggregated.totalDeaths}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm" data-testid={`stat-damage-${match.id}`}>
                        <Target className="h-4 w-4 text-yellow-500" />
                        <span className="text-muted-foreground">Dano:</span>
                        <span className="font-mono font-bold text-yellow-500">{aggregated.totalDamage.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm" data-testid={`stat-headshots-${match.id}`}>
                        <span className="text-muted-foreground">HS:</span>
                        <span className="font-mono font-bold text-purple-500">{aggregated.totalHeadshots}</span>
                      </div>
                      {aggregated.topKiller && (
                        <div className="flex items-center gap-2 text-sm ml-auto" data-testid={`stat-topfragger-${match.id}`}>
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="text-muted-foreground">Top Fragger:</span>
                          <span className="font-medium text-amber-500">
                            {aggregated.topKiller.playerName || 'Jogador'} ({aggregated.topKiller.kills}K)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhuma partida encontrada</h3>
              <p className="text-muted-foreground">
                As partidas do servidor aparecerão aqui quando forem registradas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
