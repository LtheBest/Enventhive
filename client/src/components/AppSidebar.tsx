import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  Settings,
  CreditCard,
  BarChart3,
  Building2,
  LogOut,
} from "lucide-react";
import { PlanBadge } from "./PlanBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface AppSidebarProps {
  userRole?: "company" | "admin";
  currentPlan?: "DECOUVERTE" | "ESSENTIEL" | "PRO" | "PREMIUM";
  companyName?: string;
  userName?: string;
}

export function AppSidebar({ 
  userRole = "company",
  currentPlan = "ESSENTIEL",
  companyName = "Mon Entreprise",
  userName = "Jean Dupont"
}: AppSidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const companyMenuItems = [
    { title: "Tableau de bord", icon: LayoutDashboard, url: "/dashboard" },
    { title: "Événements", icon: Calendar, url: "/events" },
    { title: "Participants", icon: Users, url: "/participants" },
    { title: "Véhicules", icon: Car, url: "/vehicles" },
    { title: "Statistiques", icon: BarChart3, url: "/stats", pro: true },
  ];

  const adminMenuItems = [
    { title: "Vue d'ensemble", icon: LayoutDashboard, url: "/admin" },
    { title: "Entreprises", icon: Building2, url: "/admin/companies" },
    { title: "Validations", icon: CreditCard, url: "/admin/validations" },
    { title: "Statistiques", icon: BarChart3, url: "/admin/stats" },
  ];

  const menuItems = userRole === "admin" ? adminMenuItems : companyMenuItems;
  const shouldShowProLabel = (item: any) => item.pro && (currentPlan === "DECOUVERTE" || currentPlan === "ESSENTIEL");

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TM</span>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-sm">TEAMMOVE</h2>
            {userRole === "company" && (
              <PlanBadge plan={currentPlan} className="mt-1" />
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {userRole === "admin" ? "Administration" : "Menu principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-sidebar-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {shouldShowProLabel(item) && (
                        <Badge variant="secondary" className="ml-auto text-xs">Pro</Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Paramètres</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location === (userRole === "admin" ? "/admin/settings" : "/settings")}
                >
                  <Link 
                    href={userRole === "admin" ? "/admin/settings" : "/settings"} 
                    data-testid="link-sidebar-settings"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Paramètres</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {userRole === "company" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/billing"}>
                    <Link href="/billing" data-testid="link-sidebar-billing">
                      <CreditCard className="h-4 w-4" />
                      <span>Abonnement</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {userName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{companyName}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
