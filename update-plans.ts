import 'dotenv/config';
import { db } from './server/db';
import { plans } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function updatePlans() {
  console.log('🔄 Updating plans with new features...');

  try {
    // Update DECOUVERTE plan
    await db.update(plans)
      .set({
        description: 'Plan gratuit pour découvrir TEAMMOVE - Max 2 événements, 10 participants par événement',
        features: {
          maxEvents: 2,
          maxParticipants: 10,
          maxVehicles: 0,
          hasAdvancedReporting: false,
          hasNotifications: false,
          hasCRM: false,
          hasAPI: false,
          hasCustomLogo: false,
          hasWhiteLabel: false,
          hasDedicatedSupport: false,
          hasIntegrations: false,
        },
      })
      .where(eq(plans.tier, 'DECOUVERTE'));
    console.log('✓ DECOUVERTE plan updated');

    // Update ESSENTIEL plan
    await db.update(plans)
      .set({
        description: 'Pour les entreprises qui grandissent - Reporting avancé, notifications, messagerie participants',
        features: {
          maxEvents: null,
          maxParticipants: 500,
          maxVehicles: 50,
          hasAdvancedReporting: true,
          hasNotifications: true,
          hasCRM: false,
          hasAPI: false,
          hasCustomLogo: false,
          hasWhiteLabel: false,
          hasDedicatedSupport: false,
          hasIntegrations: false,
        },
      })
      .where(eq(plans.tier, 'ESSENTIEL'));
    console.log('✓ ESSENTIEL plan updated');

    // Update PRO plan
    await db.update(plans)
      .set({
        description: 'Solution complète pour les professionnels - CRM, stats avancées, logo personnalisé',
        features: {
          maxEvents: null,
          maxParticipants: 5000,
          maxVehicles: 100,
          hasAdvancedReporting: true,
          hasNotifications: true,
          hasCRM: true,
          hasAPI: true,
          hasCustomLogo: true,
          hasWhiteLabel: false,
          hasDedicatedSupport: false,
          hasIntegrations: true,
        },
      })
      .where(eq(plans.tier, 'PRO'));
    console.log('✓ PRO plan updated');

    // Update PREMIUM plan
    await db.update(plans)
      .set({
        description: 'Solution sur-mesure avec marque blanche - Véhicules illimités, 10000+ participants',
        features: {
          maxEvents: null,
          maxParticipants: 10000,
          maxVehicles: null,
          hasAdvancedReporting: true,
          hasNotifications: true,
          hasCRM: true,
          hasAPI: true,
          hasCustomLogo: true,
          hasWhiteLabel: true,
          hasDedicatedSupport: true,
          hasIntegrations: true,
        },
      })
      .where(eq(plans.tier, 'PREMIUM'));
    console.log('✓ PREMIUM plan updated');

    console.log('✅ All plans updated successfully!');
  } catch (error) {
    console.error('❌ Error updating plans:', error);
    process.exit(1);
  }

  process.exit(0);
}

updatePlans();
