import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Swords, Users, Shuffle, Trophy, Target, RefreshCw, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

type PlayerWithLevel = User & { mixLevel: number };

export default function MixEscolherTime() {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const [playerLevels, setPlayerLevels] = useState<Record<string, number>>({});
  const [team1, setTeam1] = useState<PlayerWithLevel[]>([]);
  const [team2, setTeam2] = useState<PlayerWithLevel[]>([]);
  const [available, setAvailable] = useState<PlayerWithLevel[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (users.length > 0 && !initialized) {
      const initialLevels: Record<string, number> = {};
      users.forEach(user => {
        initialLevels[user.id] = 5;
      });
      setPlayerLevels(initialLevels);
      setAvailable(users.map(u => ({ ...u, mixLevel: 5 })));
      setInitialized(true);
    }
  }, [users, initialized]);

  const getPlayerWithLevel = (player: User): PlayerWithLevel => ({
    ...player,
    mixLevel: playerLevels[player.id] || 5,
  });

  const setPlayerLevel = (playerId: string, level: number) => {
    setPlayerLevels(prev => ({ ...prev, [playerId]: level }));
    
    setAvailable(prev => prev.map(p => 
      p.id === playerId ? { ...p, mixLevel: level } : p
    ));
    setTeam1(prev => prev.map(p => 
      p.id === playerId ? { ...p, mixLevel: level } : p
    ));
    setTeam2(prev => prev.map(p => 
      p.id === playerId ? { ...p, mixLevel: level } : p
    ));
  };

  const resetTeams = () => {
    setTeam1([]);
    setTeam2([]);
    setAvailable(users.map(u => getPlayerWithLevel(u)));
  };

  const balanceTeams = () => {
    const playersWithLevels = users.map(u => getPlayerWithLevel(u));
    const sortedByLevel = [...playersWithLevels].sort((a, b) => b.mixLevel - a.mixLevel);
    
    const newTeam1: PlayerWithLevel[] = [];
    const newTeam2: PlayerWithLevel[] = [];
    let team1Level = 0;
    let team2Level = 0;

    sortedByLevel.forEach((player) => {
      if (team1Level <= team2Level) {
        newTeam1.push(player);
        team1Level += player.mixLevel;
      } else {
        newTeam2.push(player);
        team2Level += player.mixLevel;
      }
    });

    setTeam1(newTeam1);
    setTeam2(newTeam2);
    setAvailable([]);
  };

  const moveToTeam = (player: PlayerWithLevel, targetTeam: "team1" | "team2") => {
    setAvailable(available.filter(p => p.id !== player.id));
    setTeam1(team1.filter(p => p.id !== player.id));
    setTeam2(team2.filter(p => p.id !== player.id));
    
    if (targetTeam === "team1") {
      setTeam1([...team1.filter(p => p.id !== player.id), player]);
    } else {
      setTeam2([...team2.filter(p => p.id !== player.id), player]);
    }
  };

  const removeFromTeam = (player: PlayerWithLevel) => {
    setTeam1(team1.filter(p => p.id !== player.id));
    setTeam2(team2.filter(p => p.id !== player.id));
    setAvailable([...available, player]);
  };

  const getTeamLevel = (team: PlayerWithLevel[]) => 
    team.reduce((sum, p) => sum + p.mixLevel, 0);

  const getTeamAvgLevel = (team: PlayerWithLevel[]) => 
    team.length > 0 ? (getTeamLevel(team) / team.length).toFixed(1) : "0";

  const getLevelColor = (level: number) => {
    if (level <= 3) return "text-red-500";
    if (level <= 5) return "text-yellow-500";
    if (level <= 7) return "text-blue-500";
    return "text-green-500";
  };

  const getLevelBadgeVariant = (level: number): "destructive" | "secondary" | "default" | "outline" => {
    if (level <= 3) return "destructive";
    if (level <= 5) return "secondary";
    if (level <= 7) return "default";
    return "default";
  };

  const PlayerCard = ({ 
    player, 
    showActions = false, 
    team 
  }: { 
    player: PlayerWithLevel; 
    showActions?: boolean; 
    team?: "team1" | "team2";
  }) => {
    const isAdmin = currentUser?.isAdmin;
    
    return (
      <div className="p-3 bg-background/50 rounded-lg border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={player.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {player.nickname?.slice(0, 2).toUpperCase() || player.firstName?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{player.nickname || player.firstName || "Jogador"}</div>
              <div className="flex items-center gap-2">
                <Badge variant={getLevelBadgeVariant(player.mixLevel)} className="font-mono">
                  <Star className="h-3 w-3 mr-1" />
                  Nível {player.mixLevel}
                </Badge>
              </div>
            </div>
          </div>
          {showActions && (
            <div className="flex gap-1">
              {team !== "team1" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => moveToTeam(player, "team1")}
                  data-testid={`button-move-team1-${player.id}`}
                >
                  Time 1
                </Button>
              )}
              {team !== "team2" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => moveToTeam(player, "team2")}
                  data-testid={`button-move-team2-${player.id}`}
                >
                  Time 2
                </Button>
              )}
              {team && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeFromTeam(player)}
                  data-testid={`button-remove-${player.id}`}
                >
                  Remover
                </Button>
              )}
            </div>
          )}
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-16">Nível:</span>
            <Slider
              value={[player.mixLevel]}
              onValueChange={(value) => setPlayerLevel(player.id, value[0])}
              min={1}
              max={10}
              step={1}
              className="flex-1"
              data-testid={`slider-level-${player.id}`}
            />
            <span className={`font-mono font-bold w-8 text-center ${getLevelColor(player.mixLevel)}`}>
              {player.mixLevel}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Swords className="h-8 w-8 text-primary" />
            Escolher Time do Mix
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentUser?.isAdmin 
              ? "Defina o nível de cada jogador (1-10) e balance os times"
              : "Organize os times para a partida"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetTeams} data-testid="button-reset">
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button onClick={balanceTeams} data-testid="button-balance">
            <Shuffle className="h-4 w-4 mr-2" />
            Balancear por Nível
          </Button>
        </div>
      </div>

      {currentUser?.isAdmin && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-primary" />
              <span>
                Como admin, você pode ajustar o nível de habilidade (1-10) de cada jogador. 
                O balanceamento será feito com base nesses níveis.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Jogadores Disponíveis
            </CardTitle>
            <CardDescription>{available.length} jogadores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {available.map((player) => (
              <PlayerCard key={player.id} player={player} showActions />
            ))}
            {available.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Todos os jogadores foram alocados
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-500/50">
          <CardHeader className="bg-blue-500/10">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-500" />
                Time 1 (CT)
              </span>
              <Badge variant="secondary">{team1.length} jogadores</Badge>
            </CardTitle>
            <CardDescription className="flex gap-4">
              <span>Nível Total: {getTeamLevel(team1)}</span>
              <span>Média: {getTeamAvgLevel(team1)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {team1.map((player) => (
              <PlayerCard key={player.id} player={player} showActions team="team1" />
            ))}
            {team1.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Adicione jogadores a este time
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-500/50">
          <CardHeader className="bg-orange-500/10">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Time 2 (TR)
              </span>
              <Badge variant="secondary">{team2.length} jogadores</Badge>
            </CardTitle>
            <CardDescription className="flex gap-4">
              <span>Nível Total: {getTeamLevel(team2)}</span>
              <span>Média: {getTeamAvgLevel(team2)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {team2.map((player) => (
              <PlayerCard key={player.id} player={player} showActions team="team2" />
            ))}
            {team2.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Adicione jogadores a este time
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {team1.length > 0 && team2.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-500">{getTeamLevel(team1)}</div>
                <div className="text-sm text-muted-foreground">Nível Time 1</div>
                <div className="text-xs text-muted-foreground">Média: {getTeamAvgLevel(team1)}</div>
              </div>
              <div className="text-4xl font-bold text-muted-foreground">VS</div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{getTeamLevel(team2)}</div>
                <div className="text-sm text-muted-foreground">Nível Time 2</div>
                <div className="text-xs text-muted-foreground">Média: {getTeamAvgLevel(team2)}</div>
              </div>
            </div>
            <div className="text-center mt-4">
              <Badge variant={Math.abs(getTeamLevel(team1) - getTeamLevel(team2)) <= 2 ? "default" : "destructive"}>
                Diferença: {Math.abs(getTeamLevel(team1) - getTeamLevel(team2))} pontos
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
