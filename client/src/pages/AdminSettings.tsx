import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres Admin</h1>
        <p className="text-muted-foreground">Configuration de la plateforme</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Configuration système</h3>
          <p className="text-muted-foreground text-center mb-4">
            Gérez les paramètres globaux de TEAMMOVE.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
