import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const { user, company } = useAuth();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">Gérez les paramètres de votre compte</p>
      </div>

      <div className="grid gap-6">
        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'entreprise</CardTitle>
            <CardDescription>Gérez les informations de votre organisation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'entreprise</Label>
              <Input defaultValue={company?.name} data-testid="input-company-name" />
            </div>
            <div className="space-y-2">
              <Label>SIREN</Label>
              <Input defaultValue={company?.siren} disabled data-testid="input-company-siren" />
            </div>
            <Button data-testid="button-save-company">Enregistrer</Button>
          </CardContent>
        </Card>

        {/* User Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profil utilisateur</CardTitle>
            <CardDescription>Gérez vos informations personnelles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input defaultValue={user?.firstName} data-testid="input-firstname" />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input defaultValue={user?.lastName} data-testid="input-lastname" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue={user?.email} type="email" data-testid="input-email" />
            </div>
            <Button data-testid="button-save-profile">Enregistrer</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
            <CardDescription>Modifiez votre mot de passe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mot de passe actuel</Label>
              <Input type="password" data-testid="input-current-password" />
            </div>
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input type="password" data-testid="input-new-password" />
            </div>
            <div className="space-y-2">
              <Label>Confirmer le nouveau mot de passe</Label>
              <Input type="password" data-testid="input-confirm-password" />
            </div>
            <Button data-testid="button-change-password">Changer le mot de passe</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
