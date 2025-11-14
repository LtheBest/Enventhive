#!/usr/bin/env tsx
/**
 * Script de mise à jour des plans d'abonnement
 * Corrige les limites selon les nouvelles spécifications
 */

import { db } from './server/db';
import { plans } from './shared/schema';
import { eq } from 'drizzle-orm';

async function updatePlans() {
  console.log('🔄 Mise à jour des plans d'abonnement...\n');

  try {
    // Mise à jour du plan DÉCOUVERTE
    console.log('📝 Mise à jour du plan DÉCOUVERTE...');
    await db
      .update(plans)
      .set({
        name: 'Découverte',
        description: 'Plan gratuit pour découvrir TEAMMOVE',
        monthlyPrice: '0.00',
        annualPrice: '0.00',
        features: {
          hasAPI: false,
          hasCRM: false,
          maxEvents: 2, // Max 2 événements par an
          maxVehicles: 0, // Pas de véhicules
          hasCustomLogo: false,
          hasWhiteLabel: false,
          hasIntegrations: false,
          maxParticipants: 20, // Max 20 participants
          hasNotifications: false,
          hasDedicatedSupport: false,
          hasAdvancedReporting: false,
        },
        requiresQuote: false,
        isActive: true,
      })
      .where(eq(plans.tier, 'DECOUVERTE'));
    console.log('✅ Plan DÉCOUVERTE mis à jour\n');

    // Mise à jour du plan ESSENTIEL
    console.log('📝 Mise à jour du plan ESSENTIEL...');
    await db
      .update(plans)
      .set({
        name: 'Essentiel',
        description: 'Pour les entreprises qui grandissent',
        monthlyPrice: '25.99',
        annualPrice: '300.00',
        features: {
          hasAPI: false,
          hasCRM: false,
          maxEvents: null, // Illimité
          maxVehicles: 50, // Max 50 véhicules
          hasCustomLogo: false,
          hasWhiteLabel: false,
          hasIntegrations: false,
          maxParticipants: 500, // Max 500 participants
          hasNotifications: true,
          hasDedicatedSupport: false,
          hasAdvancedReporting: true,
        },
        requiresQuote: false,
        isActive: true,
      })
      .where(eq(plans.tier, 'ESSENTIEL'));
    console.log('✅ Plan ESSENTIEL mis à jour\n');

    // Mise à jour du plan PRO
    console.log('📝 Mise à jour du plan PRO...');
    await db
      .update(plans)
      .set({
        name: 'Pro',
        description: 'Solution complète pour les professionnels',
        monthlyPrice: '0.00', // Sur devis
        annualPrice: '0.00', // Sur devis
        features: {
          hasAPI: true,
          hasCRM: true,
          maxEvents: null, // Illimité
          maxVehicles: 100, // Max 100 véhicules
          hasCustomLogo: true,
          hasWhiteLabel: false,
          hasIntegrations: true,
          maxParticipants: 5000, // Max 5000 participants
          hasNotifications: true,
          hasDedicatedSupport: false,
          hasAdvancedReporting: true,
        },
        requiresQuote: true, // Sur devis
        isActive: true,
      })
      .where(eq(plans.tier, 'PRO'));
    console.log('✅ Plan PRO mis à jour\n');

    // Mise à jour du plan PREMIUM
    console.log('📝 Mise à jour du plan PREMIUM...');
    await db
      .update(plans)
      .set({
        name: 'Premium',
        description: 'Solution sur-mesure avec marque blanche',
        monthlyPrice: '0.00', // Sur devis
        annualPrice: '0.00', // Sur devis
        features: {
          hasAPI: true,
          hasCRM: true,
          maxEvents: null, // Illimité
          maxVehicles: null, // Véhicules illimités
          hasCustomLogo: true,
          hasWhiteLabel: true,
          hasIntegrations: true,
          maxParticipants: 10000, // Max 10000+ participants
          hasNotifications: true,
          hasDedicatedSupport: true,
          hasAdvancedReporting: true,
        },
        requiresQuote: true, // Sur devis
        isActive: true,
      })
      .where(eq(plans.tier, 'PREMIUM'));
    console.log('✅ Plan PREMIUM mis à jour\n');

    console.log('🎉 Tous les plans ont été mis à jour avec succès !');
    console.log('\nRésumé des changements:');
    console.log('- DÉCOUVERTE: 20 participants max (au lieu de 10)');
    console.log('- ESSENTIEL: 25.99€/mois, 300€/an (au lieu de 49€/mois)');
    console.log('- PRO: Sur devis uniquement');
    console.log('- PREMIUM: Sur devis uniquement\n');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des plans:', error);
    process.exit(1);
  }

  process.exit(0);
}

updatePlans();
