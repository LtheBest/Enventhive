import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Crown, Upload, Eye, Palette } from "lucide-react";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Branding() {
  const { hasFeature } = usePlanFeatures();
  const { toast } = useToast();
  const hasAccess = hasFeature('hasCustomLogo');

  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Personnalisation du dashboard
              <Badge>PRO+</Badge>
            </CardTitle>
            <CardDescription>
              Cette fonctionnalité nécessite un plan PRO ou PREMIUM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Personnalisez votre dashboard avec votre logo et vos couleurs
              pour une expérience sur-mesure.
            </p>
            <Link href="/billing">
              <Button>Passer au plan PRO</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        toast({
          title: "Logo chargé",
          description: "Cliquez sur Enregistrer pour appliquer les modifications",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    toast({
      title: "Modifications enregistrées",
      description: "Votre personnalisation a été appliquée avec succès",
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Crown className="h-8 w-8" />
          Personnalisation du dashboard
          <Badge className="ml-2">PRO+</Badge>
        </h1>
        <p className="text-muted-foreground">
          Personnalisez l'apparence de votre dashboard
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo personnalisé
            </CardTitle>
            <CardDescription>
              Ajoutez votre logo pour personnaliser le dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-upload">Télécharger un logo</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formats acceptés: PNG, JPG, SVG (max 2MB)
              </p>
            </div>

            {logoPreview && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm font-medium mb-3">Aperçu du logo</p>
                <div className="flex items-center justify-center h-32 bg-white dark:bg-gray-900 rounded border">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Position du logo</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">En-tête</Button>
                <Button variant="outline" size="sm">Sidebar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Couleurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Couleurs de marque
            </CardTitle>
            <CardDescription>
              Personnalisez les couleurs de votre dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Couleur principale</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Utilisée pour les boutons, liens et éléments principaux
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Couleur secondaire</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="secondary-color"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Utilisée pour les éléments secondaires et accents
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Aperçu des couleurs</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-16 rounded border"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="text-sm text-muted-foreground">Principale</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-16 rounded border"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <span className="text-sm text-muted-foreground">Secondaire</span>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              Réinitialiser les couleurs par défaut
            </Button>
          </CardContent>
        </Card>

        {/* Aperçu */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Aperçu du dashboard
            </CardTitle>
            <CardDescription>
              Prévisualisez vos modifications avant de les enregistrer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-muted/50 min-h-[200px] flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="h-16 mx-auto object-contain"
                    />
                  ) : (
                    <div className="h-16 w-32 mx-auto bg-primary/20 rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Votre logo</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-center">
                  <div
                    className="h-10 px-6 rounded-md flex items-center text-white font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Bouton principal
                  </div>
                  <div
                    className="h-10 px-6 rounded-md flex items-center text-white font-medium"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Bouton secondaire
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline">Annuler</Button>
        <Button onClick={handleSave}>
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
