import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import registrationRoutes from "./routes/registration";
import stripeRoutes from "./routes/stripe";
import invoiceRoutes from "./routes/invoices";
import { apiLimiter } from "./auth/rateLimiter";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all API routes
  app.use('/api', apiLimiter);

  // Authentication routes
  app.use('/api/auth', authRoutes);
  
  // Registration routes
  app.use('/api/registration', registrationRoutes);

  // Stripe payment routes
  app.use('/api/stripe', stripeRoutes);

  // Invoice routes (PDF downloads)
  app.use('/api/invoices', invoiceRoutes);

  // TODO: Add other routes here
  // app.use('/api/companies', companyRoutes);
  // app.use('/api/events', eventRoutes);
  // app.use('/api/participants', participantRoutes);
  // etc.

  const httpServer = createServer(app);

  return httpServer;
}
