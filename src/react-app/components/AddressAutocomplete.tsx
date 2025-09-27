import { useState, useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter address...",
  className = "",
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Get API key from environment or backend
        let apiKey = "";
        try {
          const configResponse = await fetch('/api/config/google-maps');
          if (configResponse.ok) {
            const { apiKey: fetchedKey } = await configResponse.json();
            apiKey = fetchedKey;
          }
        } catch (error) {
          console.warn("Could not fetch Google Maps API key:", error);
        }

        if (!apiKey) {
          console.warn("Google Maps API key not available");
          return;
        }

        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places"],
        });

        await loader.load();
        setGoogleMapsLoaded(true);
      } catch (error) {
        console.error("Failed to load Google Maps:", error);
      }
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchPlaces = async (query: string) => {
    if (!googleMapsLoaded || !query.trim() || query.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      if (google?.maps?.places?.AutocompleteService) {
        const service = new google.maps.places.AutocompleteService();
        const request = {
          input: query,
          types: ['address'],
          componentRestrictions: { country: 'us' },
        };

        service.getPlacePredictions(request, (predictions, status) => {
          setIsLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions.map(p => ({
              place_id: p.place_id,
              description: p.description,
              structured_formatting: p.structured_formatting
            })));
            setShowDropdown(true);
          } else {
            setPredictions([]);
            setShowDropdown(false);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching place predictions:", error);
      setIsLoading(false);
      setPredictions([]);
      setShowDropdown(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.trim()) {
      searchPlaces(newValue);
    } else {
      setPredictions([]);
      setShowDropdown(false);
    }
  };

  const handlePredictionClick = async (prediction: Prediction) => {
    onChange(prediction.description);
    setShowDropdown(false);
    setPredictions([]);

    // Get detailed place information
    try {
      if (google?.maps?.places?.PlacesService) {
        const service = new google.maps.places.PlacesService(
          document.createElement('div')
        );
        
        service.getDetails(
          {
            placeId: prediction.place_id,
            fields: ['formatted_address', 'geometry'],
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.formatted_address) {
              onChange(place.formatted_address);
            }
          }
        );
      }
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowDropdown(true);
            }
          }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handlePredictionClick(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100 last:border-b-0"
            >
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  {prediction.structured_formatting ? (
                    <>
                      <div className="font-medium text-slate-900">
                        {prediction.structured_formatting.main_text}
                      </div>
                      <div className="text-sm text-slate-600">
                        {prediction.structured_formatting.secondary_text}
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-900">{prediction.description}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!googleMapsLoaded && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          Loading Google Maps...
        </div>
      )}
    </div>
  );
}
