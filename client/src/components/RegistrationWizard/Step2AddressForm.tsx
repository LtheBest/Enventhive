import { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { useLocation } from "wouter";
import { Loader2, MapPin, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { NestedRegistrationData, Step2Data } from "./types";

interface AddressSuggestion {
  label: string;
  name: string;
  street?: string;
  housenumber?: string;
  postcode: string;  // Backend returns "postcode" not "postalCode"
  city: string;
  context: string;
  coordinates?: {
    lon: number;
    lat: number;
  };
}

interface Step2Props {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  onAddressValidated: (validated: boolean) => void;
  addressValidated: boolean;
}

export function Step2AddressForm({ onNext, onBack, onAddressValidated, addressValidated }: Step2Props) {
  const { control, setValue, watch, trigger } = useFormContext<NestedRegistrationData>();
  const [, setLocation] = useLocation();
  
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // Initialize from form data when address was previously validated
  const [lastValidatedAddress, setLastValidatedAddress] = useState("");
  const [isAddressSelected, setIsAddressSelected] = useState(addressValidated);

  const street = watch("step2.street");
  const city = watch("step2.city");
  const postalCode = watch("step2.postalCode");

  // Initialize lastValidatedAddress from form data when addressValidated prop is true
  useEffect(() => {
    if (addressValidated && street && city && postalCode && !lastValidatedAddress) {
      setLastValidatedAddress(`${street}, ${city} ${postalCode}`);
      setIsAddressSelected(true);
    }
  }, [addressValidated, street, city, postalCode, lastValidatedAddress]);

  // Fetch address suggestions
  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/registration/address-autocomplete?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Address autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    // Build full street address (housenumber + street)
    const fullStreet = suggestion.housenumber 
      ? `${suggestion.housenumber} ${suggestion.street || suggestion.name}`
      : (suggestion.street || suggestion.name);
    
    setValue("step2.street", fullStreet);
    setValue("step2.city", suggestion.city);
    setValue("step2.postalCode", suggestion.postcode);
    
    // Set coordinates if available
    if (suggestion.coordinates) {
      setValue("step2.latitude", suggestion.coordinates.lat);
      setValue("step2.longitude", suggestion.coordinates.lon);
    }
    
    setLastValidatedAddress(`${fullStreet}, ${suggestion.city} ${suggestion.postcode}`);
    setIsAddressSelected(true);
    setIsPopoverOpen(false);
    onAddressValidated(true);
  };

  // Reset validation when user manually edits
  const handleManualEdit = () => {
    const currentAddress = `${street}, ${city} ${postalCode}`;
    if (currentAddress !== lastValidatedAddress) {
      setIsAddressSelected(false);
      onAddressValidated(false);
    }
  };

  const handleNext = async () => {
    // First check address selection (UX requirement)
    if (!isAddressSelected) {
      alert("Veuillez sélectionner une adresse depuis les suggestions");
      return;
    }
    
    // Trigger validation for step2 fields
    const isValid = await trigger([
      'step2.street',
      'step2.city',
      'step2.postalCode'
    ]);
    if (!isValid) return;
    
    // Get data from parent form
    const formData = watch();
    onNext(formData.step2 as Step2Data);
  };

  return (
    <Card className="w-full" data-testid="card-step2-address">
      <CardHeader>
        <CardTitle>Adresse de l'entreprise</CardTitle>
        <CardDescription>
          Saisissez au moins 3 caractères pour afficher les suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Address Search with Autocomplete */}
        <div className="space-y-2">
          <Label htmlFor="addressSearch">Rechercher une adresse</Label>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isPopoverOpen}
                className="w-full justify-between"
                data-testid="button-address-search"
              >
                {isAddressSelected && lastValidatedAddress ? (
                  <span className="truncate">{lastValidatedAddress}</span>
                ) : (
                  <span className="text-muted-foreground">Commencez à taper...</span>
                )}
                <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Ex: 10 Rue de la Paix, Paris"
                  onValueChange={(value) => {
                    fetchSuggestions(value);
                  }}
                  data-testid="input-address-autocomplete"
                />
                <CommandList>
                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Recherche...</span>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <CommandEmpty>Aucune adresse trouvée</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {suggestions.map((suggestion, idx) => (
                        <CommandItem
                          key={idx}
                          value={suggestion.label}
                          onSelect={() => handleSuggestionSelect(suggestion)}
                          data-testid={`item-address-suggestion-${idx}`}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              lastValidatedAddress === suggestion.label ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{suggestion.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {suggestion.city} {suggestion.postcode}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {isAddressSelected && (
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4 mr-1" />
              Adresse validée
            </div>
          )}
        </div>

        {/* Manual Address Fields (read-only, populated by autocomplete) */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street">Rue</Label>
            <Controller
              name="step2.street"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    id="street"
                    placeholder="10 Rue de la Paix"
                    onChange={(e) => {
                      field.onChange(e);
                      handleManualEdit();
                    }}
                    data-testid="input-street"
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-600">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Controller
              name="step2.city"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    id="city"
                    placeholder="Paris"
                    onChange={(e) => {
                      field.onChange(e);
                      handleManualEdit();
                    }}
                    data-testid="input-city"
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-600">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">Code postal</Label>
            <Controller
              name="step2.postalCode"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    id="postalCode"
                    placeholder="75001"
                    onChange={(e) => {
                      field.onChange(e);
                      handleManualEdit();
                    }}
                    data-testid="input-postal-code"
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-600">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </div>
        </div>

        {/* Hidden fields for latitude/longitude (populated by address selection) */}
        <Controller
          name="step2.latitude"
          control={control}
          render={({ field }) => <input type="hidden" {...field} />}
        />
        <Controller
          name="step2.longitude"
          control={control}
          render={({ field }) => <input type="hidden" {...field} />}
        />

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            data-testid="button-back"
          >
            Précédent
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={!isAddressSelected}
            data-testid="button-next"
          >
            Suivant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
