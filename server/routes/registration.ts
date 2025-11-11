import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { companies, users, plans, companyPlanState, planHistory } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { insertCompanySchema, insertUserSchema } from '@shared/schema';
import { registerLimiter } from '../auth/rateLimiter';
import { generateAccessToken, generateRefreshToken } from '../auth/jwt';
import { z } from 'zod';

const router = Router();

// Registration schema with extended validation
const registrationSchema = z.object({
  // Step 1: Organization type
  organizationType: z.enum(['club', 'pme', 'grande_entreprise']),
  
  // Step 2: Plan selection
  planTier: z.enum(['DECOUVERTE', 'ESSENTIEL', 'PRO', 'PREMIUM']),
  billingCycle: z.enum(['monthly', 'annual']).optional(),
  
  // Step 3: Company and user information
  companyName: z.string().min(2, 'Le nom de l\'entreprise est requis'),
  siren: z.string().length(9, 'Le SIREN doit contenir 9 chiffres').regex(/^\d{9}$/, 'Le SIREN doit être numérique'),
  companyEmail: z.string().email('Email invalide'),
  phone: z.string().optional(),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string().optional(),
  
  // User credentials
  userEmail: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis'),
  
  // CGU acceptance
  acceptTerms: z.boolean().refine(val => val === true, 'Vous devez accepter les CGU'),
});

// Main registration endpoint
router.post('/register', registerLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = registrationSchema.parse(req.body);

    // Check if SIREN already exists
    const existingSiren = await db
      .select()
      .from(companies)
      .where(eq(companies.siren, validatedData.siren))
      .limit(1);

    if (existingSiren.length > 0) {
      return res.status(409).json({ error: 'Ce SIREN est déjà enregistré' });
    }

    // Check if company email already exists
    const existingCompanyEmail = await db
      .select()
      .from(companies)
      .where(eq(companies.email, validatedData.companyEmail.toLowerCase()))
      .limit(1);

    if (existingCompanyEmail.length > 0) {
      return res.status(409).json({ error: 'Cet email d\'entreprise est déjà utilisé' });
    }

    // Check if user email already exists
    const existingUserEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.userEmail.toLowerCase()))
      .limit(1);

    if (existingUserEmail.length > 0) {
      return res.status(409).json({ error: 'Cet email utilisateur est déjà utilisé' });
    }

    // Get selected plan
    const [selectedPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.tier, validatedData.planTier))
      .limit(1);

    if (!selectedPlan) {
      return res.status(400).json({ error: 'Plan d\'abonnement invalide' });
    }

    // Determine registration flow based on plan
    if (selectedPlan.requiresQuote) {
      // PRO or PREMIUM - requires quote approval
      return handleQuoteRequiredRegistration(validatedData, selectedPlan, res);
    } else if (validatedData.planTier === 'ESSENTIEL') {
      // ESSENTIEL - requires immediate payment
      return handlePaidRegistration(validatedData, selectedPlan, res);
    } else {
      // DECOUVERTE - free plan, instant activation
      return handleFreeRegistration(validatedData, selectedPlan, res);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Handle free plan registration (DECOUVERTE)
async function handleFreeRegistration(
  data: z.infer<typeof registrationSchema>,
  plan: any,
  res: Response
) {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create company
    const [company] = await db.insert(companies).values({
      name: data.companyName,
      siren: data.siren,
      organizationType: data.organizationType,
      email: data.companyEmail.toLowerCase(),
      phone: data.phone || null,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode || null,
      isActive: true,
    }).returning();

    // Create user
    const [user] = await db.insert(users).values({
      email: data.userEmail.toLowerCase(),
      passwordHash,
      role: 'company',
      companyId: company.id,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: true,
    }).returning();

    // Create plan state
    await db.insert(companyPlanState).values({
      companyId: company.id,
      planId: plan.id,
      quotePending: false,
    });

    // Log plan history
    await db.insert(planHistory).values({
      companyId: company.id,
      oldPlanId: null,
      newPlanId: plan.id,
      reason: 'Initial registration',
      changedByUserId: user.id,
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: company.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: company.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      company: {
        id: company.id,
        name: company.name,
      },
      redirectTo: '/dashboard',
    });
  } catch (error) {
    console.error('Free registration error:', error);
    throw error;
  }
}

// Handle paid plan registration (ESSENTIEL)
async function handlePaidRegistration(
  data: z.infer<typeof registrationSchema>,
  plan: any,
  res: Response
) {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create company
    const [company] = await db.insert(companies).values({
      name: data.companyName,
      siren: data.siren,
      organizationType: data.organizationType,
      email: data.companyEmail.toLowerCase(),
      phone: data.phone || null,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode || null,
      isActive: true,
    }).returning();

    // Create user
    const [user] = await db.insert(users).values({
      email: data.userEmail.toLowerCase(),
      passwordHash,
      role: 'company',
      companyId: company.id,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: true,
    }).returning();

    // Calculate amount based on billing cycle
    const amount = data.billingCycle === 'annual' 
      ? plan.annualPrice 
      : plan.monthlyPrice;

    // Return payment information
    // The frontend will handle Stripe checkout
    return res.status(201).json({
      success: true,
      message: 'Compte créé, paiement requis',
      requiresPayment: true,
      user: {
        id: user.id,
        email: user.email,
      },
      company: {
        id: company.id,
        name: company.name,
      },
      payment: {
        planId: plan.id,
        planName: plan.name,
        amount: amount.toString(),
        currency: 'EUR',
        billingCycle: data.billingCycle || 'monthly',
      },
      redirectTo: '/payment',
    });
  } catch (error) {
    console.error('Paid registration error:', error);
    throw error;
  }
}

// Handle quote-required registration (PRO or PREMIUM)
async function handleQuoteRequiredRegistration(
  data: z.infer<typeof registrationSchema>,
  plan: any,
  res: Response
) {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create company
    const [company] = await db.insert(companies).values({
      name: data.companyName,
      siren: data.siren,
      organizationType: data.organizationType,
      email: data.companyEmail.toLowerCase(),
      phone: data.phone || null,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode || null,
      isActive: true,
    }).returning();

    // Create user
    const [user] = await db.insert(users).values({
      email: data.userEmail.toLowerCase(),
      passwordHash,
      role: 'company',
      companyId: company.id,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: true,
    }).returning();

    // Get DECOUVERTE plan for temporary access
    const [freePlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.tier, 'DECOUVERTE'))
      .limit(1);

    // Create plan state with quote pending
    await db.insert(companyPlanState).values({
      companyId: company.id,
      planId: freePlan!.id, // Temporarily on free plan
      quotePending: true,
    });

    // Log plan history
    await db.insert(planHistory).values({
      companyId: company.id,
      oldPlanId: null,
      newPlanId: freePlan!.id,
      reason: `Quote requested for ${plan.name}`,
      changedByUserId: user.id,
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: company.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Compte créé, devis en attente',
      requiresQuote: true,
      requestedPlan: plan.name,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: company.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      company: {
        id: company.id,
        name: company.name,
      },
      accessToken,
      redirectTo: '/quote-pending',
    });
  } catch (error) {
    console.error('Quote registration error:', error);
    throw error;
  }
}

// Validate SIREN (basic French SIREN validation)
router.post('/validate-siren', async (req: Request, res: Response) => {
  try {
    const { siren } = req.body;

    if (!siren || !/^\d{9}$/.test(siren)) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Le SIREN doit contenir exactement 9 chiffres' 
      });
    }

    // Check if SIREN already exists
    const existing = await db
      .select()
      .from(companies)
      .where(eq(companies.siren, siren))
      .limit(1);

    if (existing.length > 0) {
      return res.status(200).json({ 
        valid: false, 
        error: 'Ce SIREN est déjà enregistré' 
      });
    }

    return res.json({ valid: true });
  } catch (error) {
    console.error('SIREN validation error:', error);
    return res.status(500).json({ error: 'Erreur lors de la validation du SIREN' });
  }
});

export default router;
