import { UpgradePrompt } from '../UpgradePrompt';

export default function UpgradePromptExample() {
  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <UpgradePrompt
        currentPlan="DECOUVERTE"
        targetPlan="Pro"
        featureName="Statistiques avancées"
      />
      <UpgradePrompt
        currentPlan="ESSENTIEL"
        targetPlan="Premium"
        featureName="Marque blanche"
      />
    </div>
  );
}
