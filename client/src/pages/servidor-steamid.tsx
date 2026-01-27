import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, ExternalLink, Copy, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ServidorSteamId() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const passos = [
    {
      titulo: "Acesse o site SteamDB Calculator",
      descricao: "Vá para steamdb.info/calculator/ para converter seu perfil",
      link: "https://steamdb.info/calculator/",
    },
    {
      titulo: "Cole o link do seu perfil",
      descricao: "Copie o link do seu perfil Steam e cole no campo de busca",
    },
    {
      titulo: "Clique em buscar",
      descricao: "O site vai converter e mostrar seu SteamID64",
    },
    {
      titulo: "Copie o SteamID64",
      descricao: "O SteamID64 é um número com 17 dígitos mostrado nos resultados",
    },
  ];

  const porqueImportante = [
    {
      titulo: "Sistema de Skins",
      descricao: "O SteamID64 é usado para salvar suas preferências de skins no servidor",
    },
    {
      titulo: "Registro de Estatísticas",
      descricao: "Suas estatísticas de partidas são vinculadas ao seu SteamID64",
    },
    {
      titulo: "Lista VIP",
      descricao: "Para ser adicionado como VIP, precisamos do seu SteamID64",
    },
    {
      titulo: "Whitelist",
      descricao: "Servidores privados usam SteamID64 para controle de acesso",
    },
  ];

  const formatosId = [
    {
      formato: "SteamID",
      exemplo: "STEAM_0:1:12345678",
      descricao: "Formato antigo, usado em alguns servidores",
    },
    {
      formato: "SteamID3",
      exemplo: "[U:1:24691357]",
      descricao: "Formato intermediário",
    },
    {
      formato: "SteamID64",
      exemplo: "76561198012345678",
      descricao: "Formato numérico de 17 dígitos - o mais usado atualmente",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Key className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Como conseguir meu SteamID64?</h1>
      </div>

      <p className="text-muted-foreground">
        O SteamID64 é um identificador único da sua conta Steam. Veja como encontrar
        o seu e entenda por que ele é importante.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Passo a Passo para encontrar seu SteamID64</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {passos.map((passo, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{passo.titulo}</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {passo.descricao}
                  </div>
                  {passo.link && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(passo.link!)}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 mr-1 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copiar link
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        asChild
                      >
                        <a href={passo.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Abrir site
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Por que preciso do SteamID64?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {porqueImportante.map((item, index) => (
              <div key={index} className="p-3 bg-background/50 rounded-lg border">
                <div className="font-medium">{item.titulo}</div>
                <div className="text-sm text-muted-foreground">
                  {item.descricao}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formatos de Steam ID</CardTitle>
            <CardDescription>
              Existem diferentes formatos de ID Steam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formatosId.map((item, index) => (
              <div key={index} className="p-3 bg-background/50 rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{item.formato}</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {item.exemplo}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.descricao}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <Key className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-bold mb-2">Precisa de ajuda?</h3>
            <p className="text-muted-foreground mb-4">
              Se tiver dificuldades para encontrar seu SteamID64, entre em contato
              com um administrador pelo Discord ou WhatsApp.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
