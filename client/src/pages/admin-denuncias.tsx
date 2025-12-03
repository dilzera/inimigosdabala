import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Eye, 
  User, 
  EyeOff,
  MessageSquare,
  Trash2,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Report, User as UserType } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

const statusConfig: Record<ReportStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  reviewing: { label: "Em Análise", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Search },
  resolved: { label: "Resolvido", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  dismissed: { label: "Descartado", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: XCircle },
};

export default function AdminDenuncias() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    enabled: !!user?.isAdmin,
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: !!user?.isAdmin,
  });

  const usersMap = new Map(users.map(u => [u.id, u]));

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: ReportStatus; adminNotes?: string }) => {
      const response = await apiRequest("PATCH", `/api/reports/${id}`, { status, adminNotes });
      const result = await response.json();
      
      if (!response.ok) {
        throw result;
      }
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Denúncia Atualizada",
        description: "O status da denúncia foi alterado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setSelectedReport(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar denúncia.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/reports/${id}`);
      
      if (!response.ok) {
        const result = await response.json();
        throw result;
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Denúncia Excluída",
        description: "A denúncia foi removida do sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setDeleteReport(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir denúncia.",
        variant: "destructive",
      });
    },
  });

  const filteredReports = filter === "all" 
    ? reports 
    : reports.filter(r => r.status === filter);

  const getReporterName = (report: Report) => {
    if (report.isAnonymous) return "Anônimo";
    if (!report.userId) return "Desconhecido";
    const reporterUser = usersMap.get(report.userId);
    return reporterUser?.firstName || reporterUser?.nickname || reporterUser?.email || "Usuário";
  };

  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    updateMutation.mutate({ id: reportId, status: newStatus });
  };

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || "");
  };

  const handleSaveNotes = () => {
    if (!selectedReport) return;
    updateMutation.mutate({ 
      id: selectedReport.id, 
      status: selectedReport.status as ReportStatus, 
      adminNotes 
    });
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

  const pendingCount = reports.filter(r => r.status === "pending").length;
  const reviewingCount = reports.filter(r => r.status === "reviewing").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            Denúncias
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as denúncias enviadas pela comunidade
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
          {reviewingCount > 0 && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              {reviewingCount} em análise
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="reviewing">Em Análise</SelectItem>
            <SelectItem value="resolved">Resolvidas</SelectItem>
            <SelectItem value="dismissed">Descartadas</SelectItem>
          </SelectContent>
        </Select>
        
        <span className="text-sm text-muted-foreground">
          {filteredReports.length} denúncia{filteredReports.length !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Nenhuma denúncia</h3>
            <p className="text-muted-foreground">
              {filter === "all" 
                ? "Não há denúncias registradas no sistema."
                : `Não há denúncias com status "${statusConfig[filter as ReportStatus]?.label || filter}".`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredReports.map(report => {
            const StatusIcon = statusConfig[report.status as ReportStatus]?.icon || Clock;
            const statusColor = statusConfig[report.status as ReportStatus]?.color || "";
            const statusLabel = statusConfig[report.status as ReportStatus]?.label || report.status;
            
            return (
              <Card key={report.id} className="hover-elevate" data-testid={`card-report-${report.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {report.isAnonymous ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-medium truncate">{getReporterName(report)}</span>
                    </div>
                    <Badge variant="outline" className={statusColor}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusLabel}
                    </Badge>
                  </div>
                  <CardDescription>
                    {report.createdAt && formatDistanceToNow(new Date(report.createdAt), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm line-clamp-3">{report.description}</p>
                  
                  {report.adminNotes && (
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3" />
                        Notas da Admin
                      </p>
                      <p className="text-xs line-clamp-2">{report.adminNotes}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <Select 
                      value={report.status} 
                      onValueChange={(value) => handleStatusChange(report.id, value as ReportStatus)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs" data-testid={`select-status-${report.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="reviewing">Em Análise</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                        <SelectItem value="dismissed">Descartado</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewDetails(report)}
                        data-testid={`button-view-${report.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteReport(report)}
                        data-testid={`button-delete-${report.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Detalhes da Denúncia
            </DialogTitle>
            <DialogDescription>
              {selectedReport?.createdAt && format(new Date(selectedReport.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {selectedReport.isAnonymous ? (
                    <>
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Denúncia Anônima</span>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getReporterName(selectedReport)}</span>
                    </>
                  )}
                </div>
                
                <Badge variant="outline" className={statusConfig[selectedReport.status as ReportStatus]?.color}>
                  {statusConfig[selectedReport.status as ReportStatus]?.label || selectedReport.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Descrição</h4>
                <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap">
                  {selectedReport.description}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notas da Administração</h4>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione notas internas sobre esta denúncia..."
                  className="min-h-[100px]"
                  data-testid="textarea-admin-notes"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Fechar
            </Button>
            <Button 
              onClick={handleSaveNotes}
              disabled={updateMutation.isPending}
              data-testid="button-save-notes"
            >
              Salvar Notas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteReport} onOpenChange={() => setDeleteReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Denúncia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A denúncia será permanentemente removida do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteReport && deleteMutation.mutate(deleteReport.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
