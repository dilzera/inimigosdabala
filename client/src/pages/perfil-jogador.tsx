import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User as UserIcon, Trophy, Target, Crosshair, Shield, Star, TrendingUp, 
  Zap, Award, Eye, Link2, Check, AlertCircle, Edit2, Save, X, ArrowLeft,
  Medal, CalendarDays, Handshake
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import type { User } from "@shared/schema";

export default function PerfilJogador() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    profileImageUrl: "",
    steamId64: "",
  });

  const { data: player, isLoading, isError } = useQuery<User>({
    queryKey: ["/api/users", id],
    queryFn: async ({ queryKey }) => {
      const playerId = queryKey[1];
      const res = await fetch(`/api/users/${playerId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch player");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: monthlyData } = useQuery<{
    month: number;
    year: number;
    monthName: string;
    players: Array<{
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
    }>;
  }>({
    queryKey: ['/api/stats/monthly'],
  });

  const generalRanking = (() => {
    if (!player || allUsers.length === 0) return { position: 0, total: 0 };
    const sorted = [...allUsers]
      .filter(u => u.totalMatches > 0)
      .sort((a, b) => b.skillRating - a.skillRating);
    const pos = sorted.findIndex(u => u.id === player.id);
    return { position: pos >= 0 ? pos + 1 : 0, total: sorted.length };
  })();

  const getMonthlySkillRating = (p: { kills: number; deaths: number; headshots: number; damage: number; matchesPlayed: number; matchesWon: number; mvps: number; total5ks?: number; total4ks?: number; total3ks?: number }) => {
    const kd = p.deaths > 0 ? p.kills / p.deaths : p.kills;
    const hsPercent = p.kills > 0 ? (p.headshots / p.kills) * 100 : 0;
    const winRate = p.matchesPlayed > 0 ? (p.matchesWon / p.matchesPlayed) * 100 : 0;
    const estimatedRounds = p.matchesPlayed * 24;
    const adr = estimatedRounds > 0 ? p.damage / estimatedRounds : 0;
    let rating = 1000;
    rating += (kd - 1) * 150;
    rating += (hsPercent - 30) * 2;
    rating += (adr - 70) * 1.5;
    rating += (winRate - 50) * 3;
    rating += p.mvps * 2;
    rating += (p.total5ks || 0) * 30;
    rating += (p.total4ks || 0) * 15;
    rating += (p.total3ks || 0) * 5;
    return Math.max(100, Math.min(3000, Math.round(rating)));
  };

  const monthlyRanking = (() => {
    if (!player || !monthlyData?.players) return { position: 0, total: 0, kills: 0, deaths: 0, assists: 0, mvps: 0, matchesPlayed: 0, damage: 0, headshots: 0 };
    const eligible = monthlyData.players.filter(p => p.matchesPlayed >= 3);
    const sorted = [...eligible].sort((a, b) => getMonthlySkillRating(b) - getMonthlySkillRating(a));
    const pos = sorted.findIndex(p => p.userId === player.id);
    const myStats = monthlyData.players.find(p => p.userId === player.id);
    return {
      position: pos >= 0 ? pos + 1 : 0,
      total: sorted.length,
      kills: myStats?.kills || 0,
      deaths: myStats?.deaths || 0,
      assists: myStats?.assists || 0,
      mvps: myStats?.mvps || 0,
      matchesPlayed: myStats?.matchesPlayed || 0,
      damage: myStats?.damage || 0,
      headshots: myStats?.headshots || 0,
    };
  })();

  const canEdit = currentUser && player && (currentUser.id === player.id || currentUser.isAdmin);

  useEffect(() => {
    if (player) {
      setEditForm({
        firstName: player.firstName || "",
        lastName: player.lastName || "",
        nickname: player.nickname || "",
        profileImageUrl: player.profileImageUrl || "",
        steamId64: player.steamId64 || "",
      });
    }
  }, [player]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const endpoint = currentUser?.id === player?.id ? "/api/users/me" : `/api/users/${id}`;
      const response = await apiRequest("PATCH", endpoint, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil Atualizado!",
        description: "As informações foram salvas com sucesso.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Atualizar",
        description: error.message || "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(editForm);
  };

  const handleCancelEdit = () => {
    if (player) {
      setEditForm({
        firstName: player.firstName || "",
        lastName: player.lastName || "",
        nickname: player.nickname || "",
        profileImageUrl: player.profileImageUrl || "",
        steamId64: player.steamId64 || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isError || !player) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Jogador não encontrado.</AlertDescription>
        </Alert>
        <Link href="/rankings">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Rankings
          </Button>
        </Link>
      </div>
    );
  }

  const kdRatio = player.totalDeaths > 0
    ? (player.totalKills / player.totalDeaths).toFixed(2)
    : player.totalKills.toFixed(2);

  const headshotPercent = player.totalKills > 0
    ? ((player.totalHeadshots / player.totalKills) * 100).toFixed(1)
    : "0.0";

  const winRate = player.totalMatches > 0
    ? ((player.matchesWon / player.totalMatches) * 100).toFixed(1)
    : "0.0";

  const roundWinRate = player.totalRoundsPlayed > 0
    ? ((player.roundsWon / player.totalRoundsPlayed) * 100).toFixed(1)
    : "0.0";

  const accuracy = player.totalShotsFired > 0
    ? ((player.totalShotsOnTarget / player.totalShotsFired) * 100).toFixed(1)
    : "0.0";

  const adr = player.totalRoundsPlayed > 0
    ? (player.totalDamage / player.totalRoundsPlayed).toFixed(0)
    : "0";

  const clutchWinRate1v1 = player.total1v1Count > 0
    ? ((player.total1v1Wins / player.total1v1Count) * 100).toFixed(0)
    : "0";

  const entryWinRate = player.totalEntryCount > 0
    ? ((player.totalEntryWins / player.totalEntryCount) * 100).toFixed(0)
    : "0";

  const flashSuccessRate = player.totalFlashCount > 0
    ? ((player.totalFlashSuccesses / player.totalFlashCount) * 100).toFixed(0)
    : "0";

  const isOwnProfile = currentUser?.id === player.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/rankings">
            <Button variant="ghost" size="icon" data-testid="button-back-rankings">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <UserIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">
            {isOwnProfile ? "Meu Perfil" : `Perfil de ${player.nickname || player.firstName || "Jogador"}`}
          </h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            {isEditing && canEdit ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex flex-col items-center text-center mb-4">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={editForm.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {editForm.nickname?.slice(0, 2).toUpperCase() || editForm.firstName?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nickname">Apelido (Nick)</Label>
                  <Input
                    id="nickname"
                    placeholder="Seu nick no jogo"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                    data-testid="input-nickname"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      placeholder="Nome"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      data-testid="input-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      placeholder="Sobrenome"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      data-testid="input-lastname"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profileImageUrl">URL da Foto de Perfil</Label>
                  <Input
                    id="profileImageUrl"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={editForm.profileImageUrl}
                    onChange={(e) => setEditForm({ ...editForm, profileImageUrl: e.target.value })}
                    data-testid="input-profile-image"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="steamId64" className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    SteamID64
                  </Label>
                  <Input
                    id="steamId64"
                    placeholder="76561198000000000"
                    value={editForm.steamId64}
                    onChange={(e) => setEditForm({ ...editForm, steamId64: e.target.value })}
                    data-testid="input-steam-id"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancelEdit}
                    data-testid="button-cancel-edit"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={player.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {player.nickname?.slice(0, 2).toUpperCase() || player.firstName?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold">
                    {player.nickname || player.firstName || "Jogador"}
                  </h2>
                  {player.email && <p className="text-muted-foreground">{player.email}</p>}
                  <div className="flex flex-wrap gap-2 mt-3 justify-center">
                    <Badge variant={player.isAdmin ? "default" : "secondary"}>
                      {player.isAdmin ? "Admin" : "Jogador"}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      Rating: {player.skillRating}
                    </Badge>
                  </div>
                  {player.steamId64 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="font-mono text-xs">{player.steamId64}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Skill Rating</span>
                      <span className="font-mono">{player.skillRating} / 3000</span>
                    </div>
                    <Progress value={(player.skillRating / 3000) * 100} />
                  </div>
                </div>

                {canEdit && (
                  <div className="mt-6 pt-6 border-t">
                    <Button 
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="w-full"
                      data-testid="button-edit-profile"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-primary" />
              Rankings e Destaques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background/50 rounded-lg" data-testid="card-ranking-geral">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold font-mono">
                  {generalRanking.position > 0 ? `${generalRanking.position}°` : "-"}
                </div>
                <div className="text-sm text-muted-foreground">Ranking Geral</div>
                {generalRanking.total > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">de {generalRanking.total} jogadores</div>
                )}
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg" data-testid="card-ranking-mensal">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold font-mono">
                  {monthlyRanking.position > 0 ? `${monthlyRanking.position}°` : "-"}
                </div>
                <div className="text-sm text-muted-foreground">Ranking Mensal</div>
                {monthlyData?.monthName && (
                  <div className="text-xs text-muted-foreground mt-1 capitalize">{monthlyData.monthName}</div>
                )}
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg" data-testid="card-skill-rating">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono">{player.skillRating}</div>
                <div className="text-sm text-muted-foreground">Skill Rating</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg" data-testid="card-mvps-total">
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold font-mono">{player.totalMvps}</div>
                <div className="text-sm text-muted-foreground">MVPs Total</div>
                {monthlyRanking.mvps > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">{monthlyRanking.mvps} este mês</div>
                )}
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg" data-testid="card-assists-total">
                <Handshake className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold font-mono">{player.totalAssists}</div>
                <div className="text-sm text-muted-foreground">Assistências Total</div>
                {monthlyRanking.assists > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">{monthlyRanking.assists} este mês</div>
                )}
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg" data-testid="card-kd-ratio">
                <Crosshair className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono">{kdRatio}</div>
                <div className="text-sm text-muted-foreground">K/D Ratio</div>
              </div>
            </div>

            {monthlyRanking.matchesPlayed > 0 && (
              <div className="mt-4 p-3 rounded-lg border border-border/50 bg-muted/30">
                <div className="text-sm font-medium mb-2 capitalize">Resumo Mensal - {monthlyData?.monthName}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Partidas</span>
                    <span className="font-mono font-bold">{monthlyRanking.matchesPlayed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kills</span>
                    <span className="font-mono font-bold text-green-500">{monthlyRanking.kills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deaths</span>
                    <span className="font-mono font-bold text-red-500">{monthlyRanking.deaths}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HS</span>
                    <span className="font-mono font-bold text-yellow-500">{monthlyRanking.headshots}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Estatísticas Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <Crosshair className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono">{kdRatio}</div>
                <div className="text-sm text-muted-foreground">K/D Ratio</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono">{headshotPercent}%</div>
                <div className="text-sm text-muted-foreground">Headshot %</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono">{winRate}%</div>
                <div className="text-sm text-muted-foreground">Taxa de Vitória</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-mono">{player.totalMatches}</div>
                <div className="text-sm text-muted-foreground">Partidas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {player.totalMatches === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Este jogador ainda não tem partidas registradas.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Combate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Kills</span>
              <span className="font-mono font-bold text-green-500">{player.totalKills}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Deaths</span>
              <span className="font-mono font-bold text-red-500">{player.totalDeaths}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Assistências</span>
              <span className="font-mono font-bold">{player.totalAssists}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Headshots</span>
              <span className="font-mono font-bold text-yellow-500">{player.totalHeadshots}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Dano Total</span>
              <span className="font-mono font-bold">{player.totalDamage}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">ADR (Média)</span>
              <span className="font-mono font-bold text-primary">{adr}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Partidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Vitórias</span>
              <span className="font-mono font-bold text-green-500">{player.matchesWon}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Derrotas</span>
              <span className="font-mono font-bold text-red-500">{player.matchesLost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Rounds Jogados</span>
              <span className="font-mono font-bold">{player.totalRoundsPlayed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Rounds Ganhos</span>
              <span className="font-mono font-bold">{player.roundsWon}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa de Rounds</span>
              <span className="font-mono font-bold">{roundWinRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de MVPs</span>
              <Badge variant="default" className="font-mono">
                <Star className="h-3 w-3 mr-1" />
                {player.totalMvps}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Multi-Kills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                ACE (5K)
              </span>
              <span className="font-mono font-bold text-yellow-500">{player.total5ks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">4K</span>
              <span className="font-mono font-bold">{player.total4ks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">3K</span>
              <span className="font-mono font-bold">{player.total3ks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">2K</span>
              <span className="font-mono font-bold">{player.total2ks}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clutches & Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">1v1 Wins</span>
              <span className="font-mono font-bold">{player.total1v1Wins} / {player.total1v1Count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">1v1 Win Rate</span>
              <span className="font-mono font-bold text-primary">{clutchWinRate1v1}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">1v2 Wins</span>
              <span className="font-mono font-bold">{player.total1v2Wins} / {player.total1v2Count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Entry Frags</span>
              <span className="font-mono font-bold">{player.totalEntryWins} / {player.totalEntryCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Entry Win Rate</span>
              <span className="font-mono font-bold text-primary">{entryWinRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilitários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Flashes Lançadas
              </span>
              <span className="font-mono font-bold">{player.totalFlashCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Flashes Efetivas</span>
              <span className="font-mono font-bold">{player.totalFlashSuccesses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Inimigos Cegados</span>
              <span className="font-mono font-bold text-primary">{player.totalEnemiesFlashed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Dano de Utility</span>
              <span className="font-mono font-bold">{player.totalUtilityDamage}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa de Sucesso</span>
              <span className="font-mono font-bold">{flashSuccessRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precisão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Tiros Disparados
              </span>
              <span className="font-mono font-bold">{player.totalShotsFired}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tiros no Alvo</span>
              <span className="font-mono font-bold">{player.totalShotsOnTarget}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa de Acerto</span>
              <span className="font-mono font-bold text-primary">{accuracy}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
