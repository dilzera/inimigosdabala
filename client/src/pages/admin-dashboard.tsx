import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { User } from "@shared/schema";
import {
  Users,
  Trophy,
  Target,
  Crosshair,
  Crown,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user?.isAdmin,
  });

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </Card>
      </div>
    );
  }

  if (usersLoading) {
    return <AdminDashboardSkeleton />;
  }

  const users = allUsers || [];

  const totalKills = users.reduce((acc, u) => acc + u.totalKills, 0);
  const totalDeaths = users.reduce((acc, u) => acc + u.totalDeaths, 0);
  const totalMatches = users.reduce((acc, u) => acc + u.totalMatches, 0);
  const avgKD = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : "0.00";

  const topPlayers = [...users]
    .sort((a, b) => {
      const aKD = a.totalDeaths > 0 ? a.totalKills / a.totalDeaths : a.totalKills;
      const bKD = b.totalDeaths > 0 ? b.totalKills / b.totalDeaths : b.totalKills;
      return bKD - aKD;
    })
    .slice(0, 5);

  const getInitials = (u: User) => {
    if (u.firstName && u.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    if (u.nickname) {
      return u.nickname.slice(0, 2).toUpperCase();
    }
    if (u.email) {
      return u.email.slice(0, 2).toUpperCase();
    }
    return "CS";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Visão geral de todos os jogadores e estatísticas do sistema
          </p>
        </div>
        <Button asChild data-testid="button-manage-users">
          <Link href="/admin/users">
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Usuários
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Jogadores"
          value={users.length}
          subtitle={`${users.filter((u) => u.isAdmin).length} admins`}
          icon={Users}
          testId="card-total-players"
        />
        <StatsCard
          title="K/D Médio"
          value={avgKD}
          subtitle={`${totalKills} kills totais`}
          icon={Crosshair}
          testId="card-avg-kd"
        />
        <StatsCard
          title="Partidas Totais"
          value={totalMatches}
          subtitle="Em todas as contas"
          icon={Trophy}
          testId="card-total-matches"
        />
        <StatsCard
          title="Headshots Totais"
          value={users.reduce((acc, u) => acc + u.totalHeadshots, 0)}
          subtitle="Precisão coletiva"
          icon={Target}
          testId="card-total-headshots"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Top 5 Jogadores (K/D)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPlayers.map((player, index) => {
                const kd =
                  player.totalDeaths > 0
                    ? (player.totalKills / player.totalDeaths).toFixed(2)
                    : player.totalKills.toFixed(2);
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-4"
                    data-testid={`top-player-${index + 1}`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-500/20 text-yellow-500"
                          : index === 1
                          ? "bg-gray-400/20 text-gray-400"
                          : index === 2
                          ? "bg-orange-600/20 text-orange-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={player.profileImageUrl || undefined}
                        alt={player.nickname || "User"}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {getInitials(player)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {player.nickname ||
                          player.firstName ||
                          player.email?.split("@")[0]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {player.totalMatches} partidas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-primary">{kd}</div>
                      <div className="text-xs text-muted-foreground">K/D</div>
                    </div>
                  </div>
                );
              })}
              {topPlayers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum jogador encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Todos os Jogadores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jogador</TableHead>
                    <TableHead className="text-right">K/D</TableHead>
                    <TableHead className="text-right">Partidas</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((player) => {
                    const kd =
                      player.totalDeaths > 0
                        ? (player.totalKills / player.totalDeaths).toFixed(2)
                        : player.totalKills.toFixed(2);
                    return (
                      <TableRow
                        key={player.id}
                        data-testid={`player-row-${player.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={player.profileImageUrl || undefined}
                                alt={player.nickname || "User"}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                {getInitials(player)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {player.nickname ||
                                  player.firstName ||
                                  player.email?.split("@")[0]}
                              </div>
                              {player.isAdmin && (
                                <Badge variant="outline" className="text-xs">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {kd}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {player.totalMatches}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="font-mono">
                            {player.skillRating}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        Nenhum jogador encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
