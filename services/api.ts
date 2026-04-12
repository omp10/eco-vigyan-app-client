import axios from 'axios';
import { Platform } from 'react-native';

function resolveApiUrl() {
  const rawUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api').trim();
  const isLocalhost = /https?:\/\/(localhost|127\.0\.0\.1)/i.test(rawUrl);

  if (!isLocalhost) {
    return rawUrl;
  }

  let normalizedUrl = rawUrl.replace(/^https:/i, 'http:');

  if (Platform.OS === 'android') {
    normalizedUrl = normalizedUrl.replace(/localhost|127\.0\.0\.1/i, '10.0.2.2');
  }

  return normalizedUrl;
}

const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getFungusImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  const BASE_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
  const relativePath = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${relativePath}`;
}

export interface MushroomLocation {
  latitude: number;
  longitude: number;
}

export interface Mushroom {
  _id: string;
  commonName?: string;
  scientificName?: string;
  location: MushroomLocation;
  images?: Array<{ url: string }>;
  status: string;
  thumbnail?: string;
  ecologicalRole?: string[];
  submittedBy?: {
    _id: string;
    name: string;
    username: string;
    dp?: { url: string };
  };
  commonUses?: string[];
  createdAt?: string;
  photoDateTime?: string;
  texture?: string;
  underside?: string;
  fruitingSurface?: string;
  stemPresence?: string;
}

export const mushroomService = {
  async getAllMushrooms(): Promise<Mushroom[]> {
    try {
      console.log('Fetching from:', API_URL + '/mushrooms');
      const response = await api.get('/mushrooms');
      //console.log('Response data:', response.data);
      
      // Handle both { mushrooms: [...] } and direct array [...] formats
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      } else if (data.mushrooms && Array.isArray(data.mushrooms)) {
        return data.mushrooms;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching mushrooms:', error.message);
      console.error('API URL was:', API_URL);
      throw error;
    }
  },

  async getMushroomById(id: string): Promise<any> {
    try {
      const response = await api.get(`/mushrooms/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching mushroom details:', error.message);
      throw error;
    }
  },

  async getMushroomsByUser(userId: string): Promise<Mushroom[]> {
    try {
      const response = await api.get(`/mushrooms/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user mushrooms:', error.message);
      throw error;
    }
  },
};

export const trailService = {
  async createTrail(trailData: any, token: string): Promise<any> {
    try {
      const response = await api.post('/trails', trailData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating trail:', error.message);
      throw error;
    }
  },

  async getAllTrails(): Promise<any[]> {
    try {
      const response = await api.get('/trails');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching trails:', error.message);
      return [];
    }
  },

  async deleteTrail(id: string, token: string): Promise<void> {
    try {
      await api.delete(`/trails/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      console.error('Error deleting trail:', error.message);
      throw error;
    }
  }
};

export default api;
