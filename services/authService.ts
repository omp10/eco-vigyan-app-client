import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import api from './api';

const AUTH_TOKEN_KEY = '@ecovigyan_auth_token';
const USER_KEY = '@ecovigyan_user';

// Complete web browser auth session when done
WebBrowser.maybeCompleteAuthSession();

export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  dp?: { url: string };
  role: string;
  points: number;
}

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

class AuthService {
  /**
   * Sign in with Google using Expo Auth Session
   */
  async googleSignIn(): Promise<{ user: User; token: string }> {
    try {
      const redirectUri = 'https://auth.expo.io/@ecovigyan/client';
      // const redirectUri = AuthSession.makeRedirectUri({ ... });
      // Fallback manual override if above fails to generate auth.expo.io
      // const redirectUri = 'https://auth.expo.io/@ecovigyan/client';

      console.log('🔐 Starting Google Sign-In...');
      console.log('📍 Redirect URI:', redirectUri);

      const request = new AuthSession.AuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: {
          access_type: 'offline',
        },
      });

      console.log('🌐 Opening Google OAuth...');
      const result = await request.promptAsync(discovery);

      console.log('📥 OAuth Result:', result.type);

      if (result.type === 'cancel') {
        throw new Error('Sign-in was cancelled');
      }

      if (result.type === 'error') {
        console.error('OAuth Error:', result.error);
        throw new Error(result.error?.message || 'Authentication failed');
      }

      if (result.type !== 'success') {
        throw new Error('Authentication was not successful');
      }

      // Get the ID token from the response
      const idToken = result.params.id_token;

      if (!idToken) {
        console.error('No ID token in response:', result.params);
        throw new Error('No ID token received from Google');
      }

      console.log('✅ Got ID token, sending to backend...');
      return this.loginWithGoogleIdToken(idToken);

    } catch (error: any) {
      console.error('❌ Google Sign-In Error:', error);
      if (error.message) {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  }

  /**
   * Login with an existing Google ID Token (from expo-auth-session hook)
   */
  async loginWithGoogleIdToken(idToken: string): Promise<{ user: User; token: string }> {
      try {
        // Send ID token to backend for verification
        const response = await api.post('/auth/oauth/google', {
            idToken,
        });

        if (!response.data.success) {
            throw new Error(response.data.message || 'Authentication failed');
        }

        const { token, user } = response.data;

        // Store token and user info
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

        console.log('🎉 Sign-in successful!');
        return { user, token };
      } catch (error: any) {
          console.error('Backend Google Login Error:', error);
          throw error;
      }
  }

  /**
   * Sign in with Email and Password
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      const { token, user } = response.data;

      // Store token and user info
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      return { user, token };
    } catch (error: any) {
      console.error('Login Error:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(userData: any): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post('/auth/register', userData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Registration failed');
      }

      const { token, user } = response.data;

      // Store token and user info
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      return { user, token };
    } catch (error: any) {
      console.error('Registration Error:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      // Clear stored data
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get stored auth token
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Get stored user data
   */
  async getUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Verify token with backend
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const response = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const user = response.data.user;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      }

      return null;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Check if user is signed in and token is valid
   */
  async checkAuth(): Promise<User | null> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        return null;
      }

      // Verify token with backend
      return await this.verifyToken(token);
    } catch (error) {
      console.error('Auth check error:', error);
      return null;
    }
  }
}

export default new AuthService();
