import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Download, 
  Loader2, 
  Power, 
  PowerOff, 
  Trash2,
  RefreshCw,
  Send
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminCompanies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  // Fetch companies
  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['/api/admin/companies'],
  });

  // Fetch plans for bulk change
  const { data: plansData } = useQuery({
    queryKey: ['/api/plans'],
  });

  // Toggle company status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ companyId, isActive }: { companyId: string; isActive: boolean }) => {
      const response = await fetch('/api/admin/toggle-company-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ companyId, isActive }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle company status');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Statut modifié",
        description: "Le statut de l'entreprise a été mis à jour.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // Bulk change plan mutation
  const bulkChangePlanMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/bulk-change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          companyIds: selectedCompanies,
          planId: selectedPlan,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to change plans');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Plans modifiés",
        description: `Les plans de ${data.updatedCount} entreprises ont été mis à jour.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
      setSelectedCompanies([]);
      setSelectedPlan("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier les plans. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await fetch(`/api/admin/company/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete company');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entreprise supprimée",
        description: "L'entreprise a été supprimée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entreprise. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handleExportCompanies = async () => {
    try {
      const response = await fetch('/api/admin/export/companies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `companies_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export réussi",
        description: "Le fichier CSV a été téléchargé.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données.",
        variant: "destructive",
      });
    }
  };

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const toggleAllCompanies = () => {
    if (selectedCompanies.length === companiesData?.companies?.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companiesData?.companies?.map((c: any) => c.companyId) || []);
    }
  };

  const handleBulkChangePlan = () => {
    if (selectedCompanies.length === 0) {
      toast({
        title: "Aucune entreprise sélectionnée",
        description: "Veuillez sélectionner au moins une entreprise.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPlan) {
      toast({
        title: "Aucun plan sélectionné",
        description: "Veuillez sélectionner un plan.",
        variant: "destructive",
      });
      return;
    }

    bulkChangePlanMutation.mutate();
  };

  const confirmDelete = (companyId: string) => {
    setCompanyToDelete(companyId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (companyToDelete) {
      deleteCompanyMutation.mutate(companyToDelete);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entreprises</h1>
          <p className="text-muted-foreground mt-2">
            Gérez toutes les entreprises clientes
          </p>
        </div>
        <Button onClick={handleExportCompanies}>
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {selectedCompanies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actions groupées ({selectedCompanies.length} sélectionnés)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Changer le plan
                </label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plansData?.plans?.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} ({plan.tier})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleBulkChangePlan}
                disabled={bulkChangePlanMutation.isPending}
              >
                {bulkChangePlanMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Application...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Appliquer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des entreprises</CardTitle>
          <CardDescription>
            {companiesData?.companies?.length || 0} entreprise(s) enregistrée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedCompanies.length === companiesData?.companies?.length &&
                          companiesData?.companies?.length > 0
                        }
                        onCheckedChange={toggleAllCompanies}
                      />
                    </TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companiesData?.companies?.map((company: any) => (
                    <TableRow key={company.companyId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCompanies.includes(company.companyId)}
                          onCheckedChange={() => toggleCompanySelection(company.companyId)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {company.companyName}
                      </TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>
                        <Badge variant={company.quotePending ? "outline" : "default"}>
                          {company.planTier || "N/A"}
                          {company.quotePending && " (Devis)"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.isActive ? "default" : "secondary"}>
                          {company.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(company.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                companyId: company.companyId,
                                isActive: !company.isActive,
                              })
                            }
                            title={company.isActive ? "Désactiver" : "Activer"}
                          >
                            {company.isActive ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(company.companyId)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette entreprise ? Cette action est
              irréversible et supprimera toutes les données associées (événements,
              participants, transactions, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteCompanyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
