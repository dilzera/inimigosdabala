import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Crown, ExternalLink, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User, Payment } from "@shared/schema";

export default function Patrocinadores() {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const getUserById = (id: string) => users.find(u => u.id === id);

  const contributorStats = payments.reduce((acc, payment) => {
    const userId = payment.userId;
    if (!acc[userId]) {
      acc[userId] = { total: 0, count: 0 };
    }
    acc[userId].total += payment.amount || 0;
    acc[userId].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const sortedContributors = Object.entries(contributorStats)
    .map(([userId, stats]) => ({
      user: getUserById(userId),
      ...stats,
    }))
    .filter(c => c.user)
    .sort((a, b) => b.total - a.total);

  const totalArrecadado = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
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

      {sortedContributors.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-green-500" />
              <span>Contribuintes da Comunidade</span>
              <Badge variant="outline" className="ml-auto">
                Total: R$ {totalArrecadado.toFixed(2)}
              </Badge>
            </CardTitle>
            <CardDescription>
              Agradecemos aos jogadores que contribuem financeiramente para a comunidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedContributors.map((contributor, index) => (
                <div
                  key={contributor.user?.id}
                  className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border"
                  data-testid={`contributor-${contributor.user?.id}`}
                >
                  <div className="relative">
                    {index === 0 && (
                      <Crown className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 z-10" />
                    )}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contributor.user?.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {contributor.user?.nickname?.slice(0, 2).toUpperCase() || 
                         contributor.user?.firstName?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {contributor.user?.nickname || contributor.user?.firstName || "Jogador"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {contributor.count} contribuição{contributor.count > 1 ? "ões" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-green-500">
                      R$ {contributor.total.toFixed(2)}
                    </div>
                    {index === 0 && (
                      <Badge variant="default" className="text-xs">
                        Top Contribuinte
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
