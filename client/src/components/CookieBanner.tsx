import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cookieConsent = localStorage.getItem("cookie-consent");
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
    console.log('Cookies accepted');
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
    console.log('Cookies declined');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50" data-testid="banner-cookies">
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Cookies et confidentialité</h3>
              <p className="text-sm text-muted-foreground">
                Nous utilisons des cookies pour améliorer votre expérience et respecter le RGPD.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDecline}
              data-testid="button-close-cookie-banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="flex-1"
              data-testid="button-decline-cookies"
            >
              Refuser
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="flex-1"
              data-testid="button-accept-cookies"
            >
              Accepter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
