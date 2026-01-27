import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Map as MapIcon, X, Check, Crown, Trophy, Target, RefreshCw, Users } from "lucide-react";
import type { User } from "@shared/schema";

const MAPS = [
  { name: "Mirage", abbr: "MIR", color: "text-yellow-500", bg: "bg-yellow-500/20" },
  { name: "Dust2", abbr: "D2", color: "text-orange-500", bg: "bg-orange-500/20" },
  { name: "Inferno", abbr: "INF", color: "text-red-500", bg: "bg-red-500/20" },
  { name: "Anubis", abbr: "ANB", color: "text-amber-500", bg: "bg-amber-500/20" },
  { name: "Nuke", abbr: "NUK", color: "text-yellow-400", bg: "bg-yellow-400/20" },
  { name: "Overpass", abbr: "OVP", color: "text-blue-500", bg: "bg-blue-500/20" },
  { name: "Vertigo", abbr: "VRT", color: "text-sky-500", bg: "bg-sky-500/20" },
  { name: "Ancient", abbr: "ANC", color: "text-green-500", bg: "bg-green-500/20" },
  { name: "Train", abbr: "TRN", color: "text-gray-400", bg: "bg-gray-400/20" },
  { name: "Cobble", abbr: "CBL", color: "text-stone-500", bg: "bg-stone-500/20" },
  { name: "Cache", abbr: "CCH", color: "text-emerald-500", bg: "bg-emerald-500/20" },
];

export default function MixVetoMapas() {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const [bannedMaps, setBannedMaps] = useState<string[]>([]);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [currentVetoTeam, setCurrentVetoTeam] = useState<1 | 2>(1);
  const [team1Name, setTeam1Name] = useState("Time 1 (CT)");
  const [team2Name, setTeam2Name] = useState("Time 2 (TR)");
  const [captain1Name, setCaptain1Name] = useState("");
  const [captain2Name, setCaptain2Name] = useState("");

  const getPlayerName = (player: User): string => {
    if (player.nickname) return player.nickname;
    if (player.firstName) return player.firstName;
    if (player.email) return player.email;
    return "Jogador";
  };

  const banMap = (mapName: string) => {
    const newBannedMaps = [...bannedMaps, mapName];
    setBannedMaps(newBannedMaps);
    
    const remainingMaps = MAPS.filter(m => !newBannedMaps.includes(m.name));
    
    if (remainingMaps.length === 1) {
      setSelectedMap(remainingMaps[0].name);
    } else {
      setCurrentVetoTeam(currentVetoTeam === 1 ? 2 : 1);
    }
  };

  const resetVeto = () => {
    setBannedMaps([]);
    setSelectedMap(null);
    setCurrentVetoTeam(1);
  };

  const remainingMaps = MAPS.filter(m => !bannedMaps.includes(m.name));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MapIcon className="h-8 w-8 text-primary" />
            Veto de Mapas
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedMap 
              ? "Mapa selecionado!" 
              : `Vez do ${currentVetoTeam === 1 ? team1Name : team2Name} banir um mapa`
            }
          </p>
        </div>
        <Button variant="outline" onClick={resetVeto} data-testid="button-reset-veto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reiniciar Veto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-500/50">
          <CardHeader className="bg-blue-500/10 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-blue-500" />
              <Input
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                className="h-7 max-w-[180px] bg-transparent border-none p-0 text-lg font-semibold focus-visible:ring-0"
                placeholder="Time 1 (CT)"
                data-testid="input-team1-name"
              />
            </CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <Input
                  value={captain1Name}
                  onChange={(e) => setCaptain1Name(e.target.value)}
                  className="h-6 max-w-[150px] bg-transparent border-none p-0 text-sm focus-visible:ring-0"
                  placeholder="Nome do capitão"
                  data-testid="input-captain1-name"
                />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <div className={`p-4 rounded-lg border-2 border-dashed transition-all ${
              currentVetoTeam === 1 && !selectedMap
                ? "border-blue-500 bg-blue-500/10"
                : "border-muted"
            }`}>
              {currentVetoTeam === 1 && !selectedMap ? (
                <p className="text-center text-blue-500 font-medium">
                  Escolha um mapa para banir
                </p>
              ) : (
                <p className="text-center text-muted-foreground">
                  {selectedMap ? "Veto finalizado" : "Aguardando..."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/50">
          <CardHeader className="bg-orange-500/10 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-orange-500" />
              <Input
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                className="h-7 max-w-[180px] bg-transparent border-none p-0 text-lg font-semibold focus-visible:ring-0"
                placeholder="Time 2 (TR)"
                data-testid="input-team2-name"
              />
            </CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <Input
                  value={captain2Name}
                  onChange={(e) => setCaptain2Name(e.target.value)}
                  className="h-6 max-w-[150px] bg-transparent border-none p-0 text-sm focus-visible:ring-0"
                  placeholder="Nome do capitão"
                  data-testid="input-captain2-name"
                />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <div className={`p-4 rounded-lg border-2 border-dashed transition-all ${
              currentVetoTeam === 2 && !selectedMap
                ? "border-orange-500 bg-orange-500/10"
                : "border-muted"
            }`}>
              {currentVetoTeam === 2 && !selectedMap ? (
                <p className="text-center text-orange-500 font-medium">
                  Escolha um mapa para banir
                </p>
              ) : (
                <p className="text-center text-muted-foreground">
                  {selectedMap ? "Veto finalizado" : "Aguardando..."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedMap ? (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className={`h-20 w-20 mx-auto rounded-xl flex items-center justify-center ${MAPS.find(m => m.name === selectedMap)?.bg}`}>
                <span className={`text-3xl font-bold ${MAPS.find(m => m.name === selectedMap)?.color}`}>
                  {MAPS.find(m => m.name === selectedMap)?.abbr}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-500">
                  {selectedMap}
                </h2>
                <p className="text-muted-foreground">
                  Mapa selecionado para a partida!
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Veto Finalizado
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-primary" />
              Mapas Disponíveis
            </CardTitle>
            <CardDescription>
              {currentVetoTeam === 1 ? team1Name : team2Name}: Clique em um mapa para bani-lo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {MAPS.map(map => {
                const isBanned = bannedMaps.includes(map.name);
                const isRemaining = !isBanned;
                
                return (
                  <button
                    key={map.name}
                    onClick={() => !isBanned && banMap(map.name)}
                    disabled={isBanned}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      isBanned 
                        ? "opacity-40 border-red-500/50 bg-red-500/10 cursor-not-allowed" 
                        : `hover-elevate border-muted ${currentVetoTeam === 1 ? "hover:border-blue-500" : "hover:border-orange-500"}`
                    }`}
                    data-testid={`button-map-${map.name.toLowerCase()}`}
                  >
                    {isBanned && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <X className="h-12 w-12 text-red-500" />
                      </div>
                    )}
                    <div className={`h-12 w-12 mx-auto rounded-lg flex items-center justify-center ${map.bg}`}>
                      <span className={`text-lg font-bold ${map.color}`}>
                        {map.abbr}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm font-medium text-center ${isBanned ? "line-through text-muted-foreground" : ""}`}>
                      {map.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {bannedMaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              Mapas Banidos ({bannedMaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {bannedMaps.map((mapName, index) => {
                const map = MAPS.find(m => m.name === mapName);
                const bannedBy = index % 2 === 0 ? team1Name : team2Name;
                return (
                  <Badge 
                    key={mapName} 
                    variant="outline" 
                    className="text-red-500 border-red-500/50"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {mapName}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({bannedBy})
                    </span>
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-primary" />
              Como funciona o Veto
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Os times se alternam banindo mapas</li>
              <li>Cada time bane um mapa por vez</li>
              <li>O último mapa restante será o mapa da partida</li>
              <li>O capitão de cada time deve escolher qual mapa banir</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
