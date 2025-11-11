/**
 * French Address Autocomplete Service
 * Uses the free government API "adresse.data.gouv.fr"
 * API Documentation: https://adresse.data.gouv.fr/api-doc/adresse
 */

interface AddressFeature {
  properties: {
    label: string;
    name: string;
    postcode: string;
    city: string;
    context: string;
    street?: string;
    housenumber?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface AddressApiResponse {
  features: AddressFeature[];
}

export interface AddressSuggestion {
  label: string;
  name: string;
  street?: string;
  housenumber?: string;
  postcode: string;
  city: string;
  context: string;
  coordinates?: {
    lon: number;
    lat: number;
  };
}

/**
 * Search for French addresses using the government API
 * This API is free and does not require authentication
 * 
 * @param query - Search query (partial address)
 * @param limit - Maximum number of results (default: 5)
 * @returns Array of address suggestions
 */
export async function searchFrenchAddresses(
  query: string,
  limit: number = 5
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString(),
      autocomplete: '1',
    });

    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?${params}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Address API error:', response.status);
      return [];
    }

    const data: AddressApiResponse = await response.json();

    return data.features.map((feature) => ({
      label: feature.properties.label,
      name: feature.properties.name,
      street: feature.properties.street,
      housenumber: feature.properties.housenumber,
      postcode: feature.properties.postcode,
      city: feature.properties.city,
      context: feature.properties.context,
      coordinates: {
        lon: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
      },
    }));
  } catch (error) {
    console.error('Address autocomplete error:', error);
    return [];
  }
}

/**
 * Validate that an address is a real French address
 * 
 * @param address - Full address string to validate
 * @returns true if the address exists in the database
 */
export async function validateFrenchAddress(address: string): Promise<boolean> {
  if (!address || address.trim().length < 5) {
    return false;
  }

  try {
    const results = await searchFrenchAddresses(address, 1);
    
    // If we get at least one result, consider the address valid
    return results.length > 0;
  } catch (error) {
    console.error('Address validation error:', error);
    // On error, be lenient and accept the address
    return true;
  }
}
