import { useReducer, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { wizardReducer } from './reducer';
import { initialWizardState, nestedRegistrationSchema, NestedRegistrationData } from './types';
import { Step1CompanyInfo } from './Step1CompanyInfo';
import { Step2AddressForm } from './Step2AddressForm';
import { Step3PlanSelection } from './Step3PlanSelection';
import { Step4UserAccount } from './Step4UserAccount';
import { ProgressStepper } from './ProgressStepper';
import { useAuth } from '@/contexts/AuthContext';

export function RegistrationForm() {
  const [location, setLocation] = useLocation();
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { login } = useAuth();

  // Parse step from URL params
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const urlStep = parseInt(searchParams.get('step') || '1', 10);

  // Sync reducer with URL step (with validation + gating)
  useEffect(() => {
    const validStep = Math.max(1, Math.min(4, urlStep));
    
    // Gate: enforce prerequisites before allowing step navigation
    let allowedStep = validStep;
    
    // Step 2 requires SIREN validation from Step 1
    if (validStep >= 2 && !state.sirenValidated) {
      allowedStep = 1;
    }
    
    // Step 3 requires address validation from Step 2
    if (validStep >= 3 && !state.addressValidated) {
      allowedStep = Math.max(1, state.sirenValidated ? 2 : 1);
    }
    
    // Step 4 requires plan selection from Step 3
    if (validStep >= 4 && !state.step3.planTier) {
      allowedStep = Math.max(1, state.addressValidated ? 3 : state.sirenValidated ? 2 : 1);
    }
    
    // Update reducer if gated step differs from URL
    if (allowedStep !== state.currentStep) {
      dispatch({ type: 'SET_STEP', step: allowedStep });
    }
    
    // Update URL if we gated the user back
    if (allowedStep !== validStep) {
      setLocation(`/register?step=${allowedStep}`, { replace: true });
    }
  }, [urlStep, state.sirenValidated, state.addressValidated, state.step3.planTier]);

  // Initialize form with all default values
  const methods = useForm<NestedRegistrationData>({
    resolver: zodResolver(nestedRegistrationSchema),
    mode: 'onBlur',
    defaultValues: {
      step1: state.step1,
      step2: state.step2,
      step3: state.step3,
      step4: state.step4,
    },
  });

  const navigateToStep = (step: number) => {
    setLocation(`/register?step=${step}`);
  };

  const handleStep1Complete = (data: any) => {
    dispatch({ type: 'UPDATE_STEP_1', data });
    navigateToStep(2);
  };

  const handleMarkSirenValidated = () => {
    dispatch({ type: 'MARK_SIREN_VALIDATED' });
  };

  const handleStep2Complete = (data: any) => {
    dispatch({ type: 'UPDATE_STEP_2', data });
    navigateToStep(3);
  };

  const handleMarkAddressValidated = (validated: boolean) => {
    dispatch({ type: 'SET_ADDRESS_VALIDATED', validated });
  };

  const handleStep3Complete = () => {
    // No dispatch needed - handlePlanSelected already updated state
    navigateToStep(4);
  };

  const handlePlanSelected = (planId: number, tier: string) => {
    dispatch({ type: 'UPDATE_STEP_3', data: { planId, planTier: tier } });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get form data
      const formData = methods.getValues();
      
      // Manually validate Step4 with full schema (including password match)
      const { step4Schema } = await import('./types');
      const step4Result = step4Schema.safeParse(formData.step4);
      
      if (!step4Result.success) {
        const firstError = step4Result.error.errors[0];
        setSubmitError(`Erreur de validation : ${firstError.message}`);
        setIsSubmitting(false);
        return;
      }
      
      // Build registration payload
      const payload = {
        // Step 1: Company info
        companyName: formData.step1.companyName,
        siren: formData.step1.siren,
        employeeCount: formData.step1.employeeCount,
        
        // Step 2: Address
        street: formData.step2.street,
        city: formData.step2.city,
        postalCode: formData.step2.postalCode,
        latitude: formData.step2.latitude,
        longitude: formData.step2.longitude,
        
        // Step 3: Plan
        planId: formData.step3.planId,
        
        // Step 4: User account
        firstName: formData.step4.firstName,
        lastName: formData.step4.lastName,
        email: formData.step4.email,
        password: formData.step4.password,
      };

      // Call registration API
      const response = await fetch('/api/registration/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Handle based on plan tier
      if (data.requiresPayment && data.stripeCheckoutUrl) {
        // ESSENTIEL plan: Auto-login then redirect to Stripe
        await login(formData.step4.email, formData.step4.password);
        window.location.href = data.stripeCheckoutUrl;
      } else if (data.requiresQuote) {
        // PRO/PREMIUM: Auto-login then redirect to dashboard with quote message
        await login(formData.step4.email, formData.step4.password);
        setLocation('/?quote_pending=true');
      } else {
        // DECOUVERTE: Auto-login then redirect to dashboard
        await login(formData.step4.email, formData.step4.password);
        setLocation('/');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setSubmitError(error.message || 'Erreur lors de la création du compte');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-3xl">
        <CardContent className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">TM</span>
              </div>
            </div>
            <h1 className="text-3xl font-semibold text-center mb-2">
              Créer votre compte TEAMMOVE
            </h1>
            <p className="text-center text-muted-foreground">
              Gérez vos événements professionnels et optimisez vos déplacements
            </p>
          </div>

          <ProgressStepper currentStep={state.currentStep} />

          <div className="mt-8">
            <FormProvider {...methods}>
              {state.currentStep === 1 && (
                <Step1CompanyInfo
                  defaultValues={state.step1}
                  onNext={handleStep1Complete}
                  sirenValidated={state.sirenValidated}
                  onMarkSirenValidated={handleMarkSirenValidated}
                />
              )}

              {state.currentStep === 2 && (
                <Step2AddressForm
                  onNext={handleStep2Complete}
                  onBack={() => navigateToStep(1)}
                  onAddressValidated={handleMarkAddressValidated}
                  addressValidated={state.addressValidated}
                  defaultValues={state.step2}
                />
              )}

              {state.currentStep === 3 && (
                <Step3PlanSelection
                  onNext={handleStep3Complete}
                  onBack={() => navigateToStep(2)}
                  onPlanSelected={handlePlanSelected}
                />
              )}

              {state.currentStep === 4 && (
                <Step4UserAccount
                  onBack={() => navigateToStep(3)}
                  onSubmit={handleFinalSubmit}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                />
              )}
            </FormProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
