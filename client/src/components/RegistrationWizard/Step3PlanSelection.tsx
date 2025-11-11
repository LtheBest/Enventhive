import { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Check, Loader2, Zap, Building2, Rocket, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import type { NestedRegistrationData } from "./types";
import type { plans } from "@/../../shared/schema";

type Plan = typeof plans.$inferSelect;

const PLAN_ICONS = {
  DECOUVERTE: Zap,
  ESSENTIEL: Building2,
  PRO: Rocket,
  PREMIUM: Crown,
} as const;

interface Step3Props {
  onNext: () => void;
  onBack: () => void;
  onPlanSelected: (planId: string, tier: string) => void;
}

export function Step3PlanSelection({ onNext, onBack, onPlanSelected }: Step3Props) {
  const { control, watch, setValue } = useFormContext<NestedRegistrationData>();
  const selectedPlanId = watch("step3.planId");

  // Fetch available plans
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
  });

  const handleNext = () => {
    if (!selectedPlanId) {
      alert("Veuillez sélectionner un plan");
      return;
    }
    onNext();
  };

  if (isLoading) {
    return (
      <Card className="w-full" data-testid="card-step3-plan">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3">Chargement des plans...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full" data-testid="card-step3-plan">
      <CardHeader>
        <CardTitle>Choisissez votre plan</CardTitle>
        <CardDescription>
          Sélectionnez le plan qui correspond le mieux à vos besoins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Controller
          name="step3.planId"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value || ""}
              onValueChange={(value) => {
                const plan = plans?.find(p => p.id === value);
                if (plan) {
                  field.onChange(value); // planId is UUID string
                  setValue("step3.planTier", plan.tier);
                  onPlanSelected(value, plan.tier);
                }
              }}
              className="grid gap-4"
            >
              {plans?.map((plan) => {
                const Icon = PLAN_ICONS[plan.tier as keyof typeof PLAN_ICONS] || Zap;
                const isSelected = selectedPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover-elevate"
                    }`}
                    data-testid={`card-plan-${plan.tier.toLowerCase()}`}
                  >
                    <RadioGroupItem
                      value={plan.id.toString()}
                      id={`plan-${plan.id}`}
                      className="mt-1"
                      data-testid={`radio-plan-${plan.tier.toLowerCase()}`}
                    />
                    <Label
                      htmlFor={`plan-${plan.id}`}
                      className="flex-1 cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">{plan.name}</h3>
                        </div>
                        {plan.tier === "DECOUVERTE" && (
                          <Badge variant="outline">Gratuit</Badge>
                        )}
                        {plan.tier === "ESSENTIEL" && (
                          <Badge variant="default">Populaire</Badge>
                        )}
                        {plan.tier === "PRO" && (
                          <Badge variant="outline">Sur devis</Badge>
                        )}
                        {plan.tier === "PREMIUM" && (
                          <Badge variant="outline">Sur devis</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>

                      <div className="flex items-baseline gap-1">
                        {plan.monthlyPrice && parseFloat(plan.monthlyPrice) > 0 ? (
                          <>
                            <span className="text-2xl font-bold">{plan.monthlyPrice}€</span>
                            <span className="text-sm text-muted-foreground">/mois</span>
                          </>
                        ) : plan.tier === "DECOUVERTE" ? (
                          <span className="text-2xl font-bold">0€</span>
                        ) : (
                          <span className="text-lg font-semibold text-muted-foreground">
                            Prix personnalisé
                          </span>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 text-sm">
                        {plan.tier === "DECOUVERTE" && (
                          <>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Jusqu'à 3 événements/mois
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Jusqu'à 50 participants/événement
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Gestion basique du covoiturage
                            </li>
                          </>
                        )}
                        {plan.tier === "ESSENTIEL" && (
                          <>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Événements illimités
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Jusqu'à 200 participants/événement
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Optimisation intelligente du covoiturage
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Statistiques et rapports
                            </li>
                          </>
                        )}
                        {plan.tier === "PRO" && (
                          <>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Événements et participants illimités
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              API d'intégration
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Support prioritaire
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Rapports personnalisés
                            </li>
                          </>
                        )}
                        {plan.tier === "PREMIUM" && (
                          <>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Toutes les fonctionnalités PRO
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Gestionnaire de compte dédié
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Déploiement on-premise possible
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              SLA personnalisé
                            </li>
                          </>
                        )}
                      </ul>
                    </Label>

                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          )}
        />

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            data-testid="button-back"
          >
            Précédent
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={!selectedPlanId}
            data-testid="button-next"
          >
            Suivant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
