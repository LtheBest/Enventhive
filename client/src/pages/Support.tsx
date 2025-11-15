import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useLocation } from 'wouter';

interface SupportRequest {
  id: string;
  requestType: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  requestedPlanName?: string;
}

interface SupportMessage {
  id: string;
  senderEmail: string;
  senderFirstName: string;
  senderLastName: string;
  senderType: 'admin' | 'company';
  content: string;
  createdAt: string;
}

export default function Support() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');

  // New request form state
  const [requestType, setRequestType] = useState('general_inquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Fetch all support requests
  const { data: requestsData } = useQuery<{ success: boolean; requests: SupportRequest[] }>({
    queryKey: ['/api/support/requests'],
  });

  // Fetch single request with messages
  const { data: requestDetailData } = useQuery<{
    success: boolean;
    request: SupportRequest & { companyName: string };
    messages: SupportMessage[];
  }>({
    queryKey: [`/api/support/requests/${selectedRequest}`],
    enabled: !!selectedRequest,
  });

  // Create new support request
  const createRequest = useMutation({
    mutationFn: async (data: { requestType: string; subject: string; message: string }) => {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/support/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la création de la demande');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Demande créée',
        description: 'Votre demande de support a été envoyée avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/support/requests'] });
      setShowNewRequest(false);
      setSubject('');
      setMessage('');
      setRequestType('general_inquiry');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send message in request
  const sendMessage = useMutation({
    mutationFn: async (data: { supportRequestId: string; content: string }) => {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de l\'envoi du message');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Message envoyé',
        description: 'Votre message a été envoyé avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/support/requests/${selectedRequest}`] });
      setMessageContent('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateRequest = () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis.',
        variant: 'destructive',
      });
      return;
    }

    createRequest.mutate({
      requestType,
      subject,
      message,
    });
  };

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedRequest) {
      return;
    }

    sendMessage.mutate({
      supportRequestId: selectedRequest,
      content: messageContent,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      open: { color: 'bg-blue-500', icon: <Clock className="w-3 h-3" /> },
      in_progress: { color: 'bg-yellow-500', icon: <Clock className="w-3 h-3" /> },
      resolved: { color: 'bg-green-500', icon: <CheckCircle className="w-3 h-3" /> },
      closed: { color: 'bg-gray-500', icon: <XCircle className="w-3 h-3" /> },
    };

    const config = variants[status] || variants.open;

    return (
      <Badge className={`${config.color} text-white`}>
        <span className="flex items-center gap-1">
          {config.icon}
          {status === 'open' ? 'Ouvert' : 
           status === 'in_progress' ? 'En cours' : 
           status === 'resolved' ? 'Résolu' :
           'Fermé'}
        </span>
      </Badge>
    );
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quote_request: 'Demande de devis',
      plan_upgrade: 'Upgrade de plan',
      technical_support: 'Support technique',
      general_inquiry: 'Question générale',
    };
    return labels[type] || type;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Support</h1>
          <p className="text-muted-foreground">
            Besoin d'aide ? Contactez notre équipe de support
          </p>
        </div>
        <Button onClick={() => setShowNewRequest(!showNewRequest)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar - Support requests list */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Mes demandes</CardTitle>
              <CardDescription>
                {requestsData?.requests?.length || 0} demande(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {requestsData?.requests?.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRequest === request.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{request.subject}</h4>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {getRequestTypeLabel(request.requestType)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}

              {(!requestsData?.requests || requestsData.requests.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune demande de support</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="md:col-span-2">
          {showNewRequest ? (
            <Card>
              <CardHeader>
                <CardTitle>Nouvelle demande de support</CardTitle>
                <CardDescription>
                  Décrivez votre problème ou votre question
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="requestType">Type de demande</Label>
                  <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_inquiry">Question générale</SelectItem>
                      <SelectItem value="technical_support">Support technique</SelectItem>
                      <SelectItem value="plan_upgrade">Upgrade de plan</SelectItem>
                      <SelectItem value="quote_request">Demande de devis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input
                    id="subject"
                    placeholder="Résumé de votre demande"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre demande en détail..."
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateRequest} disabled={createRequest.isPending}>
                    {createRequest.isPending ? 'Envoi...' : 'Envoyer'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewRequest(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedRequest && requestDetailData ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{requestDetailData.request.subject}</CardTitle>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getRequestTypeLabel(requestDetailData.request.requestType)}
                        </Badge>
                        {getStatusBadge(requestDetailData.request.status)}
                      </div>
                      <p className="text-xs">
                        Créé le {new Date(requestDetailData.request.createdAt).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Messages */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {requestDetailData.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.senderType === 'admin'
                          ? 'bg-blue-50 dark:bg-blue-950/20 ml-4'
                          : 'bg-gray-50 dark:bg-gray-900/50 mr-4'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm">
                          {msg.senderType === 'admin' ? (
                            <span className="text-blue-600 dark:text-blue-400">
                              👨‍💼 Support TEAMMOVE
                            </span>
                          ) : (
                            <span>
                              {msg.senderFirstName} {msg.senderLastName}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>

                {/* Send message form */}
                {requestDetailData.request.status !== 'closed' && (
                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="reply">Votre message</Label>
                    <Textarea
                      id="reply"
                      placeholder="Écrivez votre message..."
                      rows={4}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() || sendMessage.isPending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendMessage.isPending ? 'Envoi...' : 'Envoyer'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez une demande ou créez-en une nouvelle</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
