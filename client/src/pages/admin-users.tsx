import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, UpdateUserStats } from "@shared/schema";
import {
  Users,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  Save,
  Shield,
  Link2,
  GitMerge,
} from "lucide-react";
import { Link } from "wouter";

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserStats & { steamId64?: string }>({});
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [sourceUserId, setSourceUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");

  const { data: allUsers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user?.isAdmin,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserStats }) => {
      await apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário atualizado com sucesso!" });
      setEditingUser(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você não tem permissão para esta ação.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Erro ao atualizar usuário",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário excluído com sucesso!" });
      setDeletingUser(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você não tem permissão para esta ação.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Erro ao excluir usuário",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const mergeUsersMutation = useMutation({
    mutationFn: async ({ sourceUserId, targetUserId }: { sourceUserId: string; targetUserId: string }) => {
      const response = await apiRequest("POST", "/api/users/merge", { sourceUserId, targetUserId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ 
        title: "Usuários mesclados com sucesso!",
        description: `Estatísticas transferidas para ${data.user?.nickname || data.user?.firstName || "o usuário de destino"}.`
      });
      setMergeDialogOpen(false);
      setSourceUserId("");
      setTargetUserId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao mesclar usuários",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

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

  if (isLoading) {
    return <AdminUsersSkeleton />;
  }

  const users = allUsers || [];
  const filteredUsers = users.filter((u) => {
    const search = searchQuery.toLowerCase();
    return (
      u.nickname?.toLowerCase().includes(search) ||
      u.firstName?.toLowerCase().includes(search) ||
      u.lastName?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search)
    );
  });

  const getInitials = (u: User) => {
    if (u.firstName && u.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    if (u.nickname) {
      return u.nickname.slice(0, 2).toUpperCase();
    }
    if (u.email) {
      return u.email.slice(0, 2).toUpperCase();
    }
    return "CS";
  };

  const openEditDialog = (u: User) => {
    setEditingUser(u);
    setEditForm({
      nickname: u.nickname || "",
      steamId64: u.steamId64 || "",
      totalKills: u.totalKills,
      totalDeaths: u.totalDeaths,
      totalAssists: u.totalAssists,
      totalHeadshots: u.totalHeadshots,
      totalMatches: u.totalMatches,
      matchesWon: u.matchesWon,
      matchesLost: u.matchesLost,
      totalRoundsPlayed: u.totalRoundsPlayed,
      roundsWon: u.roundsWon,
      totalMvps: u.totalMvps,
      skillRating: u.skillRating,
      isAdmin: u.isAdmin,
    });
  };

  const handleMergeUsers = () => {
    if (!sourceUserId || !targetUserId) {
      toast({
        title: "Selecione os usuários",
        description: "Você precisa selecionar o usuário de origem e o de destino.",
        variant: "destructive",
      });
      return;
    }
    mergeUsersMutation.mutate({ sourceUserId, targetUserId });
  };

  const handleEditSubmit = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({ id: editingUser.id, data: editForm });
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    deleteUserMutation.mutate(deletingUser.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground">
              Adicione, edite ou remova jogadores do sistema
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Jogadores ({filteredUsers.length})
          </CardTitle>
          <div className="flex items-center gap-4 flex-wrap">
            <Button 
              variant="outline" 
              onClick={() => setMergeDialogOpen(true)}
              data-testid="button-merge-users"
            >
              <GitMerge className="h-4 w-4 mr-2" />
              Mesclar Usuários
            </Button>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar jogadores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jogador</TableHead>
                  <TableHead className="text-center">Role</TableHead>
                  <TableHead className="text-right">K/D</TableHead>
                  <TableHead className="text-right">Partidas</TableHead>
                  <TableHead className="text-right">HS %</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((player) => {
                  const kd =
                    player.totalDeaths > 0
                      ? (player.totalKills / player.totalDeaths).toFixed(2)
                      : player.totalKills.toFixed(2);
                  const hs =
                    player.totalKills > 0
                      ? ((player.totalHeadshots / player.totalKills) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <TableRow key={player.id} data-testid={`user-row-${player.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={player.profileImageUrl || undefined}
                              alt={player.nickname || "User"}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(player)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {player.nickname ||
                                player.firstName ||
                                player.email?.split("@")[0]}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {player.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={player.isAdmin ? "default" : "secondary"}
                        >
                          {player.isAdmin ? "Admin" : "Jogador"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{kd}</TableCell>
                      <TableCell className="text-right font-mono">
                        {player.totalMatches}
                      </TableCell>
                      <TableCell className="text-right font-mono">{hs}%</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-mono">
                          {player.skillRating}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(player)}
                            data-testid={`button-edit-${player.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingUser(player)}
                            disabled={player.id === user.id}
                            data-testid={`button-delete-${player.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Nenhum jogador encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Jogador
            </DialogTitle>
            <DialogDescription>
              Altere as estatísticas e informações do jogador
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={editingUser.profileImageUrl || undefined}
                    alt={editingUser.nickname || "User"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {getInitials(editingUser)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">
                    {editingUser.firstName} {editingUser.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {editingUser.email}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nickname">Apelido</Label>
                  <Input
                    id="nickname"
                    value={editForm.nickname || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nickname: e.target.value })
                    }
                    data-testid="input-nickname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skillRating">Skill Rating</Label>
                  <Input
                    id="skillRating"
                    type="number"
                    value={editForm.skillRating || 0}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        skillRating: parseInt(e.target.value) || 0,
                      })
                    }
                    data-testid="input-skill-rating"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="steamId64" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  SteamID64
                </Label>
                <Input
                  id="steamId64"
                  placeholder="76561198000000000"
                  value={editForm.steamId64 || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, steamId64: e.target.value })
                  }
                  data-testid="input-steamid64"
                />
                <p className="text-xs text-muted-foreground">
                  Identificador único do Steam. Formato: 17 dígitos começando com 7656119.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Administrador
                </Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editForm.isAdmin || false}
                    onCheckedChange={(checked) =>
                      setEditForm({ ...editForm, isAdmin: checked })
                    }
                    disabled={editingUser.id === user.id}
                    data-testid="switch-is-admin"
                  />
                  <span className="text-sm text-muted-foreground">
                    {editForm.isAdmin
                      ? "Pode gerenciar todos os usuários"
                      : "Acesso apenas ao próprio perfil"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Estatísticas de Combate</h4>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalKills">Kills</Label>
                    <Input
                      id="totalKills"
                      type="number"
                      value={editForm.totalKills || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          totalKills: parseInt(e.target.value) || 0,
                        })
                      }
                      data-testid="input-total-kills"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalDeaths">Deaths</Label>
                    <Input
                      id="totalDeaths"
                      type="number"
                      value={editForm.totalDeaths || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          totalDeaths: parseInt(e.target.value) || 0,
                        })
                      }
                      data-testid="input-total-deaths"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalAssists">Assists</Label>
                    <Input
                      id="totalAssists"
                      type="number"
                      value={editForm.totalAssists || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          totalAssists: parseInt(e.target.value) || 0,
                        })
                      }
                      data-testid="input-total-assists"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalHeadshots">Headshots</Label>
                    <Input
                      id="totalHeadshots"
                      type="number"
                      value={editForm.totalHeadshots || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          totalHeadshots: parseInt(e.target.value) || 0,
                        })
                      }
                      data-testid="input-total-headshots"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Estatísticas de Partidas</h4>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalMatches">Partidas</Label>
                    <Input
                      id="totalMatches"
                      type="number"
                      value={editForm.totalMatches || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          totalMatches: parseInt(e.target.value) || 0,
                        })
                      }
                      data-testid="input-total-matches"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matchesWon">Vitórias</Label>
                    <Input
                      id="matchesWon"
                      type="number"
                      value={editForm.matchesWon || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          matchesWon: parseInt(e.target.value) || 0,
                        })
                      }
                      data-testid="input-matches-won"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matchesLost">Derrotas</Label>
                    <Input
                      id="matchesLost"
                      type="number"
                      value={editForm.matchesLost || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          matchesLost: parseInt(e.target.value) || 0,
                        })
                      }
                      data-testid="input-matches-lost"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalMvps">MVPs</Label>
                    <Input
                      id="totalMvps"
                      type="number"
                      value={editForm.totalMvps || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          totalMvps: parseInt(e.target.value) || 0,
                        })
                      }
                      data-testid="input-total-mvps"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Estatísticas de Rounds</h4>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="totalRoundsPlayed">Rounds Jogados</Label>
                    <Input
                      id="totalRoundsPlayed"
                      type="number"
                      value={editForm.totalRoundsPlayed || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          totalRoundsPlayed: parseInt(e.target.value) || 0,
                        })
                      }
                      data-testid="input-rounds-played"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roundsWon">Rounds Ganhos</Label>
                    <Input
                      id="roundsWon"
                      type="number"
                      value={editForm.roundsWon || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          roundsWon: parseInt(e.target.value) || 0,
                        })
                      }
                      data-testid="input-rounds-won"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateUserMutation.isPending}
              data-testid="button-save-user"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateUserMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o jogador{" "}
              <strong>
                {deletingUser?.nickname ||
                  deletingUser?.firstName ||
                  deletingUser?.email}
              </strong>
              ? Esta ação não pode ser desfeita e todas as estatísticas serão
              perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Mesclar Usuários
            </DialogTitle>
            <DialogDescription>
              Transfira todas as estatísticas e partidas de um usuário para outro.
              O usuário de origem será excluído após a mesclagem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Usuário de Origem (será excluído)</Label>
              <Select value={sourceUserId} onValueChange={setSourceUserId}>
                <SelectTrigger data-testid="select-source-user">
                  <SelectValue placeholder="Selecione o usuário de origem" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.id !== targetUserId)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nickname || u.firstName || u.email || u.id}
                        {u.steamId64 && ` (${u.steamId64})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {sourceUserId && (
                <p className="text-xs text-muted-foreground">
                  Stats: {users.find((u) => u.id === sourceUserId)?.totalKills || 0} kills, {" "}
                  {users.find((u) => u.id === sourceUserId)?.totalMatches || 0} partidas
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Usuário de Destino (receberá as stats)</Label>
              <Select value={targetUserId} onValueChange={setTargetUserId}>
                <SelectTrigger data-testid="select-target-user">
                  <SelectValue placeholder="Selecione o usuário de destino" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.id !== sourceUserId)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nickname || u.firstName || u.email || u.id}
                        {u.steamId64 && ` (${u.steamId64})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {targetUserId && (
                <p className="text-xs text-muted-foreground">
                  Stats: {users.find((u) => u.id === targetUserId)?.totalKills || 0} kills, {" "}
                  {users.find((u) => u.id === targetUserId)?.totalMatches || 0} partidas
                </p>
              )}
            </div>

            {sourceUserId && targetUserId && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  <strong>Atenção:</strong> Todas as estatísticas e partidas de{" "}
                  <strong>
                    {users.find((u) => u.id === sourceUserId)?.nickname ||
                      users.find((u) => u.id === sourceUserId)?.firstName ||
                      "usuário origem"}
                  </strong>{" "}
                  serão transferidas para{" "}
                  <strong>
                    {users.find((u) => u.id === targetUserId)?.nickname ||
                      users.find((u) => u.id === targetUserId)?.firstName ||
                      "usuário destino"}
                  </strong>
                  . O usuário de origem será excluído.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMergeUsers}
              disabled={mergeUsersMutation.isPending || !sourceUserId || !targetUserId}
              data-testid="button-confirm-merge"
            >
              <GitMerge className="h-4 w-4 mr-2" />
              {mergeUsersMutation.isPending ? "Mesclando..." : "Mesclar Usuários"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminUsersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
