import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  decimal
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const organizationTypeEnum = pgEnum("organization_type", ["club", "pme", "grande_entreprise"]);
export const planTierEnum = pgEnum("plan_tier", ["DECOUVERTE", "ESSENTIEL", "PRO", "PREMIUM"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "company"]);
export const eventTypeEnum = pgEnum("event_type", ["single", "recurring"]);
export const participantRoleEnum = pgEnum("participant_role", ["driver", "passenger"]);
export const participantStatusEnum = pgEnum("participant_status", ["confirmed", "pending", "declined"]);
export const eventStatusEnum = pgEnum("event_status", ["upcoming", "ongoing", "completed", "cancelled"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "refunded"]);
export const billingCycleEnum = pgEnum("billing_cycle", ["monthly", "annual"]);

// Companies table - central multi-tenant entity
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  siren: varchar("siren", { length: 9 }).notNull().unique(),
  organizationType: organizationTypeEnum("organization_type").notNull(),
  email: text("email").notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: varchar("postal_code", { length: 10 }),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sirenIdx: index("companies_siren_idx").on(table.siren),
  emailIdx: index("companies_email_idx").on(table.email),
}));

// Users table - platform users (admin or company users)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("company"),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }),
  firstName: text("first_name"),
  lastName: text("last_name"),
  photoUrl: text("photo_url"),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  loginAttempts: integer("login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  companyIdx: index("users_company_idx").on(table.companyId),
  roleCompanyIdx: index("users_role_company_idx").on(table.role, table.companyId),
}));

// Plans reference table - defines available subscription tiers
export const plans = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tier: planTierEnum("tier").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  annualPrice: decimal("annual_price", { precision: 10, scale: 2 }).notNull(),
  features: jsonb("features").notNull().$type<{
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
  }>(),
  requiresQuote: boolean("requires_quote").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Company plan state - tracks current subscription
export const companyPlanState = pgTable("company_plan_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull().unique(),
  planId: varchar("plan_id").references(() => plans.id).notNull(),
  billingCycle: billingCycleEnum("billing_cycle"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  quotePending: boolean("quote_pending").default(false).notNull(),
  quoteApprovedAt: timestamp("quote_approved_at"),
  approvedByUserId: varchar("approved_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("company_plan_state_company_idx").on(table.companyId),
  planIdx: index("company_plan_state_plan_idx").on(table.planId),
}));

// Plan history - tracks all plan changes
export const planHistory = pgTable("plan_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  oldPlanId: varchar("old_plan_id").references(() => plans.id),
  newPlanId: varchar("new_plan_id").references(() => plans.id).notNull(),
  reason: text("reason"),
  changedByUserId: varchar("changed_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("plan_history_company_idx").on(table.companyId),
  createdAtIdx: index("plan_history_created_at_idx").on(table.createdAt),
}));

// Events parent table - for recurring event definitions
export const eventParents = pgTable("event_parents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  city: text("city").notNull(),
  rrule: text("rrule"),
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("event_parents_company_idx").on(table.companyId),
}));

// Events table - actual event instances (single or from recurring)
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  parentId: varchar("parent_id").references(() => eventParents.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  eventType: eventTypeEnum("event_type").notNull().default("single"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location").notNull(),
  city: text("city").notNull(),
  maxParticipants: integer("max_participants"),
  status: eventStatusEnum("status").default("upcoming").notNull(),
  qrCode: text("qr_code"),
  publicLink: text("public_link"),
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("events_company_idx").on(table.companyId),
  companyStartDateIdx: index("events_company_start_date_idx").on(table.companyId, table.startDate),
  companyCityIdx: index("events_company_city_idx").on(table.companyId, table.city),
  statusIdx: index("events_status_idx").on(table.status),
  publicLinkIdx: index("events_public_link_idx").on(table.publicLink),
}));

// Participants - can be linked to users or external guests
export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: varchar("phone", { length: 20 }),
  city: text("city").notNull(),
  role: participantRoleEnum("role").notNull().default("passenger"),
  status: participantStatusEnum("status").default("pending").notNull(),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  eventIdx: index("participants_event_idx").on(table.eventId),
  eventCityIdx: index("participants_event_city_idx").on(table.eventId, table.city),
  eventRoleIdx: index("participants_event_role_idx").on(table.eventId, table.role),
  emailIdx: index("participants_email_idx").on(table.email),
}));

// Vehicles - linked to driver participants
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  driverParticipantId: varchar("driver_participant_id").references(() => participants.id, { onDelete: "cascade" }).notNull(),
  totalSeats: integer("total_seats").notNull(),
  availableSeats: integer("available_seats").notNull(),
  departureLocation: text("departure_location").notNull(),
  departureCity: text("departure_city").notNull(),
  destinationLocation: text("destination_location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  eventIdx: index("vehicles_event_idx").on(table.eventId),
  driverIdx: index("vehicles_driver_idx").on(table.driverParticipantId),
  departureCityIdx: index("vehicles_departure_city_idx").on(table.departureCity),
}));

// Transactions - payment records
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  planId: varchar("plan_id").references(() => plans.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),
  stripeSessionId: text("stripe_session_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeInvoiceId: text("stripe_invoice_id"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  billingCycle: billingCycleEnum("billing_cycle"),
  failureReason: text("failure_reason"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("transactions_company_idx").on(table.companyId),
  stripePaymentIntentIdx: index("transactions_stripe_payment_intent_idx").on(table.stripePaymentIntentId),
  stripeSubscriptionIdx: index("transactions_stripe_subscription_idx").on(table.stripeSubscriptionId),
  statusIdx: index("transactions_status_idx").on(table.status),
}));

// Invoices - generated PDF invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").references(() => transactions.id, { onDelete: "cascade" }).notNull().unique(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  pdfUrl: text("pdf_url"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("invoices_company_idx").on(table.companyId),
  invoiceNumberIdx: index("invoices_invoice_number_idx").on(table.invoiceNumber),
  transactionIdx: index("invoices_transaction_idx").on(table.transactionId),
}));

// Refresh tokens for JWT authentication
export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("refresh_tokens_user_idx").on(table.userId),
  tokenIdx: index("refresh_tokens_token_idx").on(table.token),
  expiresAtIdx: index("refresh_tokens_expires_at_idx").on(table.expiresAt),
}));

// Insert schemas with validation
export const insertCompanySchema = createInsertSchema(companies, {
  email: z.string().email(),
  siren: z.string().length(9).regex(/^\d{9}$/),
  phone: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
}).omit({ id: true, createdAt: true, updatedAt: true, loginAttempts: true, lockedUntil: true });

export const insertEventSchema = createInsertSchema(events).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  qrCode: true,
  publicLink: true,
});

export const insertParticipantSchema = createInsertSchema(participants, {
  email: z.string().email(),
}).omit({ id: true, createdAt: true, invitedAt: true });

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  createdAt: true 
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ 
  id: true, 
  createdAt: true 
});

export const insertPlanSchema = createInsertSchema(plans).omit({ 
  id: true, 
  createdAt: true 
});

export const insertCompanyPlanStateSchema = createInsertSchema(companyPlanState).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Export types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;

export type CompanyPlanState = typeof companyPlanState.$inferSelect;
export type InsertCompanyPlanState = z.infer<typeof insertCompanyPlanStateSchema>;

export type PlanHistory = typeof planHistory.$inferSelect;

export type EventParent = typeof eventParents.$inferSelect;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type RefreshToken = typeof refreshTokens.$inferSelect;
