import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";
import {
  hasSufficientPlan,
  getUpgradeMessage,
  type PlanTier,
} from "@/lib/plan-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlanGuardProps {
  children: ReactNode;
  requiredPlan?: PlanTier;
  requiredFeature?: string;
  featureName?: string;
  fallback?: ReactNode;
  mode?: "hide" | "block" | "alert"; // hide = masquer, block = bloquer avec message, alert = afficher alerte
}

/**
 * Composant de protection basé sur le plan d'abonnement
 * Contrôle l'accès aux fonctionnalités selon le plan de l'utilisateur
 */
export function PlanGuard({
  children,
  requiredPlan,
  requiredFeature,
  featureName = "cette fonctionnalité",
  fallback,
  mode = "block",
}: PlanGuardProps) {
  const { plan } = useAuth();
  const { planData, hasFeature } = usePlanFeatures();

  // Vérifier si l'utilisateur a le plan suffisant
  const hasPlan = requiredPlan
    ? hasSufficientPlan(plan?.tier as PlanTier, requiredPlan)
    : true;

  // Vérifier si l'utilisateur a la feature requise
  const hasRequiredFeature = requiredFeature
    ? hasFeature(requiredFeature as any)
    : true;

  // Si l'utilisateur a accès, afficher le contenu
  if (hasPlan && hasRequiredFeature) {
    return <>{children}</>;
  }

  // Mode "hide" : ne rien afficher
  if (mode === "hide") {
    return null;
  }

  // Mode "alert" : afficher une alerte mais aussi le contenu (désactivé)
  if (mode === "alert") {
    return (
      <>
        <Alert variant="default" className="mb-4 border-yellow-500">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle>Fonctionnalité limitée</AlertTitle>
          <AlertDescription>
            {getUpgradeMessage(plan?.tier as PlanTier, featureName)}
          </AlertDescription>
        </Alert>
        {children}
      </>
    );
  }

  // Mode "block" : afficher un message de blocage
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="mx-auto max-w-2xl mt-8">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Fonctionnalité Premium</CardTitle>
        <CardDescription>
          {featureName} n'est pas disponible dans votre plan actuel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Passez au plan supérieur</AlertTitle>
          <AlertDescription>
            {getUpgradeMessage(plan?.tier as PlanTier, featureName)}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 justify-center">
          <Button asChild variant="default">
            <Link href="/billing">Voir les plans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/support">Contacter le support</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook pour vérifier l'accès à une fonctionnalité
 */
export function usePlanAccess(requiredPlan?: PlanTier, requiredFeature?: string) {
  const { plan } = useAuth();
  const { hasFeature } = usePlanFeatures();

  const hasPlan = requiredPlan
    ? hasSufficientPlan(plan?.tier as PlanTier, requiredPlan)
    : true;

  const hasRequiredFeature = requiredFeature
    ? hasFeature(requiredFeature as any)
    : true;

  return {
    hasAccess: hasPlan && hasRequiredFeature,
    hasPlan,
    hasRequiredFeature,
    currentPlan: plan?.tier as PlanTier,
  };
}
