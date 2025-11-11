import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LoginFormProps {
  userType?: "company" | "admin";
  onLogin?: (email: string, password: string, remember: boolean) => void;
}

export function LoginForm({ userType = "company", onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!captchaVerified) {
      setError("Veuillez valider le CAPTCHA");
      return;
    }

    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    onLogin?.(email, password, remember);
    console.log('Login attempt', { email, remember, userType });
  };

  return (
    <Card className="w-full max-w-md" data-testid="card-login-form">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">TM</span>
          </div>
        </div>
        <CardTitle className="text-2xl text-center">
          {userType === "admin" ? "Administration" : "Connexion"}
        </CardTitle>
        <CardDescription className="text-center">
          {userType === "admin" 
            ? "Accès réservé aux administrateurs" 
            : "Connectez-vous à votre espace TEAMMOVE"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email professionnel</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-password"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked as boolean)}
              data-testid="checkbox-remember"
            />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              Se souvenir de moi
            </Label>
          </div>

          <div className="p-4 border rounded-md bg-muted/50">
            <div className="flex items-center justify-between">
              <Checkbox
                id="captcha"
                checked={captchaVerified}
                onCheckedChange={(checked) => setCaptchaVerified(checked as boolean)}
                data-testid="checkbox-captcha"
              />
              <Label htmlFor="captcha" className="text-sm font-normal cursor-pointer ml-2 flex-1">
                Je ne suis pas un robot
              </Label>
              <div className="text-xs text-muted-foreground">reCAPTCHA</div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            data-testid="button-login"
          >
            Se connecter
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col space-y-2 text-sm text-center">
        {userType === "company" && (
          <>
            <a 
              href="/forgot-password" 
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                console.log('Forgot password');
              }}
              data-testid="link-forgot-password"
            >
              Mot de passe oublié ?
            </a>
            <div className="text-muted-foreground">
              Pas encore de compte ?{" "}
              <a 
                href="/register" 
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Navigate to register');
                }}
                data-testid="link-register"
              >
                S'inscrire
              </a>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
