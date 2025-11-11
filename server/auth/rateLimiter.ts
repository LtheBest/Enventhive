import rateLimit from 'express-rate-limit';

// Brute-force protection for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Trop de requêtes. Veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for registration
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  message: 'Trop de tentatives d\'inscription. Veuillez réessayer dans 1 heure.',
  standardHeaders: true,
  legacyHeaders: false,
});
