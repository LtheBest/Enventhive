import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BillingInfo {
  plan: {
    tier: string;
    name: string;
    price: string;
    billingCycle: string;
    currentPeriodEnd: string | null;
  };
  invoices: Array<{
    id: string;
    amount: number;
    date: string;
    status: string;
    invoiceUrl: string | null;
  }>;
}

export default function Billing() {
  const { data, isLoading } = useQuery<BillingInfo>({
    queryKey: ['/api/billing/info'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Abonnement & Facturation</h1>
        <p className="text-muted-foreground">Gérez votre abonnement et vos factures</p>
      </div>

      {/* Current Plan */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Plan actuel</CardTitle>
          <CardDescription>Détails de votre abonnement TEAMMOVE</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{data?.plan.name || "Découverte"}</h3>
                <Badge>{data?.plan.tier || "DECOUVERTE"}</Badge>
              </div>
              <p className="text-muted-foreground">
                {data?.plan.price} / {data?.plan.billingCycle === "monthly" ? "mois" : "an"}
              </p>
              {data?.plan.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  Prochain renouvellement:{" "}
                  {format(new Date(data.plan.currentPeriodEnd), "d MMMM yyyy", { locale: fr })}
                </p>
              )}
            </div>
            <Button variant="outline" data-testid="button-manage-subscription">
              Modifier le plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Moyen de paiement</CardTitle>
          <CardDescription>Gérez vos moyens de paiement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Carte bancaire</p>
                <p className="text-sm text-muted-foreground">•••• •••• •••• 4242</p>
              </div>
            </div>
            <Button variant="outline" size="sm" data-testid="button-update-payment">
              Mettre à jour
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
          <CardDescription>Historique de vos factures</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.invoices && data.invoices.length > 0 ? (
            <div className="space-y-3">
              {data.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`invoice-${invoice.id}`}
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(invoice.date), "MMMM yyyy", { locale: fr })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.amount.toFixed(2)} € - {invoice.status}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" data-testid={`button-download-${invoice.id}`}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune facture disponible
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
