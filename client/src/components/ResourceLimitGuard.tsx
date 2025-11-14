import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";
import { canAddResource, type PlanTier } from "@/lib/plan-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ResourceLimitGuardProps {
  children: ReactNode | ((props: { canAdd: boolean; limit: number | null; current: number }) => ReactNode);
  resourceType: "events" | "participants" | "vehicles";
  currentCount: number;
  onLimitReached?: () => void;
}

/**
 * Composant pour gérer les limites de ressources par plan
 * Affiche des alertes et bloque la création si la limite est atteinte
 */
export function ResourceLimitGuard({
  children,
  resourceType,
  currentCount,
  onLimitReached,
}: ResourceLimitGuardProps) {
  const { plan } = useAuth();
  const planTier = plan?.tier as PlanTier;

  const { canAdd, limit, reason } = canAddResource(
    planTier,
    resourceType,
    currentCount
  );

  // Si c'est une fonction, on passe les props
  if (typeof children === "function") {
    return children({ canAdd, limit, current: currentCount });
  }

  // Si l'utilisateur peut ajouter, on affiche le contenu normal
  if (canAdd) {
    return <>{children}</>;
  }

  // Si la limite est atteinte, appeler le callback
  if (onLimitReached) {
    onLimitReached();
  }

  // Afficher un message de limite atteinte
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Limite atteinte</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{reason}</p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/billing">Passer au plan supérieur</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Hook pour obtenir les informations de limite d'une ressource
 */
export function useResourceLimit(
  resourceType: "events" | "participants" | "vehicles",
  currentCount: number
) {
  const { plan } = useAuth();
  const planTier = plan?.tier as PlanTier;

  const result = canAddResource(planTier, resourceType, currentCount);

  const percentage = result.limit
    ? Math.min((currentCount / result.limit) * 100, 100)
    : 0;

  const isNearLimit = result.limit ? percentage >= 80 : false;
  const isAtLimit = !result.canAdd;

  return {
    ...result,
    percentage,
    isNearLimit,
    isAtLimit,
    remaining: result.limit ? Math.max(result.limit - currentCount, 0) : null,
  };
}

/**
 * Composant pour afficher une jauge de progression de la limite
 */
interface ResourceLimitProgressProps {
  resourceType: "events" | "participants" | "vehicles";
  currentCount: number;
  label?: string;
  showUpgrade?: boolean;
}

export function ResourceLimitProgress({
  resourceType,
  currentCount,
  label,
  showUpgrade = true,
}: ResourceLimitProgressProps) {
  const { percentage, limit, remaining, isNearLimit, isAtLimit } =
    useResourceLimit(resourceType, currentCount);

  if (limit === null) {
    return null; // Pas de limite = pas d'affichage
  }

  const resourceLabels = {
    events: "événements",
    participants: "participants",
    vehicles: "véhicules",
  };

  const resourceLabel = label || resourceLabels[resourceType];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {currentCount} / {limit === null ? "∞" : limit} {resourceLabel}
        </span>
        {remaining !== null && remaining > 0 && (
          <span className="text-muted-foreground">
            {remaining} restant{remaining > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${
          isAtLimit
            ? "bg-red-100"
            : isNearLimit
            ? "bg-yellow-100"
            : "bg-gray-100"
        }`}
      />
      {isNearLimit && !isAtLimit && showUpgrade && (
        <Alert variant="default" className="mt-2">
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Limite bientôt atteinte</AlertTitle>
          <AlertDescription>
            Vous approchez de votre limite de {resourceLabel}.{" "}
            <Link href="/billing" className="underline font-medium">
              Passez au plan supérieur
            </Link>
          </AlertDescription>
        </Alert>
      )}
      {isAtLimit && showUpgrade && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Limite atteinte</AlertTitle>
          <AlertDescription>
            Vous avez atteint votre limite de {resourceLabel}.{" "}
            <Link href="/billing" className="underline font-medium">
              Passez au plan supérieur
            </Link>{" "}
            pour en ajouter davantage.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Modal de limite atteinte
 */
interface LimitReachedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: "events" | "participants" | "vehicles";
  limit: number;
}

export function LimitReachedDialog({
  open,
  onOpenChange,
  resourceType,
  limit,
}: LimitReachedDialogProps) {
  const resourceLabels = {
    events: "événements",
    participants: "participants",
    vehicles: "véhicules",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Limite atteinte</DialogTitle>
          <DialogDescription>
            Vous avez atteint votre limite de {limit}{" "}
            {resourceLabels[resourceType]} pour votre plan actuel.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Pour créer davantage de {resourceLabels[resourceType]}, vous devez
            passer à un plan supérieur offrant des limites plus élevées ou
            illimitées.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button asChild>
            <Link href="/billing">Voir les plans</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
