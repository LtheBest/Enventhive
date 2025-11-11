import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { useLocation } from "wouter";
import { Loader2, MapPin, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { NestedRegistrationData } from "./types";

interface AddressSuggestion {
  label: string;
  street: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

interface Step2Props {
  onNext: (data: Partial<Step2Data>) => void;
  onBack: () => void;
  onAddressValidated: (validated: boolean) => void;
  addressValidated: boolean;
  defaultValues?: Partial<Step2Data>;
}

interface Step2Data {
  street: string;
  city: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

export function Step2AddressForm({ onNext, onBack, onAddressValidated, addressValidated, defaultValues }: Step2Props) {
  const { control, setValue, watch, getValues } = useFormContext<NestedRegistrationData>();
  const [, setLocation] = useLocation();
  
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // Initialize from wizard state if address was previously validated
  const [lastValidatedAddress, setLastValidatedAddress] = useState(() => {
    if (addressValidated && defaultValues) {
      return `${defaultValues.street}, ${defaultValues.city} ${defaultValues.postalCode}`;
    }
    return "";
  });
  const [isAddressSelected, setIsAddressSelected] = useState(addressValidated);

  const street = watch("step2.street");
  const city = watch("step2.city");
  const postalCode = watch("step2.postalCode");

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
    setValue("step2.street", suggestion.street);
    setValue("step2.city", suggestion.city);
    setValue("step2.postalCode", suggestion.postalCode);
    setValue("step2.latitude", suggestion.latitude);
    setValue("step2.longitude", suggestion.longitude);
    
    setLastValidatedAddress(`${suggestion.street}, ${suggestion.city} ${suggestion.postalCode}`);
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

  const handleNext = () => {
    if (!isAddressSelected) {
      alert("Veuillez sélectionner une adresse depuis les suggestions");
      return;
    }
    // Extract Step2 data from form
    const formData = getValues();
    onNext(formData.step2 || {});
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
                            <span className="font-medium">{suggestion.street}</span>
                            <span className="text-sm text-muted-foreground">
                              {suggestion.city} {suggestion.postalCode}
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
