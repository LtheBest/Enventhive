/**
 * Configuration des permissions et fonctionnalités par plan d'abonnement
 * Ce fichier centralise toutes les règles d'accès aux fonctionnalités de l'application
 */

import { PlanFeatures } from "@/contexts/PlanFeaturesContext";

export type PlanTier = "DECOUVERTE" | "ESSENTIEL" | "PRO" | "PREMIUM";

/**
 * Configuration des items de menu disponibles par plan
 */
export interface MenuItem {
  title: string;
  icon: string; // Nom de l'icône Lucide
  url: string;
  requiredPlan?: PlanTier; // Plan minimum requis
  requiredFeature?: keyof PlanFeatures; // Feature requise
  description?: string;
  badge?: string; // Badge à afficher (ex: "Pro", "Premium")
}

/**
 * Hiérarchie des plans (du moins au plus premium)
 */
export const PLAN_HIERARCHY: Record<PlanTier, number> = {
  DECOUVERTE: 0,
  ESSENTIEL: 1,
  PRO: 2,
  PREMIUM: 3,
};

/**
 * Vérifie si un plan est suffisant pour accéder à une fonctionnalité
 */
export function hasSufficientPlan(
  userPlan: PlanTier,
  requiredPlan?: PlanTier
): boolean {
  if (!requiredPlan) return true;
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Items de menu de base (toujours disponibles pour tous les plans)
 */
export const BASE_MENU_ITEMS: MenuItem[] = [
  {
    title: "Tableau de bord",
    icon: "LayoutDashboard",
    url: "/dashboard",
    description: "Vue d'ensemble de votre activité",
  },
  {
    title: "Événements",
    icon: "Calendar",
    url: "/events",
    description: "Gérer vos événements",
  },
  {
    title: "Participants",
    icon: "Users",
    url: "/participants",
    description: "Gérer les participants",
  },
];

/**
 * Items de menu spécifiques au plan Essentiel
 */
export const ESSENTIEL_MENU_ITEMS: MenuItem[] = [
  {
    title: "Véhicules",
    icon: "Car",
    url: "/vehicles",
    requiredPlan: "ESSENTIEL",
    description: "Gérer jusqu'à 50 véhicules",
  },
  {
    title: "Reporting",
    icon: "FileText",
    url: "/reporting",
    requiredPlan: "ESSENTIEL",
    requiredFeature: "hasAdvancedReporting",
    description: "Rapports avancés",
    badge: "Essentiel",
  },
  {
    title: "Notifications",
    icon: "Bell",
    url: "/notifications",
    requiredPlan: "ESSENTIEL",
    requiredFeature: "hasNotifications",
    description: "Notifications en temps réel",
    badge: "Essentiel",
  },
  {
    title: "Messagerie",
    icon: "MessageSquare",
    url: "/broadcast",
    requiredPlan: "ESSENTIEL",
    requiredFeature: "hasNotifications",
    description: "Diffusion de messages aux participants",
    badge: "Essentiel",
  },
];

/**
 * Items de menu spécifiques au plan Pro
 */
export const PRO_MENU_ITEMS: MenuItem[] = [
  {
    title: "CRM",
    icon: "Users2",
    url: "/crm",
    requiredPlan: "PRO",
    requiredFeature: "hasCRM",
    description: "Gestion de la relation client",
    badge: "Pro",
  },
  {
    title: "Statistiques",
    icon: "BarChart3",
    url: "/advanced-stats",
    requiredPlan: "PRO",
    requiredFeature: "hasAdvancedReporting",
    description: "Statistiques avancées",
    badge: "Pro",
  },
  {
    title: "Véhicules",
    icon: "Car",
    url: "/vehicles",
    requiredPlan: "PRO",
    description: "Gérer jusqu'à 100 véhicules",
  },
  {
    title: "Personnalisation",
    icon: "Palette",
    url: "/branding",
    requiredPlan: "PRO",
    requiredFeature: "hasCustomLogo",
    description: "Personnaliser le logo du dashboard",
    badge: "Pro",
  },
];

/**
 * Items de menu spécifiques au plan Premium
 */
export const PREMIUM_MENU_ITEMS: MenuItem[] = [
  {
    title: "Intégrations",
    icon: "Puzzle",
    url: "/integrations",
    requiredPlan: "PREMIUM",
    requiredFeature: "hasIntegrations",
    description: "Intégrations spécifiques",
    badge: "Premium",
  },
  {
    title: "API",
    icon: "Code",
    url: "/api-access",
    requiredPlan: "PREMIUM",
    requiredFeature: "hasAPI",
    description: "Accès API complet",
    badge: "Premium",
  },
  {
    title: "Véhicules",
    icon: "Car",
    url: "/vehicles",
    requiredPlan: "PREMIUM",
    description: "Véhicules illimités",
  },
];

/**
 * Items de menu de paramètres (toujours disponibles)
 */
export const SETTINGS_MENU_ITEMS: MenuItem[] = [
  {
    title: "Paramètres",
    icon: "Settings",
    url: "/settings",
    description: "Paramètres du compte",
  },
  {
    title: "Abonnement",
    icon: "CreditCard",
    url: "/billing",
    description: "Gérer votre abonnement",
  },
  {
    title: "Support",
    icon: "HelpCircle",
    url: "/support",
    description: "Contacter le support",
  },
];

/**
 * Retourne les items de menu disponibles pour un plan donné
 */
export function getMenuItemsForPlan(
  planTier: PlanTier,
  planFeatures?: PlanFeatures
): MenuItem[] {
  let menuItems: MenuItem[] = [...BASE_MENU_ITEMS];

  // Pour le plan Découverte, on limite aux items de base
  if (planTier === "DECOUVERTE") {
    // Pas de véhicules ni de statistiques pour Découverte
    return menuItems;
  }

  // Ajouter les items selon le plan
  if (hasSufficientPlan(planTier, "ESSENTIEL")) {
    menuItems = [...menuItems, ...ESSENTIEL_MENU_ITEMS];
  }

  if (hasSufficientPlan(planTier, "PRO")) {
    // Remplacer l'item véhicules Essentiel par celui du Pro
    menuItems = menuItems.filter(item => 
      !(item.url === "/vehicles" && item.requiredPlan === "ESSENTIEL")
    );
    menuItems = [...menuItems, ...PRO_MENU_ITEMS];
  }

  if (hasSufficientPlan(planTier, "PREMIUM")) {
    // Remplacer l'item véhicules Pro par celui du Premium
    menuItems = menuItems.filter(item => 
      !(item.url === "/vehicles" && item.requiredPlan === "PRO")
    );
    menuItems = [...menuItems, ...PREMIUM_MENU_ITEMS];
  }

  // Filtrer les doublons par URL (garder le plus récent/premium)
  const uniqueMenuItems = Array.from(
    new Map(menuItems.map(item => [item.url, item])).values()
  );

  // Filtrer selon les features disponibles si fourni
  if (planFeatures) {
    return uniqueMenuItems.filter(item => {
      if (!item.requiredFeature) return true;
      return planFeatures[item.requiredFeature] === true;
    });
  }

  return uniqueMenuItems;
}

/**
 * Retourne les limites pour un plan donné
 */
export interface PlanLimits {
  maxEvents: number | null; // null = illimité
  maxParticipants: number | null;
  maxVehicles: number | null;
}

export function getPlanLimits(planTier: PlanTier): PlanLimits {
  switch (planTier) {
    case "DECOUVERTE":
      return {
        maxEvents: 2, // Maximum 2 événements
        maxParticipants: 10, // Maximum 10 participants
        maxVehicles: 0, // Pas de véhicules
      };
    case "ESSENTIEL":
      return {
        maxEvents: null, // Illimité
        maxParticipants: 500,
        maxVehicles: 50,
      };
    case "PRO":
      return {
        maxEvents: null,
        maxParticipants: 5000,
        maxVehicles: 100,
      };
    case "PREMIUM":
      return {
        maxEvents: null,
        maxParticipants: 10000,
        maxVehicles: null, // Illimité
      };
    default:
      return {
        maxEvents: 0,
        maxParticipants: 0,
        maxVehicles: 0,
      };
  }
}

/**
 * Vérifie si l'utilisateur peut ajouter une ressource
 */
export function canAddResource(
  planTier: PlanTier,
  resourceType: "events" | "participants" | "vehicles",
  currentCount: number
): { canAdd: boolean; limit: number | null; reason?: string } {
  const limits = getPlanLimits(planTier);
  let limit: number | null = null;

  switch (resourceType) {
    case "events":
      limit = limits.maxEvents;
      break;
    case "participants":
      limit = limits.maxParticipants;
      break;
    case "vehicles":
      limit = limits.maxVehicles;
      break;
  }

  if (limit === null) {
    return { canAdd: true, limit: null }; // Illimité
  }

  if (limit === 0) {
    return {
      canAdd: false,
      limit: 0,
      reason: `Cette fonctionnalité n'est pas disponible dans votre plan ${planTier}`,
    };
  }

  if (currentCount >= limit) {
    return {
      canAdd: false,
      limit,
      reason: `Vous avez atteint la limite de ${limit} ${resourceType} pour votre plan ${planTier}`,
    };
  }

  return { canAdd: true, limit };
}

/**
 * Retourne un message d'upgrade pour inciter à passer au plan supérieur
 */
export function getUpgradeMessage(
  currentPlan: PlanTier,
  feature: string
): string {
  const nextPlan = getNextPlan(currentPlan);
  if (!nextPlan) {
    return `Cette fonctionnalité nécessite un plan supérieur.`;
  }
  return `Passez au plan ${nextPlan} pour débloquer ${feature}.`;
}

/**
 * Retourne le plan suivant dans la hiérarchie
 */
export function getNextPlan(currentPlan: PlanTier): PlanTier | null {
  const plans: PlanTier[] = ["DECOUVERTE", "ESSENTIEL", "PRO", "PREMIUM"];
  const currentIndex = plans.indexOf(currentPlan);
  if (currentIndex === -1 || currentIndex === plans.length - 1) {
    return null;
  }
  return plans[currentIndex + 1];
}
