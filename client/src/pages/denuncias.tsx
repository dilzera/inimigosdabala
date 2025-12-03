import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertTriangle, Shield, CheckCircle, Send, EyeOff, Info, Upload, X, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function Denuncias() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attachment, setAttachment] = useState<{ data: string; type: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitMutation = useMutation({
    mutationFn: async (data: { 
      description: string; 
      isAnonymous: boolean;
      attachmentUrl?: string;
      attachmentType?: string;
    }) => {
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
      setAttachment(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo inválido",
        description: "Apenas imagens são permitidas (JPG, PNG, GIF).",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        data: reader.result as string,
        type: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
    
    const payload: { 
      description: string; 
      isAnonymous: boolean;
      attachmentUrl?: string;
      attachmentType?: string;
    } = { 
      description, 
      isAnonymous 
    };

    if (attachment) {
      payload.attachmentUrl = attachment.data;
      payload.attachmentType = attachment.type;
    }
    
    submitMutation.mutate(payload);
  };

  const handleNewReport = () => {
    setSubmitted(false);
    setDescription("");
    setIsAnonymous(false);
    setAttachment(null);
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

            <div className="space-y-3">
              <Label>Anexar Evidência (opcional)</Label>
              <div className="flex flex-col gap-3">
                {!attachment ? (
                  <div 
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover-elevate transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-area"
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para anexar uma imagem
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG ou GIF (máx. 2MB)
                    </p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-file"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 flex items-center gap-3 bg-muted/30">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                      <img 
                        src={attachment.data} 
                        alt="Anexo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <ImageIcon className="h-3 w-3 inline mr-1" />
                        Imagem anexada
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeAttachment}
                      data-testid="button-remove-attachment"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
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

            <div className="flex items-center justify-between pt-4 border-t gap-4 flex-wrap">
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
