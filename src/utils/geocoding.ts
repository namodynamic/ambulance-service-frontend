// Geocoding utilities for converting addresses to coordinates
// Currently using mock implementation

export const geocodeAddress = async (
  address: string
): Promise<{ lat: number; lng: number } | null> => {
  try {
    // For now, using the same hash-based approach for consistency
    return getMockCoordinatesFromLocation(address);
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

export const getMockCoordinatesFromLocation = (
  location: string
): { lat: number; lng: number } => {
  let hash = 0;
  for (let i = 0; i < location.length; i++) {
    const char = location.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const lat = 6.5244 + (hash % 2000) / 20000;
  const lng = 3.3792 + ((hash >> 10) % 2000) / 20000;

  return { lat, lng };
};

/**
 * Real geocoding implementation using OpenStreetMap Nominatim
 */
export const geocodeAddressWithNominatim = async (
  address: string
): Promise<{ lat: number; lng: number } | null> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          "User-Agent": "RapidCare Ambulance App/1.0 (contact@rapidcare.com)",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error("Nominatim geocoding error:", error);
    return null;
  }
};

/**
 * Reverse geocoding - convert coordinates to address
 * Currently mock implementation
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<string | null> => {
  try {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Useful for finding nearest ambulances
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Get user's current location using browser geolocation API
 */
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};
