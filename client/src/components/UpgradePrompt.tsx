import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";

interface UpgradePromptProps {
  currentPlan: string;
  targetPlan: string;
  featureName: string;
  onUpgrade?: () => void;
}

export function UpgradePrompt({ currentPlan, targetPlan, featureName, onUpgrade }: UpgradePromptProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" data-testid="card-upgrade-prompt">
      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">
              Passez au plan {targetPlan}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {featureName} est disponible à partir du plan {targetPlan}. Améliorez votre abonnement pour débloquer cette fonctionnalité.
            </p>
          </div>
        </div>
        <Button 
          className="shrink-0"
          onClick={() => {
            onUpgrade?.();
            console.log('Upgrade to', targetPlan);
          }}
          data-testid="button-upgrade-plan"
        >
          Améliorer
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
