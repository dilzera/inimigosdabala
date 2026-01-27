import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Target, 
  TrendingUp, 
  Plus, 
  Trash2, 
  History,
  AlertTriangle,
  Trophy,
  Skull,
  Crosshair,
  Star,
  Flame
} from "lucide-react";
import type { User, Bet, BetItem } from "@shared/schema";

interface BetCondition {
  id: string;
  betType: string;
  targetValue: number;
  odds?: number;
}

const betTypeLabels: Record<string, string> = {
  'kills_over': 'Kills acima de',
  'kills_under': 'Kills abaixo de',
  'deaths_under': 'Mortes abaixo de',
  'kd_over': 'K/D acima de',
  'headshots_over': 'Headshots acima de',
  'mvps_over': 'MVPs no mínimo',
  'damage_over': 'Dano acima de',
  'win': 'Vitória na partida',
};

export default function Apostas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [betAmount, setBetAmount] = useState<number>(100);
  const [conditions, setConditions] = useState<BetCondition[]>([]);
  const [newConditionType, setNewConditionType] = useState<string>("kills_over");
  const [newConditionValue, setNewConditionValue] = useState<number>(15);

  const { data: balance } = useQuery<{ balance: number; totalWon: number; totalLost: number }>({
    queryKey: ["/api/casino/balance"],
    staleTime: 10000,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: userBets = [] } = useQuery<Array<Bet & { items: BetItem[]; targetPlayer: User | null }>>({
    queryKey: ["/api/casino/bets"],
  });

  const calculateOddsMutation = useMutation({
    mutationFn: async (data: { targetPlayerId: string; items: Array<{ betType: string; targetValue: number }> }) => {
      const response = await apiRequest("POST", "/api/casino/calculate-odds", data);
      return await response.json();
    },
  });

  const placeBetMutation = useMutation({
    mutationFn: async (data: { targetPlayerId: string; amount: number; items: Array<{ betType: string; targetValue: number }> }) => {
      const response = await apiRequest("POST", "/api/casino/bets", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Aposta Registrada!",
        description: "Sua aposta foi registrada com sucesso. Boa sorte!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/casino/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/casino/bets"] });
      setConditions([]);
      setSelectedPlayer("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Aposta",
        description: error.message || "Não foi possível registrar a aposta",
        variant: "destructive",
      });
    },
  });

  const otherPlayers = users.filter(u => u.id !== user?.id && u.totalMatches > 0);

  const addCondition = () => {
    if (newConditionType === 'win') {
      setConditions([...conditions, {
        id: crypto.randomUUID(),
        betType: newConditionType,
        targetValue: 1,
      }]);
    } else {
      setConditions([...conditions, {
        id: crypto.randomUUID(),
        betType: newConditionType,
        targetValue: newConditionValue,
      }]);
    }
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const handleCalculateOdds = () => {
    if (!selectedPlayer || conditions.length === 0) return;
    
    calculateOddsMutation.mutate({
      targetPlayerId: selectedPlayer,
      items: conditions.map(c => ({ betType: c.betType, targetValue: c.targetValue })),
    });
  };

  const handlePlaceBet = () => {
    if (!selectedPlayer || conditions.length === 0 || betAmount < 10) return;
    
    placeBetMutation.mutate({
      targetPlayerId: selectedPlayer,
      amount: betAmount,
      items: conditions.map(c => ({ betType: c.betType, targetValue: c.targetValue })),
    });
  };

  const selectedPlayerData = otherPlayers.find(p => p.id === selectedPlayer);
  const calculatedOdds = calculateOddsMutation.data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Apostas em Jogadores
          </h1>
          <p className="text-muted-foreground mt-1">
            Aposte em estatísticas de jogadores para a próxima partida
          </p>
        </div>
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Seu Saldo</p>
                <p className="text-xl font-bold font-mono">
                  R$ {(balance?.balance || 10000000).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="bg-amber-500/10 border-amber-500/30">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-amber-200">
          Este é um sistema de apostas <strong>fictício</strong> apenas para diversão. 
          Todos começam com R$10 milhões virtuais. Nenhum dinheiro real está envolvido!
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Nova Aposta
              </CardTitle>
              <CardDescription>
                Selecione um jogador e defina as condições da sua aposta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Jogador</Label>
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger data-testid="select-player">
                      <SelectValue placeholder="Selecione um jogador" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherPlayers.map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          <div className="flex items-center gap-2">
                            <span>{player.nickname || player.firstName || 'Jogador'}</span>
                            <Badge variant="outline" className="text-xs">
                              {player.totalMatches} partidas
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor da Aposta (mín. R$10)</Label>
                  <Input
                    type="number"
                    min={10}
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    data-testid="input-bet-amount"
                  />
                </div>
              </div>

              {selectedPlayerData && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Estatísticas de {selectedPlayerData.nickname || selectedPlayerData.firstName}:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Crosshair className="h-4 w-4 text-red-400" />
                      <span>Média Kills: {((selectedPlayerData.totalKills || 0) / Math.max(1, selectedPlayerData.totalMatches)).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span>K/D: {((selectedPlayerData.totalKills || 0) / Math.max(1, selectedPlayerData.totalDeaths || 1)).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skull className="h-4 w-4 text-yellow-400" />
                      <span>HS%: {(((selectedPlayerData.totalHeadshots || 0) / Math.max(1, selectedPlayerData.totalKills || 1)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-blue-400" />
                      <span>Win Rate: {(((selectedPlayerData.matchesWon || 0) / Math.max(1, selectedPlayerData.totalMatches)) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <Label>Adicionar Condição</Label>
                <div className="flex gap-3 flex-wrap">
                  <Select value={newConditionType} onValueChange={setNewConditionType}>
                    <SelectTrigger className="w-[200px]" data-testid="select-condition-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(betTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {newConditionType !== 'win' && (
                    <Input
                      type="number"
                      value={newConditionValue}
                      onChange={(e) => setNewConditionValue(Number(e.target.value))}
                      className="w-24"
                      step={newConditionType === 'kd_over' ? 0.1 : 1}
                      data-testid="input-condition-value"
                    />
                  )}
                  
                  <Button onClick={addCondition} variant="outline" data-testid="button-add-condition">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>

              {conditions.length > 0 && (
                <div className="space-y-2">
                  <Label>Condições da Aposta</Label>
                  <div className="space-y-2">
                    {conditions.map(condition => (
                      <div key={condition.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span>
                          {betTypeLabels[condition.betType]} {condition.betType !== 'win' && condition.targetValue}
                        </span>
                        <div className="flex items-center gap-2">
                          {calculatedOdds?.items?.find((i: any) => i.betType === condition.betType)?.odds && (
                            <Badge variant="secondary" className="font-mono">
                              {calculatedOdds.items.find((i: any) => i.betType === condition.betType).odds}x
                            </Badge>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeCondition(condition.id)}
                            data-testid={`button-remove-condition-${condition.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={handleCalculateOdds}
                  disabled={!selectedPlayer || conditions.length === 0 || calculateOddsMutation.isPending}
                  data-testid="button-calculate-odds"
                >
                  {calculateOddsMutation.isPending ? "Calculando..." : "Calcular Odds"}
                </Button>
                
                <Button 
                  onClick={handlePlaceBet}
                  disabled={!selectedPlayer || conditions.length === 0 || betAmount < 10 || placeBetMutation.isPending}
                  data-testid="button-place-bet"
                >
                  {placeBetMutation.isPending ? "Apostando..." : (
                    <>
                      <Flame className="h-4 w-4 mr-1" />
                      Fazer Aposta
                    </>
                  )}
                </Button>
              </div>

              {calculatedOdds && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Odds Totais</p>
                      <p className="text-2xl font-bold font-mono text-primary">{calculatedOdds.totalOdds}x</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Retorno Potencial</p>
                      <p className="text-2xl font-bold font-mono text-green-400">
                        R$ {(betAmount * calculatedOdds.totalOdds).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Minhas Apostas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userBets.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Você ainda não fez nenhuma aposta
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {userBets.slice(0, 10).map(bet => (
                    <div 
                      key={bet.id} 
                      className={`p-3 rounded-lg border ${
                        bet.status === 'won' ? 'bg-green-500/10 border-green-500/30' :
                        bet.status === 'lost' ? 'bg-red-500/10 border-red-500/30' :
                        'bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {bet.targetPlayer?.nickname || bet.targetPlayer?.firstName || 'Jogador'}
                        </span>
                        <Badge 
                          variant={bet.status === 'won' ? 'default' : bet.status === 'lost' ? 'destructive' : 'secondary'}
                        >
                          {bet.status === 'pending' ? 'Pendente' : bet.status === 'won' ? 'Ganhou!' : 'Perdeu'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Valor: R$ {bet.amount.toLocaleString('pt-BR')}</p>
                        <p>Odds: {bet.totalOdds.toFixed(2)}x</p>
                        {bet.status === 'won' && (
                          <p className="text-green-400 font-medium">
                            Ganhou: R$ {bet.potentialWin.toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 text-xs">
                        {bet.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            {item.won === true && <Star className="h-3 w-3 text-green-400" />}
                            {item.won === false && <Skull className="h-3 w-3 text-red-400" />}
                            <span>{betTypeLabels[item.betType]} {item.targetValue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <CardContent className="py-4">
              <div className="text-center space-y-2">
                <Trophy className="h-8 w-8 text-amber-400 mx-auto" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Ganho</p>
                  <p className="text-lg font-bold font-mono text-green-400">
                    R$ {(balance?.totalWon || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Total Perdido</p>
                  <p className="text-lg font-bold font-mono text-red-400">
                    R$ {(balance?.totalLost || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
