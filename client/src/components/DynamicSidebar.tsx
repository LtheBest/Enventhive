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
  FileText,
  Bell,
  MessageSquare,
  Users2,
  Palette,
  Puzzle,
  Code,
  HelpCircle,
} from "lucide-react";
import { PlanBadge } from "./PlanBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";
import { 
  getMenuItemsForPlan, 
  SETTINGS_MENU_ITEMS, 
  type PlanTier,
  type MenuItem as ConfigMenuItem
} from "@/lib/plan-permissions";
import { useMemo } from "react";

interface DynamicSidebarProps {
  userRole?: "company" | "admin";
  companyName?: string;
  userName?: string;
}

// Mapping des noms d'icônes aux composants Lucide
const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  Settings,
  CreditCard,
  BarChart3,
  Building2,
  FileText,
  Bell,
  MessageSquare,
  Users2,
  Palette,
  Puzzle,
  Code,
  HelpCircle,
};

export function DynamicSidebar({ 
  userRole = "company",
  companyName = "Mon Entreprise",
  userName = "Jean Dupont"
}: DynamicSidebarProps) {
  const [location] = useLocation();
  const { logout, plan } = useAuth();
  const { planData } = usePlanFeatures();

  // Menu items pour les admins (statique)
  const adminMenuItems = [
    { title: "Vue d'ensemble", icon: LayoutDashboard, url: "/admin" },
    { title: "Entreprises", icon: Building2, url: "/admin/companies" },
    { title: "Validations", icon: CreditCard, url: "/admin/validations" },
    { title: "Messages", icon: MessageSquare, url: "/admin/messages" },
    { title: "Support", icon: HelpCircle, url: "/admin/support" },
    { title: "Statistiques", icon: BarChart3, url: "/admin/stats" },
  ];

  // Menu items dynamiques pour les companies basés sur leur plan
  const companyMenuItems = useMemo(() => {
    if (!plan?.tier) return [];
    
    const planTier = plan.tier as PlanTier;
    const features = planData?.features;
    
    return getMenuItemsForPlan(planTier, features);
  }, [plan?.tier, planData?.features]);

  // Menu items des paramètres pour les companies
  const settingsItems = useMemo(() => {
    return SETTINGS_MENU_ITEMS.map(item => ({
      title: item.title,
      icon: ICON_MAP[item.icon],
      url: item.url,
      description: item.description,
    }));
  }, []);

  // Sélectionner les menu items selon le rôle
  const mainMenuItems = userRole === "admin" ? adminMenuItems : companyMenuItems;

  // Convertir les items de configuration en format utilisable
  const convertedMainMenuItems = userRole === "company" 
    ? mainMenuItems.map((item: ConfigMenuItem) => ({
        title: item.title,
        icon: ICON_MAP[item.icon],
        url: item.url,
        badge: item.badge,
        description: item.description,
      }))
    : mainMenuItems;

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TM</span>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-sm">TEAMMOVE</h2>
            {userRole === "company" && plan && (
              <PlanBadge plan={plan.tier as PlanTier} className="mt-1" />
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
              {convertedMainMenuItems.map((item: any) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    title={item.description}
                  >
                    <Link href={item.url} data-testid={`link-sidebar-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userRole === "company" && (
          <SidebarGroup>
            <SidebarGroupLabel>Paramètres</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location === item.url}
                      title={item.description}
                    >
                      <Link 
                        href={item.url} 
                        data-testid={`link-sidebar-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {userRole === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Paramètres</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === "/admin/settings"}
                  >
                    <Link href="/admin/settings" data-testid="link-sidebar-settings">
                      <Settings className="h-4 w-4" />
                      <span>Paramètres</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
