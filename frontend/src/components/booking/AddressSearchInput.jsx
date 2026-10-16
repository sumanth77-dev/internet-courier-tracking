import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Navigation, Loader2, X, AlertCircle } from 'lucide-react';
import { searchPlaces, reverseGeocode } from '../../services/geocodingService';

export const AddressSearchInput = ({
  placeholder = 'Search address, area or landmark',
  onSelectLocation,
  type = 'pickup', // 'pickup' | 'delivery'
  disabled = false,
  showCurrentLocationButton = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const containerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Place Search
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setErrorMessage('');

    try {
      const results = await searchPlaces(query, abortControllerRef.current.signal);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'Unable to fetch address suggestions');
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setErrorMessage('');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        performSearch(val);
      }, 450);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (item) => {
    setSearchTerm(item.addressLine || item.displayName);
    setIsOpen(false);
    setSuggestions([]);
    if (onSelectLocation) {
      onSelectLocation(item);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    setIsOpen(false);
    setErrorMessage('');
  };

  // Browser Geolocation for Current Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resolved = await reverseGeocode(latitude, longitude);
          if (resolved) {
            setSearchTerm(resolved.addressLine || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            if (onSelectLocation) {
              onSelectLocation(resolved);
            }
          } else {
            // Fallback: provide raw coordinates
            const fallback = {
              latitude: Number(latitude.toFixed(6)),
              longitude: Number(longitude.toFixed(6)),
              addressLine: 'Current Location',
              city: '',
              state: '',
              postalCode: '',
              displayName: 'Current GPS Location',
            };
            setSearchTerm('Current Location');
            if (onSelectLocation) onSelectLocation(fallback);
          }
        } catch (err) {
          setErrorMessage('Could not resolve address for current location. Please verify on map.');
          const fallback = {
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6)),
            addressLine: 'Current Location',
            city: '',
            state: '',
            postalCode: '',
            displayName: 'Current GPS Location',
          };
          setSearchTerm('Current Location');
          if (onSelectLocation) onSelectLocation(fallback);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setErrorMessage('Location permission was denied. Please search or click on the map.');
        } else if (err.code === 2) {
          setErrorMessage('Location position unavailable. Please search by name.');
        } else {
          setErrorMessage('Location request timed out. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#667085]">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full h-11 pl-9 pr-8 rounded-lg border border-[#D9DEE5] bg-white text-sm text-[#172033] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033] transition shadow-xs"
          />

          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
            {isLoading && <Loader2 className="w-4 h-4 text-[#667085] animate-spin" />}
            {searchTerm && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-[#667085] hover:text-[#172033] rounded-md transition cursor-pointer"
                aria-label="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {showCurrentLocationButton && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={disabled || isLocating}
            title="Use current device location"
            className="h-11 px-3.5 rounded-lg border border-[#D9DEE5] bg-white hover:bg-[#F4F6F8] text-[#172033] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 text-[#15803D] animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-[#15803D]" />
            )}
            <span className="hidden sm:inline">Current Location</span>
          </button>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-[#D9DEE5] bg-white shadow-lg py-1.5 divide-y divide-[#F0F2F5]">
          {suggestions.map((item, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-[#F4F6F8] transition flex items-start gap-2.5 cursor-pointer"
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    type === 'pickup'
                      ? 'bg-emerald-50 text-[#15803D]'
                      : 'bg-amber-50 text-[#D97706]'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#172033] truncate">
                    {item.addressLine}
                  </div>
                  <div className="text-[11px] text-[#667085] truncate">
                    {[item.city, item.state, item.postalCode].filter(Boolean).join(', ')}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressSearchInput;
