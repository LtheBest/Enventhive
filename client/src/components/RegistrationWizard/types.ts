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
  street: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, "La ville est requise"),
  postalCode: z.string().min(5, "Le code postal est requis"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// Step 3: Plan Selection
export const step3Schema = z.object({
  planId: z.number().min(1, "Veuillez sélectionner un plan"),
  planTier: z.string().min(1, "Le plan est requis"),
});

// Step 4: User Account (base schema without refinement)
const step4BaseSchema = z.object({
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  confirmPassword: z.string().min(1, "Confirmez votre mot de passe"),
});

// Step 4 with password matching validation
export const step4Schema = step4BaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  }
);

// Nested registration schema (matches WizardState structure)
export const nestedRegistrationSchema = z.object({
  step1: step1Schema.partial(),
  step2: step2Schema.partial(),
  step3: step3Schema.partial(),
  step4: step4BaseSchema.partial(),
});

// Complete flat registration schema (for final validation)
export const fullRegistrationSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type NestedRegistrationData = z.infer<typeof nestedRegistrationSchema>;
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
  | { type: 'SET_ADDRESS_VALIDATED'; validated: boolean }
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
