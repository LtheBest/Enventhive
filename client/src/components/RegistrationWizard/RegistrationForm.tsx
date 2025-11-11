import { useReducer, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { wizardReducer } from './reducer';
import { initialWizardState, fullRegistrationSchema, FullRegistrationData } from './types';
import { Step1CompanyInfo } from './Step1CompanyInfo';
import { ProgressStepper } from './ProgressStepper';

export function RegistrationForm() {
  const [location, setLocation] = useLocation();
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);

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
  const methods = useForm<FullRegistrationData>({
    resolver: zodResolver(fullRegistrationSchema),
    mode: 'onBlur',
    defaultValues: {
      ...state.step1,
      ...state.step2,
      ...state.step3,
      ...state.step4,
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
                <div className="text-center p-12">
                  <p>Step 2: Address (à implémenter)</p>
                </div>
              )}

              {state.currentStep === 3 && (
                <div className="text-center p-12">
                  <p>Step 3: Plan Selection (à implémenter)</p>
                </div>
              )}

              {state.currentStep === 4 && (
                <div className="text-center p-12">
                  <p>Step 4: User Account (à implémenter)</p>
                </div>
              )}
            </FormProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
