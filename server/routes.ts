import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import registrationRoutes from "./routes/registration";
import { apiLimiter } from "./auth/rateLimiter";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all API routes
  app.use('/api', apiLimiter);

  // Authentication routes
  app.use('/api/auth', authRoutes);
  
  // Registration routes
  app.use('/api/registration', registrationRoutes);

  // TODO: Add other routes here
  // app.use('/api/companies', companyRoutes);
  // app.use('/api/events', eventRoutes);
  // app.use('/api/participants', participantRoutes);
  // etc.

  const httpServer = createServer(app);

  return httpServer;
}
