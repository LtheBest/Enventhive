import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, Calendar } from "lucide-react";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState } from "react";

export default function Notifications() {
  const { hasFeature } = usePlanFeatures();
  const hasAccess = hasFeature('hasNotifications');

  const [settings, setSettings] = useState({
    emailNewEvent: true,
    emailParticipantJoins: true,
    emailEventReminder: true,
    emailEventUpdates: true,
    smsReminders: false,
    pushNotifications: true,
  });

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications automatiques
              <Badge variant="secondary">ESSENTIEL+</Badge>
            </CardTitle>
            <CardDescription>
              Cette fonctionnalité nécessite un plan ESSENTIEL ou supérieur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Les notifications automatiques vous permettent de rester informé en temps réel
              de toutes les activités de vos événements.
            </p>
            <Link href="/billing">
              <Button>Améliorer mon plan</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Notifications
          <Badge variant="secondary" className="ml-2">ESSENTIEL+</Badge>
        </h1>
        <p className="text-muted-foreground">
          Configurez vos préférences de notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* Notifications par email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notifications par email
            </CardTitle>
            <CardDescription>
              Recevez des emails pour rester informé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-new-event" className="flex-1">
                <div className="font-medium">Nouvel événement créé</div>
                <div className="text-sm text-muted-foreground">
                  Notification lors de la création d'un événement
                </div>
              </Label>
              <Switch
                id="email-new-event"
                checked={settings.emailNewEvent}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailNewEvent: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-participant-joins" className="flex-1">
                <div className="font-medium">Nouvelle inscription</div>
                <div className="text-sm text-muted-foreground">
                  Notification quand un participant s'inscrit
                </div>
              </Label>
              <Switch
                id="email-participant-joins"
                checked={settings.emailParticipantJoins}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailParticipantJoins: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-reminder" className="flex-1">
                <div className="font-medium">Rappels d'événements</div>
                <div className="text-sm text-muted-foreground">
                  Rappel 24h avant chaque événement
                </div>
              </Label>
              <Switch
                id="email-reminder"
                checked={settings.emailEventReminder}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailEventReminder: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-updates" className="flex-1">
                <div className="font-medium">Modifications d'événements</div>
                <div className="text-sm text-muted-foreground">
                  Notification lors des changements d'événements
                </div>
              </Label>
              <Switch
                id="email-updates"
                checked={settings.emailEventUpdates}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailEventUpdates: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications SMS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notifications SMS
              <Badge variant="outline" className="ml-2">Bientôt disponible</Badge>
            </CardTitle>
            <CardDescription>
              Recevez des SMS pour les événements importants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-reminders" className="flex-1 opacity-50">
                <div className="font-medium">Rappels SMS</div>
                <div className="text-sm text-muted-foreground">
                  SMS de rappel 2h avant les événements
                </div>
              </Label>
              <Switch
                id="sms-reminders"
                checked={settings.smsReminders}
                disabled
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, smsReminders: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications push */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Notifications push
            </CardTitle>
            <CardDescription>
              Notifications instantanées dans votre navigateur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="flex-1">
                <div className="font-medium">Activer les notifications push</div>
                <div className="text-sm text-muted-foreground">
                  Recevez des notifications en temps réel
                </div>
              </Label>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, pushNotifications: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Enregistrer les préférences</Button>
        </div>
      </div>
    </div>
  );
}
