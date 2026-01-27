import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, Trophy, Medal, Award, Save, Trash2, Calendar, ChevronDown, ChevronUp, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, MonthlyRanking } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RankingEntry {
  rank: number;
  id: string;
  name: string;
  nickname?: string;
  profileImageUrl?: string;
  skillRating: number;
  kd: number;
  hsPercent: number;
  adr: number;
  winRate: number;
  matchesPlayed: number;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function calculateSkillRating(user: User): number {
  const kd = user.totalDeaths > 0 ? user.totalKills / user.totalDeaths : user.totalKills;
  const hsPercent = user.totalKills > 0 ? (user.totalHeadshots / user.totalKills) * 100 : 0;
  const adr = user.totalRoundsPlayed > 0 ? user.totalDamage / user.totalRoundsPlayed : 0;
  const winRate = user.totalMatches > 0 ? (user.matchesWon / user.totalMatches) * 100 : 50;
  
  return Math.round(
    1000 +
    (kd - 1) * 150 +
    (hsPercent - 30) * 2 +
    (adr - 70) * 1.5 +
    (winRate - 50) * 3 +
    (user.totalMvps || 0) * 2 +
    (user.total5ks || 0) * 30 +
    (user.total4ks || 0) * 15 +
    (user.total3ks || 0) * 5
  );
}

function getPlayerDisplayName(user: User): string {
  if (user.nickname) return user.nickname;
  if (user.firstName) return user.firstName;
  if (user.email) return user.email;
  return "Jogador";
}

export default function AdminHistoricoRankings() {
  const { toast } = useToast();
  const [expandedRanking, setExpandedRanking] = useState<number | null>(null);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: monthlyRankings = [], isLoading } = useQuery<MonthlyRanking[]>({
    queryKey: ["/api/monthly-rankings"],
  });

  const saveRankingMutation = useMutation({
    mutationFn: async () => {
      const activeUsers = users.filter(u => u.totalMatches > 0);
      const rankings: RankingEntry[] = activeUsers
        .map(user => {
          const skillRating = calculateSkillRating(user);
          const kd = user.totalDeaths > 0 ? user.totalKills / user.totalDeaths : user.totalKills;
          const hsPercent = user.totalKills > 0 ? (user.totalHeadshots / user.totalKills) * 100 : 0;
          const adr = user.totalRoundsPlayed > 0 ? user.totalDamage / user.totalRoundsPlayed : 0;
          const winRate = user.totalMatches > 0 ? (user.matchesWon / user.totalMatches) * 100 : 50;

          return {
            rank: 0,
            id: user.id,
            name: getPlayerDisplayName(user),
            nickname: user.nickname || undefined,
            profileImageUrl: user.profileImageUrl || undefined,
            skillRating: Math.max(100, Math.min(3000, skillRating)),
            kd,
            hsPercent,
            adr,
            winRate,
            matchesPlayed: user.totalMatches,
          };
        })
        .sort((a, b) => b.skillRating - a.skillRating)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      return apiRequest("POST", "/api/monthly-rankings", {
        month: selectedMonth,
        year: selectedYear,
        rankings,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-rankings"] });
      toast({
        title: "Ranking salvo!",
        description: `O ranking de ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} foi salvo.`,
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Não foi possível salvar o ranking.";
      toast({
        title: "Erro",
        description: message.includes("já existe") ? "Já existe um ranking salvo para este mês." : message,
        variant: "destructive",
      });
    },
  });

  const deleteRankingMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/monthly-rankings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-rankings"] });
      toast({
        title: "Ranking excluído",
        description: "O registro foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o ranking.",
        variant: "destructive",
      });
    },
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-mono">{rank}º</span>;
    }
  };

  const getMonthYearLabel = (month: number, year: number) => {
    return `${MONTH_NAMES[month - 1]} ${year}`;
  };

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            Histórico de Rankings Mensais
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize e salve o desempenho dos jogadores por mês
          </p>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium">Salvar ranking do mês:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="w-[140px]" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => saveRankingMutation.mutate()}
                disabled={saveRankingMutation.isPending}
                data-testid="button-save-ranking"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveRankingMutation.isPending ? "Salvando..." : "Salvar Ranking"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Ao salvar, um snapshot do ranking atual será guardado para o mês selecionado. 
            Cada mês só pode ter um registro.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Carregando rankings...
          </CardContent>
        </Card>
      ) : monthlyRankings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum ranking mensal salvo ainda.</p>
            <p className="text-sm mt-1">Selecione um mês e clique em "Salvar Ranking" para criar o primeiro registro.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {monthlyRankings.map((ranking) => {
            const isExpanded = expandedRanking === ranking.id;
            const rankingData = ranking.rankings as RankingEntry[];

            return (
              <Card key={ranking.id}>
                <Collapsible open={isExpanded} onOpenChange={() => setExpandedRanking(isExpanded ? null : ranking.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-3 p-0 h-auto hover:bg-transparent" data-testid={`button-expand-ranking-${ranking.id}`}>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div className="text-left">
                              <CardTitle className="text-lg">
                                {getMonthYearLabel(ranking.month, ranking.year)}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {rankingData.length} jogadores
                                <span className="text-xs">
                                  • Salvo em {format(new Date(ranking.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" data-testid={`button-delete-ranking-${ranking.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir ranking?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O registro de {getMonthYearLabel(ranking.month, ranking.year)} será permanentemente removido.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRankingMutation.mutate(ranking.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-2">
                        {rankingData.slice(0, 10).map((entry) => (
                          <div
                            key={entry.id}
                            className={`flex items-center gap-4 p-3 rounded-lg ${
                              entry.rank <= 3 ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
                            }`}
                          >
                            <div className="w-8 flex justify-center">
                              {getRankIcon(entry.rank)}
                            </div>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={entry.profileImageUrl} />
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {entry.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{entry.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.matchesPlayed} partidas
                              </p>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-center text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">SR</p>
                                <p className="font-mono font-semibold text-primary">{entry.skillRating}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">K/D</p>
                                <p className="font-mono">{entry.kd.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">HS%</p>
                                <p className="font-mono">{entry.hsPercent.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Win%</p>
                                <p className="font-mono">{entry.winRate.toFixed(1)}%</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {rankingData.length > 10 && (
                          <p className="text-center text-sm text-muted-foreground pt-2">
                            +{rankingData.length - 10} jogadores no ranking completo
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
