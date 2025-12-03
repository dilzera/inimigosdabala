import { useAuth } from "@/hooks/useAuth";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crosshair,
  Target,
  Trophy,
  Skull,
  Shield,
  Star,
  TrendingUp,
  Percent,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null;
  }

  const kdRatio =
    user.totalDeaths > 0
      ? (user.totalKills / user.totalDeaths).toFixed(2)
      : user.totalKills.toFixed(2);

  const headshotPercent =
    user.totalKills > 0
      ? ((user.totalHeadshots / user.totalKills) * 100).toFixed(1)
      : "0.0";

  const winRate =
    user.totalMatches > 0
      ? ((user.matchesWon / user.totalMatches) * 100).toFixed(1)
      : "0.0";

  const roundWinRate =
    user.totalRoundsPlayed > 0
      ? ((user.roundsWon / user.totalRoundsPlayed) * 100).toFixed(1)
      : "0.0";

  const mockPerformanceData = [
    { match: "1", kd: 1.2 },
    { match: "2", kd: 1.5 },
    { match: "3", kd: 0.8 },
    { match: "4", kd: 1.8 },
    { match: "5", kd: 1.4 },
    { match: "6", kd: 2.1 },
    { match: "7", kd: 1.6 },
  ];

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.nickname) {
      return user.nickname.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "CS";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {user.nickname || user.firstName || "Jogador"}!
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="flex items-center gap-3 p-4">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={user.profileImageUrl || undefined}
                alt={user.nickname || "User"}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold" data-testid="text-profile-name">
                {user.nickname || user.firstName || user.email?.split("@")[0]}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Rating: {user.skillRating}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="K/D Ratio"
          value={kdRatio}
          subtitle={`${user.totalKills} kills / ${user.totalDeaths} deaths`}
          icon={Crosshair}
          testId="card-kd-ratio"
        />
        <StatsCard
          title="Headshot %"
          value={`${headshotPercent}%`}
          subtitle={`${user.totalHeadshots} headshots`}
          icon={Target}
          testId="card-headshot"
        />
        <StatsCard
          title="Taxa de Vitória"
          value={`${winRate}%`}
          subtitle={`${user.matchesWon}W / ${user.matchesLost}L`}
          icon={Trophy}
          testId="card-win-rate"
        />
        <StatsCard
          title="Total de Partidas"
          value={user.totalMatches}
          subtitle={`${user.totalMvps} MVPs`}
          icon={Shield}
          testId="card-total-matches"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="match"
                    className="text-xs text-muted-foreground"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="kd"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Estatísticas Detalhadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Assistências
                </span>
                <span className="font-mono font-semibold">
                  {user.totalAssists}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Rounds Jogados
                </span>
                <span className="font-mono font-semibold">
                  {user.totalRoundsPlayed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Rounds Ganhos
                </span>
                <span className="font-mono font-semibold">{user.roundsWon}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Taxa de Rounds
                </span>
                <span className="font-mono font-semibold">{roundWinRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total de MVPs
                </span>
                <span className="font-mono font-semibold">{user.totalMvps}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Skill Rating
                </span>
                <Badge variant="default" className="font-mono">
                  {user.skillRating}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
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
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
