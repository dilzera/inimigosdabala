import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, Target, Swords, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Campeonato() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: registrationStatus, isLoading } = useQuery<{ registered: boolean }>({
    queryKey: ["/api/championship-registrations/me"],
    enabled: !!user,
  });

  const registerMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/championship-registrations"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/championship-registrations/me"] });
      toast({
        title: "Inscrição Recebida!",
        description: "Você será notificado quando o campeonato for confirmado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível fazer a inscrição. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleRegister = () => {
    registerMutation.mutate();
  };

  const isRegistered = registrationStatus?.registered;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Trophy className="h-10 w-10 text-yellow-500" />
          <h1 className="text-4xl font-bold">Campeonato Inimigos da Bala</h1>
          <Trophy className="h-10 w-10 text-yellow-500" />
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-1">
          Em Preparação
        </Badge>
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Swords className="h-6 w-6 text-primary" />
            Primeiro Campeonato Oficial
          </CardTitle>
          <CardDescription className="text-base">
            Estamos nos preparando para realizar o primeiro campeonato oficial da comunidade Inimigos da Bala!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 text-center">
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <span className="font-medium">Data</span>
              <span className="text-sm text-muted-foreground">A definir</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 text-center">
              <Users className="h-8 w-8 text-primary mb-2" />
              <span className="font-medium">Formato</span>
              <span className="text-sm text-muted-foreground">5v5 Competitivo</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 text-center">
              <Target className="h-8 w-8 text-primary mb-2" />
              <span className="font-medium">Mapas</span>
              <span className="text-sm text-muted-foreground">Pool Competitivo</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 text-center">
              <Clock className="h-8 w-8 text-primary mb-2" />
              <span className="font-medium">Duração</span>
              <span className="text-sm text-muted-foreground">Um dia</span>
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-lg bg-muted/30">
            <h3 className="font-semibold text-lg">O que esperar:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Partidas competitivas no servidor da comunidade
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Times balanceados para jogos equilibrados
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Estatísticas detalhadas de cada partida
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Premiação para os vencedores (a definir)
              </li>
            </ul>
          </div>

          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Quer participar? Clique abaixo para demonstrar interesse. 
              Avisaremos quando tivermos mais detalhes!
            </p>
            
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            ) : !isRegistered ? (
              <Button 
                size="lg" 
                onClick={handleRegister}
                className="text-lg px-8"
                disabled={registerMutation.isPending}
                data-testid="button-register-championship"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Trophy className="h-5 w-5 mr-2" />
                )}
                Quero Participar!
              </Button>
            ) : (
              <div className="space-y-2">
                <Badge variant="default" className="text-lg px-6 py-2">
                  Inscrição Recebida!
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Você será notificado quando o campeonato for confirmado.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Regras Preliminares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Formato do Campeonato</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Partidas 5v5 competitivas</li>
                <li>• Sistema de eliminação ou grupos (a definir)</li>
                <li>• MR12 (primeiro a 13 rounds)</li>
                <li>• Overtime se necessário</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Requisitos</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ser membro da comunidade</li>
                <li>• Ter SteamID64 cadastrado</li>
                <li>• Disponibilidade no dia do evento</li>
                <li>• Bom comportamento e fair play</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
