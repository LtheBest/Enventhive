import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MathCaptchaProps {
  onValidate: (isValid: boolean, token: string, response: string) => void;
  className?: string;
}

export function MathCaptcha({ onValidate, className = "" }: MathCaptchaProps) {
  const [challenge, setChallenge] = useState("");  // Display challenge from server (e.g., "5+3")
  const [token, setToken] = useState("");  // Signed JWT from server
  const [userAnswer, setUserAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchChallenge = async () => {
    setIsLoading(true);
    setError("");
    setUserAnswer("");
    onValidate(false, "", "");
    
    try {
      const response = await fetch('/api/security/captcha');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du CAPTCHA');
      }
      
      const data = await response.json();
      setChallenge(data.challenge);  // e.g., "5+3"
      setToken(data.token);  // Signed JWT
    } catch (err) {
      console.error('CAPTCHA fetch error:', err);
      setError('Impossible de charger la vérification. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, []);

  const handleAnswerChange = (value: string) => {
    setUserAnswer(value);
    
    // Frontend doesn't know the answer anymore (server-side only)
    // Just pass the token and response to parent
    // Parent will validate when submitting
    const hasAnswer = value.trim() !== "";
    onValidate(hasAnswer, token, value);
  };

  if (isLoading && !challenge) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-sm font-medium">Vérification de sécurité</Label>
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-sm font-medium">Vérification de sécurité</Label>
        <div className="flex items-center gap-2">
          <p className="text-sm text-destructive flex-1">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchChallenge}
            data-testid="button-retry-captcha"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="captcha-input" className="text-sm font-medium">
        Vérification de sécurité
      </Label>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md font-mono text-lg">
            <span>{challenge}</span>
            <span>=</span>
            <span className="text-muted-foreground">?</span>
          </div>
          <Input
            id="captcha-input"
            data-testid="input-captcha"
            type="number"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Réponse"
            className="w-24"
            required
            disabled={isLoading || !token}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={fetchChallenge}
          data-testid="button-refresh-captcha"
          title="Nouveau calcul"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Résolvez le calcul pour continuer
      </p>
    </div>
  );
}
