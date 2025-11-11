import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification du paiement...');

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setStatus('error');
        setMessage('ID de session manquant');
        return;
      }

      try {
        const response = await fetch(`/api/registration/verify-payment?session_id=${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Échec de la vérification du paiement');
        }

        const data = await response.json();

        if (data.success && data.paymentStatus === 'paid') {
          setStatus('success');
          setMessage('Paiement confirmé ! Redirection vers votre dashboard...');
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            setLocation('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Le paiement n\'a pas été confirmé. Veuillez contacter le support.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('Erreur lors de la vérification du paiement');
      }
    };

    verifyPayment();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" data-testid="icon-loading" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-500" data-testid="icon-success" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-500" data-testid="icon-error" />
            )}
          </div>
          <CardTitle className="text-center">
            {status === 'loading' && 'Vérification...'}
            {status === 'success' && 'Paiement réussi !'}
            {status === 'error' && 'Erreur'}
          </CardTitle>
          <CardDescription className="text-center" data-testid="text-message">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Votre compte a été activé avec succès.
              </p>
              <p className="text-sm text-muted-foreground">
                Vous allez être redirigé automatiquement...
              </p>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Si vous avez effectué un paiement, veuillez contacter notre support.
              </p>
              <Button onClick={() => setLocation('/dashboard')} data-testid="button-go-dashboard">
                Aller au dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
