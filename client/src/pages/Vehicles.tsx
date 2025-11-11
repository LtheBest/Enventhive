import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Plus } from "lucide-react";

export default function Vehicles() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Véhicules</h1>
          <p className="text-muted-foreground">Gérez les véhicules de covoiturage</p>
        </div>
        <Button data-testid="button-add-vehicle">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un véhicule
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Car className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gestion des véhicules</h3>
          <p className="text-muted-foreground text-center mb-4">
            Gérez vos véhicules et optimisez le covoiturage pour vos événements.
          </p>
          <Button variant="outline" data-testid="button-learn-more">
            En savoir plus
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
