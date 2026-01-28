import axios from 'axios';

const GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteResponse {
  polyline: LatLng[];
  distanceMeters: number;
  duration: string;
}

/**
 * Decodes an encoded polyline string into an array of LatLng coordinates.
 * Algorithm: Google Polyline Algorithm Format
 */
const decodePolyline = (encoded: string): LatLng[] => {
  const poly: LatLng[] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5
    });
  }
  return poly;
};

export const mapService = {
  /**
   * Fetches a route from Google Routes API v2
   */
  fetchRoute: async (
    origin: LatLng, 
    destination: LatLng, 
    waypoints: LatLng[] = []
  ): Promise<RouteResponse | null> => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Missing Google Maps API Key');
        return null;
      }

      const body = {
        origin: {
          location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } }
        },
        destination: {
          location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } }
        },
        intermediates: waypoints.map(wp => ({
          location: { latLng: { latitude: wp.latitude, longitude: wp.longitude } }
        })),
        travelMode: 'WALK',
        // routingPreference: 'TRAFFIC_UNAWARE', // Not allowed for WALK
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false
        },
        languageCode: 'en-US',
        units: 'METRIC'
      };

      const response = await axios.post(GOOGLE_ROUTES_API_URL, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          // We only need the polyline and distance/duration
          'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration'
        }
      });

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const coordinates = decodePolyline(route.polyline.encodedPolyline);
        return {
          polyline: coordinates,
          distanceMeters: route.distanceMeters,
          duration: route.duration
        };
      }

      return null;
    } catch (error: any) {
        console.error('Error fetching route:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to fetch route');
    }
  },
  /**
   * Calculates the total distance of a path in kilometers using Haversine formula.
   * Useful for initial estimates or when API calls are not needed/desired.
   */
  calculateTotalDistance: (path: LatLng[]): number => {
    if (path.length < 2) return 0;
    
    let totalDist = 0;
    for (let i = 0; i < path.length - 1; i++) {
        totalDist += getDistanceFromLatLonInKm(
            path[i].latitude, path[i].longitude, 
            path[i+1].latitude, path[i+1].longitude
        );
    }
    return totalDist;
  }
};

// Internal Helper: Haversine Formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1); 
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}
