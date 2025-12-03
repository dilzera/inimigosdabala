import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Gamepad2, Calendar, MapPin, Users, Trophy } from "lucide-react";
import type { Match } from "@shared/schema";

export default function PartidasTodas() {
  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const sortedMatches = [...matches].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Gamepad2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Todas as Partidas</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Gamepad2 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold font-mono">{matches.length}</div>
              <div className="text-sm text-muted-foreground">Total de Partidas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold font-mono text-blue-500">
                {matches.filter(m => m.team1Score > m.team2Score).length}
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
                {matches.filter(m => m.team2Score > m.team1Score).length}
              </div>
              <div className="text-sm text-muted-foreground">Vitórias TR</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Partidas</CardTitle>
          <CardDescription>
            {matches.length > 0 
              ? `Mostrando ${matches.length} partida(s)`
              : "Nenhuma partida registrada ainda"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedMatches.length > 0 ? (
            <div className="space-y-4">
              {sortedMatches.map((match) => {
                const ctWon = match.team1Score > match.team2Score;
                const trWon = match.team2Score > match.team1Score;
                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-4 bg-background/50 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded bg-muted">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{match.map}</div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(match.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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
