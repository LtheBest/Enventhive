import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function AdminValidations() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Validations</h1>
        <p className="text-muted-foreground">Validez les paiements et devis</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Validation des devis</h3>
          <p className="text-muted-foreground text-center mb-4">
            Approuvez les devis PRO et PREMIUM en attente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
