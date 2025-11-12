import { ReactNode } from 'react';
import { usePlanFeatures, PlanFeatures } from '@/contexts/PlanFeaturesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Zap } from 'lucide-react';
import { Link } from 'wouter';

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
}

export function FeatureGate({ feature, children, fallback, featureName }: FeatureGateProps) {
  const { hasFeature, planData } = usePlanFeatures();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg mb-2">
          Fonctionnalité Premium
        </CardTitle>
        <CardDescription className="text-center max-w-md mb-6">
          {featureName || 'Cette fonctionnalité'} est disponible avec les plans PRO et PREMIUM.
          Votre plan actuel : <strong>{planData?.name || 'Découverte'}</strong>
        </CardDescription>
        <Link href="/billing">
          <Button data-testid="button-upgrade-to-unlock">
            <Zap className="mr-2 h-4 w-4" />
            Améliorer mon plan
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

interface LimitGateProps {
  resourceType: 'events' | 'participants' | 'vehicles';
  currentCount: number;
  children: ReactNode;
  resourceName?: string;
}

export function LimitGate({ resourceType, currentCount, children, resourceName }: LimitGateProps) {
  const { canAddMore, getLimit, planData } = usePlanFeatures();

  if (canAddMore(resourceType, currentCount)) {
    return <>{children}</>;
  }

  const limit = getLimit(resourceType);
  const resourceLabel = resourceName || {
    events: 'événements',
    participants: 'participants',
    vehicles: 'véhicules',
  }[resourceType];

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      <CardContent className="flex flex-col items-center justify-center py-8 px-4">
        <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
          <Lock className="h-7 w-7 text-amber-600 dark:text-amber-500" />
        </div>
        <CardTitle className="text-base mb-2">
          Limite atteinte
        </CardTitle>
        <CardDescription className="text-center max-w-md mb-4">
          Vous avez atteint la limite de {limit} {resourceLabel} pour votre plan{' '}
          <strong>{planData?.name || 'Découverte'}</strong>.
        </CardDescription>
        <Link href="/billing">
          <Button variant="default" size="sm" data-testid="button-upgrade-limit">
            <Zap className="mr-2 h-4 w-4" />
            Passer à un plan supérieur
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
