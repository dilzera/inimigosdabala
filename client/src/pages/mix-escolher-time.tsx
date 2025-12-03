import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Swords, Users, Shuffle, Trophy, Target, RefreshCw } from "lucide-react";
import type { User } from "@shared/schema";

export default function MixEscolherTime() {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const [team1, setTeam1] = useState<User[]>([]);
  const [team2, setTeam2] = useState<User[]>([]);
  const [available, setAvailable] = useState<User[]>([]);

  const resetTeams = () => {
    setTeam1([]);
    setTeam2([]);
    setAvailable([...users]);
  };

  const balanceTeams = () => {
    const sortedByRating = [...users].sort((a, b) => b.skillRating - a.skillRating);
    const newTeam1: User[] = [];
    const newTeam2: User[] = [];
    let team1Rating = 0;
    let team2Rating = 0;

    sortedByRating.forEach((player) => {
      if (team1Rating <= team2Rating) {
        newTeam1.push(player);
        team1Rating += player.skillRating;
      } else {
        newTeam2.push(player);
        team2Rating += player.skillRating;
      }
    });

    setTeam1(newTeam1);
    setTeam2(newTeam2);
    setAvailable([]);
  };

  const moveToTeam = (player: User, targetTeam: "team1" | "team2") => {
    setAvailable(available.filter(p => p.id !== player.id));
    setTeam1(team1.filter(p => p.id !== player.id));
    setTeam2(team2.filter(p => p.id !== player.id));
    
    if (targetTeam === "team1") {
      setTeam1([...team1.filter(p => p.id !== player.id), player]);
    } else {
      setTeam2([...team2.filter(p => p.id !== player.id), player]);
    }
  };

  const removeFromTeam = (player: User) => {
    setTeam1(team1.filter(p => p.id !== player.id));
    setTeam2(team2.filter(p => p.id !== player.id));
    setAvailable([...available, player]);
  };

  const getTeamRating = (team: User[]) => 
    team.reduce((sum, p) => sum + p.skillRating, 0);

  const getTeamKD = (team: User[]) => {
    const totalKills = team.reduce((sum, p) => sum + p.totalKills, 0);
    const totalDeaths = team.reduce((sum, p) => sum + p.totalDeaths, 0);
    return totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
  };

  const PlayerCard = ({ player, showActions = false, team }: { player: User; showActions?: boolean; team?: "team1" | "team2" }) => {
    const kd = player.totalDeaths > 0 
      ? (player.totalKills / player.totalDeaths).toFixed(2) 
      : player.totalKills.toFixed(2);
    
    return (
      <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={player.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {player.nickname?.slice(0, 2).toUpperCase() || player.firstName?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{player.nickname || player.firstName || "Jogador"}</div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Rating: {player.skillRating}</span>
              <span>K/D: {kd}</span>
            </div>
          </div>
        </div>
        {showActions && (
          <div className="flex gap-1">
            {team !== "team1" && (
              <Button size="sm" variant="outline" onClick={() => moveToTeam(player, "team1")}>
                Time 1
              </Button>
            )}
            {team !== "team2" && (
              <Button size="sm" variant="outline" onClick={() => moveToTeam(player, "team2")}>
                Time 2
              </Button>
            )}
            {team && (
              <Button size="sm" variant="ghost" onClick={() => removeFromTeam(player)}>
                Remover
              </Button>
            )}
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

  if (available.length === 0 && team1.length === 0 && team2.length === 0) {
    setAvailable([...users]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Swords className="h-8 w-8 text-primary" />
            Escolher Time do Mix
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize os times para a partida
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetTeams}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button onClick={balanceTeams}>
            <Shuffle className="h-4 w-4 mr-2" />
            Balancear Automaticamente
          </Button>
        </div>
      </div>

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
              <span>Rating Total: {getTeamRating(team1)}</span>
              <span>K/D Médio: {getTeamKD(team1)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {team1.map((player) => (
              <PlayerCard key={player.id} player={player} showActions team="team1" />
            ))}
            {team1.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Arraste jogadores para este time
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
              <span>Rating Total: {getTeamRating(team2)}</span>
              <span>K/D Médio: {getTeamKD(team2)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {team2.map((player) => (
              <PlayerCard key={player.id} player={player} showActions team="team2" />
            ))}
            {team2.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Arraste jogadores para este time
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
                <div className="text-2xl font-bold text-blue-500">{getTeamRating(team1)}</div>
                <div className="text-sm text-muted-foreground">Rating Time 1</div>
              </div>
              <div className="text-4xl font-bold text-muted-foreground">VS</div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{getTeamRating(team2)}</div>
                <div className="text-sm text-muted-foreground">Rating Time 2</div>
              </div>
            </div>
            <div className="text-center mt-4">
              <Badge variant={Math.abs(getTeamRating(team1) - getTeamRating(team2)) < 200 ? "default" : "destructive"}>
                Diferença: {Math.abs(getTeamRating(team1) - getTeamRating(team2))} pontos
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
