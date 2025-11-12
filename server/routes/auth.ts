import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, refreshTokens } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../auth/jwt';
import { loginLimiter } from '../auth/rateLimiter';
import { requireAuth } from '../auth/middleware';

const router = Router();

// Helper function to verify math captcha
function verifyMathCaptcha(challenge: string, response: string): boolean {
  if (!challenge || !response) {
    return false;
  }

  try {
    // Extract numbers and operator from challenge (e.g., "5+3")
    const match = challenge.match(/^(\d+)([\+\-\*])(\d+)$/);
    if (!match) {
      return false;
    }

    const num1 = parseInt(match[1], 10);
    const operator = match[2];
    const num2 = parseInt(match[3], 10);
    const userAnswer = parseInt(response, 10);

    if (isNaN(num1) || isNaN(num2) || isNaN(userAnswer)) {
      return false;
    }

    let correctAnswer: number;
    switch (operator) {
      case '+':
        correctAnswer = num1 + num2;
        break;
      case '-':
        correctAnswer = num1 - num2;
        break;
      case '*':
        correctAnswer = num1 * num2;
        break;
      default:
        return false;
    }

    return userAnswer === correctAnswer;
  } catch (error) {
    console.error('Captcha verification error:', error);
    return false;
  }
}

// Login endpoint
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, remember, captchaChallenge, captchaResponse } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Verify captcha
    if (!verifyMathCaptcha(captchaChallenge, captchaResponse)) {
      return res.status(400).json({ error: 'Vérification de sécurité échouée. Veuillez résoudre le calcul correctement.' });
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Compte désactivé. Contactez le support.' });
    }

    // Check if account is locked (brute-force protection)
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      return res.status(429).json({ 
        error: `Compte temporairement verrouillé. Réessayez dans ${minutesLeft} minutes.` 
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      // Increment login attempts
      const newAttempts = (user.loginAttempts || 0) + 1;
      const updates: any = { loginAttempts: newAttempts };

      // Lock account after 5 failed attempts for 30 minutes
      if (newAttempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await db.update(users)
        .set(updates)
        .where(eq(users.id, user.id));

      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Reset login attempts on successful login
    await db.update(users)
      .set({ 
        loginAttempts: 0, 
        lockedUntil: null,
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || undefined,
    });

    // Create refresh token if "remember me" is checked
    let refreshTokenValue: string | null = null;
    if (remember) {
      refreshTokenValue = generateRefreshToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.insert(refreshTokens).values({
        userId: user.id,
        token: refreshTokenValue,
        expiresAt,
      });
    }

    return res.json({
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Refresh token requis' });
    }

    // Find and validate refresh token
    const [refreshToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, token),
          gt(refreshTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, refreshToken.userId))
      .limit(1);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Utilisateur non trouvé ou inactif' });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || undefined,
    });

    return res.json({ accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: 'Erreur lors du rafraîchissement du token' });
  }
});

// Logout endpoint
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (token && req.user) {
      // Delete refresh token
      await db
        .delete(refreshTokens)
        .where(
          and(
            eq(refreshTokens.token, token),
            eq(refreshTokens.userId, req.user.userId)
          )
        );
    }

    return res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        companyId: users.companyId,
        firstName: users.firstName,
        lastName: users.lastName,
        photoUrl: users.photoUrl,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

export default router;
