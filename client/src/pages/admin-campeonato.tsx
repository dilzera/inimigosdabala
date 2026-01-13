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
import { Trophy, Users, Trash2, Loader2, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ChampionshipRegistration, User as UserType } from "@shared/schema";

export default function AdminCampeonato() {
  const { toast } = useToast();

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
    if (!user) return { name: "Usuário desconhecido", email: "-", steamId: "-" };
    
    const name = user.nickname || user.firstName || user.email || "Sem nome";
    return {
      name,
      email: user.email || "-",
      steamId: user.steamId64 || "Não vinculado",
    };
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
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {registrations.length} inscritos
            </Badge>
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
    </div>
  );
}
