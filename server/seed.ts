import 'dotenv/config';
import { db } from './db';
import { plans, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed plans
  const existingPlans = await db.select().from(plans);
  
  if (existingPlans.length === 0) {
    console.log('Creating subscription plans...');
    
    await db.insert(plans).values([
      {
        tier: 'DECOUVERTE',
        name: 'Découverte',
        description: 'Plan gratuit pour découvrir TEAMMOVE - Max 2 événements, 10 participants par événement',
        monthlyPrice: '0',
        annualPrice: '0',
        features: {
          maxEvents: 2,
          maxParticipants: 10,
          maxVehicles: 0, // Pas de véhicules pour DECOUVERTE
          hasAdvancedReporting: false,
          hasNotifications: false,
          hasCRM: false,
          hasAPI: false,
          hasCustomLogo: false,
          hasWhiteLabel: false,
          hasDedicatedSupport: false,
          hasIntegrations: false,
        },
        requiresQuote: false,
        isActive: true,
      },
      {
        tier: 'ESSENTIEL',
        name: 'Essentiel',
        description: 'Pour les entreprises qui grandissent - Reporting avancé, notifications, messagerie participants',
        monthlyPrice: '49.00',
        annualPrice: '490.00',
        features: {
          maxEvents: null, // Illimité
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
        requiresQuote: false,
        isActive: true,
      },
      {
        tier: 'PRO',
        name: 'Pro',
        description: 'Solution complète pour les professionnels - CRM, stats avancées, logo personnalisé',
        monthlyPrice: '199.00',
        annualPrice: '1990.00',
        features: {
          maxEvents: null, // Illimité
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
        requiresQuote: true,
        isActive: true,
      },
      {
        tier: 'PREMIUM',
        name: 'Premium',
        description: 'Solution sur-mesure avec marque blanche - Véhicules illimités, 10000+ participants',
        monthlyPrice: '499.00',
        annualPrice: '4990.00',
        features: {
          maxEvents: null, // Illimité
          maxParticipants: null, // 10000+ (illimité)
          maxVehicles: null, // Illimité
          hasAdvancedReporting: true,
          hasNotifications: true,
          hasCRM: true,
          hasAPI: true,
          hasCustomLogo: true,
          hasWhiteLabel: true,
          hasDedicatedSupport: true,
          hasIntegrations: true,
        },
        requiresQuote: true,
        isActive: true,
      },
    ]);
    
    console.log('✓ Plans created');
  } else {
    console.log('✓ Plans already exist');
  }

  // Create 2 default admin accounts
  const existingAdmins = await db
    .select()
    .from(users)
    .where(eq(users.role, 'admin'));

  if (existingAdmins.length === 0) {
    console.log('Creating default admin accounts...');
    
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    
    await db.insert(users).values([
      {
        email: 'admin1@teammove.fr',
        passwordHash: adminPassword,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'Principal',
        isActive: true,
      },
      {
        email: 'admin2@teammove.fr',
        passwordHash: adminPassword,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'Secondaire',
        isActive: true,
      },
    ]);
    
    console.log('✓ Admin accounts created (email: admin1@teammove.fr / admin2@teammove.fr, password: Admin123!)');
  } else {
    console.log('✓ Admin accounts already exist');
  }

  console.log('✅ Seeding complete!');
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
