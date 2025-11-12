import { usePlanFeatures } from '@/contexts/PlanFeaturesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  Check, 
  X, 
  Calendar, 
  Users, 
  Car, 
  BarChart3, 
  Bell, 
  Database, 
  Code2, 
  Image, 
  Palette, 
  Headphones,
  Puzzle,
  Zap
} from 'lucide-react';

export default function PlanFeatures() {
  const { planData, isLoading } = usePlanFeatures();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Aucun plan trouvé</div>
      </div>
    );
  }

  const features = [
    {
      name: 'Événements',
      key: 'maxEvents' as const,
      icon: Calendar,
      description: planData.features.maxEvents 
        ? `Maximum ${planData.features.maxEvents} événements` 
        : 'Événements illimités',
      available: true,
    },
    {
      name: 'Participants',
      key: 'maxParticipants' as const,
      icon: Users,
      description: planData.features.maxParticipants 
        ? `Maximum ${planData.features.maxParticipants} participants` 
        : 'Participants illimités',
      available: true,
    },
    {
      name: 'Véhicules',
      key: 'maxVehicles' as const,
      icon: Car,
      description: planData.features.maxVehicles 
        ? `Maximum ${planData.features.maxVehicles} véhicules` 
        : 'Véhicules illimités',
      available: true,
    },
    {
      name: 'Rapports avancés',
      key: 'hasAdvancedReporting' as const,
      icon: BarChart3,
      description: 'Statistiques et analyses détaillées',
      available: planData.features.hasAdvancedReporting,
    },
    {
      name: 'Notifications',
      key: 'hasNotifications' as const,
      icon: Bell,
      description: 'Alertes par email et SMS',
      available: planData.features.hasNotifications,
    },
    {
      name: 'CRM',
      key: 'hasCRM' as const,
      icon: Database,
      description: 'Gestion de la relation client',
      available: planData.features.hasCRM,
    },
    {
      name: 'Accès API',
      key: 'hasAPI' as const,
      icon: Code2,
      description: 'Intégration via API REST',
      available: planData.features.hasAPI,
    },
    {
      name: 'Logo personnalisé',
      key: 'hasCustomLogo' as const,
      icon: Image,
      description: 'Ajoutez votre logo',
      available: planData.features.hasCustomLogo,
    },
    {
      name: 'White Label',
      key: 'hasWhiteLabel' as const,
      icon: Palette,
      description: 'Interface aux couleurs de votre marque',
      available: planData.features.hasWhiteLabel,
    },
    {
      name: 'Support dédié',
      key: 'hasDedicatedSupport' as const,
      icon: Headphones,
      description: 'Support prioritaire 24/7',
      available: planData.features.hasDedicatedSupport,
    },
    {
      name: 'Intégrations',
      key: 'hasIntegrations' as const,
      icon: Puzzle,
      description: 'Connectez vos outils favoris',
      available: planData.features.hasIntegrations,
    },
  ];

  const availableFeatures = features.filter(f => f.available);
  const unavailableFeatures = features.filter(f => !f.available);

  const tierColors = {
    DECOUVERTE: 'bg-blue-500',
    ESSENTIEL: 'bg-green-500',
    PRO: 'bg-purple-500',
    PREMIUM: 'bg-amber-500',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Mon Abonnement</h1>
            <p className="text-muted-foreground">
              Gérez votre plan et découvrez les fonctionnalités disponibles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${tierColors[planData.tier]}`} />
            <Badge variant="outline" className="text-base" data-testid="badge-current-plan">
              Plan {planData.name}
            </Badge>
          </div>
        </div>
        
        {planData.quotePending && !planData.isActive && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Votre demande de devis est en cours de traitement. Vous serez contacté sous 24h.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Available Features */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Fonctionnalités incluses
          </CardTitle>
          <CardDescription>
            Fonctionnalités disponibles avec votre plan actuel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {availableFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                  data-testid={`feature-available-${feature.key}`}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1">{feature.name}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Unavailable Features */}
      {unavailableFeatures.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-muted-foreground" />
              Fonctionnalités premium
            </CardTitle>
            <CardDescription>
              Passez à un plan supérieur pour débloquer ces fonctionnalités
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {unavailableFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.key}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 opacity-60"
                    data-testid={`feature-locked-${feature.key}`}
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm mb-1">{feature.name}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
            <Link href="/billing">
              <Button className="w-full" data-testid="button-upgrade-plan">
                <Zap className="mr-2 h-4 w-4" />
                Améliorer mon plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
