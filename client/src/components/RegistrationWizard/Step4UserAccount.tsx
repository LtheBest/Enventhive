import { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { step4Schema } from "./types";

interface Step4Props {
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

export function Step4UserAccount({ onBack, onSubmit, isSubmitting, submitError }: Step4Props) {
  const { control, formState: { errors }, watch, setError, clearErrors } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Watch password fields to validate match in real-time
  const password = watch("step4.password");
  const confirmPassword = watch("step4.confirmPassword");

  // Validate password match on change
  useEffect(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      setError("step4.confirmPassword", {
        type: "manual",
        message: "Les mots de passe ne correspondent pas",
      });
    } else if (password && confirmPassword && password === confirmPassword) {
      clearErrors("step4.confirmPassword");
    }
  }, [password, confirmPassword, setError, clearErrors]);

  return (
    <Card className="w-full" data-testid="card-step4-user">
      <CardHeader>
        <CardTitle>Créez votre compte</CardTitle>
        <CardDescription>
          Renseignez vos informations pour accéder à la plateforme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {submitError && (
          <Alert variant="destructive" data-testid="alert-submit-error">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Controller
              name="step4.firstName"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    id="firstName"
                    placeholder="Jean"
                    disabled={isSubmitting}
                    data-testid="input-first-name"
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-600">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Controller
              name="step4.lastName"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    id="lastName"
                    placeholder="Dupont"
                    disabled={isSubmitting}
                    data-testid="input-last-name"
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-600">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email professionnel</Label>
          <Controller
            name="step4.email"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="jean.dupont@entreprise.fr"
                  disabled={isSubmitting}
                  data-testid="input-email"
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Controller
            name="step4.password"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <div className="relative">
                  <Input
                    {...field}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {fieldState.error && (
                  <p className="text-sm text-red-600">{fieldState.error.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum 8 caractères, dont 1 majuscule, 1 minuscule et 1 chiffre
                </p>
              </>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Controller
            name="step4.confirmPassword"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <div className="relative">
                  <Input
                    {...field}
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    data-testid="input-confirm-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {fieldState.error && (
                  <p className="text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            data-testid="button-back"
          >
            Précédent
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            data-testid="button-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer mon compte"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
