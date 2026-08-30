import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { UserProfile, LearnerCompetency, GapAnalysisResult, LearningPath } from '../types';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { api } from './api.js';

// Initialize Firebase App
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || 'AIzaSyC_Pw4R-rEeWK2Ca81TLcgcb7ebDo_G7Bg',
  authDomain: firebaseConfigJson.authDomain || 'nipun-17a88.firebaseapp.com',
  projectId: firebaseConfigJson.projectId || 'nipun-17a88',
  storageBucket: firebaseConfigJson.storageBucket || 'nipun-17a88.firebasestorage.app',
  messagingSenderId: firebaseConfigJson.messagingSenderId || '1073316888953',
  appId: firebaseConfigJson.appId || '1:1073316888953:web:3b4eedb8e3c3f8f9b96fa8',
  measurementId: firebaseConfigJson.measurementId || 'G-F7W56D3ENY',
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore
export const firestore: Firestore = (firebaseConfigJson as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfigJson as any).firestoreDatabaseId)
  : getFirestore(app);

/**
 * Firebase Authentication & Firestore Service for NIPUN
 */
export const firebaseService = {
  /**
   * Check if user is returning from a Firebase Google Redirect Auth flow
   */
  async checkRedirectAuth(): Promise<{ user: UserProfile; firebaseUser: FirebaseUser } | null> {
    try {
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult && redirectResult.user) {
        const firebaseUser = redirectResult.user;
        const email = firebaseUser.email || 'officer@mospi.gov.in';
        const name = firebaseUser.displayName || email.split('@')[0];
        const googleUid = firebaseUser.uid;

        const backendRes = await api.googleVerify({
          email,
          name,
          googleUid,
        });

        if (backendRes.success && backendRes.user) {
          return { user: backendRes.user, firebaseUser };
        }
      }
    } catch (err: any) {
      console.warn('[Firebase] checkRedirectAuth note:', err?.code || err?.message || err);
    }
    return null;
  },

  /**
   * Pure Firebase Google Sign-In (Popup & Redirect via https://nipun-17a88.firebaseapp.com/__/auth/handler)
   */
  async signInWithGoogle(): Promise<{ user: UserProfile; firebaseUser?: FirebaseUser }> {
    try {
      // 1. Check if returning from redirect auth
      const redirectAuth = await this.checkRedirectAuth();
      if (redirectAuth) {
        return redirectAuth;
      }

      // 2. Attempt Firebase Popup Authentication
      let firebaseUser: FirebaseUser | null = null;
      try {
        const popupResult = await signInWithPopup(auth, googleProvider);
        if (popupResult && popupResult.user) {
          firebaseUser = popupResult.user;
        }
      } catch (popupErr: any) {
        console.warn('[Firebase] Popup authentication note:', popupErr?.code || popupErr?.message);
        
        // 3. If popup is blocked by browser or closed, trigger Firebase Redirect Auth
        if (
          popupErr?.code === 'auth/popup-blocked' ||
          popupErr?.code === 'auth/popup-closed-by-user' ||
          popupErr?.code === 'auth/cancelled-popup-request' ||
          popupErr?.code === 'auth/unauthorized-domain'
        ) {
          await signInWithRedirect(auth, googleProvider);
          return new Promise(() => {}) as any; // Browser navigating to Firebase Auth Handler
        }
        throw popupErr;
      }

      // 4. If popup succeeded, verify user credentials with NIPUN backend
      if (firebaseUser) {
        const email = firebaseUser.email || 'officer@mospi.gov.in';
        const name = firebaseUser.displayName || email.split('@')[0];
        const googleUid = firebaseUser.uid;

        const backendRes = await api.googleVerify({
          email,
          name,
          googleUid,
        });

        if (backendRes.success && backendRes.user) {
          return { user: backendRes.user, firebaseUser };
        }
      }

      // Fallback: Trigger Firebase Redirect Auth
      await signInWithRedirect(auth, googleProvider);
      return new Promise(() => {}) as any;
    } catch (error: any) {
      console.error('[Firebase/Google] Authentication processing error:', error);
      throw error;
    }
  },

  /**
   * Email and Password Sign-In
   */
  async signInWithEmail(email: string, password: string): Promise<{ user: UserProfile; firebaseUser: FirebaseUser }> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;

      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userSnapshot = await getDoc(userDocRef);

      let profile: UserProfile;
      if (userSnapshot.exists()) {
        profile = userSnapshot.data() as UserProfile;
      } else {
        profile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || email.split('@')[0],
          email: firebaseUser.email || email,
          role: 'LEARNER',
          employeeId: `MOSPI-${Math.floor(1000 + Math.random() * 9000)}`,
          ministry: 'Ministry of Statistics & Programme Implementation (MoSPI)',
          department: 'National Statistical Office (NSO)',
          organization: 'Government of India',
          designation: 'Senior Statistical Officer',
          currentRole: 'Senior Statistical Officer',
          targetRole: 'Assistant Director / Lead Analyst',
          level: 11,
          cadre: 'Subordinate Statistical Service (SSS)',
          yearsOfExperience: 4,
          education: 'Master in Statistics',
          specialization: 'Survey Statistics',
          location: 'New Delhi',
          preferredLanguage: 'English / Hindi',
          previousRoles: ['Junior Statistical Officer'],
          currentProjects: ['National Sample Survey Operations'],
          technologiesUsed: ['Python', 'SQL', 'R'],
          trainingHours: 8,
          roleReadiness: 75,
          verifiedSkillsCount: 9,
          developingSkillsCount: 5,
        };
        await setDoc(userDocRef, profile);
      }

      return { user: profile, firebaseUser };
    } catch (error: any) {
      console.error('[Firebase] Email sign-in failed:', error);
      throw error;
    }
  },

  /**
   * Email and Password Registration
   */
  async registerWithEmail(
    userData: Partial<UserProfile> & { password?: string }
  ): Promise<{ user: UserProfile; firebaseUser?: FirebaseUser }> {
    try {
      const { email, password = 'Learner@2026', ...rest } = userData;
      if (!email) throw new Error('Email is required');

      let firebaseUser: FirebaseUser | null = null;
      let targetUid = `user-${Date.now()}`;

      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = result.user;
        targetUid = firebaseUser.uid;
      } catch (authErr: any) {
        console.warn('[Firebase] Auth registration note:', authErr?.code || authErr?.message);
        if (authErr?.code === 'auth/email-already-in-use') {
          try {
            const signInRes = await signInWithEmailAndPassword(auth, email, password);
            firebaseUser = signInRes.user;
            targetUid = firebaseUser.uid;
          } catch (signInErr) {
            console.warn('[Firebase] Fallback sign-in note:', signInErr);
          }
        }
      }

      const profile: UserProfile = {
        id: targetUid,
        name: userData.name || email.split('@')[0],
        email: email,
        role: userData.role || 'LEARNER',
        employeeId: userData.employeeId || `MOSPI-${Math.floor(1000 + Math.random() * 9000)}`,
        ministry: userData.ministry || 'Ministry of Statistics & Programme Implementation (MoSPI)',
        department: userData.department || 'National Accounts Division (NAD)',
        organization: 'Government of India',
        designation: userData.designation || 'Senior Statistical Officer',
        currentRole: userData.designation || 'Senior Statistical Officer',
        targetRole: userData.targetRole || 'Assistant Director / Lead Analyst',
        level: userData.level || 11,
        cadre: userData.cadre || 'Subordinate Statistical Service (SSS)',
        yearsOfExperience: userData.yearsOfExperience || 4,
        education: userData.education || 'Post Graduate in Statistics',
        specialization: userData.specialization || 'Survey Methodology & Data Science',
        location: userData.location || 'New Delhi',
        preferredLanguage: 'English / Hindi',
        previousRoles: ['Junior Statistical Officer'],
        currentProjects: ['Statistical System Modernization'],
        technologiesUsed: ['Python', 'SQL', 'R Studio'],
        trainingHours: 0,
        roleReadiness: 75,
        verifiedSkillsCount: 10,
        developingSkillsCount: 4,
        ...rest,
      };

      try {
        const userDocRef = doc(firestore, 'users', targetUid);
        await setDoc(userDocRef, {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (fsErr) {
        console.warn('[Firebase] Firestore profile registration write note:', fsErr);
      }

      return { user: profile, firebaseUser: firebaseUser || undefined };
    } catch (error: any) {
      console.error('[Firebase] Registration failed:', error);
      throw error;
    }
  },

  /**
   * Save / update user profile in Firestore
   */
  async saveUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      await setDoc(userDocRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error('[Firebase] Error saving user profile:', error);
    }
  },

  /**
   * Fetch user profile from Firestore
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      const snapshot = await getDoc(userDocRef);
      if (snapshot.exists()) {
        return snapshot.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('[Firebase] Error getting user profile:', error);
      return null;
    }
  },

  /**
   * Sync competencies to Firestore
   */
  async saveCompetencies(userId: string, competencies: LearnerCompetency[]): Promise<void> {
    try {
      const compDocRef = doc(firestore, 'learnerCompetencies', userId);
      await setDoc(compDocRef, { userId, competencies, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error('[Firebase] Error saving competencies:', error);
    }
  },

  /**
   * Fetch competencies from Firestore
   */
  async getCompetencies(userId: string): Promise<LearnerCompetency[] | null> {
    try {
      const compDocRef = doc(firestore, 'learnerCompetencies', userId);
      const snapshot = await getDoc(compDocRef);
      if (snapshot.exists()) {
        return snapshot.data()?.competencies || null;
      }
      return null;
    } catch (error) {
      console.error('[Firebase] Error getting competencies:', error);
      return null;
    }
  },

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('[Firebase] Sign out error:', error);
    }
  },

  /**
   * Listen for Firebase Auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },
};
