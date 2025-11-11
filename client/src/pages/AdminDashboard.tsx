import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface AdminStats {
  totalCompanies: number;
  companiesByPlan: Array<{ tier: string; count: number }>;
  pendingQuotes: number;
  mrr: number;
  recentRegistrations: number;
}

interface Company {
  companyId: string;
  companyName: string;
  siren: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  planTier: string;
  planName: string;
  quotePending: boolean;
  billingCycle: string | null;
  currentPeriodEnd: Date | null;
}

interface Transaction {
  transactionId: string;
  companyId: string;
  companyName: string;
  amount: number;
  currency: string;
  status: string;
  stripeSessionId: string | null;
  stripeInvoiceId: string | null;
  createdAt: Date;
}

interface Plan {
  id: string;
  tier: string;
  name: string;
  description: string;
  monthlyPrice: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlanForApproval, setSelectedPlanForApproval] = useState<string>('');
  const [approvalCompanyId, setApprovalCompanyId] = useState<string>('');
  
  // Fetch available plans (for approval selection)
  const { data: allPlans } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
  });

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  // Fetch companies
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/admin/companies', currentPage],
    queryFn: async () => {
      const res = await fetch(`/api/admin/companies?page=${currentPage}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch companies');
      return res.json();
    }
  });

  // Fetch recent transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/admin/transactions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/transactions?page=1&limit=10');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    }
  });

  // Approve quote mutation
  const approveQuoteMutation = useMutation({
    mutationFn: async ({ companyId, planId }: { companyId: string; planId: string }) => {
      return apiRequest('/api/admin/approve-quote', 'POST', { companyId, planId });
    },
    onSuccess: () => {
      toast({
        title: 'Quote approuvé',
        description: 'Le devis a été approuvé avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'approuver le devis',
        variant: 'destructive',
      });
    },
  });

  const companies = companiesData?.companies || [];
  const transactions = transactionsData?.transactions || [];
  const proAndPremiumPlans = (allPlans || []).filter(p => p.tier === 'PRO' || p.tier === 'PREMIUM');

  if (statsLoading || companiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-admin-dashboard">
        <div className="text-center">
          <div className="text-lg">Chargement du tableau de bord...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="admin-dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="title-admin-dashboard">
          Tableau de bord Admin
        </h1>
        <Badge variant="secondary" data-testid="badge-admin-role">
          Administrateur
        </Badge>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-stat-total-companies">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entreprises</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-companies">
              {stats?.totalCompanies || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentRegistrations || 0} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-pending-quotes">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis en attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending-quotes">
              {stats?.pendingQuotes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Plans PRO/PREMIUM à approuver
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-mrr">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-mrr">
              {stats?.mrr?.toFixed(2) || '0.00'}€
            </div>
            <p className="text-xs text-muted-foreground">
              Revenu mensuel récurrent
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-growth">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plans par tier</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats?.companiesByPlan?.map((p) => (
                <div key={p.tier} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{p.tier}:</span>
                  <span className="font-medium" data-testid={`stat-plan-${p.tier.toLowerCase()}`}>
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <Card data-testid="card-companies-table">
        <CardHeader>
          <CardTitle>Gestion des entreprises</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>SIREN</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company: Company) => (
                <TableRow key={company.companyId} data-testid={`row-company-${company.companyId}`}>
                  <TableCell className="font-medium" data-testid={`text-company-name-${company.companyId}`}>
                    {company.companyName}
                  </TableCell>
                  <TableCell data-testid={`text-siren-${company.companyId}`}>
                    {company.siren}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" data-testid={`badge-plan-${company.companyId}`}>
                      {company.planTier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground" data-testid={`text-email-${company.companyId}`}>
                    {company.email}
                  </TableCell>
                  <TableCell>
                    {company.quotePending ? (
                      <Badge variant="secondary" data-testid={`badge-status-pending-${company.companyId}`}>
                        Devis en attente
                      </Badge>
                    ) : (
                      <Badge variant="default" data-testid={`badge-status-active-${company.companyId}`}>
                        Actif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {company.quotePending && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="default"
                            data-testid={`button-approve-quote-${company.companyId}`}
                            onClick={() => {
                              setApprovalCompanyId(company.companyId);
                              setSelectedPlanForApproval('');
                            }}
                          >
                            Approuver
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Approuver le devis</AlertDialogTitle>
                            <AlertDialogDescription asChild>
                              <div className="space-y-4">
                                <p>
                                  Sélectionnez le plan à activer pour <strong>{company.companyName}</strong>.
                                </p>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Plan</label>
                                  <Select
                                    value={selectedPlanForApproval}
                                    onValueChange={setSelectedPlanForApproval}
                                  >
                                    <SelectTrigger data-testid="select-plan-approval">
                                      <SelectValue placeholder="Choisir un plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {proAndPremiumPlans.map(plan => (
                                        <SelectItem
                                          key={plan.id}
                                          value={plan.id}
                                          data-testid={`option-plan-${plan.tier.toLowerCase()}`}
                                        >
                                          {plan.name} - {plan.monthlyPrice}€/mois
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid="button-cancel-approve">Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              data-testid="button-confirm-approve"
                              disabled={!selectedPlanForApproval || approveQuoteMutation.isPending}
                              onClick={(e) => {
                                e.preventDefault();
                                if (selectedPlanForApproval && approvalCompanyId) {
                                  approveQuoteMutation.mutate({
                                    companyId: approvalCompanyId,
                                    planId: selectedPlanForApproval
                                  });
                                }
                              }}
                            >
                              {approveQuoteMutation.isPending ? 'Approbation...' : 'Confirmer'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {companiesData?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {companiesData.pagination.page} sur {companiesData.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  data-testid="button-prev-page"
                >
                  Précédent
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= companiesData.pagination.totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  data-testid="button-next-page"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card data-testid="card-recent-transactions">
        <CardHeader>
          <CardTitle>Transactions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>ID Stripe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction: Transaction) => (
                <TableRow key={transaction.transactionId} data-testid={`row-transaction-${transaction.transactionId}`}>
                  <TableCell className="font-medium">
                    {transaction.companyName}
                  </TableCell>
                  <TableCell data-testid={`text-amount-${transaction.transactionId}`}>
                    {(transaction.amount / 100).toFixed(2)} {transaction.currency.toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={transaction.status === 'succeeded' ? 'default' : 'secondary'}
                      data-testid={`badge-status-${transaction.transactionId}`}
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {transaction.stripeSessionId?.substring(0, 20)}...
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
