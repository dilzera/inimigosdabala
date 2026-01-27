import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Copy, Check, Shield, Users, Gamepad2, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ServidorComandos() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "5x5": true,
    "admin": false,
    "competitivo": false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copiado!",
      description: "Comando copiado para a área de transferência",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CommandRow = ({ comando, descricao, id }: { comando: string; descricao: string; id: string }) => (
    <div
      className="flex items-center justify-between p-3 bg-background/50 rounded-lg border hover-elevate cursor-pointer"
      onClick={() => copyToClipboard(comando, id)}
      data-testid={`command-${id}`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="font-mono whitespace-nowrap">
          {comando}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {descricao}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Terminal className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Comandos do Servidor</h1>
      </div>

      <p className="text-muted-foreground">
        Lista de comandos disponíveis no servidor. Clique em um comando para copiar.
      </p>

      {/* Modo 5x5 */}
      <Collapsible open={openSections["5x5"]} onOpenChange={() => toggleSection("5x5")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover-elevate">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  Comandos do Modo 5x5
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${openSections["5x5"] ? 'rotate-180' : ''}`} />
              </CardTitle>
              <CardDescription>
                Todos os comandos abaixo devem ser digitados no chat dentro do servidor
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-2">
              <CommandRow comando=".ready" descricao="Marca o jogador como pronto" id="5x5-ready" />
              <CommandRow comando=".unready" descricao="Marca o jogador como não pronto" id="5x5-unready" />
              <CommandRow comando=".stay" descricao="Permanece no mesmo lado (para o vencedor da faca)" id="5x5-stay" />
              <CommandRow comando=".switch" descricao="Troca de lado (para o vencedor da faca)" id="5x5-switch" />
              <CommandRow comando=".swap" descricao="Troca de lado (alternativo)" id="5x5-swap" />
              <CommandRow comando=".rtv" descricao="Abre uma votação para troca do mapa" id="5x5-rtv" />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Comandos Administrativos */}
      <Collapsible open={openSections["admin"]} onOpenChange={() => toggleSection("admin")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover-elevate">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  Comandos Administrativos
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${openSections["admin"] ? 'rotate-180' : ''}`} />
              </CardTitle>
              <CardDescription>
                Comandos utilizados por administradores nos servidores privados
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Comandos Gerais */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Comandos Gerais
                </h3>
                <div className="space-y-2">
                  <CommandRow comando="!modes" descricao="Abre o menu para selecionar o modo de jogo (ex: Mix, Retake, Deathmatch)" id="admin-modes" />
                  <CommandRow comando="!maps" descricao="Exibe o menu de mapas disponíveis com base no modo selecionado" id="admin-maps" />
                  <CommandRow comando="!allspec" descricao="Move todos os jogadores para a equipe de Espectadores" id="admin-allspec" />
                </div>
              </div>

              {/* Moderação de Jogadores */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Moderação de Jogadores
                </h3>
                <div className="space-y-2">
                  <CommandRow comando="!kick <nome_do_jogador>" descricao="Expulsar jogador" id="admin-kick" />
                  <CommandRow comando="!ban <nome_do_jogador>" descricao="Banir jogador" id="admin-ban" />
                </div>
                
                {/* Banimento via painel web */}
                <Card className="mt-4 bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Banimento via painel web</CardTitle>
                    <CardDescription>
                      Caso o comando no servidor não funcione corretamente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Acesse o perfil do jogador e copie o link da Steam</li>
                      <li>
                        Vá até: <a href="https://steamdb.info/calculator/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">steamdb.info/calculator/</a>
                      </li>
                      <li>Cole o link do perfil para converter e obter o SteamID64</li>
                      <li>No painel web do servidor, utilize o comando no console:</li>
                    </ol>
                    <div className="space-y-2 mt-2">
                      <CommandRow comando="css_ban <STEAMID64>" descricao="Banir jogador pelo SteamID64" id="admin-css-ban" />
                      <CommandRow comando="css_unban <STEAMID64>" descricao="Remover banimento pelo SteamID64" id="admin-css-unban" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      <p>Exemplo: <code className="bg-background px-1 rounded">css_ban 76561197960690195</code></p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Modo Competitivo */}
      <Collapsible open={openSections["competitivo"]} onOpenChange={() => toggleSection("competitivo")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover-elevate">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-yellow-500" />
                  Modo Competitivo
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${openSections["competitivo"] ? 'rotate-180' : ''}`} />
              </CardTitle>
              <CardDescription>
                Todos os comandos abaixo devem ser digitados no chat dentro do servidor
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Comandos Gerais */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Comandos Gerais
                </h3>
                <div className="space-y-2">
                  <CommandRow comando="!modes" descricao="Abre o menu para selecionar o modo de jogo (selecione: Competitivo)" id="comp-modes" />
                  <CommandRow comando="!maps" descricao="Exibe o menu de mapas disponíveis com base no modo selecionado" id="comp-maps" />
                  <CommandRow comando="!allspec" descricao="Move todos os jogadores para a equipe de Espectadores" id="comp-allspec" />
                </div>
              </div>

              {/* Comandos do Modo Competitivo */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Comandos do Modo Competitivo</h3>
                <div className="space-y-2">
                  <CommandRow comando=".ready" descricao="Marca o jogador como pronto" id="comp-ready" />
                  <CommandRow comando=".unready" descricao="Marca o jogador como não pronto" id="comp-unready" />
                  <CommandRow comando=".pause" descricao="Pausa a partida no tempo de congelamento" id="comp-pause" />
                  <CommandRow comando=".tech" descricao="Pausa a partida (alternativo)" id="comp-tech" />
                  <CommandRow comando=".unpause" descricao="Solicita a remoção do pause (ambos os times precisam usar)" id="comp-unpause" />
                  <CommandRow comando=".stay" descricao="Mantém o time vencedor da faca no mesmo lado" id="comp-stay" />
                  <CommandRow comando=".switch" descricao="Alterna o lado do time vencedor da faca" id="comp-switch" />
                  <CommandRow comando=".swap" descricao="Alterna o lado (alternativo)" id="comp-swap" />
                  <CommandRow comando=".stop" descricao="Restaura o backup da rodada atual (ambos os times precisam usar)" id="comp-stop" />
                  <CommandRow comando=".tac" descricao="Inicia uma pausa tática" id="comp-tac" />
                  <CommandRow comando=".coach t" descricao="Define o treinador para o lado Terrorista" id="comp-coach-t" />
                  <CommandRow comando=".coach ct" descricao="Define o treinador para o lado CT" id="comp-coach-ct" />
                </div>
              </div>

              {/* Comandos Administrativos do Competitivo */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  Comandos Administrativos
                </h3>
                <div className="space-y-2">
                  <CommandRow comando=".start" descricao="Força o início da partida" id="comp-start" />
                  <CommandRow comando=".restart" descricao="Reinicia a partida" id="comp-restart" />
                  <CommandRow comando=".forcepause" descricao="Pausa a partida como administrador (jogadores não podem despausar)" id="comp-forcepause" />
                  <CommandRow comando=".fp" descricao="Pausa forçada (alternativo)" id="comp-fp" />
                  <CommandRow comando=".forceunpause" descricao="Força a remoção do pause" id="comp-forceunpause" />
                  <CommandRow comando=".fup" descricao="Força a remoção do pause (alternativo)" id="comp-fup" />
                  <CommandRow comando=".restore <nº>" descricao="Restaura o backup da rodada informada" id="comp-restore" />
                  <CommandRow comando=".roundknife" descricao="Ativa/desativa a rodada da faca" id="comp-roundknife" />
                  <CommandRow comando=".rk" descricao="Rodada da faca (alternativo)" id="comp-rk" />
                  <CommandRow comando=".playout" descricao="Ativa o modo scrim (todas as rodadas são jogadas)" id="comp-playout" />
                  <CommandRow comando=".readyrequired <nº>" descricao="Define o número mínimo de jogadores prontos para iniciar" id="comp-readyrequired" />
                  <CommandRow comando=".settings" descricao="Exibe as configurações ativas do servidor" id="comp-settings" />
                  <CommandRow comando=".map <nome_do_mapa>" descricao="Troca o mapa (ex: .map de_mirage)" id="comp-map" />
                </div>

                {/* Mapas disponíveis */}
                <Card className="mt-4 bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Mapas Disponíveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {["de_inferno", "de_anubis", "de_mirage", "de_nuke", "de_dust2", "de_overpass", "de_vertigo", "de_ancient", "de_thera", "de_mills", "de_train"].map(map => (
                        <Badge 
                          key={map} 
                          variant="outline" 
                          className="font-mono cursor-pointer hover-elevate"
                          onClick={() => copyToClipboard(`.map ${map}`, `map-${map}`)}
                        >
                          {copiedId === `map-${map}` ? <Check className="h-3 w-3 mr-1 text-green-500" /> : null}
                          {map}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Outros Comandos */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Outros Comandos</h3>
                <div className="space-y-2">
                  <CommandRow comando=".asay <mensagem>" descricao="Envia uma mensagem global como administrador" id="comp-asay" />
                  <CommandRow comando=".team1 <nome>" descricao="Define o nome da Equipe 1 (CT)" id="comp-team1" />
                  <CommandRow comando=".team2 <nome>" descricao="Define o nome da Equipe 2 (Terrorista)" id="comp-team2" />
                  <CommandRow comando=".rcon <comando>" descricao="Envia um comando diretamente ao servidor" id="comp-rcon" />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
