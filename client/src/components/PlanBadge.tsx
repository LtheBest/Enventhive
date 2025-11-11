import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Plan = "DECOUVERTE" | "ESSENTIEL" | "PRO" | "PREMIUM";

interface PlanBadgeProps {
  plan: Plan;
  className?: string;
}

const planConfig: Record<Plan, { label: string; variant: "default" | "secondary" | "outline" }> = {
  DECOUVERTE: { label: "Découverte", variant: "secondary" },
  ESSENTIEL: { label: "Essentiel", variant: "default" },
  PRO: { label: "Pro", variant: "default" },
  PREMIUM: { label: "Premium", variant: "default" },
};

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const config = planConfig[plan];
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn("text-xs font-medium uppercase tracking-wide", className)}
      data-testid={`badge-plan-${plan.toLowerCase()}`}
    >
      {config.label}
    </Badge>
  );
}
