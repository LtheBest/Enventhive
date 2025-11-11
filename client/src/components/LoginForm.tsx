import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

interface LoginFormProps {
  userType?: "company" | "admin";
}

export function LoginForm({ userType = "company" }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.message && err.message.includes('429')) {
        setError("Trop de tentatives. Veuillez réessayer dans 15 minutes.");
      } else if (err.message && err.message.includes('401')) {
        setError("Email ou mot de passe incorrect");
      } else if (err.message && err.message.includes('Account locked')) {
        setError("Compte verrouillé suite à trop de tentatives. Réessayez dans 30 minutes.");
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
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
            <Alert variant="destructive" data-testid="alert-error">
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
              disabled={isLoading}
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
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked as boolean)}
              data-testid="checkbox-remember"
              disabled={isLoading}
            />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              Se souvenir de moi
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            data-testid="button-login"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col space-y-2 text-sm text-center">
        {userType === "company" && (
          <div className="text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/register" data-testid="link-register">
              <span className="text-primary hover:underline cursor-pointer">
                S'inscrire
              </span>
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
