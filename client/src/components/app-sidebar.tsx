import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Crosshair,
  Settings,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const playerItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
  ];

  const adminItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Gerenciar Usuários",
      url: "/admin/users",
      icon: Users,
    },
  ];

  const items = user?.isAdmin ? adminItems : playerItems;

  const getInitials = (user: typeof userType) => {
    if (!user) return "?";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.nickname) {
      return user.nickname.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "CS";
  };

  const userType = user;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Crosshair className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">CS Stats</span>
            <span className="text-xs text-muted-foreground">Manager</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider text-xs">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user?.profileImageUrl || undefined}
              alt={user?.nickname || "User"}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.nickname || user?.firstName || user?.email?.split("@")[0] || "Jogador"}
            </span>
            <Badge
              variant={user?.isAdmin ? "default" : "secondary"}
              className="w-fit text-xs"
              data-testid="badge-user-role"
            >
              {user?.isAdmin ? "Admin" : "Jogador"}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full mt-3 justify-start"
          asChild
          data-testid="button-logout"
        >
          <a href="/api/logout">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </a>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
