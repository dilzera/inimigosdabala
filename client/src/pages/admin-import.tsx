import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileUp, CheckCircle, AlertCircle, Upload, FileText, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [csvContent, setCsvContent] = useState("");
  const [mapName, setMapName] = useState("");

  const importMutation = useMutation({
    mutationFn: async (data: { csvContent: string; map: string }) => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
        
        // Try to extract map name from filename
        const fileName = file.name.replace('.csv', '');
        if (fileName.includes('match_data_')) {
          setMapName(''); // Let user fill in
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
    importMutation.mutate({ csvContent, map: mapName });
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
    </div>
  );
}
