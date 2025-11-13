import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Users, Mail } from "lucide-react";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Broadcast() {
  const { hasFeature } = usePlanFeatures();
  const { toast } = useToast();
  const hasAccess = hasFeature('hasNotifications'); // Messagerie disponible avec notifications (ESSENTIEL+)

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Messagerie de diffusion
              <Badge variant="secondary">ESSENTIEL+</Badge>
            </CardTitle>
            <CardDescription>
              Cette fonctionnalité nécessite un plan ESSENTIEL ou supérieur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              La messagerie de diffusion vous permet d'envoyer des messages groupés
              à tous les participants de vos événements.
            </p>
            <Link href="/billing">
              <Button>Améliorer mon plan</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSendBroadcast = () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Message envoyé",
      description: "Votre message a été envoyé à tous les participants",
    });

    setSubject("");
    setMessage("");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Send className="h-8 w-8" />
          Messagerie de diffusion
          <Badge variant="secondary" className="ml-2">ESSENTIEL+</Badge>
        </h1>
        <p className="text-muted-foreground">
          Envoyez des messages à tous vos participants
        </p>
      </div>

      <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Sur tous vos événements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Messages envoyés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Ce mois-ci
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Send className="h-4 w-4" />
                Taux d'ouverture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                Moyenne mensuelle
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire d'envoi */}
        <Card>
          <CardHeader>
            <CardTitle>Nouveau message de diffusion</CardTitle>
            <CardDescription>
              Envoyez un message à tous les participants de vos événements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Objet du message</Label>
              <Input
                id="subject"
                placeholder="Ex: Rappel important pour l'événement"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Contenu du message</Label>
              <Textarea
                id="message"
                placeholder="Écrivez votre message ici..."
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Le message sera envoyé par email à tous les participants
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Destinataires: <span className="font-medium">0 participants</span>
              </p>
              <Button onClick={handleSendBroadcast}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer le message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Historique */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des messages</CardTitle>
            <CardDescription>
              Messages de diffusion récemment envoyés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun message envoyé pour le moment</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
