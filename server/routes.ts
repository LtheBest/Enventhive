import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import registrationRoutes from "./routes/registration";
import registrationVerifyRoutes from "./routes/registration-verify";
import stripeRoutes from "./routes/stripe";
import invoiceRoutes from "./routes/invoices";
import eventRoutes from "./routes/events";
import plansRoutes from "./routes/plans";
import adminRoutes from "./routes/admin";
import dashboardRoutes from "./routes/dashboard";
import securityRoutes from "./routes/security";
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

  // Plans routes (public access to view plans)
  app.use('/api/plans', plansRoutes);

  // Admin routes (requires admin role)
  app.use('/api/admin', adminRoutes);

  // Company dashboard routes
  app.use('/api/dashboard', dashboardRoutes);

  // TODO: Add other routes here
  // app.use('/api/companies', companyRoutes);
  // app.use('/api/participants', participantRoutes);
  // etc.

  const httpServer = createServer(app);

  return httpServer;
}
