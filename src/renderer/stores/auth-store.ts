/**
 * Authentication Store
 * 
 * This store manages Firebase authentication state, including anonymous sign-in
 * and user session management for the BrainSwift application.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from 'firebase/auth';
import { firebaseClient, type FirebaseResult } from '../services/api/firebase-client';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  error: string | null;

  // Actions
  signInAnonymously: () => Promise<boolean>;
  signOut: () => void;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setInitializing: (initializing: boolean) => void;
}

/**
 * Authentication store for managing Firebase authentication state
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isInitializing: true,
      error: null,

      /**
       * Sign in anonymously to Firebase
       * @returns Promise<boolean> - true if successful, false otherwise
       */
      signInAnonymously: async (): Promise<boolean> => {
        try {
          console.log('🔐 Starting anonymous sign-in...');
          set({ error: null, isInitializing: true });
          
          const result: FirebaseResult<User> = await firebaseClient.signInAnonymously();
          
          if (result.success) {
            console.log('🔐 Anonymous sign-in successful, updating auth store...');
            set({
              user: result.data,
              isAuthenticated: true,
              isInitializing: false,
              error: null
            });
            console.log('🔐 Auth store updated: isInitializing =', false);
            console.log('Anonymous sign-in successful');
            return true;
          } else {
            console.log('🔐 Anonymous sign-in failed, updating auth store...');
            set({
              user: null,
              isAuthenticated: false,
              isInitializing: false,
              error: result.error
            });
            console.error('Anonymous sign-in failed:', result.error);
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
          console.log('🔐 Sign-in error, updating auth store...');
          set({
            user: null,
            isAuthenticated: false,
            isInitializing: false,
            error: errorMessage
          });
          console.error('Sign-in error:', errorMessage);
          return false;
        }
      },

      /**
       * Sign out the current user
       */
      signOut: (): void => {
        console.log('🔐 Signing out user...');
        set({
          user: null,
          isAuthenticated: false,
          error: null
        });
        console.log('User signed out');
      },

      /**
       * Clear any authentication errors
       */
      clearError: (): void => {
        set({ error: null });
      },

      /**
       * Set the current user (used by Firebase auth state listener)
       * @param user - The Firebase user object or null
       */
      setUser: (user: User | null): void => {
        console.log('🔐 Auth store setUser called with user:', user ? 'User object' : 'null');
        console.log('🔐 Current auth store state before setUser:', {
          isAuthenticated: get().isAuthenticated,
          isInitializing: get().isInitializing
        });
        
        set({
          user,
          isAuthenticated: !!user,
          isInitializing: false
        });
        
        console.log('🔐 Auth store state after setUser:', {
          isAuthenticated: !!user,
          isInitializing: false
        });
      },

      /**
       * Set the initializing state
       * @param initializing - Whether authentication is still initializing
       */
      setInitializing: (initializing: boolean): void => {
        console.log('🔐 Setting isInitializing to:', initializing);
        set({ isInitializing: initializing });
      }
    }),
    {
      name: 'auth-storage',
      // Only persist basic authentication state, not the full user object
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        // Don't persist the user object as it contains functions
        // that can't be serialized
      }),
      // Custom storage handlers for Firebase User object
      onRehydrateStorage: () => (state) => {
        console.log('🔐 Rehydrating auth storage...');
        if (state) {
          // Reset user and isAuthenticated on app restart
          // Firebase auth state listener will set the correct values
          state.user = null;
          state.isAuthenticated = false;
          state.isInitializing = true;
          console.log('🔐 Auth state reset after rehydration: isInitializing = true');
        }
      }
    }
  )
);

/**
 * Initialize authentication state with Firebase auth state listener
 * This should be called once when the app starts
 */
export function initializeAuth(): void {
  console.log('🔐 initializeAuth called');
  
  // Get the current Firebase user and set up the auth state listener
  const currentUser = firebaseClient.getCurrentUser();
  console.log('🔐 Current Firebase user:', currentUser ? 'User exists' : 'No user');
  
  if (currentUser) {
    console.log('🔐 Setting existing user in auth store...');
    useAuthStore.getState().setUser(currentUser);
  } else {
    // If no user is signed in, automatically sign in anonymously
    console.log('🔐 No user found, starting anonymous sign-in...');
    useAuthStore.getState().signInAnonymously();
  }
}

/**
 * Selectors for common auth state patterns
 */
export const authSelectors = {
  /**
   * Check if user is authenticated and ready
   */
  isReady: (state: AuthState) => !state.isInitializing && state.isAuthenticated,
  
  /**
   * Check if authentication is in progress
   */
  isLoading: (state: AuthState) => state.isInitializing,
  
  /**
   * Get current user ID if authenticated
   */
  getUserId: (state: AuthState) => state.user?.uid || null,
  
  /**
   * Check if there are authentication errors
   */
  hasError: (state: AuthState) => !!state.error
}; 