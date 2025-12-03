import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ServidorMapas() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const mapas = [
    {
      categoria: "Mapas de Aim",
      items: [
        {
          nome: "aim_botz",
          descricao: "O melhor mapa para treinar aim contra bots",
          workshopId: "243702660",
        },
        {
          nome: "Fast Aim / Reflex Training",
          descricao: "Treino de reflexo e aim rápido",
          workshopId: "647772108",
        },
        {
          nome: "Aim Training - CSGOHUB",
          descricao: "Treino de aim com diferentes modos",
          workshopId: "2458827562",
        },
      ],
    },
    {
      categoria: "Mapas de Prefire",
      items: [
        {
          nome: "Prefire Mirage",
          descricao: "Treino de prefire no Mirage",
          workshopId: "1222094548",
        },
        {
          nome: "Prefire Dust2",
          descricao: "Treino de prefire no Dust2",
          workshopId: "1222095566",
        },
        {
          nome: "Prefire Inferno",
          descricao: "Treino de prefire no Inferno",
          workshopId: "1222094786",
        },
        {
          nome: "Prefire Ancient",
          descricao: "Treino de prefire no Ancient",
          workshopId: "2492892770",
        },
      ],
    },
    {
      categoria: "Mapas de Grenades",
      items: [
        {
          nome: "Yprac Mirage",
          descricao: "Treino de granadas e utilitárias no Mirage",
          workshopId: "1222094548",
        },
        {
          nome: "Yprac Dust2",
          descricao: "Treino de granadas e utilitárias no Dust2",
          workshopId: "1222095566",
        },
        {
          nome: "Yprac Inferno",
          descricao: "Treino de granadas e utilitárias no Inferno",
          workshopId: "1222094786",
        },
        {
          nome: "Yprac Nuke",
          descricao: "Treino de granadas e utilitárias no Nuke",
          workshopId: "1222095009",
        },
      ],
    },
    {
      categoria: "Mapas de Deathmatch",
      items: [
        {
          nome: "FFA DM Multi-CFG",
          descricao: "Arena de deathmatch com múltiplas configurações",
          workshopId: "1368013039",
        },
        {
          nome: "Aim Map",
          descricao: "Mapa clássico de aim 1v1",
          workshopId: "149089768",
        },
      ],
    },
  ];

  const getWorkshopUrl = (workshopId: string) =>
    `https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopId}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Map className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Mapas de Treino</h1>
      </div>

      <p className="text-muted-foreground">
        Mapas recomendados da Workshop do Steam para melhorar suas habilidades.
        Clique para copiar o link ou abrir diretamente na Steam.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {mapas.map((categoria) => (
          <Card key={categoria.categoria}>
            <CardHeader>
              <CardTitle>{categoria.categoria}</CardTitle>
              <CardDescription>
                {categoria.items.length} mapas disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoria.items.map((item, index) => {
                const id = `${categoria.categoria}-${index}`;
                const url = getWorkshopUrl(item.workshopId);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-4 bg-background/50 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.descricao}
                      </div>
                      <Badge variant="outline" className="mt-2 font-mono text-xs">
                        ID: {item.workshopId}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(url, id)}
                      >
                        {copiedId === id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        asChild
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
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
