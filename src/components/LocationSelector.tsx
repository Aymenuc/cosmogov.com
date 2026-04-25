'use client';

import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Navigation, Globe, Building2 } from 'lucide-react';

export interface LocationData {
  countryId?: string;
  countryName?: string;
  stateId?: string;
  stateName?: string;
  cityId?: string;
  cityName?: string;
  latitude?: number;
  longitude?: number;
}

interface LocationSelectorProps {
  value?: LocationData;
  onChange: (location: LocationData) => void;
  compact?: boolean;
  showMap?: boolean;
}

interface CountryOption {
  id: string;
  name: string;
  emoji?: string;
}

interface StateOption {
  id: string;
  name: string;
}

interface CityOption {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
}

export default function LocationSelector({ value, onChange, compact = false, showMap = false }: LocationSelectorProps) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingMyLocation, setLoadingMyLocation] = useState(false);

  // Load countries on mount
  useEffect(() => {
    setLoadingCountries(true);
    fetch('/api/geo/countries')
      .then(res => res.json())
      .then(data => {
        if (data.countries) {
          setCountries(data.countries);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingCountries(false));
  }, []);

  // Load states when country changes
  const handleCountryChange = useCallback(async (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    const newLocation: LocationData = {
      countryId,
      countryName: country?.name,
      stateId: undefined,
      stateName: undefined,
      cityId: undefined,
      cityName: undefined,
      latitude: undefined,
      longitude: undefined,
    };
    onChange(newLocation);
    setStates([]);
    setCities([]);

    if (!countryId) return;

    setLoadingStates(true);
    try {
      const res = await fetch(`/api/geo/states?countryId=${countryId}`);
      const data = await res.json();
      setStates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStates(false);
    }
  }, [countries, onChange]);

  // Load cities when state changes
  const handleStateChange = useCallback(async (stateId: string) => {
    const state = states.find(s => s.id === stateId);
    const newLocation: LocationData = {
      ...value,
      stateId,
      stateName: state?.name,
      cityId: undefined,
      cityName: undefined,
      latitude: undefined,
      longitude: undefined,
    };
    onChange(newLocation);
    setCities([]);

    if (!stateId) return;

    setLoadingCities(true);
    try {
      const res = await fetch(`/api/geo/cities?stateId=${stateId}`);
      const data = await res.json();
      setCities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCities(false);
    }
  }, [states, value, onChange]);

  // Handle city change — auto-fill lat/lng
  const handleCityChange = useCallback((cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    const lat = city?.latitude ? parseFloat(city.latitude) : undefined;
    const lng = city?.longitude ? parseFloat(city.longitude) : undefined;

    onChange({
      ...value,
      cityId,
      cityName: city?.name,
      latitude: lat && !isNaN(lat) ? lat : undefined,
      longitude: lng && !isNaN(lng) ? lng : undefined,
    });
  }, [cities, value, onChange]);

  // "Use My Location" button
  const handleUseMyLocation = async () => {
    setLoadingMyLocation(true);
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return;
      const user = await res.json();
      if (user.countryId) {
        // Load states for this country
        const statesRes = await fetch(`/api/geo/states?countryId=${user.countryId}`);
        const statesData = await statesRes.json();
        setStates(Array.isArray(statesData) ? statesData : []);

        if (user.stateId) {
          // Load cities for this state
          const citiesRes = await fetch(`/api/geo/cities?stateId=${user.stateId}`);
          const citiesData = await citiesRes.json();
          setCities(Array.isArray(citiesData) ? citiesData : []);
        }

        onChange({
          countryId: user.countryId,
          countryName: user.countryName,
          stateId: user.stateId,
          stateName: user.stateName,
          cityId: user.cityId,
          cityName: user.cityName,
          latitude: user.latitude,
          longitude: user.longitude,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMyLocation(false);
    }
  };

  const selectClasses = 'bg-white/5 border-white/10 text-white';
  const placeholderClasses = 'text-cosmic-muted/50';

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-cosmic-teal" />
          <span className="text-xs text-cosmic-muted">Location</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-6 text-[10px] text-cosmic-teal hover:text-cosmic-teal/80 px-2"
            onClick={handleUseMyLocation}
            disabled={loadingMyLocation}
          >
            {loadingMyLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
            <span className="ml-1">My Location</span>
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Select value={value?.countryId || ''} onValueChange={handleCountryChange}>
            <SelectTrigger className={`${selectClasses} h-8 text-xs`}>
              <SelectValue placeholder="Country" className={placeholderClasses} />
            </SelectTrigger>
            <SelectContent className="bg-[#0B1022] border-white/10 max-h-60">
              {loadingCountries ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-cosmic-teal" />
                </div>
              ) : (
                countries.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-white text-xs focus:bg-white/5 focus:text-white">
                    {c.emoji && <span className="mr-1">{c.emoji}</span>}{c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={value?.stateId || ''} onValueChange={handleStateChange} disabled={!value?.countryId || loadingStates}>
            <SelectTrigger className={`${selectClasses} h-8 text-xs`}>
              <SelectValue placeholder="State" className={placeholderClasses} />
            </SelectTrigger>
            <SelectContent className="bg-[#0B1022] border-white/10 max-h-60">
              {loadingStates ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-cosmic-teal" />
                </div>
              ) : (
                states.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-white text-xs focus:bg-white/5 focus:text-white">
                    {s.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={value?.cityId || ''} onValueChange={handleCityChange} disabled={!value?.stateId || loadingCities}>
            <SelectTrigger className={`${selectClasses} h-8 text-xs`}>
              <SelectValue placeholder="City" className={placeholderClasses} />
            </SelectTrigger>
            <SelectContent className="bg-[#0B1022] border-white/10 max-h-60">
              {loadingCities ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-cosmic-teal" />
                </div>
              ) : (
                cities.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-white text-xs focus:bg-white/5 focus:text-white">
                    {c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        {value?.latitude != null && value?.longitude != null && (
          <p className="text-[10px] text-cosmic-muted/60">
            📍 {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
          </p>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cosmic-teal/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-cosmic-teal" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Location</h3>
            <p className="text-xs text-cosmic-muted">Where is this initiative based?</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-cosmic-teal/20 text-cosmic-teal hover:bg-cosmic-teal/10 hover:text-cosmic-teal h-8"
          onClick={handleUseMyLocation}
          disabled={loadingMyLocation}
        >
          {loadingMyLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          <span className="ml-1.5 text-xs">Use My Location</span>
        </Button>
      </div>

      <div className="space-y-3">
        {/* Country */}
        <div className="space-y-1.5">
          <label className="text-xs text-cosmic-muted flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Country
          </label>
          <Select value={value?.countryId || ''} onValueChange={handleCountryChange}>
            <SelectTrigger className={`${selectClasses} w-full`}>
              <SelectValue placeholder="Select a country" className={placeholderClasses} />
            </SelectTrigger>
            <SelectContent className="bg-[#0B1022] border-white/10 max-h-64">
              {loadingCountries ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-cosmic-teal" />
                  <span className="ml-2 text-xs text-cosmic-muted">Loading countries...</span>
                </div>
              ) : (
                countries.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-white focus:bg-white/5 focus:text-white">
                    {c.emoji && <span className="mr-1.5">{c.emoji}</span>}{c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* State */}
        <div className="space-y-1.5">
          <label className="text-xs text-cosmic-muted flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            State / Region
          </label>
          <Select value={value?.stateId || ''} onValueChange={handleStateChange} disabled={!value?.countryId || loadingStates}>
            <SelectTrigger className={`${selectClasses} w-full`}>
              {loadingStates ? (
                <div className="flex items-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cosmic-teal mr-2" />
                  <span className="text-xs text-cosmic-muted">Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select a state / region" className={placeholderClasses} />
              )}
            </SelectTrigger>
            <SelectContent className="bg-[#0B1022] border-white/10 max-h-64">
              {states.map(s => (
                <SelectItem key={s.id} value={s.id} className="text-white focus:bg-white/5 focus:text-white">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <label className="text-xs text-cosmic-muted flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            City
          </label>
          <Select value={value?.cityId || ''} onValueChange={handleCityChange} disabled={!value?.stateId || loadingCities}>
            <SelectTrigger className={`${selectClasses} w-full`}>
              {loadingCities ? (
                <div className="flex items-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cosmic-teal mr-2" />
                  <span className="text-xs text-cosmic-muted">Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select a city" className={placeholderClasses} />
              )}
            </SelectTrigger>
            <SelectContent className="bg-[#0B1022] border-white/10 max-h-64">
              {cities.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-white focus:bg-white/5 focus:text-white">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Coordinates display */}
      {value?.latitude != null && value?.longitude != null && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cosmic-teal/5 border border-cosmic-teal/10">
          <Navigation className="w-3.5 h-3.5 text-cosmic-teal" />
          <span className="text-xs text-cosmic-teal">
            Coordinates: {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
          </span>
          {value.cityName && (
            <span className="text-xs text-cosmic-muted ml-1">
              · {value.cityName}{value.stateName ? `, ${value.stateName}` : ''}{value.countryName ? `, ${value.countryName}` : ''}
            </span>
          )}
        </div>
      )}

      {/* Mini map preview */}
      {showMap && value?.latitude != null && value?.longitude != null && (
        <div className="rounded-lg overflow-hidden border border-white/10 h-40 bg-[#070A12] flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-6 h-6 text-cosmic-teal mx-auto mb-1" />
            <p className="text-xs text-cosmic-muted">
              {value.latitude.toFixed(4)}°, {value.longitude.toFixed(4)}°
            </p>
            <p className="text-[10px] text-cosmic-muted/60 mt-0.5">
              Map preview — see Cosmic Map for full view
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
