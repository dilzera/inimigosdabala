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
import { User, Gamepad2, ArrowRight, CheckCircle, Link2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export function ProfileUpdatePopup() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const needsUpdate = !user.steamId64 || !user.nickname;
    
    if (needsUpdate) {
      // Show after all other popups (delayed by 26 seconds)
      const timer = setTimeout(() => setOpen(true), 26000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleGoToProfile = () => {
    handleClose();
    setLocation("/perfil");
  };

  const hasSteamId = !!user?.steamId64;
  const hasNickname = !!user?.nickname;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6 text-primary" />
            Atualize seu Perfil
          </DialogTitle>
          <DialogDescription>
            Precisamos de algumas informações para melhorar sua experiência
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium text-primary">
              Para facilitar a gestão de acessos e vincular suas estatísticas, 
              precisamos do seu SteamID64 e nickname do jogo!
            </p>
          </div>
          
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 rounded-lg ${hasSteamId ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">SteamID64</span>
                  <p className="text-xs text-muted-foreground">
                    Vincula suas partidas do servidor
                  </p>
                </div>
              </div>
              {hasSteamId ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Badge variant="destructive">Pendente</Badge>
              )}
            </div>
            
            <div className={`flex items-center justify-between p-3 rounded-lg ${hasNickname ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
              <div className="flex items-center gap-3">
                <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">Nickname do Jogo</span>
                  <p className="text-xs text-muted-foreground">
                    Nome que você usa no CS2
                  </p>
                </div>
              </div>
              {hasNickname ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Badge variant="destructive">Pendente</Badge>
              )}
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Essas informações ajudam os administradores a gerenciar os acessos 
            e garantem que suas estatísticas sejam corretamente vinculadas.
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleGoToProfile} 
            className="w-full"
            data-testid="button-go-to-profile-update"
          >
            <User className="h-4 w-4 mr-2" />
            Atualizar Perfil
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="w-full"
            data-testid="button-close-profile-update-popup"
          >
            Depois eu faço
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
