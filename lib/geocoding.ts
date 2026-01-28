export const geocodeCity = async (cityName: string) => {
  try {
    // Using OpenStreetMap Nominatim API (free, no key required for low usage)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`,
      {
        headers: {
          'User-Agent': 'EcoVigyanApp/1.0'
        }
      }
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};
