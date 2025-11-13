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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  MessageCircle,
  FileText,
  Bell,
  Send,
  Building2,
  Zap,
  Crown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";

// Interface pour les éléments de menu avec conditions d'affichage
interface MenuItem {
  title: string;
  url: string;
  icon: any;
  requiredPlan?: ('DECOUVERTE' | 'ESSENTIEL' | 'PRO' | 'PREMIUM')[];
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

// Menu items de base (accessibles à tous)
const baseMenuItems: MenuItem[] = [
  {
    title: "Tableau de bord",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Événements",
    url: "/events",
    icon: Calendar,
  },
  {
    title: "Participants",
    url: "/participants",
    icon: Users,
  },
];

// Menu items conditionnels par plan
const conditionalMenuItems: MenuItem[] = [
  {
    title: "Véhicules",
    url: "/vehicles",
    icon: Car,
    requiredPlan: ['ESSENTIEL', 'PRO', 'PREMIUM'], // Masqué pour DECOUVERTE
  },
  {
    title: "Statistiques",
    url: "/stats",
    icon: BarChart3,
    requiredPlan: ['ESSENTIEL', 'PRO', 'PREMIUM'], // Masqué pour DECOUVERTE
  },
];

// Fonctionnalités avancées par plan
const advancedFeatures: MenuItem[] = [
  {
    title: "Reporting avancé",
    url: "/reporting",
    icon: FileText,
    requiredPlan: ['ESSENTIEL', 'PRO', 'PREMIUM'],
    badge: "ESSENTIEL+",
    badgeVariant: 'secondary',
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    requiredPlan: ['ESSENTIEL', 'PRO', 'PREMIUM'],
    badge: "ESSENTIEL+",
    badgeVariant: 'secondary',
  },
  {
    title: "Messagerie diffusion",
    url: "/broadcast",
    icon: Send,
    requiredPlan: ['ESSENTIEL', 'PRO', 'PREMIUM'],
    badge: "ESSENTIEL+",
    badgeVariant: 'secondary',
  },
  {
    title: "CRM",
    url: "/crm",
    icon: Building2,
    requiredPlan: ['PRO', 'PREMIUM'],
    badge: "PRO+",
    badgeVariant: 'default',
  },
  {
    title: "Stats avancées",
    url: "/advanced-stats",
    icon: BarChart3,
    requiredPlan: ['PRO', 'PREMIUM'],
    badge: "PRO+",
    badgeVariant: 'default',
  },
  {
    title: "Logo personnalisé",
    url: "/branding",
    icon: Crown,
    requiredPlan: ['PRO', 'PREMIUM'],
    badge: "PRO+",
    badgeVariant: 'default',
  },
  {
    title: "Intégrations",
    url: "/integrations",
    icon: Zap,
    requiredPlan: ['PREMIUM'],
    badge: "PREMIUM",
    badgeVariant: 'default',
  },
];

// Items toujours présents
const settingsItems: MenuItem[] = [
  {
    title: "Paramètres",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Abonnement",
    url: "/billing",
    icon: CreditCard,
  },
  {
    title: "Support",
    url: "/support",
    icon: MessageCircle,
  },
];

export function CompanySidebar() {
  const [location] = useLocation();
  const { user, company, logout } = useAuth();
  const { planData } = usePlanFeatures();

  // Détermine si un item de menu doit être affiché
  const shouldShowMenuItem = (item: MenuItem): boolean => {
    if (!item.requiredPlan) return true; // Items de base toujours affichés
    if (!planData) return false;
    return item.requiredPlan.includes(planData.tier);
  };

  // Filtre les menus selon le plan
  const visibleBaseItems = baseMenuItems;
  const visibleConditionalItems = conditionalMenuItems.filter(shouldShowMenuItem);
  const visibleAdvancedFeatures = advancedFeatures.filter(shouldShowMenuItem);

  const getPlanBadge = () => {
    if (!planData) return null;
    
    const badgeConfig: Record<string, { color: string; label: string }> = {
      DECOUVERTE: { color: "bg-blue-500", label: "Découverte" },
      ESSENTIEL: { color: "bg-green-500", label: "Essentiel" },
      PRO: { color: "bg-purple-500", label: "Pro" },
      PREMIUM: { color: "bg-amber-500", label: "Premium" },
    };

    const config = badgeConfig[planData.tier] || badgeConfig.DECOUVERTE;

    return (
      <div className="flex items-center gap-2 mt-1">
        <div className={`h-2 w-2 rounded-full ${config.color}`} />
        <span className="text-xs text-muted-foreground">{config.label}</span>
      </div>
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">TM</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="font-semibold text-sm">TEAMMOVE</h2>
            <p className="text-xs text-muted-foreground truncate">
              {company?.name || "Entreprise"}
            </p>
            {getPlanBadge()}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Menu principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[...visibleBaseItems, ...visibleConditionalItems].map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`sidebar-link-${item.url.substring(1)}`}
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

        {/* Fonctionnalités avancées (si disponibles pour le plan) */}
        {visibleAdvancedFeatures.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Fonctionnalités avancées</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdvancedFeatures.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`sidebar-link-${item.url.substring(1)}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge variant={item.badgeVariant} className="text-[10px] px-1.5 py-0">
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
        )}

        {/* Paramètres et Support */}
        <SidebarGroup>
          <SidebarGroupLabel>Paramètres</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`sidebar-link-${item.url.substring(1)}`}
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

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
