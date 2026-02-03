import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Swords, Users, Shuffle, Trophy, Target, RefreshCw, Star, TrendingUp, UserCheck, ArrowRight, Crown, Map as MapIcon, X, Check, ArrowUpDown, SortAsc } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

type PlayerWithLevel = User & { mixLevel: number; isCaptain?: boolean };

function getKdRating(player: User): number {
  const totalKills = player.totalKills || 0;
  const totalDeaths = player.totalDeaths || 1;
  return totalDeaths > 0 ? totalKills / totalDeaths : totalKills > 0 ? 1.5 : 1.0;
}

const kdCache: Map<string, number> = new Map();

function getCachedKd(player: User): number {
  const cached = kdCache.get(player.id);
  if (cached !== undefined) return cached;
  
  const kd = getKdRating(player);
  kdCache.set(player.id, kd);
  return kd;
}

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

const SEPARATED_PLAYERS = ["76561198308656936", "76561198004056384"];

function ensureSeparation(
  team1: PlayerWithLevel[], 
  team2: PlayerWithLevel[]
): { team1: PlayerWithLevel[]; team2: PlayerWithLevel[] } {
  const team1Separated = team1.filter(p => SEPARATED_PLAYERS.includes(p.steamId64 || ""));
  const team2Separated = team2.filter(p => SEPARATED_PLAYERS.includes(p.steamId64 || ""));
  
  if (team1Separated.length >= 2) {
    const playerToMove = team1Separated[1];
    const team2NonSeparated = team2.filter(p => !SEPARATED_PLAYERS.includes(p.steamId64 || ""));
    
    if (team2NonSeparated.length > 0) {
      const playerToSwap = team2NonSeparated[0];
      return {
        team1: [...team1.filter(p => p.id !== playerToMove.id), playerToSwap],
        team2: [...team2.filter(p => p.id !== playerToSwap.id), playerToMove]
      };
    }
  }
  
  if (team2Separated.length >= 2) {
    const playerToMove = team2Separated[1];
    const team1NonSeparated = team1.filter(p => !SEPARATED_PLAYERS.includes(p.steamId64 || ""));
    
    if (team1NonSeparated.length > 0) {
      const playerToSwap = team1NonSeparated[0];
      return {
        team1: [...team1.filter(p => p.id !== playerToSwap.id), playerToMove],
        team2: [...team2.filter(p => p.id !== playerToMove.id), playerToSwap]
      };
    }
  }
  
  return { team1, team2 };
}

export default function MixEscolherTime() {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const [step, setStep] = useState<"selection" | "balancing" | "veto">("selection");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [playerLevels, setPlayerLevels] = useState<Record<string, number>>({});
  const [team1, setTeam1] = useState<PlayerWithLevel[]>([]);
  const [team2, setTeam2] = useState<PlayerWithLevel[]>([]);
  const [available, setAvailable] = useState<PlayerWithLevel[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [captain1Id, setCaptain1Id] = useState<string | null>(null);
  const [captain2Id, setCaptain2Id] = useState<string | null>(null);
  const [bannedMaps, setBannedMaps] = useState<string[]>([]);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [currentVetoTeam, setCurrentVetoTeam] = useState<1 | 2>(1);
  const [sortOrder, setSortOrder] = useState<"alphabetical" | "kd">("kd");

  useEffect(() => {
    if (users.length > 0 && !initialized) {
      const initialLevels: Record<string, number> = {};
      users.forEach(user => {
        initialLevels[user.id] = 5;
      });
      setPlayerLevels(initialLevels);
      setInitialized(true);
    }
  }, [users, initialized]);

  const getPlayerName = (player: User): string => {
    if (player.nickname) return player.nickname;
    if (player.firstName) return player.firstName;
    if (player.email) return player.email;
    return "Jogador";
  };

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

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedPlayerIds(new Set(users.map(u => u.id)));
  };

  const clearSelection = () => {
    setSelectedPlayerIds(new Set());
  };

  const proceedToBalancing = () => {
    const selectedPlayers = users
      .filter(u => selectedPlayerIds.has(u.id))
      .map(u => getPlayerWithLevel(u));
    setAvailable(selectedPlayers);
    setTeam1([]);
    setTeam2([]);
    setCaptain1Id(null);
    setCaptain2Id(null);
    setStep("balancing");
  };

  const backToSelection = () => {
    setStep("selection");
    setTeam1([]);
    setTeam2([]);
    setAvailable([]);
    setCaptain1Id(null);
    setCaptain2Id(null);
  };

  const resetTeams = () => {
    const selectedPlayers = users
      .filter(u => selectedPlayerIds.has(u.id))
      .map(u => getPlayerWithLevel(u));
    setTeam1([]);
    setTeam2([]);
    setAvailable(selectedPlayers);
    setCaptain1Id(null);
    setCaptain2Id(null);
  };

  const balanceTeams = () => {
    const selectedPlayers = users
      .filter(u => selectedPlayerIds.has(u.id))
      .map(u => getPlayerWithLevel(u));
    const sortedByLevel = [...selectedPlayers].sort((a, b) => b.mixLevel - a.mixLevel);
    
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

    const { team1: finalTeam1, team2: finalTeam2 } = ensureSeparation(newTeam1, newTeam2);

    setTeam1(finalTeam1);
    setTeam2(finalTeam2);
    setAvailable([]);
    
    if (finalTeam1.length > 0) setCaptain1Id(finalTeam1[0].id);
    if (finalTeam2.length > 0) setCaptain2Id(finalTeam2[0].id);
  };

  const balanceByKd = () => {
    const selectedPlayers = users
      .filter(u => selectedPlayerIds.has(u.id))
      .map(u => getPlayerWithLevel(u));
    const sortedByKd = [...selectedPlayers].sort((a, b) => getCachedKd(b) - getCachedKd(a));
    
    const newTeam1: PlayerWithLevel[] = [];
    const newTeam2: PlayerWithLevel[] = [];
    let team1Kd = 0;
    let team2Kd = 0;

    sortedByKd.forEach((player) => {
      const playerKd = getCachedKd(player);
      if (team1Kd <= team2Kd) {
        newTeam1.push(player);
        team1Kd += playerKd;
      } else {
        newTeam2.push(player);
        team2Kd += playerKd;
      }
    });

    const { team1: finalTeam1, team2: finalTeam2 } = ensureSeparation(newTeam1, newTeam2);

    setTeam1(finalTeam1);
    setTeam2(finalTeam2);
    setAvailable([]);
    
    if (finalTeam1.length > 0) setCaptain1Id(finalTeam1[0].id);
    if (finalTeam2.length > 0) setCaptain2Id(finalTeam2[0].id);
  };

  const moveToTeam = (player: PlayerWithLevel, targetTeam: "team1" | "team2") => {
    const newAvailable = available.filter(p => p.id !== player.id);
    let newTeam1 = team1.filter(p => p.id !== player.id);
    let newTeam2 = team2.filter(p => p.id !== player.id);
    
    if (targetTeam === "team1") {
      newTeam1 = [...newTeam1, player];
    } else {
      newTeam2 = [...newTeam2, player];
    }
    
    const playerSteamId = player.steamId64 || "";
    if (SEPARATED_PLAYERS.includes(playerSteamId)) {
      const targetList = targetTeam === "team1" ? newTeam1 : newTeam2;
      const hasConflict = targetList.some(p => 
        p.id !== player.id && SEPARATED_PLAYERS.includes(p.steamId64 || "")
      );
      
      if (hasConflict) {
        const { team1: fixedTeam1, team2: fixedTeam2 } = ensureSeparation(newTeam1, newTeam2);
        setTeam1(fixedTeam1);
        setTeam2(fixedTeam2);
        setAvailable(newAvailable);
        return;
      }
    }
    
    setAvailable(newAvailable);
    setTeam1(newTeam1);
    setTeam2(newTeam2);
  };

  const removeFromTeam = (player: PlayerWithLevel) => {
    if (captain1Id === player.id) setCaptain1Id(null);
    if (captain2Id === player.id) setCaptain2Id(null);
    setTeam1(team1.filter(p => p.id !== player.id));
    setTeam2(team2.filter(p => p.id !== player.id));
    setAvailable([...available, player]);
  };

  const setCaptain = (playerId: string, team: "team1" | "team2") => {
    if (team === "team1") {
      setCaptain1Id(playerId);
    } else {
      setCaptain2Id(playerId);
    }
  };

  const proceedToVeto = () => {
    setBannedMaps([]);
    setSelectedMap(null);
    setCurrentVetoTeam(1);
    setStep("veto");
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

  const backToBalancing = () => {
    setStep("balancing");
    setBannedMaps([]);
    setSelectedMap(null);
  };

  const getTeamLevel = (team: PlayerWithLevel[]) => 
    team.reduce((sum, p) => sum + p.mixLevel, 0);

  const getTeamAvgLevel = (team: PlayerWithLevel[]) => 
    team.length > 0 ? (getTeamLevel(team) / team.length).toFixed(1) : "0";

  const getTeamKd = (team: PlayerWithLevel[]) =>
    team.reduce((sum, p) => sum + getCachedKd(p), 0);

  const getTeamAvgKd = (team: PlayerWithLevel[]) =>
    team.length > 0 ? (getTeamKd(team) / team.length).toFixed(2) : "0.00";

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

  const getKdColor = (kd: number) => {
    if (kd < 0.8) return "text-red-500";
    if (kd < 1.0) return "text-yellow-500";
    if (kd < 1.3) return "text-blue-500";
    return "text-green-500";
  };

  const getSortedUsers = () => {
    const usersCopy = [...users];
    if (sortOrder === "kd") {
      return usersCopy.sort((a, b) => getCachedKd(b) - getCachedKd(a));
    } else {
      return usersCopy.sort((a, b) => {
        const nameA = getPlayerName(a).toLowerCase();
        const nameB = getPlayerName(b).toLowerCase();
        return nameA.localeCompare(nameB, 'pt-BR');
      });
    }
  };

  const SelectionPlayerCard = ({ player }: { player: User }) => {
    const isSelected = selectedPlayerIds.has(player.id);
    const kd = getCachedKd(player);
    const playerName = getPlayerName(player);
    const level = playerLevels[player.id] || 5;
    const isAdmin = currentUser?.isAdmin;
    
    return (
      <div 
        className={`p-3 rounded-lg border cursor-pointer transition-all ${
          isSelected 
            ? "bg-primary/10 border-primary" 
            : "bg-background/50 hover-elevate"
        }`}
        onClick={() => togglePlayerSelection(player.id)}
        data-testid={`selection-card-${player.id}`}
      >
        <div className="flex items-center gap-3">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => togglePlayerSelection(player.id)}
            onClick={(e) => e.stopPropagation()}
            data-testid={`checkbox-${player.id}`}
          />
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={player.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {playerName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-medium truncate max-w-[150px]" data-testid={`text-selection-name-${player.id}`}>
                  {playerName}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{playerName}</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getLevelBadgeVariant(level)} className="font-mono text-xs">
                <Star className="h-3 w-3 mr-1" />
                Nv {level}
              </Badge>
              <Badge variant="outline" className={`font-mono text-xs ${getKdColor(kd)}`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                K/D {kd.toFixed(2)}
              </Badge>
            </div>
          </div>
        </div>
        
        {isAdmin && isSelected && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-muted-foreground w-12 shrink-0">Nível:</span>
            <Slider
              value={[level]}
              onValueChange={(value) => setPlayerLevel(player.id, value[0])}
              min={1}
              max={10}
              step={1}
              className="flex-1"
              data-testid={`slider-selection-level-${player.id}`}
            />
            <span className={`font-mono font-bold w-6 text-center shrink-0 ${getLevelColor(level)}`}>
              {level}
            </span>
          </div>
        )}
      </div>
    );
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
    const kd = getCachedKd(player);
    const playerName = getPlayerName(player);
    const isCaptain = (team === "team1" && captain1Id === player.id) || 
                      (team === "team2" && captain2Id === player.id);
    
    return (
      <div className={`p-3 bg-background/50 rounded-lg border space-y-3 ${isCaptain ? "border-yellow-500 bg-yellow-500/5" : ""}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={player.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {playerName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isCaptain && (
                <Crown className="absolute -top-2 -right-2 h-5 w-5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="font-medium truncate max-w-[120px] sm:max-w-[180px]" data-testid={`text-player-name-${player.id}`}>
                    {playerName}
                    {isCaptain && <span className="text-yellow-500 ml-1">(C)</span>}
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
                    <Badge variant="outline" className={`font-mono text-xs ${getKdColor(kd)}`} data-testid={`badge-kd-${player.id}`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      K/D {kd.toFixed(2)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>K/D Ratio</p>
                    <p className="text-xs text-muted-foreground">{player.totalKills} kills / {player.totalDeaths} deaths</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          {showActions && (
            <div className="flex gap-1 shrink-0 flex-wrap">
              {team && !isCaptain && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setCaptain(player.id, team)}
                      className="h-8 w-8"
                      data-testid={`button-captain-${player.id}`}
                    >
                      <Crown className="h-4 w-4 text-yellow-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Definir como Capitão</TooltipContent>
                </Tooltip>
              )}
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

  if (step === "veto") {
    const captain1 = team1.find(p => p.id === captain1Id);
    const captain2 = team2.find(p => p.id === captain2Id);
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
                : `Vez do ${currentVetoTeam === 1 ? "Time 1 (CT)" : "Time 2 (TR)"} banir um mapa`
              }
            </p>
          </div>
          <Button variant="outline" onClick={backToBalancing} data-testid="button-back-to-balancing">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Voltar aos Times
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-blue-500/50">
            <CardHeader className="bg-blue-500/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-blue-500" />
                Time 1 (CT)
                {captain1 && (
                  <Badge variant="outline" className="ml-auto">
                    <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                    {getPlayerName(captain1)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="flex flex-wrap gap-2">
                {team1.map(p => (
                  <Badge key={p.id} variant="secondary">
                    {p.id === captain1Id && <Crown className="h-3 w-3 mr-1 text-yellow-500" />}
                    {getPlayerName(p)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/50">
            <CardHeader className="bg-orange-500/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-orange-500" />
                Time 2 (TR)
                {captain2 && (
                  <Badge variant="outline" className="ml-auto">
                    <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                    {getPlayerName(captain2)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="flex flex-wrap gap-2">
                {team2.map(p => (
                  <Badge key={p.id} variant="secondary">
                    {p.id === captain2Id && <Crown className="h-3 w-3 mr-1 text-yellow-500" />}
                    {getPlayerName(p)}
                  </Badge>
                ))}
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
                <h2 className="text-3xl font-bold text-green-500">{selectedMap}</h2>
                <p className="text-muted-foreground">
                  Mapa selecionado para a partida!
                </p>
                <Badge variant="default" className="text-lg px-4 py-2">
                  <Check className="h-5 w-5 mr-2" />
                  Mapa Definido
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                Mapas Disponíveis
              </CardTitle>
              <CardDescription>
                {currentVetoTeam === 1 ? (
                  <span className="text-blue-500 font-medium">Time 1 (CT)</span>
                ) : (
                  <span className="text-orange-500 font-medium">Time 2 (TR)</span>
                )}
                {" "}deve banir um mapa. Restam {remainingMaps.length} mapas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {MAPS.map((map) => {
                  const isBanned = bannedMaps.includes(map.name);
                  return (
                    <Button
                      key={map.name}
                      variant={isBanned ? "ghost" : "outline"}
                      disabled={isBanned}
                      onClick={() => banMap(map.name)}
                      className={`h-auto py-4 flex-col gap-2 ${
                        isBanned ? "opacity-30 line-through" : "hover-elevate"
                      }`}
                      data-testid={`button-ban-${map.name.toLowerCase()}`}
                    >
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${map.bg}`}>
                        <span className={`text-lg font-bold ${map.color}`}>{map.abbr}</span>
                      </div>
                      <span className="font-medium">{map.name}</span>
                      {isBanned && (
                        <Badge variant="destructive" className="text-xs">
                          <X className="h-3 w-3 mr-1" />
                          Banido
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {bannedMaps.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Mapas Banidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {bannedMaps.map((mapName, index) => (
                  <Badge key={mapName} variant="destructive">
                    {index + 1}. {mapName}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (step === "selection") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-primary" />
              Selecionar Jogadores
            </h1>
            <p className="text-muted-foreground mt-1">
              Selecione os jogadores que vão participar do mix (idealmente 10 para 5v5)
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={clearSelection} data-testid="button-clear-selection">
              Limpar
            </Button>
            <Button variant="outline" onClick={selectAll} data-testid="button-select-all">
              Selecionar Todos
            </Button>
            <Button 
              onClick={proceedToBalancing} 
              disabled={selectedPlayerIds.size < 2}
              data-testid="button-proceed"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continuar ({selectedPlayerIds.size})
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Jogadores Cadastrados
              </span>
              <div className="flex items-center gap-2">
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "alphabetical" | "kd")}>
                  <SelectTrigger className="w-[160px]" data-testid="select-sort-order">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kd">Ordenar por K/D</SelectItem>
                    <SelectItem value="alphabetical">Ordem Alfabética</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant={selectedPlayerIds.size === 10 ? "default" : "secondary"}>
                  {selectedPlayerIds.size} selecionados
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              Clique para selecionar/desmarcar jogadores. {currentUser?.isAdmin && "Como admin, você pode ajustar o nível dos jogadores selecionados."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {getSortedUsers().map((player) => (
                <SelectionPlayerCard key={player.id} player={player} />
              ))}
            </div>
            {users.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum jogador cadastrado
              </p>
            )}
          </CardContent>
        </Card>

        {selectedPlayerIds.size > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selectedPlayerIds.size} jogadores selecionados</span>
                  {selectedPlayerIds.size === 10 && (
                    <Badge variant="default">Perfeito para 5v5</Badge>
                  )}
                  {selectedPlayerIds.size > 10 && (
                    <Badge variant="secondary">Mais que 10 jogadores</Badge>
                  )}
                  {selectedPlayerIds.size < 10 && selectedPlayerIds.size >= 2 && (
                    <Badge variant="outline">Menos que 10 jogadores</Badge>
                  )}
                </div>
                <Button 
                  onClick={proceedToBalancing} 
                  disabled={selectedPlayerIds.size < 2}
                  data-testid="button-proceed-footer"
                >
                  <Swords className="h-4 w-4 mr-2" />
                  Balancear Times
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Swords className="h-8 w-8 text-primary" />
            Balancear Times
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentUser?.isAdmin 
              ? "Defina o nível de cada jogador (1-10) e balance os times"
              : "Organize os times para a partida"
            }
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={backToSelection} data-testid="button-back">
            <UserCheck className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button variant="outline" onClick={resetTeams} data-testid="button-reset">
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button variant="outline" onClick={balanceTeams} data-testid="button-balance">
            <Shuffle className="h-4 w-4 mr-2" />
            Por Nível
          </Button>
          <Button onClick={balanceByKd} data-testid="button-balance-kd">
            <TrendingUp className="h-4 w-4 mr-2" />
            Por K/D
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
                Use "Por Nível" para balancear pelo nível manual ou "Por K/D" para usar o K/D ratio.
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
              <span className="text-blue-500">K/D Médio: {getTeamAvgKd(team1)}</span>
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
              <span className="text-orange-500">K/D Médio: {getTeamAvgKd(team2)}</span>
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
                  K/D Médio: {getTeamAvgKd(team1)}
                </div>
                {captain1Id && (
                  <Badge variant="outline" className="mt-2">
                    <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                    {getPlayerName(team1.find(p => p.id === captain1Id)!)}
                  </Badge>
                )}
              </div>
              <div className="text-4xl font-bold text-muted-foreground">VS</div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{getTeamLevel(team2)}</div>
                <div className="text-sm text-muted-foreground">Nível Time 2</div>
                <div className="text-xs text-muted-foreground">Média: {getTeamAvgLevel(team2)}</div>
                <div className="text-xs text-orange-500 mt-1">
                  K/D Médio: {getTeamAvgKd(team2)}
                </div>
                {captain2Id && (
                  <Badge variant="outline" className="mt-2">
                    <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                    {getPlayerName(team2.find(p => p.id === captain2Id)!)}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-center mt-4 flex justify-center gap-2 flex-wrap">
              <Badge variant={Math.abs(getTeamLevel(team1) - getTeamLevel(team2)) <= 2 ? "default" : "destructive"}>
                Dif. Nível: {Math.abs(getTeamLevel(team1) - getTeamLevel(team2))} pts
              </Badge>
              <Badge variant={Math.abs(getTeamKd(team1) - getTeamKd(team2)) <= 0.5 ? "default" : "destructive"}>
                Dif. K/D: {Math.abs(getTeamKd(team1) - getTeamKd(team2)).toFixed(2)}
              </Badge>
            </div>
            {team1.length >= 1 && team2.length >= 1 && (
              <div className="text-center mt-4">
                <Button onClick={proceedToVeto} data-testid="button-proceed-veto">
                  <MapIcon className="h-4 w-4 mr-2" />
                  Ir para Veto de Mapas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
