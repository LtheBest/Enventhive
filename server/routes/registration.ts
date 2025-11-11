import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { companies, users, plans, companyPlanState, planHistory } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { insertCompanySchema, insertUserSchema } from '@shared/schema';
import { registerLimiter } from '../auth/rateLimiter';
import { generateAccessToken, generateRefreshToken } from '../auth/jwt';
import { z } from 'zod';
import { withTransaction } from '../utils/transaction';
import { validateSirenWithApi } from '../services/siren';
import { searchFrenchAddresses, validateFrenchAddress } from '../services/address';
import { createStripeCheckoutSession } from './stripe';

const router = Router();

// Registration schema matching frontend wizard structure
const registrationSchema = z.object({
  // Step 1: Organization and company info
  organizationType: z.enum(['club', 'pme', 'grande_entreprise']),
  companyName: z.string().min(2, 'Le nom de l\'entreprise est requis'),
  siren: z.string().length(9, 'Le SIREN doit contenir 9 chiffres').regex(/^\d{9}$/, 'Le SIREN doit être numérique'),
  companyEmail: z.string().email('Email invalide'),
  phone: z.string().optional(),
  
  // Step 2: Address
  street: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string().min(5, 'Le code postal est requis'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  
  // Step 3: Plan selection
  planId: z.string().uuid('Plan invalide'),
  billingCycle: z.enum(['monthly', 'annual']).optional().default('monthly'),
  
  // Step 4: User credentials
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis'),
});

// Main registration endpoint
// TODO: Re-enable registerLimiter after testing
router.post('/register', /* registerLimiter, */ async (req: Request, res: Response) => {
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
      .where(eq(users.email, validatedData.email.toLowerCase()))
      .limit(1);

    if (existingUserEmail.length > 0) {
      return res.status(409).json({ error: 'Cet email utilisateur est déjà utilisé' });
    }

    // Get selected plan by ID
    const [selectedPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, validatedData.planId))
      .limit(1);

    if (!selectedPlan) {
      return res.status(400).json({ error: 'Plan d\'abonnement invalide' });
    }

    // Determine registration flow based on plan
    if (selectedPlan.requiresQuote) {
      // PRO or PREMIUM - requires quote approval
      return handleQuoteRequiredRegistration(validatedData, selectedPlan, res);
    } else if (selectedPlan.tier === 'ESSENTIEL') {
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
    // Hash password outside transaction
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Execute all database operations in a transaction
    const result = await withTransaction(async (tx) => {
      // Create company
      const [company] = await tx.insert(companies).values({
        name: data.companyName,
        siren: data.siren,
        organizationType: data.organizationType,
        email: data.companyEmail.toLowerCase(),
        phone: data.phone || null,
        address: data.street,
        city: data.city,
        postalCode: data.postalCode || null,
        isActive: true,
      }).returning();

      // Create user
      const [user] = await tx.insert(users).values({
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'company',
        companyId: company.id,
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: true,
      }).returning();

      // Create plan state
      await tx.insert(companyPlanState).values({
        companyId: company.id,
        planId: plan.id,
        quotePending: false,
      });

      // Log plan history
      await tx.insert(planHistory).values({
        companyId: company.id,
        oldPlanId: null,
        newPlanId: plan.id,
        reason: 'Initial registration',
        changedByUserId: user.id,
      });

      return { company, user };
    });

    // Generate tokens after successful transaction
    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      companyId: result.company.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        companyId: result.company.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
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
    // Hash password outside transaction
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Execute all database operations in a transaction
    const result = await withTransaction(async (tx) => {
      // Create company
      const [company] = await tx.insert(companies).values({
        name: data.companyName,
        siren: data.siren,
        organizationType: data.organizationType,
        email: data.companyEmail.toLowerCase(),
        phone: data.phone || null,
        address: data.street,
        city: data.city,
        postalCode: data.postalCode || null,
        isActive: true,
      }).returning();

      // Create user
      const [user] = await tx.insert(users).values({
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'company',
        companyId: company.id,
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: true,
      }).returning();

      // Create plan state (pending payment)
      await tx.insert(companyPlanState).values({
        companyId: company.id,
        planId: plan.id,
        quotePending: false,
      });

      // Log plan history
      await tx.insert(planHistory).values({
        companyId: company.id,
        oldPlanId: null,
        newPlanId: plan.id,
        reason: 'Registration - payment pending',
        changedByUserId: user.id,
      });

      return { company, user };
    });

    // Create Stripe Checkout Session for payment
    const stripeSession = await createStripeCheckoutSession({
      company: {
        id: result.company.id,
        email: result.company.email,
        name: result.company.name,
      },
      plan: {
        id: plan.id,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
      },
      billingCycle: data.billingCycle || 'monthly',
      userId: result.user.id,
      isRegistration: true,
    });

    // Generate JWT token for auto-login before redirecting to Stripe
    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      companyId: result.company.id,
    });

    // Return success with Stripe checkout URL and auth token
    return res.status(201).json({
      success: true,
      message: 'Compte créé, redirection vers le paiement',
      requiresPayment: true,
      stripeCheckoutUrl: stripeSession.url,
      stripeSessionId: stripeSession.id,
      accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        companyId: result.company.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
      },
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
    // Hash password outside transaction
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Execute all database operations in a transaction
    const result = await withTransaction(async (tx) => {
      // Create company
      const [company] = await tx.insert(companies).values({
        name: data.companyName,
        siren: data.siren,
        organizationType: data.organizationType,
        email: data.companyEmail.toLowerCase(),
        phone: data.phone || null,
        address: data.street,
        city: data.city,
        postalCode: data.postalCode || null,
        isActive: true,
      }).returning();

      // Create user
      const [user] = await tx.insert(users).values({
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'company',
        companyId: company.id,
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: true,
      }).returning();

      // Get DECOUVERTE plan for temporary access
      const [freePlan] = await tx
        .select()
        .from(plans)
        .where(eq(plans.tier, 'DECOUVERTE'))
        .limit(1);

      // Create plan state with quote pending
      await tx.insert(companyPlanState).values({
        companyId: company.id,
        planId: freePlan!.id, // Temporarily on free plan
        quotePending: true,
      });

      // Log plan history
      await tx.insert(planHistory).values({
        companyId: company.id,
        oldPlanId: null,
        newPlanId: freePlan!.id,
        reason: `Quote requested for ${plan.name}`,
        changedByUserId: user.id,
      });

      return { company, user };
    });

    // Generate tokens after successful transaction
    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      companyId: result.company.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Compte créé, devis en attente',
      requiresQuote: true,
      requestedPlan: plan.name,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        companyId: result.company.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
      },
      accessToken,
      redirectTo: '/quote-pending',
    });
  } catch (error) {
    console.error('Quote registration error:', error);
    throw error;
  }
}

// Validate SIREN using government API
router.post('/validate-siren', async (req: Request, res: Response) => {
  try {
    const { siren } = req.body;

    if (!siren || !/^\d{9}$/.test(siren)) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Le SIREN doit contenir exactement 9 chiffres' 
      });
    }

    // Check if SIREN already exists in our database
    const existing = await db
      .select()
      .from(companies)
      .where(eq(companies.siren, siren))
      .limit(1);

    if (existing.length > 0) {
      return res.status(200).json({ 
        valid: false, 
        error: 'Ce SIREN est déjà enregistré dans notre système' 
      });
    }

    // Validate SIREN with external API
    const validationResult = await validateSirenWithApi(siren);

    if (!validationResult.valid) {
      return res.status(200).json({
        valid: false,
        error: validationResult.error,
      });
    }

    // Check if company is active
    if (validationResult.active === false) {
      return res.status(200).json({
        valid: false,
        error: 'Cette entreprise n\'est plus active',
      });
    }

    return res.json({
      valid: true,
      companyName: validationResult.companyName,
      category: validationResult.category,
    });
  } catch (error) {
    console.error('SIREN validation error:', error);
    return res.status(500).json({ error: 'Erreur lors de la validation du SIREN' });
  }
});

// French address autocomplete
router.get('/address-autocomplete', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!query || query.trim().length < 3) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await searchFrenchAddresses(query, limit);

    return res.json({ suggestions });
  } catch (error) {
    console.error('Address autocomplete error:', error);
    return res.status(500).json({ error: 'Erreur lors de la recherche d\'adresses' });
  }
});

// Validate French address
router.post('/validate-address', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address || address.trim().length < 5) {
      return res.status(400).json({
        valid: false,
        error: 'L\'adresse est trop courte',
      });
    }

    const isValid = await validateFrenchAddress(address);

    return res.json({
      valid: isValid,
      error: isValid ? undefined : 'Adresse non trouvée dans la base nationale',
    });
  } catch (error) {
    console.error('Address validation error:', error);
    return res.status(500).json({ error: 'Erreur lors de la validation de l\'adresse' });
  }
});

export default router;
