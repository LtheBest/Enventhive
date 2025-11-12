import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, AlertCircle, Loader2 } from "lucide-react";

export default function AdminMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [messageType, setMessageType] = useState<"individual" | "group" | "broadcast">("individual");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // Fetch companies
  const { data: companiesData, isLoading: loadingCompanies } = useQuery({
    queryKey: ['/api/admin/companies'],
  });

  // Fetch messages
  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/admin/messages'],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      companyIds: string[];
      messageType: string;
      subject: string;
      content: string;
    }) => {
      const response = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message envoyé",
        description: "Le message a été envoyé avec succès aux entreprises sélectionnées.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSubject("");
    setContent("");
    setMessageType("individual");
    setSelectedCompanies([]);
  };

  const handleSendMessage = () => {
    if (!subject || !content || selectedCompanies.length === 0) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs et sélectionner au moins une entreprise.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      companyIds: selectedCompanies,
      messageType,
      subject,
      content,
    });
  };

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const selectAllCompanies = () => {
    if (companiesData?.companies) {
      setSelectedCompanies(companiesData.companies.map((c: any) => c.companyId));
    }
  };

  const deselectAllCompanies = () => {
    setSelectedCompanies([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messagerie Admin</h1>
          <p className="text-muted-foreground mt-2">
            Envoyez des messages aux entreprises individuellement ou en groupe
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Nouveau message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Envoyer un message</DialogTitle>
              <DialogDescription>
                Composez et envoyez un message à une ou plusieurs entreprises
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de message</Label>
                <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individuel</SelectItem>
                    <SelectItem value="group">Groupe</SelectItem>
                    <SelectItem value="broadcast">Diffusion générale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Objet</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Objet du message"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenu</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Rédigez votre message..."
                  className="min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Destinataires ({selectedCompanies.length} sélectionnés)</Label>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllCompanies}
                    >
                      Tout sélectionner
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={deselectAllCompanies}
                    >
                      Tout désélectionner
                    </Button>
                  </div>
                </div>
                <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-2">
                  {loadingCompanies ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    companiesData?.companies?.map((company: any) => (
                      <div key={company.companyId} className="flex items-center space-x-2">
                        <Checkbox
                          id={company.companyId}
                          checked={selectedCompanies.includes(company.companyId)}
                          onCheckedChange={() => toggleCompanySelection(company.companyId)}
                        />
                        <label
                          htmlFor={company.companyId}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {company.companyName} ({company.email})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages envoyés</CardTitle>
          <CardDescription>
            Historique de tous les messages envoyés aux entreprises
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messagesData?.messages?.length === 0 ? (
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                Aucun message envoyé pour le moment.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {messagesData?.messages?.map((message: any) => (
                <Card key={message.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{message.subject}</CardTitle>
                        <CardDescription>
                          Envoyé par {message.sentByEmail} • {message.recipientCount} destinataire(s) •{" "}
                          {new Date(message.createdAt).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                        {message.messageType === 'individual' && 'Individuel'}
                        {message.messageType === 'group' && 'Groupe'}
                        {message.messageType === 'broadcast' && 'Diffusion'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
