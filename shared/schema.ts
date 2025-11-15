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

// Company Vehicles - vehicles owned by companies (added to events optionally)
export const companyVehicles = pgTable("company_vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // e.g., "Bus A", "Voiture 1"
  vehicleType: text("vehicle_type").notNull(), // e.g., "bus", "car", "van"
  licensePlate: varchar("license_plate", { length: 20 }),
  totalSeats: integer("total_seats").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("company_vehicles_company_idx").on(table.companyId),
}));

// Event Vehicles - link company vehicles to specific events
export const eventVehicles = pgTable("event_vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  companyVehicleId: varchar("company_vehicle_id").references(() => companyVehicles.id, { onDelete: "cascade" }).notNull(),
  assignedDriverId: varchar("assigned_driver_id").references(() => participants.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  eventIdx: index("event_vehicles_event_idx").on(table.eventId),
  vehicleIdx: index("event_vehicles_vehicle_idx").on(table.companyVehicleId),
}));

// Vehicles - linked to driver participants (for participant-created rides)
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  driverParticipantId: varchar("driver_participant_id").references(() => participants.id, { onDelete: "cascade" }).notNull(),
  totalSeats: integer("total_seats").notNull(),
  availableSeats: integer("available_seats").notNull(),
  departureLocation: text("departure_location").notNull(),
  departureCity: text("departure_city").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  destinationLocation: text("destination_location"),
  isPaidRide: boolean("is_paid_ride").default(false).notNull(), // true if driver wants payment
  pricePerKm: decimal("price_per_km", { precision: 5, scale: 2 }), // e.g., 0.10 EUR/km
  estimatedDistance: decimal("estimated_distance", { precision: 8, scale: 2 }), // in km
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
  stripeSessionId: text("stripe_session_id").unique(), // Unique constraint for idempotency
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeInvoiceId: text("stripe_invoice_id").unique(), // Unique constraint for renewal idempotency
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

// Stripe Events - track processed webhook events for idempotency
export const stripeEvents = pgTable("stripe_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<{
    companyId?: string;
    sessionId?: string;
    subscriptionId?: string;
    invoiceId?: string;
  }>(),
}, (table) => ({
  stripeEventIdIdx: index("stripe_events_stripe_event_id_idx").on(table.stripeEventId),
  eventTypeIdx: index("stripe_events_event_type_idx").on(table.eventType),
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

// Message type enum
export const messageTypeEnum = pgEnum("message_type", ["individual", "group", "broadcast"]);
export const messageStatusEnum = pgEnum("message_status", ["sent", "read", "archived"]);

// Admin Messages - for admin to company communications
export const adminMessages = pgTable("admin_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sentByUserId: varchar("sent_by_user_id").references(() => users.id, { onDelete: "set null" }).notNull(),
  messageType: messageTypeEnum("message_type").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sentByIdx: index("admin_messages_sent_by_idx").on(table.sentByUserId),
  typeIdx: index("admin_messages_type_idx").on(table.messageType),
  createdAtIdx: index("admin_messages_created_at_idx").on(table.createdAt),
}));

// Message Recipients - track which companies received which messages
export const messageRecipients = pgTable("message_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").references(() => adminMessages.id, { onDelete: "cascade" }).notNull(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  status: messageStatusEnum("status").default("sent").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  messageIdx: index("message_recipients_message_idx").on(table.messageId),
  companyIdx: index("message_recipients_company_idx").on(table.companyId),
  statusIdx: index("message_recipients_status_idx").on(table.status),
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

export const insertCompanyVehicleSchema = createInsertSchema(companyVehicles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertEventVehicleSchema = createInsertSchema(eventVehicles).omit({ 
  id: true, 
  createdAt: true 
});

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

export const insertStripeEventSchema = createInsertSchema(stripeEvents).omit({ 
  id: true, 
  processedAt: true 
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

export type CompanyVehicle = typeof companyVehicles.$inferSelect;
export type InsertCompanyVehicle = z.infer<typeof insertCompanyVehicleSchema>;

export type EventVehicle = typeof eventVehicles.$inferSelect;
export type InsertEventVehicle = z.infer<typeof insertEventVehicleSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type RefreshToken = typeof refreshTokens.$inferSelect;

export type AdminMessage = typeof adminMessages.$inferSelect;
export type MessageRecipient = typeof messageRecipients.$inferSelect;

export const insertAdminMessageSchema = createInsertSchema(adminMessages).omit({ 
  id: true, 
  createdAt: true 
});

export const insertMessageRecipientSchema = createInsertSchema(messageRecipients).omit({ 
  id: true, 
  createdAt: true 
});

export type InsertAdminMessage = z.infer<typeof insertAdminMessageSchema>;
export type InsertMessageRecipient = z.infer<typeof insertMessageRecipientSchema>;

// Support Requests - for quote/plan upgrade requests
export const supportRequestStatusEnum = pgEnum("support_request_status", ["open", "in_progress", "resolved", "closed"]);
export const supportRequestTypeEnum = pgEnum("support_request_type", ["quote_request", "plan_upgrade", "technical_support", "general_inquiry"]);

export const supportRequests = pgTable("support_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  requestType: supportRequestTypeEnum("request_type").notNull(),
  status: supportRequestStatusEnum("status").default("open").notNull(),
  requestedPlanId: varchar("requested_plan_id").references(() => plans.id),
  subject: text("subject").notNull(),
  priority: varchar("priority", { length: 20 }).default("normal").notNull(),
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("support_requests_company_idx").on(table.companyId),
  statusIdx: index("support_requests_status_idx").on(table.status),
  typeIdx: index("support_requests_type_idx").on(table.requestType),
  createdAtIdx: index("support_requests_created_at_idx").on(table.createdAt),
}));

// Support Messages - bidirectional messages between company and admin
export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supportRequestId: varchar("support_request_id").references(() => supportRequests.id, { onDelete: "cascade" }).notNull(),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "set null" }).notNull(),
  senderType: userRoleEnum("sender_type").notNull(), // admin or company
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false).notNull(), // true for admin-only notes
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  requestIdx: index("support_messages_request_idx").on(table.supportRequestId),
  senderIdx: index("support_messages_sender_idx").on(table.senderId),
  createdAtIdx: index("support_messages_created_at_idx").on(table.createdAt),
}));

export const insertSupportRequestSchema = createInsertSchema(supportRequests).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({ 
  id: true, 
  createdAt: true 
});

export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

// Invitation Tokens - for email invitations to participants
export const invitationTokens = pgTable("invitation_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(),
  participantId: varchar("participant_id").references(() => participants.id, { onDelete: "cascade" }).notNull(),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index("invitation_tokens_token_idx").on(table.token),
  participantIdx: index("invitation_tokens_participant_idx").on(table.participantId),
  eventIdx: index("invitation_tokens_event_idx").on(table.eventId),
  expiresAtIdx: index("invitation_tokens_expires_at_idx").on(table.expiresAt),
}));

// Passenger Ride Requests - passengers looking for rides
export const passengerRideRequests = pgTable("passenger_ride_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").references(() => participants.id, { onDelete: "cascade" }).notNull(),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  departureLocation: text("departure_location").notNull(),
  departureCity: text("departure_city").notNull(),
  matchedVehicleId: varchar("matched_vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, matched, confirmed
  notifiedDrivers: jsonb("notified_drivers").$type<string[]>().default([]), // IDs of drivers notified
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  participantIdx: index("passenger_ride_requests_participant_idx").on(table.participantId),
  eventIdx: index("passenger_ride_requests_event_idx").on(table.eventId),
  departureCityIdx: index("passenger_ride_requests_departure_city_idx").on(table.departureCity),
  statusIdx: index("passenger_ride_requests_status_idx").on(table.status),
}));

// Vehicle Bookings - track passenger bookings on vehicles
export const vehicleBookings = pgTable("vehicle_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id, { onDelete: "cascade" }).notNull(),
  passengerParticipantId: varchar("passenger_participant_id").references(() => participants.id, { onDelete: "cascade" }).notNull(),
  rideRequestId: varchar("ride_request_id").references(() => passengerRideRequests.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, confirmed, cancelled
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  vehicleIdx: index("vehicle_bookings_vehicle_idx").on(table.vehicleId),
  passengerIdx: index("vehicle_bookings_passenger_idx").on(table.passengerParticipantId),
  statusIdx: index("vehicle_bookings_status_idx").on(table.status),
}));

export const insertInvitationTokenSchema = createInsertSchema(invitationTokens).omit({ 
  id: true, 
  createdAt: true 
});

export const insertPassengerRideRequestSchema = createInsertSchema(passengerRideRequests).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertVehicleBookingSchema = createInsertSchema(vehicleBookings).omit({ 
  id: true, 
  createdAt: true 
});

export type InvitationToken = typeof invitationTokens.$inferSelect;
export type InsertInvitationToken = z.infer<typeof insertInvitationTokenSchema>;

export type PassengerRideRequest = typeof passengerRideRequests.$inferSelect;
export type InsertPassengerRideRequest = z.infer<typeof insertPassengerRideRequestSchema>;

export type VehicleBooking = typeof vehicleBookings.$inferSelect;
export type InsertVehicleBooking = z.infer<typeof insertVehicleBookingSchema>;
