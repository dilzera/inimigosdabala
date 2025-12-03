import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertTriangle, Shield, CheckCircle, Send, EyeOff, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Denuncias() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data: { description: string; isAnonymous: boolean }) => {
      const response = await apiRequest("POST", "/api/reports", data);
      const result = await response.json();
      
      if (!response.ok) {
        throw result;
      }
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Denúncia Enviada",
        description: "Sua denúncia foi registrada e será analisada pela administração.",
      });
      setDescription("");
      setIsAnonymous(false);
      setSubmitted(true);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar denúncia.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: "Erro",
        description: "A descrição é obrigatória.",
        variant: "destructive",
      });
      return;
    }
    
    if (description.length < 10) {
      toast({
        title: "Erro",
        description: "A descrição deve ter pelo menos 10 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate({ description, isAnonymous });
  };

  const handleNewReport = () => {
    setSubmitted(false);
    setDescription("");
    setIsAnonymous(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Faça Login</h2>
          <p className="text-muted-foreground">
            Você precisa estar logado para enviar uma denúncia.
          </p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Denúncia Enviada!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Sua denúncia foi registrada com sucesso. Nossa equipe de administração irá analisar 
                o caso e tomar as medidas necessárias.
              </p>
            </div>
            <Button onClick={handleNewReport} variant="outline" data-testid="button-new-report">
              Enviar Nova Denúncia
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          Denúncias
        </h1>
        <p className="text-muted-foreground mt-2">
          Relate comportamentos inadequados, problemas ou sugestões para a comunidade
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Sobre as Denúncias</AlertTitle>
        <AlertDescription>
          Todas as denúncias são revisadas pela administração. Você pode optar por enviar anonimamente.
          Comportamentos inadequados incluem: cheats, linguagem ofensiva, toxicidade, etc.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Nova Denúncia
          </CardTitle>
          <CardDescription>
            Descreva detalhadamente o que aconteceu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">
                Descrição do Problema
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva o que aconteceu, inclua detalhes como data/hora, nome do jogador envolvido, etc..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[180px]"
                maxLength={2000}
                data-testid="textarea-description"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mínimo 10 caracteres</span>
                <span>{description.length}/2000</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                data-testid="checkbox-anonymous"
              />
              <div className="space-y-1">
                <Label htmlFor="anonymous" className="flex items-center gap-2 cursor-pointer">
                  <EyeOff className="h-4 w-4" />
                  Enviar Anonimamente
                </Label>
                <p className="text-xs text-muted-foreground">
                  Sua identidade não será revelada para a administração
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {isAnonymous ? (
                  <span className="flex items-center gap-1 text-yellow-500">
                    <EyeOff className="h-4 w-4" />
                    Denúncia anônima
                  </span>
                ) : (
                  <span>
                    Identificado como: <strong>{user.firstName || user.email || 'Usuário'}</strong>
                  </span>
                )}
              </p>
              
              <Button 
                type="submit" 
                disabled={submitMutation.isPending || description.length < 10}
                data-testid="button-submit-report"
              >
                {submitMutation.isPending ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Denúncia
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              O que pode ser denunciado?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Uso de cheats ou hacks durante partidas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Comportamento tóxico ou linguagem ofensiva</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Trolling ou sabotagem proposital de partidas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Problemas técnicos recorrentes no servidor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Sugestões de melhoria para a comunidade</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
