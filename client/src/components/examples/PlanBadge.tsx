import { PlanBadge } from '../PlanBadge';

export default function PlanBadgeExample() {
  return (
    <div className="p-4 flex flex-wrap gap-3">
      <PlanBadge plan="DECOUVERTE" />
      <PlanBadge plan="ESSENTIEL" />
      <PlanBadge plan="PRO" />
      <PlanBadge plan="PREMIUM" />
    </div>
  );
}
