import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Award, Target, Crosshair, Star, Calendar, TrendingUp, ArrowUpDown, Skull } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

interface MonthlyPlayerStats {
  userId: string;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  damage: number;
  mvps: number;
  matchesPlayed: number;
  matchesWon: number;
  total5ks: number;
  total4ks: number;
  total3ks: number;
  user: {
    id: string;
    nickname: string | null;
    firstName: string | null;
    email: string | null;
    profileImageUrl: string | null;
    steamId64: string | null;
  } | null;
}

interface MonthlyStatsResponse {
  month: number;
  year: number;
  monthName: string;
  players: MonthlyPlayerStats[];
}

type SortField = "kd" | "kills" | "deaths" | "headshots" | "winrate" | "matches" | "mvps" | "alphabetical";

export default function RankingMensal() {
  const [sortField, setSortField] = useState<SortField>("kd");
  
  const { data, isLoading } = useQuery<MonthlyStatsResponse>({
    queryKey: ["/api/stats/monthly"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const players = data?.players || [];
  const monthName = data?.monthName || "";
  const year = data?.year || new Date().getFullYear();

  const getKd = (p: MonthlyPlayerStats) => p.deaths > 0 ? p.kills / p.deaths : p.kills;
  const getHsPercent = (p: MonthlyPlayerStats) => p.kills > 0 ? (p.headshots / p.kills) * 100 : 0;
  const getWinRate = (p: MonthlyPlayerStats) => p.matchesPlayed > 0 ? (p.matchesWon / p.matchesPlayed) * 100 : 0;
  const getPlayerName = (p: MonthlyPlayerStats) => p.user?.nickname || p.user?.firstName || p.user?.email || "Jogador";

  const sortedPlayers = [...players].sort((a, b) => {
    switch (sortField) {
      case "kd":
        return getKd(b) - getKd(a);
      case "kills":
        return b.kills - a.kills;
      case "deaths":
        return b.deaths - a.deaths;
      case "headshots":
        return getHsPercent(b) - getHsPercent(a);
      case "winrate":
        return getWinRate(b) - getWinRate(a);
      case "matches":
        return b.matchesPlayed - a.matchesPlayed;
      case "mvps":
        return b.mvps - a.mvps;
      case "alphabetical":
        return getPlayerName(a).localeCompare(getPlayerName(b), 'pt-BR');
      default:
        return 0;
    }
  });

  const topByKd = [...players].sort((a, b) => getKd(b) - getKd(a)).slice(0, 3);
  const topByKills = [...players].sort((a, b) => b.kills - a.kills).slice(0, 3);
  const topByWinRate = [...players].sort((a, b) => getWinRate(b) - getWinRate(a)).slice(0, 3);
  const worstByKd = [...players].sort((a, b) => getKd(a) - getKd(b)).slice(0, 3);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  const TopCard = ({ 
    title, 
    icon, 
    players, 
    statFormatter,
    iconColor = "text-primary"
  }: { 
    title: string; 
    icon: React.ReactNode; 
    players: MonthlyPlayerStats[];
    statFormatter: (p: MonthlyPlayerStats) => string;
    iconColor?: string;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {players.map((player, index) => (
          <Link 
            key={player.userId} 
            href={`/jogador/${player.userId}`}
            className="flex items-center justify-between p-2 rounded-lg hover-elevate bg-background/50"
          >
            <div className="flex items-center gap-2">
              {getRankIcon(index)}
              <Avatar className="h-8 w-8">
                <AvatarImage src={player.user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getPlayerName(player).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm truncate max-w-[100px]">
                {getPlayerName(player)}
              </span>
            </div>
            <Badge variant="outline" className="font-mono">
              {statFormatter(player)}
            </Badge>
          </Link>
        ))}
        {players.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum jogador este mês
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Ranking Mensal</h1>
            <p className="text-muted-foreground capitalize">
              {monthName} {year}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-1 w-fit">
          {players.length} jogadores ativos
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TopCard
          title="Melhor K/D"
          icon={<Crosshair className="h-4 w-4 text-green-500" />}
          players={topByKd}
          statFormatter={(p) => getKd(p).toFixed(2)}
        />
        <TopCard
          title="Mais Kills"
          icon={<Target className="h-4 w-4 text-red-500" />}
          players={topByKills}
          statFormatter={(p) => p.kills.toString()}
        />
        <TopCard
          title="Maior Win Rate"
          icon={<Trophy className="h-4 w-4 text-yellow-500" />}
          players={topByWinRate}
          statFormatter={(p) => `${getWinRate(p).toFixed(1)}%`}
        />
        <TopCard
          title="Pior K/D"
          icon={<Skull className="h-4 w-4 text-red-500" />}
          players={worstByKd}
          statFormatter={(p) => getKd(p).toFixed(2)}
          iconColor="text-red-500"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Todos os Jogadores do Mês
              </CardTitle>
              <CardDescription>
                Lista completa de jogadores que participaram de partidas em {monthName}
              </CardDescription>
            </div>
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort-monthly">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kd">K/D Ratio</SelectItem>
                <SelectItem value="kills">Kills</SelectItem>
                <SelectItem value="deaths">Deaths</SelectItem>
                <SelectItem value="headshots">Headshot %</SelectItem>
                <SelectItem value="winrate">Win Rate</SelectItem>
                <SelectItem value="matches">Partidas</SelectItem>
                <SelectItem value="mvps">MVPs</SelectItem>
                <SelectItem value="alphabetical">Alfabética</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {sortedPlayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma partida registrada este mês.</p>
              <p className="text-sm">O ranking será atualizado quando houver partidas importadas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Jogador</TableHead>
                    <TableHead className="text-center">Partidas</TableHead>
                    <TableHead className="text-center">K/D</TableHead>
                    <TableHead className="text-center">Kills</TableHead>
                    <TableHead className="text-center">Deaths</TableHead>
                    <TableHead className="text-center">HS%</TableHead>
                    <TableHead className="text-center">Win Rate</TableHead>
                    <TableHead className="text-center">MVPs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPlayers.map((player, index) => {
                    const kd = getKd(player);
                    const hsPercent = getHsPercent(player);
                    const winRate = getWinRate(player);
                    
                    return (
                      <TableRow key={player.userId} data-testid={`row-monthly-${player.userId}`}>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getRankIcon(index)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/jogador/${player.userId}`}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={player.user?.profileImageUrl || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getPlayerName(player).slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{getPlayerName(player)}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{player.matchesPlayed}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={kd >= 1 ? "default" : "secondary"} className="font-mono">
                            {kd.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">{player.kills}</TableCell>
                        <TableCell className="text-center font-mono">{player.deaths}</TableCell>
                        <TableCell className="text-center font-mono">{hsPercent.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={winRate >= 50 ? "default" : "secondary"} className="font-mono">
                            {winRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            <Star className="h-3 w-3 mr-1 text-yellow-500" />
                            {player.mvps}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold">Ranking Mensal</h3>
              <p className="text-sm text-muted-foreground">
                Este ranking é zerado automaticamente no início de cada mês. 
                Apenas partidas jogadas no mês atual são contabilizadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
