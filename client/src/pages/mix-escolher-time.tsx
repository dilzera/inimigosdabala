import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Swords, Users, Shuffle, Trophy, Target, RefreshCw, Star, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

type PlayerWithLevel = User & { mixLevel: number };

function calculateRating(player: User): number {
  const totalKills = player.totalKills || 0;
  const totalDeaths = player.totalDeaths || 0;
  const totalAssists = player.totalAssists || 0;
  const headshots = player.totalHeadshots || 0;
  const totalDamage = player.totalDamage || 0;
  const wins = player.matchesWon || 0;
  const losses = player.matchesLost || 0;
  const roundsPlayed = Math.max(player.totalRoundsPlayed || 1, 1);
  const totalMatches = Math.max(player.totalMatches || 1, 1);
  const mvps = player.totalMvps || 0;
  const aces = player.total5ks || 0;
  const fourK = player.total4ks || 0;
  const threeK = player.total3ks || 0;
  const twoK = player.total2ks || 0;
  const clutch1v1Wins = player.total1v1Wins || 0;
  const clutch1v2Wins = player.total1v2Wins || 0;
  const entryWins = player.totalEntryWins || 0;
  const entryCount = Math.max(player.totalEntryCount || 1, 1);

  const kd = totalDeaths > 0 ? totalKills / totalDeaths : (totalKills > 0 ? 1.5 : 0.5);
  const adr = totalDamage / roundsPlayed;
  const hsPercent = totalKills > 0 ? headshots / totalKills : 0;
  const winRate = (wins + losses) > 0 ? wins / (wins + losses) : 0.5;
  const kpr = totalKills / roundsPlayed;
  const apr = totalAssists / roundsPlayed;
  const entrySuccess = entryWins / entryCount;
  const mvpPerMatch = mvps / totalMatches;

  const multiKillPerRound = ((aces * 5) + (fourK * 3) + (threeK * 2) + (twoK * 1)) / roundsPlayed;
  const clutchPerRound = ((clutch1v1Wins * 2) + (clutch1v2Wins * 4)) / roundsPlayed;

  const normalizedKd = Math.min(kd / 2.0, 1.0);
  const normalizedAdr = Math.min(adr / 100.0, 1.0);
  const normalizedHsPercent = Math.min(hsPercent, 1.0);
  const normalizedWinRate = Math.min(winRate, 1.0);
  const normalizedKpr = Math.min(kpr / 0.8, 1.0);
  const normalizedApr = Math.min(apr / 0.5, 1.0);
  const normalizedEntry = Math.min(entrySuccess, 1.0);
  const normalizedMvp = Math.min(mvpPerMatch / 2.0, 1.0);
  const normalizedMultiKill = Math.min(multiKillPerRound * 5, 1.0);
  const normalizedClutch = Math.min(clutchPerRound * 10, 1.0);

  const rating = (
    (normalizedKd * 0.20) +
    (normalizedAdr * 0.20) +
    (normalizedHsPercent * 0.08) +
    (normalizedWinRate * 0.15) +
    (normalizedKpr * 0.10) +
    (normalizedApr * 0.05) +
    (normalizedMultiKill * 0.08) +
    (normalizedClutch * 0.06) +
    (normalizedMvp * 0.04) +
    (normalizedEntry * 0.04)
  );

  return Math.max(0.10, Math.min(2.00, rating));
}

const ratingsCache = new Map<string, number>();

function getCachedRating(player: User): number {
  const cached = ratingsCache.get(player.id);
  if (cached !== undefined) return cached;
  
  const rating = calculateRating(player);
  ratingsCache.set(player.id, rating);
  return rating;
}

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

  const balanceByRating = () => {
    const playersWithLevels = users.map(u => getPlayerWithLevel(u));
    const sortedByRating = [...playersWithLevels].sort((a, b) => getCachedRating(b) - getCachedRating(a));
    
    const newTeam1: PlayerWithLevel[] = [];
    const newTeam2: PlayerWithLevel[] = [];
    let team1Rating = 0;
    let team2Rating = 0;

    sortedByRating.forEach((player) => {
      const playerRating = getCachedRating(player);
      if (team1Rating <= team2Rating) {
        newTeam1.push(player);
        team1Rating += playerRating;
      } else {
        newTeam2.push(player);
        team2Rating += playerRating;
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

  const getTeamRating = (team: PlayerWithLevel[]) =>
    team.reduce((sum, p) => sum + getCachedRating(p), 0);

  const getTeamAvgRating = (team: PlayerWithLevel[]) =>
    team.length > 0 ? (getTeamRating(team) / team.length).toFixed(2) : "0.00";

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

  const getRatingColor = (rating: number) => {
    if (rating < 0.7) return "text-red-500";
    if (rating < 1.0) return "text-yellow-500";
    if (rating < 1.3) return "text-blue-500";
    return "text-green-500";
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
    const rating = getCachedRating(player);
    const playerName = player.nickname || player.firstName || "Jogador";
    
    return (
      <div className="p-3 bg-background/50 rounded-lg border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={player.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {player.nickname?.slice(0, 2).toUpperCase() || player.firstName?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="font-medium truncate max-w-[120px] sm:max-w-[180px]" data-testid={`text-player-name-${player.id}`}>
                    {playerName}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{playerName}</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getLevelBadgeVariant(player.mixLevel)} className="font-mono text-xs" data-testid={`badge-level-${player.id}`}>
                  <Star className="h-3 w-3 mr-1" />
                  Nv {player.mixLevel}
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className={`font-mono text-xs ${getRatingColor(rating)}`} data-testid={`badge-rating-${player.id}`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {rating.toFixed(2)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rating baseado nas estatísticas</p>
                    <p className="text-xs text-muted-foreground">K/D, ADR, HS%, Win Rate</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          {showActions && (
            <div className="flex gap-1 shrink-0">
              {team !== "team1" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => moveToTeam(player, "team1")}
                  className="text-xs px-2"
                  data-testid={`button-move-team1-${player.id}`}
                >
                  CT
                </Button>
              )}
              {team !== "team2" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => moveToTeam(player, "team2")}
                  className="text-xs px-2"
                  data-testid={`button-move-team2-${player.id}`}
                >
                  TR
                </Button>
              )}
              {team && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeFromTeam(player)}
                  className="text-xs px-2"
                  data-testid={`button-remove-${player.id}`}
                >
                  X
                </Button>
              )}
            </div>
          )}
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-12 shrink-0">Nível:</span>
            <Slider
              value={[player.mixLevel]}
              onValueChange={(value) => setPlayerLevel(player.id, value[0])}
              min={1}
              max={10}
              step={1}
              className="flex-1"
              data-testid={`slider-level-${player.id}`}
            />
            <span className={`font-mono font-bold w-6 text-center shrink-0 ${getLevelColor(player.mixLevel)}`}>
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
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={resetTeams} data-testid="button-reset">
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button variant="outline" onClick={balanceTeams} data-testid="button-balance">
            <Shuffle className="h-4 w-4 mr-2" />
            Por Nível
          </Button>
          <Button onClick={balanceByRating} data-testid="button-balance-rating">
            <TrendingUp className="h-4 w-4 mr-2" />
            Por Rating
          </Button>
        </div>
      </div>

      {currentUser?.isAdmin && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-primary shrink-0" />
              <span>
                Como admin, você pode ajustar o nível de habilidade (1-10) de cada jogador. 
                Use "Por Nível" para balancear pelo nível manual ou "Por Rating" para usar as estatísticas.
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
            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-500" />
                Time 1 (CT)
              </span>
              <Badge variant="secondary">{team1.length}</Badge>
            </CardTitle>
            <CardDescription className="flex gap-4 flex-wrap">
              <span>Nível: {getTeamLevel(team1)}</span>
              <span className="text-blue-500">Rating: {getTeamAvgRating(team1)}</span>
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
            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Time 2 (TR)
              </span>
              <Badge variant="secondary">{team2.length}</Badge>
            </CardTitle>
            <CardDescription className="flex gap-4 flex-wrap">
              <span>Nível: {getTeamLevel(team2)}</span>
              <span className="text-orange-500">Rating: {getTeamAvgRating(team2)}</span>
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
            <div className="flex items-center justify-center gap-6 md:gap-8 text-center flex-wrap">
              <div>
                <div className="text-2xl font-bold text-blue-500">{getTeamLevel(team1)}</div>
                <div className="text-sm text-muted-foreground">Nível Time 1</div>
                <div className="text-xs text-muted-foreground">Média: {getTeamAvgLevel(team1)}</div>
                <div className="text-xs text-blue-500 mt-1">
                  Rating Médio: {getTeamAvgRating(team1)}
                </div>
              </div>
              <div className="text-4xl font-bold text-muted-foreground">VS</div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{getTeamLevel(team2)}</div>
                <div className="text-sm text-muted-foreground">Nível Time 2</div>
                <div className="text-xs text-muted-foreground">Média: {getTeamAvgLevel(team2)}</div>
                <div className="text-xs text-orange-500 mt-1">
                  Rating Médio: {getTeamAvgRating(team2)}
                </div>
              </div>
            </div>
            <div className="text-center mt-4 flex justify-center gap-2 flex-wrap">
              <Badge variant={Math.abs(getTeamLevel(team1) - getTeamLevel(team2)) <= 2 ? "default" : "destructive"}>
                Dif. Nível: {Math.abs(getTeamLevel(team1) - getTeamLevel(team2))} pts
              </Badge>
              <Badge variant={Math.abs(getTeamRating(team1) - getTeamRating(team2)) <= 0.5 ? "default" : "destructive"}>
                Dif. Rating: {Math.abs(getTeamRating(team1) - getTeamRating(team2)).toFixed(2)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
