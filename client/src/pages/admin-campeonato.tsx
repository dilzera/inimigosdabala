import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trophy, Users, Trash2, Loader2, User, Swords, Shuffle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { ChampionshipRegistration, User as UserType } from "@shared/schema";

interface GeneratedTeam {
  team1: Array<{ user: UserType; kd: number }>;
  team2: Array<{ user: UserType; kd: number }>;
}

export default function AdminCampeonato() {
  const { toast } = useToast();
  const [generatedTeams, setGeneratedTeams] = useState<GeneratedTeam | null>(null);

  const { data: registrations = [], isLoading: loadingRegistrations } = useQuery<ChampionshipRegistration[]>({
    queryKey: ["/api/championship-registrations"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/championship-registrations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/championship-registrations"] });
      toast({
        title: "Inscrição Removida",
        description: "A inscrição foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a inscrição.",
        variant: "destructive",
      });
    },
  });

  const getUserInfo = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { name: "Usuário desconhecido", email: "-", steamId: "-", kd: 0 };
    
    const name = user.nickname || user.firstName || user.email || "Sem nome";
    const kd = user.totalDeaths && user.totalDeaths > 0 
      ? (user.totalKills || 0) / user.totalDeaths 
      : user.totalKills || 0;
    return {
      name,
      email: user.email || "-",
      steamId: user.steamId64 || "Não vinculado",
      kd,
    };
  };

  const getRegisteredUsersWithKD = () => {
    return registrations.map(reg => {
      const user = users.find(u => u.id === reg.userId);
      if (!user) return null;
      
      const kd = user.totalDeaths && user.totalDeaths > 0 
        ? (user.totalKills || 0) / user.totalDeaths 
        : user.totalKills || 0;
      
      return { user, kd };
    }).filter((item): item is { user: UserType; kd: number } => item !== null);
  };

  const generateTeams = () => {
    const playersWithKD = getRegisteredUsersWithKD();
    
    if (playersWithKD.length < 2) {
      toast({
        title: "Jogadores insuficientes",
        description: "É necessário pelo menos 2 jogadores inscritos para gerar times.",
        variant: "destructive",
      });
      return;
    }

    const sorted = [...playersWithKD].sort((a, b) => b.kd - a.kd);
    
    const team1: typeof sorted = [];
    const team2: typeof sorted = [];
    let team1Total = 0;
    let team2Total = 0;

    for (const player of sorted) {
      if (team1Total <= team2Total) {
        team1.push(player);
        team1Total += player.kd;
      } else {
        team2.push(player);
        team2Total += player.kd;
      }
    }

    setGeneratedTeams({ team1, team2 });
    
    toast({
      title: "Times gerados!",
      description: `Time 1: ${team1.length} jogadores | Time 2: ${team2.length} jogadores`,
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Inscrições do Campeonato</h1>
          <p className="text-muted-foreground">
            Gerencie os interessados no campeonato
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Jogadores Interessados
              </CardTitle>
              <CardDescription>
                {registrations.length} {registrations.length === 1 ? "jogador" : "jogadores"} demonstraram interesse
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {registrations.length} inscritos
              </Badge>
              <Button 
                onClick={generateTeams}
                disabled={registrations.length < 2}
                data-testid="button-generate-teams"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Gerar Times (K/D)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingRegistrations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum jogador se inscreveu ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Jogador</TableHead>
                    <TableHead>K/D</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>SteamID64</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg, index) => {
                    const userInfo = getUserInfo(reg.userId);
                    return (
                      <TableRow key={reg.id} data-testid={`row-registration-${reg.id}`}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {userInfo.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={userInfo.kd >= 1 ? "default" : "secondary"} className="font-mono">
                            {userInfo.kd.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {userInfo.email}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {userInfo.steamId !== "Não vinculado" ? (
                            <Badge variant="outline" className="font-mono">
                              {userInfo.steamId}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Não vinculado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(reg.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Interessado</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(reg.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-registration-${reg.id}`}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
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

      {generatedTeams && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-primary" />
                Times Gerados (Balanceado por K/D)
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setGeneratedTeams(null)}
              >
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Badge variant="default" className="bg-blue-600">Time 1</Badge>
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    K/D Total: {generatedTeams.team1.reduce((sum, p) => sum + p.kd, 0).toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2">
                  {generatedTeams.team1.map((player, idx) => (
                    <div 
                      key={player.user.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">{idx + 1}.</span>
                        <span className="font-medium">
                          {player.user.nickname || player.user.firstName || player.user.email || "Jogador"}
                        </span>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        K/D: {player.kd.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Badge variant="default" className="bg-red-600">Time 2</Badge>
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    K/D Total: {generatedTeams.team2.reduce((sum, p) => sum + p.kd, 0).toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2">
                  {generatedTeams.team2.map((player, idx) => (
                    <div 
                      key={player.user.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">{idx + 1}.</span>
                        <span className="font-medium">
                          {player.user.nickname || player.user.firstName || player.user.email || "Jogador"}
                        </span>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        K/D: {player.kd.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
