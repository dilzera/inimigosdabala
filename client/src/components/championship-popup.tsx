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
import { Trophy, Users, Calendar, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export function ChampionshipPopup() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleGoToRegistration = () => {
    handleClose();
    setLocation("/campeonato");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Campeonato Inimigos da Bala
          </DialogTitle>
          <DialogDescription>
            O primeiro campeonato oficial da comunidade está chegando!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center">
            <Badge variant="secondary" className="text-lg px-4 py-1 mb-4">
              Em Preparação
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Estamos preparando o primeiro campeonato competitivo 5v5 da comunidade. 
            Demonstre seu interesse e seja notificado quando tivermos mais detalhes!
          </p>
          
          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
              <Users className="h-6 w-6 text-primary mb-1" />
              <span className="text-xs font-medium">5v5</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
              <Calendar className="h-6 w-6 text-primary mb-1" />
              <span className="text-xs font-medium">Em breve</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
              <Trophy className="h-6 w-6 text-yellow-500 mb-1" />
              <span className="text-xs font-medium">Prêmios</span>
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Garanta sua vaga! As inscrições estão abertas.
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleGoToRegistration} 
            className="w-full"
            data-testid="button-go-to-championship"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Quero Participar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="w-full"
            data-testid="button-close-championship-popup"
          >
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
