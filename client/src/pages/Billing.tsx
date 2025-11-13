import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Zap, Crown, Rocket, ArrowRight, Clock } from 'lucide-react';
import { useLocation } from 'wouter';

interface Plan {
  id: string;
  tier: 'DECOUVERTE' | 'ESSENTIEL' | 'PRO' | 'PREMIUM';
  name: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  features: {
    maxEvents: number | null;
    maxParticipants: number | null;
    maxVehicles: number | null;
    hasAdvancedReporting: boolean;
    hasNotifications: boolean;
    hasCRM: boolean;
    hasAPI: boolean;
    hasCustomLogo: boolean;
    hasWhiteLabel: boolean;
    hasDedicatedSupport: boolean;
    hasIntegrations: boolean;
  };
  requiresQuote: boolean;
  isActive: boolean;
}

interface DashboardStats {
  company: {
    name: string;
    siren: string;
  };
  plan: {
    tier: string;
    status: string;
    quotePending: boolean;
  };
}

export default function Billing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Fetch all plans
  const { data: plansData } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
  });

  // Fetch current company stats with plan info
  const { data: statsData } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  // Upgrade plan mutation
  const upgradePlan = useMutation({
    mutationFn: async (data: { targetPlanId: string; billingCycle: 'monthly' | 'annual' }) => {
      const res = await fetch('/api/plans/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors du changement de plan');
      }

      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresPayment) {
        // Redirect to Stripe checkout
        toast({
          title: 'Redirection vers le paiement',
          description: 'Vous allez être redirigé vers la page de paiement sécurisée.',
        });
        window.location.href = data.stripeCheckoutUrl;
      } else if (data.requiresQuote) {
        // Show message that request has been sent
        toast({
          title: 'Demande envoyée',
          description: 'Un administrateur va vous contacter pour établir un devis personnalisé.',
        });
        // Redirect to support page
        navigate('/support');
      } else {
        // Plan changed successfully
        toast({
          title: 'Plan changé',
          description: 'Votre plan a été changé avec succès.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/plans/current-features'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUpgrade = (planId: string, requiresQuote: boolean) => {
    if (!planId) return;

    if (requiresQuote) {
      // For quote-based plans, use monthly by default
      upgradePlan.mutate({ targetPlanId: planId, billingCycle: 'monthly' });
    } else {
      // Show billing cycle selection
      setSelectedPlanId(planId);
    }
  };

  const confirmUpgrade = () => {
    if (!selectedPlanId) return;

    upgradePlan.mutate({
      targetPlanId: selectedPlanId,
      billingCycle,
    });

    setSelectedPlanId('');
  };

  const getPlanIcon = (tier: string) => {
    const icons = {
      DECOUVERTE: <Zap className="w-6 h-6" />,
      ESSENTIEL: <Rocket className="w-6 h-6" />,
      PRO: <Crown className="w-6 h-6" />,
      PREMIUM: <Crown className="w-6 h-6" />,
    };
    return icons[tier as keyof typeof icons] || icons.DECOUVERTE;
  };

  const getPlanColor = (tier: string) => {
    const colors = {
      DECOUVERTE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
      ESSENTIEL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      PRO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      PREMIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    };
    return colors[tier as keyof typeof colors] || colors.DECOUVERTE;
  };

  const currentPlanTier = statsData?.plan?.tier || 'DECOUVERTE';
  const isQuotePending = statsData?.plan?.quotePending || false;

  const renderFeatureList = (features: Plan['features']) => {
    const featuresList = [
      features.maxEvents && `${features.maxEvents} événements max`,
      features.maxParticipants && `${features.maxParticipants} participants par événement`,
      features.maxVehicles && `${features.maxVehicles} véhicules`,
      features.hasAdvancedReporting && 'Reporting avancé',
      features.hasNotifications && 'Notifications automatiques',
      features.hasCRM && 'CRM intégré',
      features.hasAPI && 'Accès API',
      features.hasCustomLogo && 'Logo personnalisé',
      features.hasWhiteLabel && 'Marque blanche',
      features.hasDedicatedSupport && 'Support dédié',
      features.hasIntegrations && 'Intégrations tierces',
    ].filter(Boolean);

    return featuresList.map((feature, index) => (
      <li key={index} className="flex items-start">
        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
        <span>{feature}</span>
      </li>
    ));
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestion de l'abonnement</h1>
        <p className="text-muted-foreground">
          Gérez votre abonnement et changez de plan à tout moment
        </p>
      </div>

      {isQuotePending && (
        <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Devis en attente
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Votre demande de devis pour un plan supérieur est en cours de traitement. 
                  Un administrateur va vous contacter prochainement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {statsData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Plan actuel</CardTitle>
            <CardDescription>
              {statsData.company.name} - SIREN: {statsData.company.siren}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {getPlanIcon(currentPlanTier)}
              <div>
                <h3 className="text-2xl font-bold">{currentPlanTier}</h3>
                <p className="text-sm text-muted-foreground">
                  {isQuotePending ? 'En attente de validation' : 'Plan actif'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plansData?.map((plan) => {
          const isCurrentPlan = plan.tier === currentPlanTier;
          const price = billingCycle === 'monthly' 
            ? parseFloat(plan.monthlyPrice) 
            : parseFloat(plan.annualPrice) / 12;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                isCurrentPlan ? 'border-primary shadow-lg' : ''
              }`}
            >
              {isCurrentPlan && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Plan actuel
                </Badge>
              )}

              <CardHeader>
                <div className={`p-3 rounded-lg w-fit ${getPlanColor(plan.tier)}`}>
                  {getPlanIcon(plan.tier)}
                </div>
                <CardTitle className="mt-4">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    {plan.tier === 'DECOUVERTE' ? (
                      'Gratuit'
                    ) : plan.requiresQuote ? (
                      'Sur devis'
                    ) : (
                      <>
                        {price.toFixed(2)}€
                        <span className="text-sm font-normal text-muted-foreground">/mois</span>
                      </>
                    )}
                  </div>
                  {!plan.requiresQuote && billingCycle === 'annual' && plan.tier !== 'DECOUVERTE' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Facturé {plan.annualPrice}€ annuellement
                    </p>
                  )}
                </div>

                <ul className="space-y-2 text-sm">
                  {renderFeatureList(plan.features)}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrentPlan ? (
                  <Button disabled className="w-full">
                    Plan actuel
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(plan.id, plan.requiresQuote)}
                    className="w-full"
                    disabled={upgradePlan.isPending}
                  >
                    {plan.requiresQuote ? (
                      <>Demander un devis</>
                    ) : (
                      <>
                        Choisir ce plan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Billing cycle selector dialog */}
      {selectedPlanId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Choisissez la facturation</CardTitle>
              <CardDescription>
                Sélectionnez votre cycle de facturation préféré
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={billingCycle} onValueChange={(value: 'monthly' | 'annual') => setBillingCycle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="annual">Annuel (économisez 2 mois)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={confirmUpgrade} disabled={upgradePlan.isPending}>
                {upgradePlan.isPending ? 'Traitement...' : 'Continuer'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedPlanId('')}
                disabled={upgradePlan.isPending}
              >
                Annuler
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
