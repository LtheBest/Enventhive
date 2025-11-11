import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

type OrganizationType = "club" | "pme" | "grande-entreprise";
type PlanType = "DECOUVERTE" | "ESSENTIEL" | "PRO" | "PREMIUM";

const steps = [
  "Type d'organisme",
  "Plan d'abonnement",
  "Informations",
];

const planDetails: Record<PlanType, { name: string; price: string; features: string[]; requiresQuote: boolean }> = {
  DECOUVERTE: {
    name: "Découverte",
    price: "Gratuit",
    features: ["Gestion basique", "Reporting simple", "Limité à 5 événements"],
    requiresQuote: false,
  },
  ESSENTIEL: {
    name: "Essentiel",
    price: "49€/mois",
    features: ["Reporting avancé", "Notifications", "Support standard", "Événements illimités"],
    requiresQuote: false,
  },
  PRO: {
    name: "Pro",
    price: "Sur devis",
    features: ["CRM intégré", "Statistiques avancées", "API access", "Logo personnalisé"],
    requiresQuote: true,
  },
  PREMIUM: {
    name: "Premium",
    price: "Sur devis",
    features: ["Marque blanche", "Support dédié", "Intégrations tierces", "Tout illimité"],
    requiresQuote: true,
  },
};

export function RegistrationForm() {
  const [step, setStep] = useState(0);
  const [organizationType, setOrganizationType] = useState<OrganizationType>("pme");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("ESSENTIEL");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    siren: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      console.log('Step', step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Submit registration', {
      organizationType,
      plan: selectedPlan,
      ...formData,
    });
    const plan = planDetails[selectedPlan];
    if (plan.requiresQuote) {
      console.log('Redirect to quote request');
    } else if (selectedPlan === "ESSENTIEL") {
      console.log('Redirect to payment');
    } else {
      console.log('Create free account');
    }
  };

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return true;
    if (step === 2) return acceptedTerms && formData.email && formData.password && formData.companyName && formData.siren;
    return false;
  };

  return (
    <Card className="w-full max-w-3xl" data-testid="card-registration-form">
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">TM</span>
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Créer votre compte TEAMMOVE</CardTitle>
        <CardDescription className="text-center">
          Rejoignez la plateforme de gestion d'événements d'entreprise
        </CardDescription>
        
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`flex items-center gap-2 ${index <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < step ? 'bg-primary text-primary-foreground' :
                  index === step ? 'bg-primary text-primary-foreground' :
                  'bg-muted'
                }`}>
                  {index < step ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className="text-sm hidden md:inline">{stepName}</span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 0 && (
          <div className="space-y-4">
            <Label>Type d'organisme</Label>
            <RadioGroup value={organizationType} onValueChange={(v) => setOrganizationType(v as OrganizationType)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 border rounded-md p-4 hover-elevate">
                  <RadioGroupItem value="club" id="club" data-testid="radio-org-club" />
                  <Label htmlFor="club" className="flex-1 font-normal cursor-pointer">
                    <span className="font-medium">Club / Association</span>
                    <p className="text-sm text-muted-foreground">Pour les clubs sportifs et associations</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-4 hover-elevate">
                  <RadioGroupItem value="pme" id="pme" data-testid="radio-org-pme" />
                  <Label htmlFor="pme" className="flex-1 font-normal cursor-pointer">
                    <span className="font-medium">PME</span>
                    <p className="text-sm text-muted-foreground">Petites et moyennes entreprises</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-4 hover-elevate">
                  <RadioGroupItem value="grande-entreprise" id="grande-entreprise" data-testid="radio-org-large" />
                  <Label htmlFor="grande-entreprise" className="flex-1 font-normal cursor-pointer">
                    <span className="font-medium">Grande Entreprise</span>
                    <p className="text-sm text-muted-foreground">Plus de 250 employés</p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Label>Choisissez votre plan</Label>
            <div className="grid md:grid-cols-2 gap-4">
              {(Object.keys(planDetails) as PlanType[]).map((plan) => {
                const details = planDetails[plan];
                const isSelected = selectedPlan === plan;
                return (
                  <Card
                    key={plan}
                    className={`cursor-pointer transition-all hover-elevate ${
                      isSelected ? 'border-primary ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                    data-testid={`card-plan-${plan.toLowerCase()}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{details.name}</CardTitle>
                        {details.requiresQuote && (
                          <Badge variant="outline">Sur devis</Badge>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-primary">{details.price}</div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {details.features.map((feature) => (
                          <li key={feature} className="text-sm flex items-start gap-2">
                            <Check className="h-4 w-4 text-chart-2 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  data-testid="input-company-name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siren">SIREN</Label>
                <Input
                  id="siren"
                  value={formData.siren}
                  onChange={(e) => setFormData({ ...formData, siren: e.target.value })}
                  placeholder="123 456 789"
                  data-testid="input-siren"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="input-phone"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Commencez à taper une adresse..."
                data-testid="input-address"
                required
              />
              <p className="text-xs text-muted-foreground">Auto-complétion des adresses françaises</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  data-testid="input-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  data-testid="input-confirm-password"
                  required
                />
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                data-testid="checkbox-terms"
              />
              <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
                J'accepte les{" "}
                <a href="/cgu" className="text-primary hover:underline">
                  conditions générales d'utilisation
                </a>{" "}
                et la{" "}
                <a href="/privacy" className="text-primary hover:underline">
                  politique de confidentialité
                </a>
              </Label>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            data-testid="button-next"
          >
            {step === steps.length - 1 ? "Créer mon compte" : "Suivant"}
            {step < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
