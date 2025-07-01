/**
 * Firebase Client Configuration and Services
 * 
 * This file handles Firebase initialization, authentication, and Firestore operations
 * for the BrainLift Generator application. It provides offline-first functionality
 * with automatic synchronization when online.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInAnonymously,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  serverTimestamp,
  FirestoreError
} from 'firebase/firestore';
import type { BrainLiftDocument } from '../../stores/document-store';

/**
 * Firebase configuration object
 * Replace these placeholder values with your actual Firebase config
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

/**
 * Firebase service result type for error handling
 */
export type FirebaseResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Firebase client class for managing all Firebase operations
 */
export class FirebaseClient {
  private app: FirebaseApp;
  private auth: Auth;
  private db!: Firestore; // Definite assignment assertion - initialized in initializeFirestoreWithPersistence
  private currentUser: User | null = null;

  constructor() {
    // Validate required environment variables
    this.validateConfig();
    
    // Initialize Firebase
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    
    // Initialize Firestore with offline persistence
    this.initializeFirestoreWithPersistence();
    
    // Set up authentication state listener
    this.setupAuthListener();
  }

  /**
   * Validate that all required Firebase configuration values are present
   */
  private validateConfig(): void {
    const requiredKeys = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ];

    const missingKeys = requiredKeys.filter(key => !import.meta.env[key]);
    
    if (missingKeys.length > 0) {
      throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
    }

    // Measurement ID is optional for Analytics
    if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
      console.log('Firebase Analytics measurement ID configured');
    }
  }

  /**
   * Set up authentication state change listener
   */
  private setupAuthListener(): void {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      console.log('Firebase auth state changed:', user ? 'Signed in' : 'Signed out');
    });
  }

  /**
   * Initialize Firestore with offline persistence for Firebase v11
   */
  private initializeFirestoreWithPersistence(): void {
    try {
      // Initialize Firestore with persistent local cache
      this.db = initializeFirestore(this.app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
      console.log('Firebase offline persistence enabled');
    } catch (error) {
      console.warn('Firebase persistence initialization failed, falling back to default:', error);
      // Fallback to default Firestore if persistence fails
      this.db = getFirestore(this.app);
    }
  }

  /**
   * Sign in anonymously to Firebase
   */
  async signInAnonymously(): Promise<FirebaseResult<User>> {
    try {
      const result = await signInAnonymously(this.auth);
      console.log('Firebase anonymous sign-in successful');
      return { success: true, data: result.user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown authentication error';
      console.error('Firebase sign-in failed:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Save a BrainLift document to Firestore
   */
  async saveDocument(document: BrainLiftDocument): Promise<FirebaseResult<void>> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Prepare document for Firestore (convert dates to server timestamps where needed)
      const docData = {
        ...document,
        userId: this.currentUser.uid,
        updatedAt: serverTimestamp(),
        // Convert Date objects to ISO strings for consistent serialization
        createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : document.createdAt,
        chatHistory: document.chatHistory.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
        })),
        experts: document.experts.map(expert => ({
          ...expert,
          lastUpdated: expert.lastUpdated instanceof Date ? expert.lastUpdated.toISOString() : expert.lastUpdated
        })),
        spikyPOVs: document.spikyPOVs.map(spiky => ({
          ...spiky,
          lastUpdated: spiky.lastUpdated instanceof Date ? spiky.lastUpdated.toISOString() : spiky.lastUpdated
        })),
        knowledgeTree: document.knowledgeTree.map(knowledge => ({
          ...knowledge,
          lastUpdated: knowledge.lastUpdated instanceof Date ? knowledge.lastUpdated.toISOString() : knowledge.lastUpdated
        }))
      };

      const docRef = doc(this.db, 'brainlifts', document.id);
      await setDoc(docRef, docData);
      
      console.log('Document saved to Firebase:', document.id);
      return { success: true, data: undefined };
    } catch (error) {
      const message = this.getFirestoreErrorMessage(error);
      console.error('Failed to save document:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Get a BrainLift document from Firestore
   */
  async getDocument(documentId: string): Promise<FirebaseResult<BrainLiftDocument | null>> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      const docRef = doc(this.db, 'brainlifts', documentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: true, data: null };
      }

      const data = docSnap.data();
      
      // Convert ISO strings back to Date objects
      const document: BrainLiftDocument = {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        chatHistory: data.chatHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        experts: data.experts.map((expert: any) => ({
          ...expert,
          lastUpdated: new Date(expert.lastUpdated)
        })),
        spikyPOVs: data.spikyPOVs.map((spiky: any) => ({
          ...spiky,
          lastUpdated: new Date(spiky.lastUpdated)
        })),
        knowledgeTree: data.knowledgeTree.map((knowledge: any) => ({
          ...knowledge,
          lastUpdated: new Date(knowledge.lastUpdated)
        }))
      } as BrainLiftDocument;

      return { success: true, data: document };
    } catch (error) {
      const message = this.getFirestoreErrorMessage(error);
      console.error('Failed to get document:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Get all documents for the current user
   */
  async getUserDocuments(): Promise<FirebaseResult<BrainLiftDocument[]>> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      const q = query(
        collection(this.db, 'brainlifts'),
        where('userId', '==', this.currentUser.uid),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const documents: BrainLiftDocument[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const document: BrainLiftDocument = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
          chatHistory: data.chatHistory.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })),
          experts: data.experts.map((expert: any) => ({
            ...expert,
            lastUpdated: new Date(expert.lastUpdated)
          })),
          spikyPOVs: data.spikyPOVs.map((spiky: any) => ({
            ...spiky,
            lastUpdated: new Date(spiky.lastUpdated)
          })),
          knowledgeTree: data.knowledgeTree.map((knowledge: any) => ({
            ...knowledge,
            lastUpdated: new Date(knowledge.lastUpdated)
          }))
        } as BrainLiftDocument;
        
        documents.push(document);
      });

      return { success: true, data: documents };
    } catch (error) {
      const message = this.getFirestoreErrorMessage(error);
      console.error('Failed to get user documents:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Delete a document from Firestore
   */
  async deleteDocument(documentId: string): Promise<FirebaseResult<void>> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      const docRef = doc(this.db, 'brainlifts', documentId);
      await deleteDoc(docRef);
      
      console.log('Document deleted from Firebase:', documentId);
      return { success: true, data: undefined };
    } catch (error) {
      const message = this.getFirestoreErrorMessage(error);
      console.error('Failed to delete document:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Convert Firestore errors to user-friendly messages
   */
  private getFirestoreErrorMessage(error: unknown): string {
    if (error instanceof Error && 'code' in error) {
      const firestoreError = error as FirestoreError;
      switch (firestoreError.code) {
        case 'permission-denied':
          return 'Access denied. Please check your permissions.';
        case 'unavailable':
          return 'Service temporarily unavailable. Please try again.';
        case 'unauthenticated':
          return 'Authentication required. Please sign in.';
        case 'not-found':
          return 'Document not found.';
        case 'already-exists':
          return 'Document already exists.';
        default:
          return `Database error: ${firestoreError.message}`;
      }
    }
    return error instanceof Error ? error.message : 'Unknown database error';
  }
}

// Create and export a singleton instance
export const firebaseClient = new FirebaseClient(); 