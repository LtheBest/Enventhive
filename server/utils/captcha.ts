import jwt from 'jsonwebtoken';

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || process.env.JWT_SECRET || 'captcha-fallback-secret';
const CAPTCHA_TTL_SECONDS = 120; // 2 minutes

interface CaptchaPayload {
  num1: number;
  num2: number;
  operator: '+' | '-' | '*';
  answer: number;
  iat: number; // issued at
}

/**
 * Generate a secure CAPTCHA challenge with signed token
 * Returns: { challenge: "5+3", token: "signed.jwt.token" }
 */
export function generateCaptchaChallenge(): { challenge: string; token: string } {
  // Generate random operands
  const num1 = Math.floor(Math.random() * 10) + 1; // 1-10
  const num2 = Math.floor(Math.random() * 10) + 1; // 1-10
  
  // Random operator
  const operators: Array<'+' | '-' | '*'> = ['+', '-', '*'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  
  // Calculate correct answer
  let answer: number;
  switch (operator) {
    case '+':
      answer = num1 + num2;
      break;
    case '-':
      answer = num1 - num2;
      break;
    case '*':
      answer = num1 * num2;
      break;
  }
  
  // Create payload (server-controlled operands/operator/answer)
  const payload: CaptchaPayload = {
    num1,
    num2,
    operator,
    answer,
    iat: Math.floor(Date.now() / 1000),
  };
  
  // Sign token with HMAC (JWT)
  const token = jwt.sign(payload, CAPTCHA_SECRET, {
    expiresIn: CAPTCHA_TTL_SECONDS,
    algorithm: 'HS256',
  });
  
  // Return displayable challenge and opaque signed token
  const challenge = `${num1}${operator}${num2}`;
  
  return { challenge, token };
}

/**
 * Verify CAPTCHA token and user response
 * Returns true if valid, false otherwise
 */
export function verifyCaptchaResponse(token: string, userResponse: string): boolean {
  if (!token || !userResponse) {
    return false;
  }
  
  try {
    // Verify and decode token
    const decoded = jwt.verify(token, CAPTCHA_SECRET, {
      algorithms: ['HS256'],
    }) as CaptchaPayload;
    
    // Check if expired (JWT already checks, but double-check)
    const now = Math.floor(Date.now() / 1000);
    if (now - decoded.iat > CAPTCHA_TTL_SECONDS) {
      console.warn('[CAPTCHA] Token expired');
      return false;
    }
    
    // Verify user's answer matches server-calculated answer
    const userAnswer = parseInt(userResponse, 10);
    if (isNaN(userAnswer)) {
      return false;
    }
    
    const isValid = userAnswer === decoded.answer;
    
    if (!isValid) {
      console.warn('[CAPTCHA] Invalid answer', {
        expected: decoded.answer,
        received: userAnswer,
      });
    }
    
    return isValid;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('[CAPTCHA] Token expired during verification');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('[CAPTCHA] Invalid token signature');
    } else {
      console.error('[CAPTCHA] Verification error:', error);
    }
    return false;
  }
}
