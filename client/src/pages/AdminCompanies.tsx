import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function AdminCompanies() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Entreprises</h1>
        <p className="text-muted-foreground">Gérez les entreprises clientes</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gestion des entreprises</h3>
          <p className="text-muted-foreground text-center mb-4">
            Liste des entreprises et validation des devis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
