import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Trophy, Target, Crosshair, Shield, Star, TrendingUp, 
  Zap, Award, Eye, ArrowRight, ArrowLeft, Minus
} from "lucide-react";
import type { User } from "@shared/schema";

function StatComparison({ 
  label, 
  value1, 
  value2, 
  icon,
  higherIsBetter = true,
  isPercent = false,
  suffix = ""
}: { 
  label: string; 
  value1: number; 
  value2: number; 
  icon?: React.ReactNode;
  higherIsBetter?: boolean;
  isPercent?: boolean;
  suffix?: string;
}) {
  const diff = value1 - value2;
  const winner = higherIsBetter ? (diff > 0 ? 1 : diff < 0 ? 2 : 0) : (diff < 0 ? 1 : diff > 0 ? 2 : 0);

  const formatValue = (val: number) => {
    if (isPercent) return `${val.toFixed(1)}%`;
    if (Number.isInteger(val)) return val.toString();
    return val.toFixed(2);
  };

  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-border/50 last:border-0">
      <div className={`text-right font-mono font-bold ${winner === 1 ? 'text-green-500' : winner === 2 ? 'text-red-500' : ''}`}>
        {formatValue(value1)}{suffix}
      </div>
      <div className="text-center flex items-center justify-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-left font-mono font-bold ${winner === 2 ? 'text-green-500' : winner === 1 ? 'text-red-500' : ''}`}>
        {formatValue(value2)}{suffix}
      </div>
    </div>
  );
}

function PlayerCard({ player, position }: { player: User | null; position: "left" | "right" }) {
  if (!player) {
    return (
      <Card className="flex-1">
        <CardContent className="pt-6 flex flex-col items-center justify-center h-48 text-muted-foreground">
          <Users className="h-12 w-12 mb-4 opacity-50" />
          <p>Selecione um jogador</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={player.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {player.nickname?.slice(0, 2).toUpperCase() || player.firstName?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold">
            {player.nickname || player.firstName || "Jogador"}
          </h3>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="font-mono">
              Rating: {player.skillRating}
            </Badge>
            <Badge variant="secondary">
              {player.totalMatches} partidas
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CompararJogadores() {
  const [player1Id, setPlayer1Id] = useState<string>("");
  const [player2Id, setPlayer2Id] = useState<string>("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const player1 = users.find(u => u.id === player1Id) || null;
  const player2 = users.find(u => u.id === player2Id) || null;

  const playersWithMatches = users.filter(u => u.totalMatches > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const getKD = (p: User) => p.totalDeaths > 0 ? p.totalKills / p.totalDeaths : p.totalKills;
  const getHS = (p: User) => p.totalKills > 0 ? (p.totalHeadshots / p.totalKills) * 100 : 0;
  const getWinRate = (p: User) => p.totalMatches > 0 ? (p.matchesWon / p.totalMatches) * 100 : 0;
  const getADR = (p: User) => p.totalRoundsPlayed > 0 ? p.totalDamage / p.totalRoundsPlayed : 0;
  const getAccuracy = (p: User) => p.totalShotsFired > 0 ? (p.totalShotsOnTarget / p.totalShotsFired) * 100 : 0;
  const getClutchRate = (p: User) => p.total1v1Count > 0 ? (p.total1v1Wins / p.total1v1Count) * 100 : 0;
  const getEntryRate = (p: User) => p.totalEntryCount > 0 ? (p.totalEntryWins / p.totalEntryCount) * 100 : 0;
  const getFlashRate = (p: User) => p.totalFlashCount > 0 ? (p.totalFlashSuccesses / p.totalFlashCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Comparar Jogadores</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Jogador 1</label>
          <Select value={player1Id} onValueChange={setPlayer1Id}>
            <SelectTrigger data-testid="select-player1">
              <SelectValue placeholder="Selecione o primeiro jogador" />
            </SelectTrigger>
            <SelectContent>
              {playersWithMatches.map(user => (
                <SelectItem 
                  key={user.id} 
                  value={user.id}
                  disabled={user.id === player2Id}
                  data-testid={`option-player1-${user.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{user.nickname || user.firstName || "Jogador"}</span>
                    <span className="text-muted-foreground text-xs">({user.skillRating})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Jogador 2</label>
          <Select value={player2Id} onValueChange={setPlayer2Id}>
            <SelectTrigger data-testid="select-player2">
              <SelectValue placeholder="Selecione o segundo jogador" />
            </SelectTrigger>
            <SelectContent>
              {playersWithMatches.map(user => (
                <SelectItem 
                  key={user.id} 
                  value={user.id}
                  disabled={user.id === player1Id}
                  data-testid={`option-player2-${user.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{user.nickname || user.firstName || "Jogador"}</span>
                    <span className="text-muted-foreground text-xs">({user.skillRating})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <PlayerCard player={player1} position="left" />
        <div className="flex items-center">
          <div className="text-4xl font-bold text-muted-foreground">VS</div>
        </div>
        <PlayerCard player={player2} position="right" />
      </div>

      {player1 && player2 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Estatísticas Gerais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatComparison label="Skill Rating" value1={player1.skillRating} value2={player2.skillRating} icon={<Star className="h-4 w-4" />} />
              <StatComparison label="K/D Ratio" value1={getKD(player1)} value2={getKD(player2)} icon={<Crosshair className="h-4 w-4" />} />
              <StatComparison label="Headshot %" value1={getHS(player1)} value2={getHS(player2)} icon={<Target className="h-4 w-4" />} isPercent />
              <StatComparison label="Win Rate" value1={getWinRate(player1)} value2={getWinRate(player2)} icon={<Trophy className="h-4 w-4" />} isPercent />
              <StatComparison label="ADR" value1={getADR(player1)} value2={getADR(player2)} icon={<Zap className="h-4 w-4" />} />
              <StatComparison label="Precisão" value1={getAccuracy(player1)} value2={getAccuracy(player2)} icon={<Target className="h-4 w-4" />} isPercent />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-primary" />
                Combate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatComparison label="Kills" value1={player1.totalKills} value2={player2.totalKills} />
              <StatComparison label="Deaths" value1={player1.totalDeaths} value2={player2.totalDeaths} higherIsBetter={false} />
              <StatComparison label="Assistências" value1={player1.totalAssists} value2={player2.totalAssists} />
              <StatComparison label="Headshots" value1={player1.totalHeadshots} value2={player2.totalHeadshots} />
              <StatComparison label="Dano Total" value1={player1.totalDamage} value2={player2.totalDamage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Partidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatComparison label="Partidas" value1={player1.totalMatches} value2={player2.totalMatches} />
              <StatComparison label="Vitórias" value1={player1.matchesWon} value2={player2.matchesWon} />
              <StatComparison label="Derrotas" value1={player1.matchesLost} value2={player2.matchesLost} higherIsBetter={false} />
              <StatComparison label="Rounds Jogados" value1={player1.totalRoundsPlayed} value2={player2.totalRoundsPlayed} />
              <StatComparison label="Rounds Ganhos" value1={player1.roundsWon} value2={player2.roundsWon} />
              <StatComparison label="MVPs" value1={player1.totalMvps} value2={player2.totalMvps} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Multi-Kills & Clutches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatComparison label="ACE (5K)" value1={player1.total5ks} value2={player2.total5ks} icon={<Award className="h-4 w-4 text-yellow-500" />} />
              <StatComparison label="4K" value1={player1.total4ks} value2={player2.total4ks} />
              <StatComparison label="3K" value1={player1.total3ks} value2={player2.total3ks} />
              <StatComparison label="2K" value1={player1.total2ks} value2={player2.total2ks} />
              <StatComparison label="1v1 Win Rate" value1={getClutchRate(player1)} value2={getClutchRate(player2)} isPercent />
              <StatComparison label="Entry Win Rate" value1={getEntryRate(player1)} value2={getEntryRate(player2)} isPercent />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Utilitários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-x-8">
                <div>
                  <StatComparison label="Flashes Lançadas" value1={player1.totalFlashCount} value2={player2.totalFlashCount} />
                  <StatComparison label="Flashes Efetivas" value1={player1.totalFlashSuccesses} value2={player2.totalFlashSuccesses} />
                  <StatComparison label="Inimigos Cegados" value1={player1.totalEnemiesFlashed} value2={player2.totalEnemiesFlashed} />
                </div>
                <div>
                  <StatComparison label="Taxa de Flash" value1={getFlashRate(player1)} value2={getFlashRate(player2)} isPercent />
                  <StatComparison label="Dano de Utility" value1={player1.totalUtilityDamage} value2={player2.totalUtilityDamage} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(!player1 || !player2) && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Selecione dois jogadores acima para comparar suas estatísticas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
