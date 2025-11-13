/**
 * Script de mise à jour des features des plans d'abonnement
 * Ce script met à jour les plans existants avec les nouvelles fonctionnalités et limites
 */

import 'dotenv/config';
import { db } from './server/db';
import { plans } from './shared/schema';
import { eq } from 'drizzle-orm';

async function updatePlansFeatures() {
  console.log('🚀 Mise à jour des fonctionnalités des plans...\n');

  try {
    // Récupérer tous les plans existants
    const allPlans = await db.select().from(plans);
    console.log(`✅ ${allPlans.length} plans trouvés\n`);

    // PLAN DÉCOUVERTE
    const decouvertePlan = allPlans.find(p => p.tier === 'DECOUVERTE');
    if (decouvertePlan) {
      await db.update(plans)
        .set({
          features: {
            maxEvents: 2,
            maxParticipants: 10, // Max 10 participants par événement
            maxVehicles: 0, // Pas de véhicules
            hasAdvancedReporting: false,
            hasNotifications: false,
            hasCRM: false,
            hasAPI: false,
            hasCustomLogo: false,
            hasWhiteLabel: false,
            hasDedicatedSupport: false,
            hasIntegrations: false,
            hasBroadcastMessaging: false, // Messagerie de diffusion
          }
        })
        .where(eq(plans.id, decouvertePlan.id));
      console.log('✅ Plan DÉCOUVERTE mis à jour');
      console.log('   - Max 2 événements');
      console.log('   - Max 10 participants/événement');
      console.log('   - 0 véhicule');
      console.log('   - Pas d\'accès aux fonctionnalités avancées\n');
    }

    // PLAN ESSENTIEL
    const essentielPlan = allPlans.find(p => p.tier === 'ESSENTIEL');
    if (essentielPlan) {
      await db.update(plans)
        .set({
          features: {
            maxEvents: null, // Illimité
            maxParticipants: 500, // Max 500 participants par événement
            maxVehicles: 50, // Max 50 véhicules
            hasAdvancedReporting: true, // ✅ Reporting avancé
            hasNotifications: true, // ✅ Notifications
            hasCRM: false,
            hasAPI: false,
            hasCustomLogo: false,
            hasWhiteLabel: false,
            hasDedicatedSupport: false,
            hasIntegrations: false,
            hasBroadcastMessaging: true, // ✅ Messagerie de diffusion participants
          }
        })
        .where(eq(plans.id, essentielPlan.id));
      console.log('✅ Plan ESSENTIEL mis à jour');
      console.log('   - Événements illimités');
      console.log('   - Max 500 participants/événement');
      console.log('   - Max 50 véhicules');
      console.log('   - Reporting avancé, Notifications, Messagerie diffusion\n');
    }

    // PLAN PRO
    const proPlan = allPlans.find(p => p.tier === 'PRO');
    if (proPlan) {
      await db.update(plans)
        .set({
          features: {
            maxEvents: null, // Illimité
            maxParticipants: 5000, // Max 5000 participants par événement
            maxVehicles: 100, // Max 100 véhicules
            hasAdvancedReporting: true,
            hasNotifications: true,
            hasCRM: true, // ✅ CRM
            hasAPI: true, // ✅ API
            hasCustomLogo: true, // ✅ Logo personnalisé dashboard
            hasWhiteLabel: false,
            hasDedicatedSupport: true,
            hasIntegrations: true, // ✅ Intégrations spécifiques
            hasBroadcastMessaging: true,
            hasAdvancedStats: true, // ✅ Statistiques avancées
          }
        })
        .where(eq(plans.id, proPlan.id));
      console.log('✅ Plan PRO mis à jour');
      console.log('   - Événements illimités');
      console.log('   - Max 5000 participants/événement');
      console.log('   - Max 100 véhicules');
      console.log('   - CRM, Stats avancées, Logo personnalisé, Intégrations\n');
    }

    // PLAN PREMIUM
    const premiumPlan = allPlans.find(p => p.tier === 'PREMIUM');
    if (premiumPlan) {
      await db.update(plans)
        .set({
          features: {
            maxEvents: null, // Illimité
            maxParticipants: null, // Illimité (10000+)
            maxVehicles: null, // Illimité
            hasAdvancedReporting: true,
            hasNotifications: true,
            hasCRM: true,
            hasAPI: true,
            hasCustomLogo: true, // ✅ Logo personnalisé dashboard
            hasWhiteLabel: true,
            hasDedicatedSupport: true,
            hasIntegrations: true, // ✅ Intégrations spécifiques
            hasBroadcastMessaging: true,
            hasAdvancedStats: true,
            hasPrioritySupport: true,
          }
        })
        .where(eq(plans.id, premiumPlan.id));
      console.log('✅ Plan PREMIUM mis à jour');
      console.log('   - Événements illimités');
      console.log('   - Participants illimités (10000+)');
      console.log('   - Véhicules illimités');
      console.log('   - Toutes les fonctionnalités premium\n');
    }

    console.log('✅ Mise à jour terminée avec succès!\n');
    console.log('📋 Résumé des fonctionnalités par plan:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔵 DÉCOUVERTE (Gratuit):');
    console.log('   • 2 événements max');
    console.log('   • 10 participants max/événement');
    console.log('   • 0 véhicule');
    console.log('   • Fonctionnalités de base uniquement');
    console.log('');
    console.log('🟢 ESSENTIEL:');
    console.log('   • Événements illimités');
    console.log('   • 500 participants max/événement');
    console.log('   • 50 véhicules max');
    console.log('   • Reporting avancé');
    console.log('   • Notifications');
    console.log('   • Messagerie de diffusion participants');
    console.log('');
    console.log('🟣 PRO:');
    console.log('   • Événements illimités');
    console.log('   • 5000 participants max/événement');
    console.log('   • 100 véhicules max');
    console.log('   • CRM');
    console.log('   • Statistiques avancées');
    console.log('   • Logo personnalisé dashboard');
    console.log('   • Intégrations spécifiques');
    console.log('');
    console.log('🟡 PREMIUM:');
    console.log('   • Événements illimités');
    console.log('   • Participants illimités (10000+)');
    console.log('   • Véhicules illimités');
    console.log('   • Toutes les fonctionnalités PRO +');
    console.log('   • Support prioritaire');
    console.log('   • White label');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des plans:', error);
    process.exit(1);
  }
}

updatePlansFeatures();
