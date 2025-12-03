import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Target,
  Users,
  BarChart3,
  Trophy,
  Shield,
  Swords,
} from "lucide-react";
import logoUrl from "@assets/WhatsApp_Image_2025-11-17_at_01.47.14_(1)_1764723428520.jpeg";

export default function Landing() {
  const features = [
    {
      icon: BarChart3,
      title: "Estatísticas Detalhadas",
      description:
        "Acompanhe K/D, headshots, taxa de vitória e muito mais em tempo real",
    },
    {
      icon: Swords,
      title: "Balanceamento de Times",
      description:
        "Sistema inteligente para criar partidas equilibradas entre amigos",
    },
    {
      icon: Trophy,
      title: "Rankings",
      description:
        "Veja quem são os melhores jogadores do seu grupo de amigos",
    },
    {
      icon: Shield,
      title: "Perfis Personalizados",
      description:
        "Cada jogador tem seu próprio perfil com estatísticas individuais",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={logoUrl} 
              alt="Inimigos da Bala" 
              className="h-12 w-12 rounded-md object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight">Inimigos da Bala</span>
              <span className="text-xs text-muted-foreground">Counter-Strike 2</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild data-testid="button-login-replit">
              <a href="/api/login">Entrar</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="flex justify-center mb-8">
              <img 
                src={logoUrl} 
                alt="Inimigos da Bala" 
                className="h-32 w-32 rounded-lg object-contain"
              />
            </div>
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary/10 rounded-full">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Comunidade Counter-Strike 2
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Bem-vindo aos{" "}
              <span className="text-primary">Inimigos da Bala</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Acompanhe estatísticas, balance times para o mix, veja rankings 
              e muito mais. O sistema completo para gerenciar suas partidas
              de Counter-Strike 2 com os amigos.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" asChild data-testid="button-get-started">
                <a href="/api/login">Entrar na Comunidade</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-card/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Tudo que você precisa para suas partidas
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Funcionalidades pensadas para jogadores que levam suas partidas
                a sério
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover-elevate">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-8">Nossa Comunidade</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold font-mono text-primary mb-2">
                  <Users className="h-10 w-10 mx-auto mb-2" />
                  10+
                </div>
                <div className="text-sm text-muted-foreground">
                  Jogadores Ativos
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold font-mono text-primary mb-2">
                  <Swords className="h-10 w-10 mx-auto mb-2" />
                  500+
                </div>
                <div className="text-sm text-muted-foreground">
                  Partidas Jogadas
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold font-mono text-primary mb-2">
                  <Trophy className="h-10 w-10 mx-auto mb-2" />
                  1.5+
                </div>
                <div className="text-sm text-muted-foreground">K/D Médio</div>
              </div>
              <div>
                <div className="text-4xl font-bold font-mono text-primary mb-2">
                  <Target className="h-10 w-10 mx-auto mb-2" />
                  45%
                </div>
                <div className="text-sm text-muted-foreground">
                  Headshot Rate
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <img 
            src={logoUrl} 
            alt="Inimigos da Bala" 
            className="h-16 w-16 mx-auto mb-4 rounded-md object-contain"
          />
          <p className="text-sm text-muted-foreground">
            Inimigos da Bala - Counter-Strike 2
          </p>
        </div>
      </footer>
    </div>
  );
}
