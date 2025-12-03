import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  DollarSign, Plus, Trash2, Calendar, User as UserIcon, 
  TrendingUp, Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { User, Payment } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminFinanceiro() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: users = [], isLoading: usersLoading, isError: usersError } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: payments = [], isLoading: paymentsLoading, isError: paymentsError } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: { userId: string; amount: number; description: string; paymentDate: string }) => {
      const response = await apiRequest("POST", "/api/payments", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pagamento Registrado!",
        description: "O pagamento foi registrado com sucesso.",
      });
      setIsDialogOpen(false);
      setSelectedUserId("");
      setAmount("");
      setDescription("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Registrar",
        description: error.message || "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/payments/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pagamento Removido!",
        description: "O pagamento foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Remover",
        description: error.message || "Não foi possível remover o pagamento.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !amount) {
      toast({
        title: "Erro",
        description: "Selecione um jogador e informe o valor.",
        variant: "destructive",
      });
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido maior que zero.",
        variant: "destructive",
      });
      return;
    }
    createPaymentMutation.mutate({
      userId: selectedUserId,
      amount: parsedAmount,
      description,
      paymentDate,
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

  const getUserById = (id: string) => users.find(u => u.id === id);

  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const uniquePayers = new Set(payments.map(p => p.userId)).size;

  const sortedPayments = [...payments].sort((a, b) => 
    new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Financeiro</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-payment">
              <Plus className="h-4 w-4 mr-2" />
              Novo Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
              <DialogDescription>
                Adicione um novo pagamento de um jogador.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div className="space-y-2">
                <Label>Jogador</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger data-testid="select-user">
                    <SelectValue placeholder="Selecione um jogador" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nickname || u.firstName || u.email || "Jogador"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Ex: Contribuição mensal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Data do Pagamento</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  data-testid="input-payment-date"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createPaymentMutation.isPending}
                  data-testid="button-submit-payment"
                >
                  {createPaymentMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {paymentsLoading || usersLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="loading-stats">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paymentsError || usersError ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="error-stats">
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6">
              <div className="text-center text-destructive py-4">
                Erro ao carregar estatísticas. Tente novamente.
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="stats-cards">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500" data-testid="text-total-amount">
                R$ {totalPayments.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {payments.length} pagamentos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contribuintes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-unique-payers">{uniquePayers}</div>
              <p className="text-xs text-muted-foreground">
                jogadores únicos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Pagamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-average-amount">
                R$ {payments.length > 0 ? (totalPayments / payments.length).toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                valor médio
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Todos os pagamentos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading || usersLoading ? (
            <div className="flex justify-center py-8" data-testid="loading-payments">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : paymentsError || usersError ? (
            <div className="text-center py-8 text-destructive" data-testid="error-payments">
              Erro ao carregar pagamentos. Tente novamente.
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="empty-payments">
              Nenhum pagamento registrado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jogador</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayments.map((payment) => {
                  const payer = getUserById(payment.userId);
                  return (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={payer?.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {payer?.nickname?.slice(0, 2).toUpperCase() || 
                               payer?.firstName?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {payer?.nickname || payer?.firstName || "Jogador"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-green-500">
                          R$ {(payment.amount || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.description || "-"}
                      </TableCell>
                      <TableCell>
                        {payment.paymentDate 
                          ? format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deletePaymentMutation.mutate(payment.id)}
                          disabled={deletePaymentMutation.isPending}
                          data-testid={`button-delete-payment-${payment.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
