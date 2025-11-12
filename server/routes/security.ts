import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { generateCaptchaChallenge } from '../utils/captcha';

const router = Router();

// Rate limit CAPTCHA generation to prevent abuse
const captchaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Max 20 CAPTCHA requests per minute per IP
  message: 'Trop de requêtes de CAPTCHA. Réessayez dans une minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/security/captcha
 * Generate a new server-signed CAPTCHA challenge
 */
router.get('/captcha', captchaLimiter, (req: Request, res: Response) => {
  try {
    const { challenge, token } = generateCaptchaChallenge();
    
    res.json({
      challenge,  // Display to user: "5+3"
      token,      // Opaque signed token to submit with answer
    });
  } catch (error) {
    console.error('[CAPTCHA] Generation error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du CAPTCHA' });
  }
});

export default router;
