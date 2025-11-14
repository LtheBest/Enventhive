#!/usr/bin/env tsx
import 'dotenv/config';
import { db } from './server/db';
import { plans } from './shared/schema';
import { eq } from 'drizzle-orm';

async function updatePlans() {
  console.log('Updating plans...\n');

  try {
    // Update DECOUVERTE plan
    console.log('Updating DECOUVERTE plan...');
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
          maxEvents: 2,
          maxVehicles: 0,
          hasCustomLogo: false,
          hasWhiteLabel: false,
          hasIntegrations: false,
          maxParticipants: 20,
          hasNotifications: false,
          hasDedicatedSupport: false,
          hasAdvancedReporting: false,
        },
        requiresQuote: false,
        isActive: true,
      })
      .where(eq(plans.tier, 'DECOUVERTE'));
    console.log('DECOUVERTE plan updated\n');

    // Update ESSENTIEL plan
    console.log('Updating ESSENTIEL plan...');
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
          maxEvents: null,
          maxVehicles: 50,
          hasCustomLogo: false,
          hasWhiteLabel: false,
          hasIntegrations: false,
          maxParticipants: 500,
          hasNotifications: true,
          hasDedicatedSupport: false,
          hasAdvancedReporting: true,
        },
        requiresQuote: false,
        isActive: true,
      })
      .where(eq(plans.tier, 'ESSENTIEL'));
    console.log('ESSENTIEL plan updated\n');

    // Update PRO plan
    console.log('Updating PRO plan...');
    await db
      .update(plans)
      .set({
        name: 'Pro',
        description: 'Solution complète pour les professionnels',
        monthlyPrice: '0.00',
        annualPrice: '0.00',
        features: {
          hasAPI: true,
          hasCRM: true,
          maxEvents: null,
          maxVehicles: 100,
          hasCustomLogo: true,
          hasWhiteLabel: false,
          hasIntegrations: true,
          maxParticipants: 5000,
          hasNotifications: true,
          hasDedicatedSupport: false,
          hasAdvancedReporting: true,
        },
        requiresQuote: true,
        isActive: true,
      })
      .where(eq(plans.tier, 'PRO'));
    console.log('PRO plan updated\n');

    // Update PREMIUM plan
    console.log('Updating PREMIUM plan...');
    await db
      .update(plans)
      .set({
        name: 'Premium',
        description: 'Solution sur-mesure avec marque blanche',
        monthlyPrice: '0.00',
        annualPrice: '0.00',
        features: {
          hasAPI: true,
          hasCRM: true,
          maxEvents: null,
          maxVehicles: null,
          hasCustomLogo: true,
          hasWhiteLabel: true,
          hasIntegrations: true,
          maxParticipants: 10000,
          hasNotifications: true,
          hasDedicatedSupport: true,
          hasAdvancedReporting: true,
        },
        requiresQuote: true,
        isActive: true,
      })
      .where(eq(plans.tier, 'PREMIUM'));
    console.log('PREMIUM plan updated\n');

    console.log('All plans updated successfully!');

  } catch (error) {
    console.error('Error updating plans:', error);
    process.exit(1);
  }

  process.exit(0);
}

updatePlans();
