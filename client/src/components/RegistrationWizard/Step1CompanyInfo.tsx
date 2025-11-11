import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step1Schema, Step1Data } from './types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Step1Props {
  defaultValues: Partial<Step1Data>;
  onNext: (data: Step1Data) => void;
  sirenValidated: boolean;
  onMarkSirenValidated: () => void;
}

export function Step1CompanyInfo({ 
  defaultValues, 
  onNext,
  sirenValidated,
  onMarkSirenValidated
}: Step1Props) {
  const [isValidatingSiren, setIsValidatingSiren] = useState(false);
  const [sirenError, setSirenError] = useState('');
  const [sirenSuccess, setSirenSuccess] = useState(sirenValidated);
  const [lastValidatedSiren, setLastValidatedSiren] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues,
  });

  const sirenValue = watch('siren');

  // Reset SIREN validation when user changes the field
  useEffect(() => {
    if (sirenValue && sirenValue !== lastValidatedSiren) {
      setSirenSuccess(false);
      setSirenError('');
    }
  }, [sirenValue, lastValidatedSiren]);

  const validateSiren = async (siren: string) => {
    if (siren.length !== 9 || !/^\d{9}$/.test(siren)) {
      setSirenError('Le SIREN doit contenir exactement 9 chiffres');
      return false;
    }

    setIsValidatingSiren(true);
    setSirenError('');
    setSirenSuccess(false);

    try {
      const response = await fetch('/api/registration/validate-siren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siren }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSirenError(data.error || 'SIREN invalide');
        return false;
      }

      if (data.valid) {
        setSirenSuccess(true);
        setLastValidatedSiren(siren);
        onMarkSirenValidated();
        return true;
      } else {
        setSirenError(data.error || 'SIREN invalide');
        return false;
      }
    } catch (error) {
      setSirenError('Erreur lors de la validation du SIREN. Veuillez réessayer.');
      return false;
    } finally {
      setIsValidatingSiren(false);
    }
  };

  const handleSirenBlur = () => {
    if (sirenValue && sirenValue.length === 9 && sirenValue !== lastValidatedSiren) {
      validateSiren(sirenValue);
    }
  };

  const onSubmit = async (data: Step1Data) => {
    // Always validate SIREN before proceeding if not matching last validated value
    if (data.siren !== lastValidatedSiren || !sirenSuccess) {
      const isValid = await validateSiren(data.siren);
      if (!isValid) {
        return;
      }
    }
    
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="form-step1">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Informations de l'entreprise</h2>
        <p className="text-muted-foreground">Commençons par les détails de votre organisation</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Type d'organisation *</Label>
          <Controller
            name="organizationType"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                data-testid="radiogroup-organization-type"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="club" id="club" data-testid="radio-club" />
                  <Label htmlFor="club" className="font-normal cursor-pointer">
                    Club ou Association
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pme" id="pme" data-testid="radio-pme" />
                  <Label htmlFor="pme" className="font-normal cursor-pointer">
                    PME (moins de 250 employés)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="grande_entreprise" id="grande_entreprise" data-testid="radio-grande-entreprise" />
                  <Label htmlFor="grande_entreprise" className="font-normal cursor-pointer">
                    Grande entreprise (plus de 250 employés)
                  </Label>
                </div>
              </RadioGroup>
            )}
          />
          {errors.organizationType && (
            <p className="text-sm text-destructive">{errors.organizationType.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Nom de l'entreprise *</Label>
          <Input
            id="companyName"
            {...register('companyName')}
            placeholder="ACME Corporation"
            data-testid="input-company-name"
          />
          {errors.companyName && (
            <p className="text-sm text-destructive">{errors.companyName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="siren">SIREN *</Label>
          <div className="relative">
            <Input
              id="siren"
              {...register('siren')}
              placeholder="123456789"
              maxLength={9}
              onBlur={handleSirenBlur}
              data-testid="input-siren"
              className={sirenSuccess && sirenValue === lastValidatedSiren ? 'border-green-500' : ''}
            />
            {isValidatingSiren && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {sirenSuccess && sirenValue === lastValidatedSiren && !isValidatingSiren && (
              <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
            )}
          </div>
          {errors.siren && (
            <p className="text-sm text-destructive">{errors.siren.message}</p>
          )}
          {sirenError && !errors.siren && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{sirenError}</AlertDescription>
            </Alert>
          )}
          {sirenSuccess && sirenValue === lastValidatedSiren && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              SIREN validé
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyEmail">Email de l'entreprise *</Label>
          <Input
            id="companyEmail"
            type="email"
            {...register('companyEmail')}
            placeholder="contact@acme.com"
            data-testid="input-company-email"
          />
          {errors.companyEmail && (
            <p className="text-sm text-destructive">{errors.companyEmail.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone (optionnel)</Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder="+33 1 23 45 67 89"
            data-testid="input-phone"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isValidatingSiren}
          data-testid="button-next-step1"
        >
          {isValidatingSiren ? 'Validation...' : 'Suivant'}
        </Button>
      </div>
    </form>
  );
}
