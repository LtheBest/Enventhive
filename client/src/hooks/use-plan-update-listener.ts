import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

/**
 * Hook pour écouter les changements de plan et mettre à jour l'interface dynamiquement
 * Ce hook invalide les queries et affiche une notification lors d'un changement de plan
 */
export function usePlanUpdateListener() {
  const { plan, refreshAuth } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const previousPlanRef = useRef(plan?.tier);

  useEffect(() => {
    // Vérifier si le plan a changé
    if (previousPlanRef.current && plan?.tier && previousPlanRef.current !== plan.tier) {
      // Le plan a changé !
      const oldPlan = previousPlanRef.current;
      const newPlan = plan.tier;

      console.log(`Plan changed from ${oldPlan} to ${newPlan}`);

      // Afficher une notification
      toast({
        title: "Plan mis à jour ! 🎉",
        description: `Vous êtes maintenant sur le plan ${newPlan}. Profitez de vos nouvelles fonctionnalités !`,
        duration: 5000,
      });

      // Invalider toutes les queries pour recharger les données
      queryClient.invalidateQueries();

      // Recharger les données utilisateur
      refreshAuth();
    }

    // Mettre à jour la référence
    previousPlanRef.current = plan?.tier;
  }, [plan?.tier, queryClient, refreshAuth, toast]);
}

/**
 * Hook pour écouter les changements de plan via polling
 * Utile pour détecter les changements effectués par l'admin
 */
export function usePlanPolling(intervalMs: number = 60000) {
  const { refreshAuth } = useAuth();

  useEffect(() => {
    // Polling toutes les X millisecondes
    const interval = setInterval(() => {
      refreshAuth();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, refreshAuth]);
}

/**
 * Hook pour forcer un refresh du plan
 */
export function useRefreshPlan() {
  const { refreshAuth } = useAuth();
  const queryClient = useQueryClient();

  return async () => {
    // Invalider les queries liées au plan
    await queryClient.invalidateQueries({ queryKey: ['/api/plans/current-features'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    
    // Recharger l'auth
    await refreshAuth();
  };
}
