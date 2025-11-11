import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AdminStats() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Statistiques Admin</h1>
        <p className="text-muted-foreground">Analysez les performances de la plateforme</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Statistiques globales</h3>
          <p className="text-muted-foreground text-center mb-4">
            Vue d'ensemble des métriques de la plateforme.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
