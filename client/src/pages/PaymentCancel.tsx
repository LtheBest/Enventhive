import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <XCircle className="h-16 w-16 text-yellow-500" data-testid="icon-cancel" />
          </div>
          <CardTitle className="text-center">Paiement annulé</CardTitle>
          <CardDescription className="text-center">
            Vous avez annulé le processus de paiement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Votre compte a été créé mais n'est pas encore activé. Vous pouvez reprendre le paiement depuis votre dashboard.
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setLocation('/')}
              data-testid="button-go-home"
            >
              Retour à l'accueil
            </Button>
            <Button 
              className="flex-1"
              onClick={() => setLocation('/dashboard')}
              data-testid="button-go-dashboard"
            >
              Aller au dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
