import { useState, useEffect, useCallback } from 'react';

interface AddressSuggestion {
  properties: {
    label: string;
    name: string;
    city: string;
    postcode: string;
    citycode: string;
    context: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface AddressAutocompleteResult {
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
  clear: () => void;
}

export function useAddressAutocomplete(): AddressAutocompleteResult {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const search = useCallback((query: string) => {
    // Clear previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Clear suggestions if query is too short
    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Debounce search - wait 300ms after user stops typing
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
        );

        if (!response.ok) {
          throw new Error('Erreur lors de la recherche d\'adresse');
        }

        const data = await response.json();
        setSuggestions(data.features || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    setDebounceTimeout(timeout);
  }, [debounceTimeout]);

  const clear = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
  }, [debounceTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return {
    suggestions,
    isLoading,
    error,
    search,
    clear,
  };
}
