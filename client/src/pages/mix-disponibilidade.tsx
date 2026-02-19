import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import {
  Users, Clock, UserPlus, UserMinus, AlertTriangle,
  ChevronLeft, ChevronRight, CalendarDays, Shield, Swords,
  ShieldAlert, CheckCircle, Ban, X
} from "lucide-react";
import type { User as UserType, MixAvailability } from "@shared/schema";

type MixEntry = MixAvailability & { user: UserType };

function getTodayDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = getTodayDate();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dateStr === today) return "Hoje";
  if (dateStr === tomorrowStr) return "Amanhã";

  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export default function MixDisponibilidade() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [confirmMode, setConfirmMode] = useState(false);
  const [confirmedPlayerIds, setConfirmedPlayerIds] = useState<Set<string>>(new Set());
  const today = getTodayDate();
  const initialDate = today;

  const { data: selectedDate, refetch: refetchDate } = useQuery<string>({
    queryKey: ['mix-list-date'],
    queryFn: () => initialDate,
    staleTime: Infinity,
    initialData: initialDate,
  });

  const currentDate = selectedDate || today;

  const { data: mixList = [], isLoading } = useQuery<MixEntry[]>({
    queryKey: ['/api/mix/availability', currentDate],
    queryFn: async () => {
      const res = await fetch(`/api/mix/availability/${currentDate}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const { data: penaltyData } = useQuery<{ count: number; forcedSub: boolean; suspended: boolean }>({
    queryKey: ['/api/mix/penalties', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/mix/penalties/${user?.id}`, { credentials: 'include' });
      if (!res.ok) return { count: 0, forcedSub: false, suspended: false };
      return res.json();
    },
    enabled: !!user?.id,
  });

  const joinMutation = useMutation({
    mutationFn: async (isSub: boolean) => {
      return apiRequest('POST', '/api/mix/availability/join', { listDate: currentDate, isSub });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/mix/availability', currentDate] });
      if (data.forcedSub) {
        toast({ title: "Adicionado como Suplente", description: "Devido a faltas anteriores, você só pode entrar como suplente.", variant: "destructive" });
      } else {
        toast({ title: "Adicionado na lista!", description: "Você está na lista do mix." });
      }
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Não foi possível entrar na lista", variant: "destructive" });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/mix/confirm-played', {
        listDate: currentDate,
        playedUserIds: Array.from(confirmedPlayerIds),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/mix/penalties'] });
      setConfirmMode(false);
      setConfirmedPlayerIds(new Set());
      toast({
        title: "Lista confirmada!",
        description: `${data.noShowCount} jogador(es) penalizado(s) por falta.`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Não foi possível confirmar a lista", variant: "destructive" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/mix/availability/leave', { listDate: currentDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mix/availability', currentDate] });
      toast({ title: "Removido da lista", description: "Você saiu da lista do mix." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Não foi possível sair da lista", variant: "destructive" });
    },
  });

  const adminRemoveMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      return apiRequest('POST', '/api/mix/availability/admin-remove', { listDate: currentDate, userId: targetUserId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mix/availability', currentDate] });
      toast({ title: "Jogador removido", description: "Jogador removido da lista sem penalidade." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Não foi possível remover o jogador", variant: "destructive" });
    },
  });

  const isInList = mixList.some(e => e.userId === user?.id);
  const mainPlayers = mixList.filter(e => !e.isSub).sort((a, b) => a.position - b.position);
  const subPlayers = mixList.filter(e => e.isSub).sort((a, b) => a.position - b.position);

  const navigateDate = (days: number) => {
    const newDate = addDays(currentDate, days);
    queryClient.setQueryData(['mix-list-date'], newDate);
  };

  const getInitials = (u: UserType) => {
    if (u.nickname) return u.nickname.slice(0, 2).toUpperCase();
    if (u.firstName) return u.firstName.slice(0, 2).toUpperCase();
    return "??";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-mix-title">Lista do Mix</h1>
          <p className="text-muted-foreground">
            Disponibilize-se para jogar o mix de hoje
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4" data-testid="date-navigation">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateDate(-1)}
          data-testid="button-prev-date"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold capitalize" data-testid="text-current-date">
            {formatDateLabel(currentDate)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({new Date(currentDate + 'T12:00:00').toLocaleDateString('pt-BR')})
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateDate(1)}
          data-testid="button-next-date"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card className="border-primary/20" data-testid="card-mix-header">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-primary" />
            Mix 19 horas - Inimigos da Bala
          </CardTitle>
          <CardDescription>
            {mainPlayers.length}/10 jogadores confirmados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {penaltyData && penaltyData.count > 0 && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              penaltyData.suspended 
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-yellow-500/10 border-yellow-500/30'
            }`} data-testid="penalty-warning">
              <ShieldAlert className={`h-5 w-5 ${penaltyData.suspended ? 'text-red-500' : 'text-yellow-500'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {penaltyData.suspended
                    ? `Suspensão ativa! Você tem ${penaltyData.count} falta(s) e está suspenso por 1 lista.`
                    : `Atenção: Você tem ${penaltyData.count} falta(s). Só pode entrar como suplente.`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {penaltyData.suspended
                    ? "Após 3 faltas, suspensão de 1 lista. Contate um admin para resolver."
                    : "Quem falta sem avisar entra apenas como suplente na próxima."
                  }
                </p>
              </div>
              <Badge variant={penaltyData.suspended ? "destructive" : "secondary"}>
                {penaltyData.count} falta{penaltyData.count > 1 ? "s" : ""}
              </Badge>
            </div>
          )}

          {!isInList ? (
            penaltyData?.suspended ? (
              <Button disabled className="w-full" variant="destructive" data-testid="button-suspended">
                <Ban className="h-4 w-4 mr-2" />
                Suspenso desta lista
              </Button>
            ) : penaltyData?.forcedSub ? (
              <div className="space-y-2">
                <Button
                  onClick={() => joinMutation.mutate(true)}
                  disabled={joinMutation.isPending}
                  variant="outline"
                  className="w-full"
                  data-testid="button-join-sub"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Entrar como Suplente (obrigatório por falta anterior)
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => joinMutation.mutate(false)}
                  disabled={joinMutation.isPending}
                  className="flex-1"
                  data-testid="button-join-main"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Entrar como Titular
                </Button>
                <Button
                  onClick={() => joinMutation.mutate(true)}
                  disabled={joinMutation.isPending}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-join-sub"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Entrar como Suplente
                </Button>
              </div>
            )
          ) : (
            <Button
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
              variant="destructive"
              className="w-full"
              data-testid="button-leave-list"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Sair da Lista
            </Button>
          )}

          {user?.isAdmin && mainPlayers.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              {!confirmMode ? (
                <Button
                  onClick={() => {
                    setConfirmMode(true);
                    setConfirmedPlayerIds(new Set(mainPlayers.map(p => p.userId)));
                  }}
                  variant="outline"
                  className="w-full"
                  data-testid="button-start-confirm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Presença (Admin)
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Desmarque quem NÃO jogou. Os desmarcados receberão falta.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => confirmMutation.mutate()}
                      disabled={confirmMutation.isPending}
                      data-testid="button-confirm-played"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar
                    </Button>
                    <Button
                      onClick={() => { setConfirmMode(false); setConfirmedPlayerIds(new Set()); }}
                      variant="outline"
                      data-testid="button-cancel-confirm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-main-players">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Titulares ({mainPlayers.length}/10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Array.from({ length: 10 }, (_, i) => {
              const player = mainPlayers[i];
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    player ? 'bg-muted/50' : 'bg-muted/20 border border-dashed border-muted-foreground/20'
                  }`}
                  data-testid={`slot-main-${i + 1}`}
                >
                  <span className="w-8 text-center font-mono font-bold text-lg text-muted-foreground">
                    {i + 1}
                  </span>
                  {player ? (
                    <>
                      {confirmMode && (
                        <Checkbox
                          checked={confirmedPlayerIds.has(player.userId)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(confirmedPlayerIds);
                            if (checked) { newSet.add(player.userId); } else { newSet.delete(player.userId); }
                            setConfirmedPlayerIds(newSet);
                          }}
                          data-testid={`checkbox-confirm-${i + 1}`}
                        />
                      )}
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.user.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(player.user)}
                        </AvatarFallback>
                      </Avatar>
                      <Link href={`/jogador/${player.userId}`} className="font-medium flex-1 underline decoration-muted-foreground/30 underline-offset-2 cursor-pointer" data-testid={`link-player-main-${i + 1}`}>
                        {player.user.nickname || player.user.firstName || "Jogador"}
                      </Link>
                      {confirmMode && !confirmedPlayerIds.has(player.userId) && (
                        <Badge variant="destructive">Faltou</Badge>
                      )}
                      {player.userId === user?.id && (
                        <Badge variant="default">Você</Badge>
                      )}
                      {user?.isAdmin && !confirmMode && player.userId !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => adminRemoveMutation.mutate(player.userId)}
                          disabled={adminRemoveMutation.isPending}
                          data-testid={`button-admin-remove-main-${i + 1}`}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm italic flex-1">
                      Vaga disponível
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-sub-players">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Suplentes ({subPlayers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {subPlayers.length === 0 ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-dashed border-muted-foreground/20">
                <span className="w-8 text-center font-mono font-bold text-lg text-muted-foreground">1</span>
                <span className="text-muted-foreground text-sm italic flex-1">
                  Nenhum suplente
                </span>
              </div>
            ) : (
              subPlayers.map((player, i) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  data-testid={`slot-sub-${i + 1}`}
                >
                  <span className="w-8 text-center font-mono font-bold text-lg text-muted-foreground">
                    {i + 1}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={player.user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(player.user)}
                    </AvatarFallback>
                  </Avatar>
                  <Link href={`/jogador/${player.userId}`} className="font-medium flex-1 underline decoration-muted-foreground/30 underline-offset-2 cursor-pointer" data-testid={`link-player-sub-${i + 1}`}>
                    {player.user.nickname || player.user.firstName || "Jogador"}
                  </Link>
                  {player.userId === user?.id && (
                    <Badge variant="default">Você</Badge>
                  )}
                  {user?.isAdmin && player.userId !== user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => adminRemoveMutation.mutate(player.userId)}
                      disabled={adminRemoveMutation.isPending}
                      data-testid={`button-admin-remove-sub-${i + 1}`}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))
            )}
            {subPlayers.length > 0 && (
              <div
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-dashed border-muted-foreground/20"
              >
                <span className="w-8 text-center font-mono font-bold text-lg text-muted-foreground">
                  {subPlayers.length + 1}
                </span>
                <span className="text-muted-foreground text-sm italic flex-1">
                  Vaga disponível
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {mainPlayers.length >= 2 && (
        <Button
          onClick={() => {
            const playerIds = mainPlayers.map(e => e.userId).join(",");
            setLocation(`/mix/escolher-time?players=${playerIds}`);
          }}
          className="w-full"
          data-testid="button-go-team-selection"
        >
          <Swords className="h-4 w-4 mr-2" />
          Escolher Times com Jogadores da Lista ({mainPlayers.length})
        </Button>
      )}

      <Card className="border-yellow-500/20 bg-yellow-500/5" data-testid="card-rules">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Regras da Lista
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Devido aos recentes abandonos sem aviso, quem colocar o nome na lista e não comparecer ou avisar 
            antecipadamente ficará restrito a colocar o nome como suplente nas próximas listas, liberando a vaga principal.
          </p>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">
              Limite de horário de chegada: 19h10. Após isso, suplentes serão acionados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
