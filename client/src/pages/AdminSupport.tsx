import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Send, Clock, CheckCircle, XCircle, Building2 } from 'lucide-react';

interface SupportRequest {
  id: string;
  companyId: string;
  companyName: string;
  requestType: string;
  subject: string;
  status: string;
  priority: string;
  requestedPlanName?: string;
  createdAt: string;
  updatedAt: string;
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

export default function AdminSupport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');

  // Fetch all support requests
  const { data: requestsData } = useQuery<{ success: boolean; requests: SupportRequest[] }>({
    queryKey: ['/api/support/requests'],
  });

  // Fetch single request with messages
  const { data: requestDetailData } = useQuery<{
    success: boolean;
    request: SupportRequest & { companyEmail: string };
    messages: SupportMessage[];
  }>({
    queryKey: [`/api/support/requests/${selectedRequest}`],
    enabled: !!selectedRequest,
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (data: { supportRequestId: string; content: string; isInternal?: boolean }) => {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  // Update status
  const updateStatus = useMutation({
    mutationFn: async (data: { requestId: string; status: string }) => {
      const res = await fetch(`/api/support/requests/${data.requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: data.status }),
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la mise à jour du statut');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de la demande a été mis à jour avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/support/requests'] });
      queryClient.invalidateQueries({ queryKey: [`/api/support/requests/${selectedRequest}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = (isInternal = false) => {
    if (!messageContent.trim() || !selectedRequest) {
      return;
    }

    sendMessage.mutate({
      supportRequestId: selectedRequest,
      content: messageContent,
      isInternal,
    });
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedRequest) return;

    updateStatus.mutate({
      requestId: selectedRequest,
      status,
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

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-500',
      normal: 'bg-blue-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500',
    };

    return (
      <Badge className={`${colors[priority] || colors.normal} text-white text-xs`}>
        {priority === 'low' ? 'Basse' :
         priority === 'normal' ? 'Normale' :
         priority === 'high' ? 'Haute' :
         'Urgente'}
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion du Support</h1>
        <p className="text-muted-foreground">
          Gérez les demandes de support des entreprises
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar - Support requests list */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de support</CardTitle>
              <CardDescription>
                {requestsData?.requests?.length || 0} demande(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
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
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">
                      {request.companyName}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {getRequestTypeLabel(request.requestType)}
                    </Badge>
                    {getPriorityBadge(request.priority)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
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
          {selectedRequest && requestDetailData ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{requestDetailData.request.subject}</CardTitle>
                    <CardDescription className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">
                          {getRequestTypeLabel(requestDetailData.request.requestType)}
                        </Badge>
                        {getStatusBadge(requestDetailData.request.status)}
                        {getPriorityBadge(requestDetailData.request.priority)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{requestDetailData.request.companyName}</span>
                        <span className="text-xs">({requestDetailData.request.companyEmail})</span>
                      </div>
                      {requestDetailData.request.requestedPlanName && (
                        <p className="text-xs">
                          Plan demandé : <strong>{requestDetailData.request.requestedPlanName}</strong>
                        </p>
                      )}
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

                {/* Status Update */}
                <div className="mt-4 flex items-center gap-2">
                  <Label>Statut:</Label>
                  <Select
                    value={requestDetailData.request.status}
                    onValueChange={handleUpdateStatus}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Ouvert</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="closed">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
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
                          ? 'bg-blue-50 dark:bg-blue-950/20 mr-4'
                          : 'bg-gray-50 dark:bg-gray-900/50 ml-4'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm">
                          {msg.senderType === 'admin' ? (
                            <span className="text-blue-600 dark:text-blue-400">
                              👨‍💼 {msg.senderFirstName} {msg.senderLastName} (Admin)
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
                    <Label htmlFor="reply">Répondre</Label>
                    <Textarea
                      id="reply"
                      placeholder="Écrivez votre message..."
                      rows={4}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSendMessage(false)}
                        disabled={!messageContent.trim() || sendMessage.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sendMessage.isPending ? 'Envoi...' : 'Envoyer à l\'entreprise'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSendMessage(true)}
                        disabled={!messageContent.trim() || sendMessage.isPending}
                      >
                        Note interne
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez une demande pour voir les détails</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
