import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Check, ArrowRight } from "lucide-react";

export default function ServidorSkins() {
  const passos = [
    {
      titulo: "Acesse o servidor",
      descricao: "Entre no servidor e aguarde carregar completamente",
    },
    {
      titulo: "Abra o menu de skins",
      descricao: "Digite !ws no chat para abrir o menu de skins de armas",
    },
    {
      titulo: "Escolha a arma",
      descricao: "Selecione a categoria e a arma que deseja personalizar",
    },
    {
      titulo: "Selecione a skin",
      descricao: "Navegue pelas skins disponíveis e escolha a que mais gosta",
    },
    {
      titulo: "Aplique a skin",
      descricao: "Confirme a seleção e a skin será aplicada automaticamente",
    },
  ];

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
    "Algumas skins raras estão disponíveis apenas para jogadores VIP",
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
          <CardTitle>Passo a Passo</CardTitle>
          <CardDescription>
            Siga estes passos para aplicar suas skins favoritas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {passos.map((passo, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{passo.titulo}</div>
                  <div className="text-sm text-muted-foreground">
                    {passo.descricao}
                  </div>
                </div>
                {index < passos.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comandos Disponíveis</CardTitle>
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
