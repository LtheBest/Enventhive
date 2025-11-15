import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, MapPin, Building2, Users, Car, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAddressAutocomplete } from '@/hooks/use-address-autocomplete';

interface EventData {
  event: {
    id: string;
    title: string;
    description?: string;
    startDate: string;
    location: string;
    city: string;
    eventType: string;
    maxParticipants?: number;
  };
  company: {
    name: string;
    logoUrl?: string;
  };
  stats: {
    participantCount: number;
    driversCount: number;
  };
}

interface JoinFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  role: 'driver' | 'passenger';
  
  // Driver fields
  departureLocation?: string;
  departureTime?: string;
  totalSeats?: number;
  isPaidRide?: boolean;
  pricePerKm?: number;
  estimatedDistance?: number;
  
  // Passenger fields
  passengerDepartureLocation?: string;
}

export default function PublicEventJoin() {
  const [, params] = useRoute('/events/:eventId/join');
  const eventId = params?.eventId;
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<JoinFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    role: 'passenger',
  });
  
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showDriverAddressSuggestions, setShowDriverAddressSuggestions] = useState(false);
  const [showPassengerAddressSuggestions, setShowPassengerAddressSuggestions] = useState(false);

  const driverAddressAutocomplete = useAddressAutocomplete();
  const passengerAddressAutocomplete = useAddressAutocomplete();

  // Fetch event details
  const { data: eventData, isLoading: eventLoading } = useQuery<EventData>({
    queryKey: [`/api/public/events/${eventId}`],
    enabled: !!eventId,
  });

  // Join event mutation
  const joinMutation = useMutation({
    mutationFn: async (data: JoinFormData) => {
      const response = await fetch(`/api/public/events/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'inscription');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.availableVehicles && data.availableVehicles.length > 0) {
        setAvailableVehicles(data.availableVehicles);
        setShowVehicleSelection(true);
      } else if (data.noDriversAvailable) {
        toast({
          title: 'Inscription confirmée',
          description: data.message,
        });
        setRegistrationSuccess(true);
      } else {
        toast({
          title: 'Inscription réussie',
          description: data.message,
        });
        setRegistrationSuccess(true);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Book vehicle mutation
  const bookVehicleMutation = useMutation({
    mutationFn: async ({ participantId, vehicleId }: { participantId: string; vehicleId: string }) => {
      const response = await fetch(`/api/public/events/${eventId}/book-vehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, vehicleId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la réservation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Réservation confirmée',
        description: 'Votre place a été réservée avec succès !',
      });
      setRegistrationSuccess(true);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: keyof JoinFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (role: 'driver' | 'passenger') => {
    setFormData(prev => ({ ...prev, role }));
    setShowDriverForm(role === 'driver');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    joinMutation.mutate(formData);
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
  };

  const handleConfirmBooking = () => {
    if (selectedVehicle && joinMutation.data?.participant?.id) {
      bookVehicleMutation.mutate({
        participantId: joinMutation.data.participant.id,
        vehicleId: selectedVehicle,
      });
    }
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Événement introuvable</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventDate = new Date(eventData.event.startDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">Inscription confirmée !</CardTitle>
            <CardDescription>
              Vous êtes inscrit(e) à l'événement "{eventData.event.title}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Vous recevrez un email de confirmation avec tous les détails de l'événement.
                </AlertDescription>
              </Alert>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm"><strong>Événement :</strong> {eventData.event.title}</p>
                <p className="text-sm"><strong>Date :</strong> {eventDate}</p>
                <p className="text-sm"><strong>Lieu :</strong> {eventData.event.location}, {eventData.event.city}</p>
                <p className="text-sm"><strong>Organisateur :</strong> {eventData.company.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showVehicleSelection && availableVehicles.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Choisissez votre conducteur</CardTitle>
              <CardDescription>
                Sélectionnez un conducteur pour rejoindre l'événement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableVehicles.map((vehicle) => (
                  <Card
                    key={vehicle.vehicleId}
                    className={`cursor-pointer transition-all ${
                      selectedVehicle === vehicle.vehicleId
                        ? 'border-primary border-2'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleVehicleSelect(vehicle.vehicleId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="font-semibold">
                            {vehicle.driver.firstName} {vehicle.driver.lastName}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{vehicle.departureLocation}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(vehicle.departureTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4" />
                            <span>{vehicle.availableSeats} place(s) disponible(s)</span>
                          </div>
                          {vehicle.isPaidRide && vehicle.pricePerKm && (
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              💰 Trajet rémunéré : {vehicle.pricePerKm}€/km
                              {vehicle.estimatedDistance && ` (≈ ${(parseFloat(vehicle.pricePerKm) * parseFloat(vehicle.estimatedDistance)).toFixed(2)}€)`}
                            </p>
                          )}
                        </div>
                        <div className="h-6 w-6 rounded-full border-2 flex items-center justify-center">
                          {selectedVehicle === vehicle.vehicleId && (
                            <div className="h-3 w-3 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowVehicleSelection(false)}
                  disabled={bookVehicleMutation.isPending}
                >
                  Retour
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={!selectedVehicle || bookVehicleMutation.isPending}
                  className="flex-1"
                >
                  {bookVehicleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Réservation...
                    </>
                  ) : (
                    'Confirmer la réservation'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Event Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                {eventData.company.logoUrl && (
                  <img
                    src={eventData.company.logoUrl}
                    alt={eventData.company.name}
                    className="h-12 mb-4"
                  />
                )}
                <CardTitle className="text-3xl mb-2">{eventData.event.title}</CardTitle>
                <CardDescription className="text-lg">
                  Organisé par {eventData.company.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date et heure</p>
                  <p className="font-medium">{eventDate}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lieu</p>
                  <p className="font-medium">{eventData.event.location}</p>
                  <p className="text-sm text-muted-foreground">{eventData.event.city}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Participants</p>
                  <p className="font-medium">{eventData.stats.participantCount} inscrits</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conducteurs</p>
                  <p className="font-medium">{eventData.stats.driversCount} disponibles</p>
                </div>
              </div>
            </div>
            
            {eventData.event.description && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm">{eventData.event.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Rejoindre l'événement</CardTitle>
            <CardDescription>
              Remplissez le formulaire pour vous inscrire à cet événement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Ex: Paris, Lyon, Marseille..."
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <Label>Vous êtes : *</Label>
                <RadioGroup value={formData.role} onValueChange={(value) => handleRoleChange(value as 'driver' | 'passenger')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="passenger" id="passenger" />
                    <Label htmlFor="passenger" className="cursor-pointer">Passager - Je cherche un covoiturage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="driver" id="driver" />
                    <Label htmlFor="driver" className="cursor-pointer">Conducteur - Je propose un covoiturage</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Driver Form */}
              {showDriverForm && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Informations du trajet</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 relative">
                      <Label htmlFor="departureLocation">Lieu de départ *</Label>
                      <Input
                        id="departureLocation"
                        value={formData.departureLocation || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange('departureLocation', value);
                          driverAddressAutocomplete.search(value);
                          setShowDriverAddressSuggestions(true);
                        }}
                        onFocus={() => {
                          if (driverAddressAutocomplete.suggestions.length > 0) {
                            setShowDriverAddressSuggestions(true);
                          }
                        }}
                        placeholder="Commencez à taper une adresse..."
                        required
                      />
                      {showDriverAddressSuggestions && driverAddressAutocomplete.suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          {driverAddressAutocomplete.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                              onClick={() => {
                                handleInputChange('departureLocation', suggestion.properties.label);
                                handleInputChange('departureCity', suggestion.properties.city || suggestion.properties.name);
                                setShowDriverAddressSuggestions(false);
                                driverAddressAutocomplete.clear();
                              }}
                            >
                              <div className="font-medium">{suggestion.properties.label}</div>
                              <div className="text-xs text-muted-foreground">{suggestion.properties.context}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      {driverAddressAutocomplete.isLoading && (
                        <p className="text-xs text-muted-foreground mt-1">Recherche en cours...</p>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="departureTime">Heure de départ *</Label>
                        <Input
                          id="departureTime"
                          type="datetime-local"
                          value={formData.departureTime || ''}
                          onChange={(e) => handleInputChange('departureTime', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="totalSeats">Nombre de places *</Label>
                        <Input
                          id="totalSeats"
                          type="number"
                          min="1"
                          max="8"
                          value={formData.totalSeats || ''}
                          onChange={(e) => handleInputChange('totalSeats', parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPaidRide"
                        checked={formData.isPaidRide || false}
                        onCheckedChange={(checked) => handleInputChange('isPaidRide', checked)}
                      />
                      <Label htmlFor="isPaidRide" className="cursor-pointer">
                        Je souhaite être rémunéré(e) (0,10€/km recommandé)
                      </Label>
                    </div>

                    {formData.isPaidRide && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="pricePerKm">Prix par km (€)</Label>
                          <Input
                            id="pricePerKm"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.pricePerKm || ''}
                            onChange={(e) => handleInputChange('pricePerKm', parseFloat(e.target.value))}
                            placeholder="0.10"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="estimatedDistance">Distance estimée (km)</Label>
                          <Input
                            id="estimatedDistance"
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.estimatedDistance || ''}
                            onChange={(e) => handleInputChange('estimatedDistance', parseFloat(e.target.value))}
                            placeholder="50"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Passenger Form */}
              {!showDriverForm && (
                <div className="space-y-2 relative">
                  <Label htmlFor="passengerDepartureLocation">Votre lieu de départ</Label>
                  <Input
                    id="passengerDepartureLocation"
                    value={formData.passengerDepartureLocation || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleInputChange('passengerDepartureLocation', value);
                      passengerAddressAutocomplete.search(value);
                      setShowPassengerAddressSuggestions(true);
                    }}
                    onFocus={() => {
                      if (passengerAddressAutocomplete.suggestions.length > 0) {
                        setShowPassengerAddressSuggestions(true);
                      }
                    }}
                    placeholder="Commencez à taper une adresse..."
                  />
                  {showPassengerAddressSuggestions && passengerAddressAutocomplete.suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {passengerAddressAutocomplete.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                          onClick={() => {
                            handleInputChange('passengerDepartureLocation', suggestion.properties.label);
                            setShowPassengerAddressSuggestions(false);
                            passengerAddressAutocomplete.clear();
                          }}
                        >
                          <div className="font-medium">{suggestion.properties.label}</div>
                          <div className="text-xs text-muted-foreground">{suggestion.properties.context}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {passengerAddressAutocomplete.isLoading && (
                    <p className="text-xs text-muted-foreground mt-1">Recherche en cours...</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Cette information nous aidera à vous mettre en relation avec des conducteurs dans votre zone
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={joinMutation.isPending}
              >
                {joinMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  'Confirmer mon inscription'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
