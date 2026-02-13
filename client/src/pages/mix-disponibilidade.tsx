import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Clock, UserPlus, UserMinus, AlertTriangle,
  ChevronLeft, ChevronRight, CalendarDays, Shield
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

  const joinMutation = useMutation({
    mutationFn: async (isSub: boolean) => {
      return apiRequest('POST', '/api/mix/availability/join', { listDate: currentDate, isSub });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mix/availability', currentDate] });
      toast({ title: "Adicionado na lista!", description: "Você está na lista do mix." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Não foi possível entrar na lista", variant: "destructive" });
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
          {!isInList ? (
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
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.user.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(player.user)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium flex-1" data-testid={`text-player-name-main-${i + 1}`}>
                        {player.user.nickname || player.user.firstName || "Jogador"}
                      </span>
                      {player.userId === user?.id && (
                        <Badge variant="default">Você</Badge>
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
                  <span className="font-medium flex-1" data-testid={`text-player-name-sub-${i + 1}`}>
                    {player.user.nickname || player.user.firstName || "Jogador"}
                  </span>
                  {player.userId === user?.id && (
                    <Badge variant="default">Você</Badge>
                  )}
                </div>
              ))
            )}
            {subPlayers.length > 0 && subPlayers.length < 4 && (
              Array.from({ length: 4 - subPlayers.length }, (_, i) => (
                <div
                  key={`empty-sub-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-dashed border-muted-foreground/20"
                >
                  <span className="w-8 text-center font-mono font-bold text-lg text-muted-foreground">
                    {subPlayers.length + i + 1}
                  </span>
                  <span className="text-muted-foreground text-sm italic flex-1">
                    Vaga disponível
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

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
