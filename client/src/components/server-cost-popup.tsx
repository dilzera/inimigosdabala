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
import { Heart, Copy, Check, Server, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ServerCostPopup() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const pixKey = "12982690148";

  useEffect(() => {
    // Show first with 1.5s delay
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      toast({
        title: "Chave PIX copiada!",
        description: "Cole no seu app de banco para fazer a transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Copie manualmente: " + pixKey,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-6 w-6 text-red-500" />
            Ajude a Manter Nossa Comunidade
          </DialogTitle>
          <DialogDescription>
            O Inimigos da Bala precisa da sua ajuda para continuar funcionando!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium text-primary">
              Qualquer valor ajuda! Pode ser R$ 1, R$ 5, R$ 10... o que você puder contribuir faz diferença para manter nossa comunidade ativa!
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Manter nossa comunidade online tem custos mensais. Se você curte jogar conosco, 
            considere ajudar com qualquer valor. Cada contribuição faz diferença!
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                <span className="font-medium">Servidor CS2 (Skins)</span>
              </div>
              <Badge variant="secondary" className="font-mono">
                R$ 79,90/mês
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <span className="font-medium">Site da Comunidade</span>
              </div>
              <Badge variant="secondary" className="font-mono">
                R$ 100,00/mês
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="font-semibold">Total Mensal</span>
              <Badge variant="default" className="font-mono text-base">
                R$ 179,90
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-center">Chave PIX (Celular)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 rounded-lg bg-muted text-center font-mono text-lg tracking-wider">
                {pixKey}
              </code>
              <Button
                onClick={copyPixKey}
                variant="outline"
                size="icon"
                className="h-12 w-12"
                data-testid="button-copy-pix"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-center font-medium text-green-600 dark:text-green-400">
              Não existe valor mínimo! R$ 1, R$ 2, R$ 5... toda ajuda conta!
            </p>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Obrigado por fazer parte da família Inimigos da Bala.
          </p>
        </div>
        
        <div className="flex justify-center">
          <Button onClick={handleClose} data-testid="button-close-cost-popup">
            Entendi, Obrigado!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
