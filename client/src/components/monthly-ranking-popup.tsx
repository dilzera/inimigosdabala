import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export function MonthlyRankingPopup() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Show after server cost popup closes (delayed by 8 seconds)
    const timer = setTimeout(() => setOpen(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleGoToRanking = () => {
    handleClose();
    setLocation("/ranking-mensal");
  };

  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-primary" />
            Ranking Mensal
          </DialogTitle>
          <DialogDescription>
            Confira quem está dominando neste mês!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center">
            <Badge variant="default" className="text-lg px-4 py-1 mb-4 capitalize">
              {currentMonth}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            O ranking mensal mostra o desempenho dos jogadores apenas no mês atual. 
            Todos os dados são zerados automaticamente quando o mês vira!
          </p>
          
          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
              <Trophy className="h-6 w-6 text-yellow-500 mb-1" />
              <span className="text-xs font-medium">Top K/D</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
              <TrendingUp className="h-6 w-6 text-green-500 mb-1" />
              <span className="text-xs font-medium">Win Rate</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
              <Calendar className="h-6 w-6 text-primary mb-1" />
              <span className="text-xs font-medium">Atualizado</span>
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Veja sua posição e compare com os outros jogadores da comunidade.
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleGoToRanking} 
            className="w-full"
            data-testid="button-go-to-monthly-ranking"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Ver Ranking Mensal
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="w-full"
            data-testid="button-close-monthly-ranking-popup"
          >
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
