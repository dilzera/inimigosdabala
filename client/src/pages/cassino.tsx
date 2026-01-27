import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Box, 
  Sparkles,
  AlertTriangle,
  Play,
  Zap,
  Crown,
  Star,
  Trophy,
  Gem,
  Skull
} from "lucide-react";
import type { CasinoTransaction } from "@shared/schema";

interface SlotResult {
  won: boolean;
  multiplier: number;
  betAmount: number;
  winnings: number;
  newBalance: number;
  symbols: string[][];
}

interface CaseResult {
  item: {
    name: string;
    rarity: string;
    value: number;
    multiplier: number;
    weapon: string;
    skin: string;
  };
  casePrice: number;
  profit: number;
  newBalance: number;
}

const rarityColors: Record<string, string> = {
  'Consumidor': 'bg-gray-500/20 text-gray-300 border-gray-500/50',
  'Industrial': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  'Militar': 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  'Restrito': 'bg-pink-500/20 text-pink-300 border-pink-500/50',
  'Secreto': 'bg-red-500/20 text-red-300 border-red-500/50',
  'Faca/Luva': 'bg-amber-500/20 text-amber-300 border-amber-500/50',
};

export default function Cassino() {
  const { toast } = useToast();
  const [slotBet, setSlotBet] = useState<number>(100);
  const [selectedCase, setSelectedCase] = useState<string>("basic");
  const [slotResult, setSlotResult] = useState<SlotResult | null>(null);
  const [caseResult, setCaseResult] = useState<CaseResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const { data: balance, refetch: refetchBalance } = useQuery<{ balance: number; totalWon: number; totalLost: number }>({
    queryKey: ["/api/casino/balance"],
    staleTime: 5000,
  });

  const { data: transactions = [] } = useQuery<CasinoTransaction[]>({
    queryKey: ["/api/casino/transactions"],
  });

  const slotMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/casino/slot", { amount });
      return await response.json();
    },
    onSuccess: (data: SlotResult) => {
      setSlotResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/casino/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/casino/transactions"] });
      
      if (data.won) {
        toast({
          title: "VOCÊ GANHOU!",
          description: `${data.multiplier}x - R$ ${data.winnings.toLocaleString('pt-BR')}!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const caseMutation = useMutation({
    mutationFn: async (caseType: string) => {
      const response = await apiRequest("POST", "/api/casino/case", { caseType });
      return await response.json();
    },
    onSuccess: (data: CaseResult) => {
      setCaseResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/casino/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/casino/transactions"] });
      
      toast({
        title: data.item.rarity === 'Faca/Luva' || data.item.rarity === 'Secreto' ? "ITEM RARO!" : "Item Obtido",
        description: `${data.item.name} (${data.item.rarity})`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSpin = async () => {
    if (slotBet < 10) return;
    setIsSpinning(true);
    setSlotResult(null);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    await slotMutation.mutateAsync(slotBet);
    setIsSpinning(false);
  };

  const handleOpenCase = async () => {
    setIsOpening(true);
    setCaseResult(null);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await caseMutation.mutateAsync(selectedCase);
    setIsOpening(false);
  };

  const cases = [
    { id: 'basic', name: 'Caixa Básica', price: 5000, color: 'from-blue-500/20 to-blue-600/20' },
    { id: 'premium', name: 'Caixa Premium', price: 25000, color: 'from-purple-500/20 to-purple-600/20' },
    { id: 'elite', name: 'Caixa Elite', price: 100000, color: 'from-pink-500/20 to-pink-600/20' },
    { id: 'legendary', name: 'Caixa Lendária', price: 500000, color: 'from-amber-500/20 to-amber-600/20' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Cassino
          </h1>
          <p className="text-muted-foreground mt-1">
            Teste sua sorte com caixas e slots
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
          Este é um sistema de cassino <strong>fictício</strong> apenas para diversão. 
          Todos começam com R$10 milhões virtuais. Nenhum dinheiro real está envolvido!
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="cases" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cases" className="flex items-center gap-2" data-testid="tab-cases">
            <Box className="h-4 w-4" />
            Abertura de Caixas
          </TabsTrigger>
          <TabsTrigger value="slots" className="flex items-center gap-2" data-testid="tab-slots">
            <Zap className="h-4 w-4" />
            Tigrinho
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cases.map(caseItem => (
              <Card 
                key={caseItem.id}
                className={`cursor-pointer transition-all ${
                  selectedCase === caseItem.id 
                    ? 'ring-2 ring-primary' 
                    : 'hover-elevate'
                } bg-gradient-to-br ${caseItem.color}`}
                onClick={() => setSelectedCase(caseItem.id)}
                data-testid={`case-${caseItem.id}`}
              >
                <CardContent className="p-4 text-center">
                  <Box className={`h-12 w-12 mx-auto mb-3 ${
                    caseItem.id === 'legendary' ? 'text-amber-400' :
                    caseItem.id === 'elite' ? 'text-pink-400' :
                    caseItem.id === 'premium' ? 'text-purple-400' :
                    'text-blue-400'
                  }`} />
                  <h3 className="font-bold">{caseItem.name}</h3>
                  <p className="text-lg font-mono font-bold mt-2">
                    R$ {caseItem.price.toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Abrir {cases.find(c => c.id === selectedCase)?.name}
              </CardTitle>
              <CardDescription>
                Clique para abrir uma caixa e descobrir seu item
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                {isOpening && (
                  <div className="w-full h-32 flex items-center justify-center">
                    <div className="flex gap-2">
                      {[0, 1, 2].map(i => (
                        <div 
                          key={i}
                          className="w-20 h-20 bg-muted rounded-lg animate-pulse flex items-center justify-center"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        >
                          <Gem className="h-8 w-8 text-muted-foreground animate-spin" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {caseResult && !isOpening && (
                  <div className={`p-6 rounded-lg border-2 text-center ${rarityColors[caseResult.item.rarity]}`}>
                    <Gem className={`h-16 w-16 mx-auto mb-4 ${
                      caseResult.item.rarity === 'Faca/Luva' ? 'text-amber-400 animate-pulse' :
                      caseResult.item.rarity === 'Secreto' ? 'text-red-400 animate-pulse' :
                      ''
                    }`} />
                    <h3 className="text-xl font-bold">{caseResult.item.name}</h3>
                    <Badge className={`mt-2 ${rarityColors[caseResult.item.rarity]}`}>
                      {caseResult.item.rarity}
                    </Badge>
                    <p className="text-2xl font-mono font-bold mt-3">
                      R$ {caseResult.item.value.toLocaleString('pt-BR')}
                    </p>
                    <p className={`text-sm mt-2 ${caseResult.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {caseResult.profit >= 0 ? '+' : ''}{caseResult.profit.toLocaleString('pt-BR')} lucro
                    </p>
                  </div>
                )}

                <Button 
                  size="lg"
                  onClick={handleOpenCase}
                  disabled={isOpening || caseMutation.isPending}
                  className="px-8"
                  data-testid="button-open-case"
                >
                  {isOpening ? (
                    <>
                      <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                      Abrindo...
                    </>
                  ) : (
                    <>
                      <Box className="h-5 w-5 mr-2" />
                      Abrir Caixa - R$ {cases.find(c => c.id === selectedCase)?.price.toLocaleString('pt-BR')}
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
                {Object.entries(rarityColors).map(([rarity, classes]) => (
                  <div key={rarity} className={`p-2 rounded text-center ${classes} border`}>
                    <p className="font-medium">{rarity}</p>
                    <p className="text-xs opacity-70">
                      {rarity === 'Consumidor' ? '60%' :
                       rarity === 'Industrial' ? '25%' :
                       rarity === 'Militar' ? '10%' :
                       rarity === 'Restrito' ? '4%' :
                       rarity === 'Secreto' ? '0.8%' : '0.2%'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slots" className="space-y-6">
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                <span className="text-4xl">🐯</span>
                Tigrinho da Sorte
                <span className="text-4xl">🐯</span>
              </CardTitle>
              <CardDescription>
                Taxa de vitória: 10% | Multiplicadores: 2x a 50x
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-6">
                <div className="grid grid-cols-3 gap-2 p-4 bg-black/50 rounded-xl border-4 border-amber-500/50">
                  {(slotResult?.symbols || [
                    ['❓', '❓', '❓'],
                    ['❓', '❓', '❓'],
                    ['❓', '❓', '❓'],
                  ]).map((row, rowIdx) => (
                    <div key={rowIdx} className="flex flex-col gap-2">
                      {row.map((symbol, colIdx) => (
                        <div 
                          key={`${rowIdx}-${colIdx}`}
                          className={`w-16 h-16 flex items-center justify-center text-3xl bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-amber-500/30 ${
                            isSpinning ? 'animate-pulse' : ''
                          }`}
                        >
                          {isSpinning ? '🎰' : symbol}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {slotResult && !isSpinning && (
                  <div className={`text-center p-4 rounded-lg ${
                    slotResult.won 
                      ? 'bg-green-500/20 border border-green-500/50' 
                      : 'bg-red-500/20 border border-red-500/50'
                  }`}>
                    {slotResult.won ? (
                      <>
                        <Crown className="h-10 w-10 text-amber-400 mx-auto mb-2 animate-bounce" />
                        <p className="text-2xl font-bold text-green-400">VOCÊ GANHOU!</p>
                        <p className="text-3xl font-mono font-bold text-amber-400 mt-2">
                          {slotResult.multiplier}x
                        </p>
                        <p className="text-xl font-mono mt-1">
                          R$ {slotResult.winnings.toLocaleString('pt-BR')}
                        </p>
                      </>
                    ) : (
                      <>
                        <Skull className="h-10 w-10 text-red-400 mx-auto mb-2" />
                        <p className="text-xl font-bold text-red-400">Não foi dessa vez...</p>
                        <p className="text-muted-foreground mt-1">
                          Perdeu R$ {slotResult.betAmount.toLocaleString('pt-BR')}
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slot-bet">Valor da Aposta</Label>
                    <Input
                      id="slot-bet"
                      type="number"
                      min={10}
                      value={slotBet}
                      onChange={(e) => setSlotBet(Number(e.target.value))}
                      className="w-40 text-center font-mono"
                      data-testid="input-slot-bet"
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                    {[100, 1000, 10000, 100000].map(amount => (
                      <Button 
                        key={amount}
                        variant="outline" 
                        size="sm"
                        onClick={() => setSlotBet(amount)}
                        data-testid={`button-quick-bet-${amount}`}
                      >
                        {amount >= 1000 ? `${amount / 1000}k` : amount}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  size="lg"
                  onClick={handleSpin}
                  disabled={isSpinning || slotMutation.isPending || slotBet < 10}
                  className="px-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  data-testid="button-spin"
                >
                  {isSpinning ? (
                    <>
                      <Zap className="h-5 w-5 mr-2 animate-spin" />
                      Girando...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      GIRAR - R$ {slotBet.toLocaleString('pt-BR')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Histórico Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma transação ainda
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {transactions.slice(0, 20).map(tx => (
                <div 
                  key={tx.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {tx.type === 'slot_win' && <Crown className="h-5 w-5 text-amber-400" />}
                    {tx.type === 'slot_loss' && <Skull className="h-5 w-5 text-red-400" />}
                    {tx.type === 'case_opening' && <Box className="h-5 w-5 text-purple-400" />}
                    {tx.type === 'bet' && <Trophy className="h-5 w-5 text-blue-400" />}
                    {tx.type === 'bet_win' && <Trophy className="h-5 w-5 text-green-400" />}
                    <span className="text-sm">{tx.description}</span>
                  </div>
                  <span className={`font-mono font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}R$ {tx.amount.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
