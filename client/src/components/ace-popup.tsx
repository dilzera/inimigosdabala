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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Star, Trophy } from "lucide-react";
import type { User } from "@shared/schema";
import Confetti from "@/components/confetti";

export function AcePopup() {
  const [open, setOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const latestAcePlayer = users
    .filter(u => (u.total5ks || 0) > 0)
    .sort((a, b) => (b.total5ks || 0) - (a.total5ks || 0))[0];

  useEffect(() => {
    if (!latestAcePlayer) return;
    
    const timer = setTimeout(() => {
      setOpen(true);
      setShowConfetti(true);
    }, 4500);
    return () => clearTimeout(timer);
  }, [latestAcePlayer]);

  const handleClose = () => {
    setOpen(false);
    setShowConfetti(false);
  };

  if (!latestAcePlayer) return null;

  const playerName = latestAcePlayer.nickname || latestAcePlayer.firstName || "Jogador";
  const aceCount = latestAcePlayer.total5ks || 0;

  return (
    <>
      {showConfetti && <Confetti />}
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
              <Sparkles className="h-7 w-7 text-yellow-500" />
              ACE! 5K!
              <Sparkles className="h-7 w-7 text-yellow-500" />
            </DialogTitle>
            <DialogDescription className="text-center">
              Temos um jogador destruidor na comunidade!
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-yellow-500">
                <AvatarImage src={latestAcePlayer.profileImageUrl || undefined} />
                <AvatarFallback className="bg-yellow-500/20 text-yellow-600 text-2xl font-bold">
                  {playerName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-2">
                <Trophy className="h-5 w-5 text-white" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-primary">{playerName}</h3>
              <p className="text-muted-foreground">
                conseguiu {aceCount === 1 ? "um" : aceCount} ACE{aceCount > 1 ? "s" : ""}!
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-8 w-8 fill-yellow-500 text-yellow-500" />
              ))}
            </div>
            
            <Badge variant="default" className="text-lg px-4 py-2">
              {aceCount} ACE{aceCount > 1 ? "s" : ""} no Total
            </Badge>
            
            <p className="text-center text-sm text-muted-foreground max-w-xs">
              Parabéns pela jogada incrível! 5 abates em um único round é coisa de profissional!
            </p>
          </div>
          
          <div className="flex justify-center">
            <Button onClick={handleClose} data-testid="button-close-ace-popup">
              Impressionante!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
