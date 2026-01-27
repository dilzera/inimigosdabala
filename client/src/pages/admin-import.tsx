import { useState, useMemo, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileUp, CheckCircle, AlertCircle, Upload, FileText, Info, Trophy, Users, Star, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface DetectedTeam {
  name: string;
  players: string[];
}

function parseCSVForTeams(csvContent: string): DetectedTeam[] {
  if (!csvContent.trim()) return [];
  
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const teamIndex = headers.indexOf('team');
  const nameIndex = headers.indexOf('name');
  
  if (teamIndex === -1) return [];
  
  const teams: Map<string, string[]> = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const teamName = values[teamIndex] || '';
    const playerName = nameIndex >= 0 ? values[nameIndex] : '';
    
    if (teamName) {
      if (!teams.has(teamName)) {
        teams.set(teamName, []);
      }
      if (playerName) {
        teams.get(teamName)!.push(playerName);
      }
    }
  }
  
  return Array.from(teams.entries()).map(([name, players]) => ({
    name,
    players
  }));
}

export default function AdminImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [csvContent, setCsvContent] = useState("");
  const [mapName, setMapName] = useState("");
  const [winnerTeam, setWinnerTeam] = useState<string>("");
  const [team1Score, setTeam1Score] = useState<string>("");
  const [team2Score, setTeam2Score] = useState<string>("");

  const detectedTeams = useMemo(() => parseCSVForTeams(csvContent), [csvContent]);

  useEffect(() => {
    if (detectedTeams.length >= 2) {
      setWinnerTeam("");
      setTeam1Score("");
      setTeam2Score("");
    }
  }, [csvContent]);

  const importMutation = useMutation({
    mutationFn: async (data: { 
      csvContent: string; 
      map: string;
      winnerTeam?: string;
      team1Score?: number;
      team2Score?: number;
    }) => {
      const response = await apiRequest("POST", "/api/matches/import", data);
      const result = await response.json();
      
      if (!response.ok) {
        throw { status: response.status, ...result };
      }
      
      return result;
    },
    onSuccess: (data: { matchId: string; playersProcessed: number }) => {
      toast({
        title: "Partida Importada!",
        description: `${data.playersProcessed} jogadores processados com sucesso.`,
      });
      setCsvContent("");
      setMapName("");
      setWinnerTeam("");
      setTeam1Score("");
      setTeam2Score("");
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      if (error.status === 409) {
        toast({
          title: "Partida já importada",
          description: error.message || "Esta partida já foi importada anteriormente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro na Importação",
          description: error.message || "Falha ao importar dados da partida.",
          variant: "destructive",
        });
      }
    },
  });

  const recalculateMvpsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/recalculate-mvps");
      const result = await response.json();
      
      if (!response.ok) {
        throw result;
      }
      
      return result;
    },
    onSuccess: (data: { matchesProcessed: number; mvpsAssigned: number; usersUpdated: number }) => {
      toast({
        title: "MVPs Recalculados!",
        description: `${data.matchesProcessed} partidas processadas, ${data.mvpsAssigned} MVPs atribuídos.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Recalcular MVPs",
        description: error.message || "Falha ao recalcular MVPs.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
        
        const fileName = file.name.replace('.csv', '');
        if (fileName.includes('match_data_')) {
          setMapName('');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      toast({
        title: "Erro",
        description: "Cole o conteúdo do CSV ou faça upload de um arquivo.",
        variant: "destructive",
      });
      return;
    }
    if (!mapName.trim()) {
      toast({
        title: "Erro",
        description: "Informe o nome do mapa.",
        variant: "destructive",
      });
      return;
    }
    
    const importData: any = { csvContent, map: mapName };
    
    if (winnerTeam) {
      importData.winnerTeam = winnerTeam;
    }
    if (team1Score && team2Score) {
      importData.team1Score = parseInt(team1Score);
      importData.team2Score = parseInt(team2Score);
    }
    
    importMutation.mutate(importData);
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar Partida</h1>
        <p className="text-muted-foreground">
          Importe dados de partidas do servidor CS2 usando arquivos CSV
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Formato do Arquivo CSV</AlertTitle>
        <AlertDescription>
          O arquivo deve conter as colunas: matchid, mapnumber, steamid64, team, name, kills, deaths, damage, assists, head_shot_kills, etc.
          O sistema irá automaticamente criar novos jogadores baseado no SteamID64 se eles ainda não existirem.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload de Arquivo
            </CardTitle>
            <CardDescription>
              Faça upload do arquivo CSV gerado pelo servidor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                  data-testid="input-csv-file"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <FileUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Clique para fazer upload ou arraste o arquivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Somente arquivos CSV
                  </p>
                </label>
              </div>
              {csvContent && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm">
                    Arquivo carregado ({csvContent.split('\n').length - 1} jogadores)
                  </span>
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Colar CSV
            </CardTitle>
            <CardDescription>
              Ou cole o conteúdo do CSV diretamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="matchid,mapnumber,steamid64,team,name,kills,deaths,..."
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
              data-testid="textarea-csv-content"
            />
          </CardContent>
        </Card>
      </div>

      {detectedTeams.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Times Detectados
            </CardTitle>
            <CardDescription>
              Informe o vencedor e o placar da partida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {detectedTeams.slice(0, 2).map((team, index) => (
                <div key={team.name} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-red-500'}`} />
                    <h4 className="font-semibold">{team.name}</h4>
                    <span className="text-sm text-muted-foreground">
                      ({team.players.length} jogadores)
                    </span>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground truncate" title={team.players.join(', ')}>
                      {team.players.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Time Vencedor
                </Label>
                <RadioGroup
                  value={winnerTeam}
                  onValueChange={setWinnerTeam}
                  className="flex gap-4"
                >
                  {detectedTeams.slice(0, 2).map((team) => (
                    <div key={team.name} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={team.name} 
                        id={`winner-${team.name}`}
                        data-testid={`radio-winner-${team.name}`}
                      />
                      <Label htmlFor={`winner-${team.name}`} className="cursor-pointer">
                        {team.name}
                      </Label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="draw" 
                      id="winner-draw"
                      data-testid="radio-winner-draw"
                    />
                    <Label htmlFor="winner-draw" className="cursor-pointer">
                      Empate
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="team1-score">
                    Placar {detectedTeams[0]?.name}
                  </Label>
                  <Input
                    id="team1-score"
                    type="number"
                    min="0"
                    max="99"
                    placeholder="0"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(e.target.value)}
                    data-testid="input-team1-score"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team2-score">
                    Placar {detectedTeams[1]?.name}
                  </Label>
                  <Input
                    id="team2-score"
                    type="number"
                    min="0"
                    max="99"
                    placeholder="0"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(e.target.value)}
                    data-testid="input-team2-score"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações da Partida</CardTitle>
          <CardDescription>
            Complete os dados necessários para importar a partida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="map-name">Nome do Mapa</Label>
                <Input
                  id="map-name"
                  placeholder="de_dust2, de_inferno, de_mirage..."
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  data-testid="input-map-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {csvContent ? (
                    <span className="text-green-500 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {csvContent.split('\n').length - 1} jogadores detectados
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Nenhum dado carregado
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={importMutation.isPending || !csvContent || !mapName}
              className="w-full sm:w-auto"
              data-testid="button-import"
            >
              {importMutation.isPending ? (
                <>Importando...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Partida
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {importMutation.isSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Importação Concluída!</AlertTitle>
          <AlertDescription>
            Os dados da partida foram importados e as estatísticas dos jogadores foram atualizadas automaticamente.
          </AlertDescription>
        </Alert>
      )}

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Recalcular MVPs
          </CardTitle>
          <CardDescription>
            Recalcule os MVPs de todas as partidas anteriores baseado nas estatísticas dos jogadores.
            Isso é útil se as partidas foram importadas antes da implementação do cálculo automático de MVP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Como funciona o cálculo de MVP</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              <p>O MVP é calculado usando uma fórmula que considera múltiplos fatores:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Kills (2 pts), Assists (0.5 pts), K/D ratio (5 pts por ratio)</li>
                <li>Headshot % (até 10 pts), Dano (0.01 pts por dano)</li>
                <li>ACE (15 pts), 4K (10 pts), 3K (5 pts), 2K (2 pts)</li>
                <li>Clutches 1v1 (8 pts), 1v2 (12 pts)</li>
                <li>Entry Frags (3 pts), Dano de Utilidade (0.02 pts)</li>
                <li>Inimigos Flashados (0.5 pts)</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => recalculateMvpsMutation.mutate()}
            disabled={recalculateMvpsMutation.isPending}
            className="w-full sm:w-auto"
            data-testid="button-recalculate-mvps"
          >
            {recalculateMvpsMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Recalculando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalcular MVPs de Todas as Partidas
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
