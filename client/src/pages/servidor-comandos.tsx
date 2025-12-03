import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ServidorComandos() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copiado!",
      description: "Comando copiado para a área de transferência",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const comandos = [
    {
      categoria: "Administração",
      items: [
        { comando: "!admin", descricao: "Abre o menu de administração" },
        { comando: "!map <mapa>", descricao: "Muda o mapa do servidor" },
        { comando: "!kick <jogador>", descricao: "Expulsa um jogador" },
        { comando: "!ban <jogador> <tempo>", descricao: "Bane um jogador por tempo determinado" },
      ],
    },
    {
      categoria: "Partida",
      items: [
        { comando: "!ready / !r", descricao: "Marca como pronto para começar" },
        { comando: "!unready", descricao: "Desmarca como pronto" },
        { comando: "!pause", descricao: "Pausa a partida (precisa de votação)" },
        { comando: "!unpause", descricao: "Retoma a partida pausada" },
        { comando: "!stop", descricao: "Para a partida atual" },
        { comando: "!restart", descricao: "Reinicia o round" },
      ],
    },
    {
      categoria: "Prática",
      items: [
        { comando: "!pratica", descricao: "Ativa modo de prática" },
        { comando: ".noclip", descricao: "Ativa/desativa noclip" },
        { comando: ".god", descricao: "Ativa/desativa modo deus" },
        { comando: ".flash", descricao: "Dá uma flashbang" },
        { comando: ".smoke", descricao: "Dá uma smoke" },
        { comando: ".he", descricao: "Dá uma granada HE" },
        { comando: ".molotov", descricao: "Dá um molotov" },
        { comando: ".decoy", descricao: "Dá um decoy" },
        { comando: ".clear", descricao: "Limpa todas as granadas" },
        { comando: ".bot", descricao: "Adiciona um bot" },
        { comando: ".nobot", descricao: "Remove os bots" },
        { comando: ".rethrow", descricao: "Joga a última granada novamente" },
      ],
    },
    {
      categoria: "Outros",
      items: [
        { comando: "!ws", descricao: "Abre o menu de skins" },
        { comando: "!gloves", descricao: "Abre o menu de luvas" },
        { comando: "!knife", descricao: "Abre o menu de facas" },
        { comando: "!agents", descricao: "Abre o menu de agentes" },
        { comando: "!rank", descricao: "Mostra seu rank no servidor" },
        { comando: "!top", descricao: "Mostra o top 10 jogadores" },
        { comando: "!stats", descricao: "Mostra suas estatísticas" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Terminal className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Comandos do Servidor</h1>
      </div>

      <p className="text-muted-foreground">
        Lista de comandos disponíveis no servidor. Clique em um comando para copiar.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {comandos.map((categoria) => (
          <Card key={categoria.categoria}>
            <CardHeader>
              <CardTitle>{categoria.categoria}</CardTitle>
              <CardDescription>
                {categoria.items.length} comandos disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoria.items.map((item, index) => {
                const id = `${categoria.categoria}-${index}`;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg border hover-elevate cursor-pointer"
                    onClick={() => copyToClipboard(item.comando, id)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-mono">
                        {item.comando}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.descricao}
                      </span>
                    </div>
                    <Button size="icon" variant="ghost">
                      {copiedId === id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
