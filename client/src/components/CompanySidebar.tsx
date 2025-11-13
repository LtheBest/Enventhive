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
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";

// Interface pour les éléments de menu avec conditions d'affichage
interface MenuItem {
  title: string;
  url: string;
  icon: any;
  requiredPlan?: ('DECOUVERTE' | 'ESSENTIEL' | 'PRO' | 'PREMIUM')[];
  requiredFeature?: string; // Nom de la feature dans planData.features
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

// Menu items de base (accessibles à tous les plans)
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
// Véhicules et Statistiques sont masqués pour DÉCOUVERTE
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

// Fonctionnalités avancées par plan (ESSENTIEL+)
const essentialFeatures: MenuItem[] = [
  {
    title: "Reporting avancé",
    url: "/reporting",
    icon: FileText,
    requiredFeature: 'hasAdvancedReporting',
    badge: "ESSENTIEL+",
    badgeVariant: 'secondary',
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    requiredFeature: 'hasNotifications',
    badge: "ESSENTIEL+",
    badgeVariant: 'secondary',
  },
  {
    title: "Messagerie diffusion",
    url: "/broadcast",
    icon: Send,
    requiredFeature: 'hasBroadcastMessaging',
    badge: "ESSENTIEL+",
    badgeVariant: 'secondary',
  },
];

// Fonctionnalités PRO+
const proFeatures: MenuItem[] = [
  {
    title: "CRM",
    url: "/crm",
    icon: Building2,
    requiredFeature: 'hasCRM',
    badge: "PRO+",
    badgeVariant: 'default',
  },
  {
    title: "Stats avancées",
    url: "/advanced-stats",
    icon: TrendingUp,
    requiredFeature: 'hasAdvancedStats',
    badge: "PRO+",
    badgeVariant: 'default',
  },
  {
    title: "Intégrations",
    url: "/integrations",
    icon: Zap,
    requiredFeature: 'hasIntegrations',
    badge: "PRO+",
    badgeVariant: 'default',
  },
  {
    title: "Logo personnalisé",
    url: "/branding",
    icon: Crown,
    requiredFeature: 'hasCustomLogo',
    badge: "PRO+",
    badgeVariant: 'default',
  },
];

// Items toujours présents (tous les plans)
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
  const { planData, hasFeature } = usePlanFeatures();

  // Détermine si un item de menu doit être affiché selon le plan
  const shouldShowMenuItem = (item: MenuItem): boolean => {
    // Si requiredPlan est défini, vérifier le plan
    if (item.requiredPlan) {
      if (!planData) return false;
      if (!item.requiredPlan.includes(planData.tier)) return false;
    }
    
    // Si requiredFeature est défini, vérifier la feature
    if (item.requiredFeature) {
      return hasFeature(item.requiredFeature as keyof typeof planData.features);
    }
    
    return true;
  };

  // Filtre les menus selon le plan et les features
  const visibleBaseItems = baseMenuItems;
  const visibleConditionalItems = conditionalMenuItems.filter(shouldShowMenuItem);
  const visibleEssentialFeatures = essentialFeatures.filter(shouldShowMenuItem);
  const visibleProFeatures = proFeatures.filter(shouldShowMenuItem);

  // Combine toutes les fonctionnalités avancées visibles
  const allVisibleAdvancedFeatures = [
    ...visibleEssentialFeatures,
    ...visibleProFeatures,
  ];

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
        {allVisibleAdvancedFeatures.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Fonctionnalités avancées</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {allVisibleAdvancedFeatures.map((item) => (
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

        {/* Paramètres et Support (toujours visibles) */}
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
