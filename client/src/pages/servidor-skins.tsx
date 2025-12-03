import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Palette, Check, ExternalLink, Play } from "lucide-react";
import tutorialVideo from "@assets/2025-11-14_13-30-54_1764764550063.mp4";

export default function ServidorSkins() {
  const comandosExtras = [
    {
      comando: "!ws",
      descricao: "Abre o menu de skins de armas",
    },
    {
      comando: "!knife",
      descricao: "Abre o menu de facas",
    },
    {
      comando: "!gloves",
      descricao: "Abre o menu de luvas",
    },
    {
      comando: "!agents",
      descricao: "Abre o menu de agentes (personagens)",
    },
    {
      comando: "!stickers",
      descricao: "Abre o menu de adesivos",
    },
    {
      comando: "!music",
      descricao: "Abre o menu de kits de música",
    },
  ];

  const dicas = [
    "As skins são apenas visuais e não afetam o gameplay",
    "Suas escolhas de skins são salvas automaticamente",
    "Você pode mudar as skins a qualquer momento durante o warmup",
    "Configure suas skins no site antes de entrar no servidor",
    "As luvas e facas são aplicadas para todas as armas",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Palette className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Como Colocar as Skins</h1>
      </div>

      <p className="text-muted-foreground">
        Aprenda a usar o sistema de skins do servidor para personalizar suas armas,
        facas, luvas e muito mais!
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Configurar Skins
          </CardTitle>
          <CardDescription>
            Acesse o site abaixo para configurar suas skins antes de entrar no servidor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            size="lg"
            className="w-full md:w-auto"
            onClick={() => window.open("https://inventory.cstrike.app", "_blank")}
            data-testid="button-inventory-link"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Acessar Inventory CS Strike
          </Button>
          <p className="text-sm text-muted-foreground">
            Configure suas skins, facas, luvas e agentes no site. As configurações serão aplicadas automaticamente quando você entrar no servidor.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Tutorial em Vídeo
          </CardTitle>
          <CardDescription>
            Assista o passo a passo de como configurar suas skins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden bg-black">
            <video
              controls
              className="w-full max-h-[500px]"
              data-testid="video-tutorial"
            >
              <source src={tutorialVideo} type="video/mp4" />
              Seu navegador não suporta vídeos.
            </video>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comandos no Servidor</CardTitle>
            <CardDescription>
              Use estes comandos no chat do jogo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {comandosExtras.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border"
              >
                <Badge variant="secondary" className="font-mono">
                  {item.comando}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {item.descricao}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dicas Importantes</CardTitle>
            <CardDescription>
              Informações úteis sobre o sistema de skins
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dicas.map((dica, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border"
              >
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{dica}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
