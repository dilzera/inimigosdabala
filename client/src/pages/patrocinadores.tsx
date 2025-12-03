import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Crown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Patrocinadores() {
  const patrocinadores = [
    {
      nivel: "Diamante",
      icon: Crown,
      cor: "text-blue-400",
      bgCor: "bg-blue-500/10",
      borderCor: "border-blue-500/30",
      lista: [
        {
          nome: "Seu nome aqui",
          descricao: "Seja um patrocinador Diamante",
          link: "#",
        },
      ],
    },
    {
      nivel: "Ouro",
      icon: Star,
      cor: "text-yellow-400",
      bgCor: "bg-yellow-500/10",
      borderCor: "border-yellow-500/30",
      lista: [
        {
          nome: "Seu nome aqui",
          descricao: "Seja um patrocinador Ouro",
          link: "#",
        },
      ],
    },
    {
      nivel: "Prata",
      icon: Heart,
      cor: "text-gray-400",
      bgCor: "bg-gray-500/10",
      borderCor: "border-gray-500/30",
      lista: [
        {
          nome: "Seu nome aqui",
          descricao: "Seja um patrocinador Prata",
          link: "#",
        },
      ],
    },
  ];

  const beneficios = [
    {
      nivel: "Diamante",
      items: [
        "Logo em destaque no site",
        "Menção especial no Discord",
        "VIP permanente no servidor",
        "Agradecimento ao vivo nas streams",
        "Acesso antecipado a novidades",
      ],
    },
    {
      nivel: "Ouro",
      items: [
        "Logo no site",
        "Menção no Discord",
        "VIP no servidor por 6 meses",
        "Agradecimento nas redes sociais",
      ],
    },
    {
      nivel: "Prata",
      items: [
        "Nome listado no site",
        "VIP no servidor por 3 meses",
        "Badge especial no Discord",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Patrocinadores</h1>
      </div>

      <p className="text-muted-foreground">
        Agradecemos a todos os patrocinadores que ajudam a manter a comunidade
        Inimigos da Bala ativa e funcionando!
      </p>

      <div className="grid gap-6">
        {patrocinadores.map((categoria) => (
          <Card key={categoria.nivel} className={`${categoria.borderCor} border-2`}>
            <CardHeader className={categoria.bgCor}>
              <CardTitle className="flex items-center gap-3">
                <categoria.icon className={`h-6 w-6 ${categoria.cor}`} />
                <span>Patrocinadores {categoria.nivel}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {categoria.lista.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoria.lista.map((patrocinador, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-background/50 rounded-lg border"
                    >
                      <div>
                        <div className="font-medium">{patrocinador.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          {patrocinador.descricao}
                        </div>
                      </div>
                      {patrocinador.link !== "#" && (
                        <Button size="icon" variant="ghost" asChild>
                          <a
                            href={patrocinador.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum patrocinador neste nível ainda. Seja o primeiro!
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quer se tornar um patrocinador?</CardTitle>
          <CardDescription>
            Conheça os benefícios de cada nível de patrocínio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {beneficios.map((beneficio) => {
              const categoria = patrocinadores.find(p => p.nivel === beneficio.nivel);
              return (
                <div
                  key={beneficio.nivel}
                  className={`p-4 rounded-lg border-2 ${categoria?.borderCor} ${categoria?.bgCor}`}
                >
                  <h4 className={`font-bold mb-3 ${categoria?.cor}`}>
                    {beneficio.nivel}
                  </h4>
                  <ul className="space-y-2">
                    {beneficio.items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Star className={`h-4 w-4 flex-shrink-0 mt-0.5 ${categoria?.cor}`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-bold mb-2">Interessado em patrocinar?</h3>
          <p className="text-muted-foreground mb-4">
            Entre em contato conosco pelo Discord ou WhatsApp para saber mais
            sobre como se tornar um patrocinador da comunidade.
          </p>
          <Badge variant="default" className="text-lg px-4 py-2">
            Obrigado pelo apoio!
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
