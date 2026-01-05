import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Map, Trophy, Gamepad2, TrendingUp } from "lucide-react";
import type { Match } from "@shared/schema";

export default function MapasMaisJogados() {
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

  const mapStats = matches.reduce((acc, match) => {
    const mapName = match.map || "Desconhecido";
    if (!acc[mapName]) {
      acc[mapName] = { count: 0, team1Wins: 0, team2Wins: 0 };
    }
    acc[mapName].count += 1;
    if (match.team1Score > match.team2Score) {
      acc[mapName].team1Wins += 1;
    } else if (match.team2Score > match.team1Score) {
      acc[mapName].team2Wins += 1;
    }
    return acc;
  }, {} as Record<string, { count: number; team1Wins: number; team2Wins: number }>);

  const sortedMaps = Object.entries(mapStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count);

  const totalMatches = matches.length;
  const topMap = sortedMaps[0];

  const getMapImage = (mapName: string) => {
    const mapLower = mapName.toLowerCase();
    if (mapLower.includes("dust")) return "bg-gradient-to-br from-amber-700 to-yellow-600";
    if (mapLower.includes("mirage")) return "bg-gradient-to-br from-orange-600 to-amber-500";
    if (mapLower.includes("inferno")) return "bg-gradient-to-br from-red-700 to-orange-600";
    if (mapLower.includes("nuke")) return "bg-gradient-to-br from-green-600 to-emerald-500";
    if (mapLower.includes("overpass")) return "bg-gradient-to-br from-blue-700 to-cyan-500";
    if (mapLower.includes("vertigo")) return "bg-gradient-to-br from-sky-600 to-blue-500";
    if (mapLower.includes("ancient")) return "bg-gradient-to-br from-emerald-700 to-green-500";
    if (mapLower.includes("anubis")) return "bg-gradient-to-br from-yellow-700 to-amber-500";
    if (mapLower.includes("train")) return "bg-gradient-to-br from-gray-600 to-slate-500";
    return "bg-gradient-to-br from-gray-700 to-gray-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Map className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Mapas Mais Jogados</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Gamepad2 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold font-mono">{totalMatches}</div>
              <div className="text-sm text-muted-foreground">Total de Partidas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Map className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold font-mono">{sortedMaps.length}</div>
              <div className="text-sm text-muted-foreground">Mapas Diferentes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold font-mono truncate">{topMap?.name || "-"}</div>
              <div className="text-sm text-muted-foreground">Mapa Favorito</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ranking de Mapas
          </CardTitle>
          <CardDescription>
            {sortedMaps.length > 0 
              ? `${sortedMaps.length} mapa(s) jogado(s) no total`
              : "Nenhuma partida registrada ainda"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedMaps.length > 0 ? (
            <div className="space-y-3">
              {sortedMaps.map((map, index) => {
                const percentage = totalMatches > 0 ? ((map.count / totalMatches) * 100).toFixed(1) : "0";
                return (
                  <div
                    key={map.name}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      index === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-background/50 border'
                    }`}
                    data-testid={`map-row-${map.name}`}
                  >
                    <div className="flex items-center justify-center w-8">
                      {index === 0 ? (
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      ) : index === 1 ? (
                        <Badge variant="secondary">{index + 1}</Badge>
                      ) : index === 2 ? (
                        <Badge className="bg-amber-600 text-white">{index + 1}</Badge>
                      ) : (
                        <span className="w-6 text-center font-bold text-muted-foreground">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className={`w-12 h-12 rounded-lg ${getMapImage(map.name)} flex items-center justify-center`}>
                      <Map className="h-6 w-6 text-white drop-shadow-lg" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-lg">{map.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {map.count} partida{map.count !== 1 ? "s" : ""} ({percentage}%)
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                          CT: {map.team1Wins}
                        </Badge>
                        <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                          TR: {map.team2Wins}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma partida registrada ainda. Importe partidas para ver as estatísticas dos mapas.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
