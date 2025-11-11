/**
 * SIREN Validation Service
 * Uses the French government's API Entreprise to validate SIREN numbers
 * API Documentation: https://api.gouv.fr/les-api/api-entreprise
 */

interface SirenApiResponse {
  unite_legale?: {
    siren: string;
    denomination?: string;
    nom?: string;
    prenom?: string;
    categorie_entreprise?: string;
    etat_administratif?: string;
  };
  errors?: Array<{ message: string }>;
}

export interface SirenValidationResult {
  valid: boolean;
  siren?: string;
  companyName?: string;
  category?: string;
  active?: boolean;
  error?: string;
}

/**
 * Validate SIREN number using API Entreprise
 * Note: This requires an API token from api.gouv.fr
 * For now, we implement basic validation and structure for future integration
 */
export async function validateSirenWithApi(siren: string): Promise<SirenValidationResult> {
  // Basic format validation
  if (!/^\d{9}$/.test(siren)) {
    return {
      valid: false,
      error: 'Le SIREN doit contenir exactement 9 chiffres',
    };
  }

  // Luhn algorithm validation for SIREN
  if (!isValidSirenChecksum(siren)) {
    return {
      valid: false,
      error: 'Le numéro SIREN n\'est pas valide (checksum invalide)',
    };
  }

  // TODO: Implement actual API call when API token is available
  // For now, return valid for properly formatted SIRENs
  // In production, this would call: https://entreprise.api.gouv.fr/v3/insee/sirene/unites_legales/{siren}
  
  const API_TOKEN = process.env.API_ENTREPRISE_TOKEN;
  
  if (!API_TOKEN) {
    // Fallback: Accept valid format but warn
    console.warn('API_ENTREPRISE_TOKEN not configured - SIREN validation is limited to format check');
    return {
      valid: true,
      siren,
      error: undefined,
    };
  }

  try {
    const response = await fetch(
      `https://entreprise.api.gouv.fr/v3/insee/sirene/unites_legales/${siren}`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          valid: false,
          error: 'Ce numéro SIREN n\'existe pas dans la base SIRENE',
        };
      }
      throw new Error(`API returned ${response.status}`);
    }

    const data: SirenApiResponse = await response.json();

    if (data.errors) {
      return {
        valid: false,
        error: data.errors[0]?.message || 'Erreur lors de la validation',
      };
    }

    const unite = data.unite_legale;
    if (!unite) {
      return {
        valid: false,
        error: 'Données SIREN non disponibles',
      };
    }

    return {
      valid: true,
      siren: unite.siren,
      companyName: unite.denomination || `${unite.prenom} ${unite.nom}`,
      category: unite.categorie_entreprise,
      active: unite.etat_administratif === 'A',
    };
  } catch (error) {
    console.error('SIREN API validation error:', error);
    // Fallback to checksum validation only
    return {
      valid: true,
      siren,
      error: 'Impossible de vérifier le SIREN en ligne, validation locale effectuée',
    };
  }
}

/**
 * Validate SIREN checksum using Luhn algorithm
 */
function isValidSirenChecksum(siren: string): boolean {
  let sum = 0;
  
  for (let i = 0; i < siren.length; i++) {
    let digit = parseInt(siren[i], 10);
    
    // Double every second digit
    if (i % 2 === 1) {
      digit *= 2;
      // If result is > 9, subtract 9
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
  }
  
  return sum % 10 === 0;
}
