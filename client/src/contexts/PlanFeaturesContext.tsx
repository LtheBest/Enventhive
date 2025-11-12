import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface PlanFeatures {
  maxEvents: number | null;
  maxParticipants: number | null;
  maxVehicles: number | null;
  hasAdvancedReporting: boolean;
  hasNotifications: boolean;
  hasCRM: boolean;
  hasAPI: boolean;
  hasCustomLogo: boolean;
  hasWhiteLabel: boolean;
  hasDedicatedSupport: boolean;
  hasIntegrations: boolean;
}

interface PlanData {
  tier: 'DECOUVERTE' | 'ESSENTIEL' | 'PRO' | 'PREMIUM';
  name: string;
  features: PlanFeatures;
  quotePending: boolean;
  isActive: boolean;
}

interface PlanFeaturesContextType {
  planData: PlanData | null;
  isLoading: boolean;
  isError: boolean;
  hasFeature: (featureName: keyof PlanFeatures) => boolean;
  canAddMore: (resourceType: 'events' | 'participants' | 'vehicles', currentCount: number) => boolean;
  getLimit: (resourceType: 'events' | 'participants' | 'vehicles') => number | null;
}

const PlanFeaturesContext = createContext<PlanFeaturesContextType | undefined>(undefined);

export function PlanFeaturesProvider({ children }: { children: ReactNode }) {
  const { data: planData, isLoading, isError } = useQuery<PlanData>({
    queryKey: ['/api/plans/current-features'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once if error
    enabled: true, // Will fail gracefully for non-company users
  });

  const hasFeature = (featureName: keyof PlanFeatures): boolean => {
    if (!planData) return false;
    const value = planData.features[featureName];
    return typeof value === 'boolean' ? value : false;
  };

  const getLimit = (resourceType: 'events' | 'participants' | 'vehicles'): number | null => {
    if (!planData) return null;
    
    switch (resourceType) {
      case 'events':
        return planData.features.maxEvents;
      case 'participants':
        return planData.features.maxParticipants;
      case 'vehicles':
        return planData.features.maxVehicles;
      default:
        return null;
    }
  };

  const canAddMore = (
    resourceType: 'events' | 'participants' | 'vehicles',
    currentCount: number
  ): boolean => {
    const limit = getLimit(resourceType);
    if (limit === null) return true; // Unlimited
    return currentCount < limit;
  };

  return (
    <PlanFeaturesContext.Provider
      value={{
        planData: planData || null,
        isLoading,
        isError,
        hasFeature,
        canAddMore,
        getLimit,
      }}
    >
      {children}
    </PlanFeaturesContext.Provider>
  );
}

export function usePlanFeatures() {
  const context = useContext(PlanFeaturesContext);
  if (context === undefined) {
    throw new Error('usePlanFeatures must be used within a PlanFeaturesProvider');
  }
  return context;
}
