import { useReducer, useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
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
  const [, setLocation] = useLocation();
  const search = useSearch();  // Get query string from wouter
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { authenticateWithToken} = useAuth();
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaChallenge, setCaptchaChallenge] = useState("");
  const [captchaResponse, setCaptchaResponse] = useState("");

  // Parse step from URL query params (using wouter's useSearch)
  const searchParams = new URLSearchParams(search);
  const urlStep = parseInt(searchParams.get('step') || '1', 10);
  
  console.log('[RegistrationForm] RENDER - search:', search, 'urlStep:', urlStep, 'state.currentStep:', state.currentStep);

  // Simple sync: currentStep follows urlStep
  useEffect(() => {
    const validStep = Math.max(1, Math.min(4, urlStep));
    
    console.log('[RegistrationForm] Syncing step - urlStep:', urlStep, 'validStep:', validStep, 'currentStep:', state.currentStep);
    
    if (validStep !== state.currentStep) {
      console.log('[RegistrationForm] Updating currentStep to', validStep);
      dispatch({ type: 'SET_STEP', step: validStep });
    }
  }, [urlStep]);

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
    console.log('[RegistrationForm] MARK_SIREN_VALIDATED called');
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

  const handlePlanSelected = (planId: string, tier: string) => {
    dispatch({ type: 'UPDATE_STEP_3', data: { planId, planTier: tier } });
  };

  const handleCaptchaValidate = (isValid: boolean, challenge: string, response: string) => {
    setCaptchaValid(isValid);
    setCaptchaChallenge(challenge);
    setCaptchaResponse(response);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    if (!captchaValid) {
      setSubmitError("Veuillez résoudre le calcul de sécurité");
      setIsSubmitting(false);
      return;
    }

    try {
      // Validate entire form before submitting
      const isValid = await methods.trigger();
      if (!isValid) {
        setSubmitError('Veuillez corriger les erreurs dans le formulaire');
        setIsSubmitting(false);
        return;
      }
      
      // Get form data
      const formData = methods.getValues();
      
      // Build registration payload from React Hook Form (single source of truth)
      const payload = {
        // Step 1: Company info (from RHF)
        companyName: formData.step1?.companyName,
        siren: formData.step1?.siren,
        companyEmail: formData.step1?.companyEmail,
        phone: formData.step1?.phone,
        organizationType: formData.step1?.organizationType,
        
        // Step 2: Address (from RHF)
        street: formData.step2?.street,
        city: formData.step2?.city,
        postalCode: formData.step2?.postalCode,
        latitude: formData.step2?.latitude,
        longitude: formData.step2?.longitude,
        
        // Step 3: Plan (from RHF)
        planId: formData.step3?.planId,
        
        // Step 4: User account (from RHF)
        firstName: formData.step4?.firstName,
        lastName: formData.step4?.lastName,
        email: formData.step4?.email,
        password: formData.step4?.password,
        
        // Captcha verification
        captchaChallenge,
        captchaResponse,
      };

      console.log('[RegistrationForm] Submitting payload:', {
        ...payload,
        password: '***',
        planId: payload.planId,
        planTier: formData.step3?.planTier,
      });

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
      console.log('[RegistrationForm] API response:', {
        success: data.success,
        requiresQuote: data.requiresQuote,
        requiresPayment: data.requiresPayment,
        hasAccessToken: !!data.accessToken,
        redirectTo: data.redirectTo,
      });

      // Authenticate using the token (loads user data without redirect)
      if (data.accessToken) {
        console.log('[RegistrationForm] Authenticating with token...');
        await authenticateWithToken(data.accessToken);
        console.log('[RegistrationForm] Authentication successful');
      }

      // Handle redirect based on plan tier
      if (data.requiresPayment && data.stripeCheckoutUrl) {
        // ESSENTIEL plan: Redirect to Stripe checkout
        console.log('[RegistrationForm] Redirecting to Stripe:', data.stripeCheckoutUrl);
        window.location.href = data.stripeCheckoutUrl;
      } else if (data.requiresQuote) {
        // PRO/PREMIUM: Redirect to dashboard with quote pending
        console.log('[RegistrationForm] Redirecting to dashboard (quote pending)');
        setLocation('/dashboard');
      } else {
        // DECOUVERTE: Redirect to dashboard
        console.log('[RegistrationForm] Redirecting to dashboard (free plan)');
        setLocation('/dashboard');
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
                  onCaptchaValidate={handleCaptchaValidate}
                  isCaptchaValid={captchaValid}
                />
              )}
            </FormProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
