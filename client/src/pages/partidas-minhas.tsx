import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { History, Trophy, Target, Skull, Calendar, MapPin } from "lucide-react";
import type { MatchStats, Match } from "@shared/schema";

export default function PartidasMinhas() {
  const { user } = useAuth();
  
  const { data: matchStats = [], isLoading } = useQuery<MatchStats[]>({
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

  const totalPartidas = matchStats.length;
  const totalKills = matchStats.reduce((sum, m) => sum + m.kills, 0);
  const totalDeaths = matchStats.reduce((sum, m) => sum + m.deaths, 0);
  const totalMvps = matchStats.reduce((sum, m) => sum + m.mvps, 0);
  const avgKD = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Minhas Partidas</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold font-mono">{totalPartidas}</div>
              <div className="text-sm text-muted-foreground">Partidas Jogadas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold font-mono text-green-500">{totalKills}</div>
              <div className="text-sm text-muted-foreground">Total de Kills</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Skull className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold font-mono text-red-500">{totalDeaths}</div>
              <div className="text-sm text-muted-foreground">Total de Deaths</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">{avgKD}</div>
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
          {matchStats.length > 0 ? (
            <div className="space-y-4">
              {matchStats.map((stat) => (
                <div
                  key={stat.id}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded ${stat.team === 1 ? 'bg-blue-500/20' : 'bg-orange-500/20'}`}>
                      <Badge variant={stat.team === 1 ? "default" : "secondary"}>
                        {stat.team === 1 ? "CT" : "TR"}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium">
                        Partida #{stat.matchId.slice(0, 8)}
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {stat.createdAt ? new Date(stat.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="font-mono font-bold text-green-500">{stat.kills}</div>
                      <div className="text-xs text-muted-foreground">Kills</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-bold text-red-500">{stat.deaths}</div>
                      <div className="text-xs text-muted-foreground">Deaths</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-bold">{stat.assists}</div>
                      <div className="text-xs text-muted-foreground">Assists</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-bold text-yellow-500">{stat.headshots}</div>
                      <div className="text-xs text-muted-foreground">HS</div>
                    </div>
                    {stat.mvps > 0 && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        {stat.mvps} MVP
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
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
