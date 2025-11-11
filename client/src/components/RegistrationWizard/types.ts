import { z } from 'zod';

// Step 1: Company Info + SIREN
export const step1Schema = z.object({
  organizationType: z.enum(['club', 'pme', 'grande_entreprise'], {
    required_error: "Veuillez sélectionner un type d'organisation"
  }),
  companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
  siren: z.string()
    .length(9, "Le SIREN doit contenir 9 chiffres")
    .regex(/^\d{9}$/, "Le SIREN doit être numérique"),
  companyEmail: z.string().email("Email invalide"),
  phone: z.string().optional(),
});

// Step 2: Address
export const step2Schema = z.object({
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, "La ville est requise"),
  postalCode: z.string().optional(),
});

// Step 3: Plan Selection
export const step3Schema = z.object({
  planTier: z.enum(['DECOUVERTE', 'ESSENTIEL', 'PRO', 'PREMIUM'], {
    required_error: "Veuillez sélectionner un plan"
  }),
  billingCycle: z.enum(['monthly', 'annual']).optional(),
});

// Step 4: User Account
export const step4Schema = z.object({
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  userEmail: z.string().email("Email invalide"),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter les CGU"
  }),
});

// Complete registration schema (all steps combined)
export const fullRegistrationSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type FullRegistrationData = z.infer<typeof fullRegistrationSchema>;

// Wizard State
export interface WizardState {
  currentStep: number;
  step1: Partial<Step1Data>;
  step2: Partial<Step2Data>;
  step3: Partial<Step3Data>;
  step4: Partial<Step4Data>;
  sirenValidated: boolean;
  addressValidated: boolean;
}

// Wizard Actions
export type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'UPDATE_STEP_1'; data: Partial<Step1Data> }
  | { type: 'UPDATE_STEP_2'; data: Partial<Step2Data> }
  | { type: 'UPDATE_STEP_3'; data: Partial<Step3Data> }
  | { type: 'UPDATE_STEP_4'; data: Partial<Step4Data> }
  | { type: 'MARK_SIREN_VALIDATED' }
  | { type: 'MARK_ADDRESS_VALIDATED' }
  | { type: 'RESET' };

export const initialWizardState: WizardState = {
  currentStep: 1,
  step1: {},
  step2: {},
  step3: {},
  step4: {},
  sirenValidated: false,
  addressValidated: false,
};
