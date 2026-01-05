import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Users, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import type { User } from "@shared/schema";

type SortField = "nickname" | "skillRating" | "kd" | "hs" | "adr" | "winRate" | "matches";
type SortDirection = "asc" | "desc";

export default function Jogadores() {
  const [sortField, setSortField] = useState<SortField>("skillRating");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const playersWithMatches = users.filter(u => u.totalMatches >= 1);

  const getKD = (player: User) => {
    return player.totalDeaths > 0 ? player.totalKills / player.totalDeaths : player.totalKills;
  };

  const getHS = (player: User) => {
    return player.totalKills > 0 ? (player.totalHeadshots / player.totalKills) * 100 : 0;
  };

  const getADR = (player: User) => {
    return player.totalRoundsPlayed > 0 ? player.totalDamage / player.totalRoundsPlayed : 0;
  };

  const getWinRate = (player: User) => {
    return player.totalMatches > 0 ? (player.matchesWon / player.totalMatches) * 100 : 0;
  };

  const sortedPlayers = [...playersWithMatches].sort((a, b) => {
    let valueA: number | string;
    let valueB: number | string;

    switch (sortField) {
      case "nickname":
        valueA = (a.nickname || a.firstName || "").toLowerCase();
        valueB = (b.nickname || b.firstName || "").toLowerCase();
        break;
      case "skillRating":
        valueA = a.skillRating;
        valueB = b.skillRating;
        break;
      case "kd":
        valueA = getKD(a);
        valueB = getKD(b);
        break;
      case "hs":
        valueA = getHS(a);
        valueB = getHS(b);
        break;
      case "adr":
        valueA = getADR(a);
        valueB = getADR(b);
        break;
      case "winRate":
        valueA = getWinRate(a);
        valueB = getWinRate(b);
        break;
      case "matches":
        valueA = a.totalMatches;
        valueB = b.totalMatches;
        break;
      default:
        valueA = a.skillRating;
        valueB = b.skillRating;
    }

    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortDirection === "asc" 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }

    return sortDirection === "asc" 
      ? (valueA as number) - (valueB as number) 
      : (valueB as number) - (valueA as number);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 px-2 font-medium"
      data-testid={`sort-${field}`}
    >
      {label}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ArrowUp className="ml-1 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-1 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Jogadores</h1>
        <Badge variant="outline" className="ml-2">
          {playersWithMatches.length} jogador{playersWithMatches.length !== 1 ? "es" : ""}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Jogadores</CardTitle>
          <CardDescription>
            Todos os jogadores com pelo menos 1 partida registrada. Clique nas colunas para ordenar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {playersWithMatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">
                      <SortButton field="nickname" label="Jogador" />
                    </th>
                    <th className="text-center p-2">
                      <SortButton field="skillRating" label="Rating" />
                    </th>
                    <th className="text-center p-2">
                      <SortButton field="kd" label="K/D" />
                    </th>
                    <th className="text-center p-2">
                      <SortButton field="hs" label="HS%" />
                    </th>
                    <th className="text-center p-2">
                      <SortButton field="adr" label="ADR" />
                    </th>
                    <th className="text-center p-2">
                      <SortButton field="winRate" label="Win%" />
                    </th>
                    <th className="text-center p-2">
                      <SortButton field="matches" label="Partidas" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, index) => {
                    const kd = getKD(player);
                    const hs = getHS(player);
                    const adr = getADR(player);
                    const winRate = getWinRate(player);

                    return (
                      <tr 
                        key={player.id} 
                        className={`border-b hover-elevate ${index % 2 === 0 ? 'bg-background/50' : ''}`}
                        data-testid={`player-row-${player.id}`}
                      >
                        <td className="p-3">
                          <Link 
                            href={`/jogador/${player.id}`} 
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            data-testid={`link-player-${player.id}`}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={player.profileImageUrl || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {player.nickname?.slice(0, 2).toUpperCase() || player.firstName?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium hover:text-primary transition-colors">
                                {player.nickname || player.firstName || "Jogador"}
                              </div>
                              {player.isAdmin && (
                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono font-bold">{player.skillRating}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono font-bold ${kd >= 1 ? 'text-green-500' : 'text-red-500'}`}>
                            {kd.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono font-bold ${hs >= 50 ? 'text-green-500' : hs >= 30 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {hs.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono font-bold ${adr >= 80 ? 'text-green-500' : adr >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {adr.toFixed(0)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono font-bold ${winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                            {winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="font-mono">
                            {player.totalMatches}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum jogador com partidas registradas ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
