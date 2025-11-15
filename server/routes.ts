import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import registrationRoutes from "./routes/registration";
import registrationVerifyRoutes from "./routes/registration-verify";
import stripeRoutes from "./routes/stripe";
import invoiceRoutes from "./routes/invoices";
import eventRoutes from "./routes/events";
import participantRoutes from "./routes/participants";
import vehicleRoutes from "./routes/vehicles";
import plansRoutes from "./routes/plans";
import adminRoutes from "./routes/admin";
import dashboardRoutes from "./routes/dashboard";
import securityRoutes from "./routes/security";
import supportRoutes from "./routes/support";
import companyVehiclesRoutes from "./routes/company-vehicles";
import publicEventsRoutes from "./routes/public-events";
import { apiLimiter } from "./auth/rateLimiter";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all API routes
  app.use('/api', apiLimiter);

  // Security routes (CAPTCHA generation, etc.)
  app.use('/api/security', securityRoutes);

  // Authentication routes
  app.use('/api/auth', authRoutes);
  
  // Registration routes
  app.use('/api/registration', registrationRoutes);
  app.use('/api/registration', registrationVerifyRoutes);

  // Stripe payment routes
  app.use('/api/stripe', stripeRoutes);

  // Invoice routes (PDF downloads)
  app.use('/api/invoices', invoiceRoutes);

  // Event management routes
  app.use('/api/events', eventRoutes);

  // Public event routes (no authentication required)
  app.use('/api/public/events', publicEventsRoutes);

  // Participant management routes
  app.use('/api/participants', participantRoutes);

  // Vehicle management routes
  app.use('/api/vehicles', vehicleRoutes);

  // Plans routes (public access to view plans)
  app.use('/api/plans', plansRoutes);

  // Admin routes (requires admin role)
  app.use('/api/admin', adminRoutes);

  // Company dashboard routes
  app.use('/api/dashboard', dashboardRoutes);

  // Support routes (for companies and admins)
  app.use('/api/support', supportRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
