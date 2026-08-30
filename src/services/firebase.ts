import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
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
  projectId: firebaseConfigJson.projectId,
  appId: firebaseConfigJson.appId,
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
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

// Initialize Firestore with custom database ID if available
export const firestore: Firestore = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Firebase Authentication & Firestore Service for NIPUN
 */
export const firebaseService = {
  /**
   * Google Sign-In with popup and resilient fallback
   */
  async signInWithGoogle(): Promise<{ user: UserProfile; firebaseUser?: FirebaseUser }> {
    try {
      let firebaseUser: FirebaseUser | null = null;
      let email: string | null = null;
      let name: string | null = null;
      let googleUid: string | null = null;

      // 1. Try Firebase Popup Authentication
      try {
        const result = await signInWithPopup(auth, googleProvider);
        firebaseUser = result.user;
        if (firebaseUser) {
          email = firebaseUser.email;
          name = firebaseUser.displayName;
          googleUid = firebaseUser.uid;
        }
      } catch (popupErr: any) {
        console.warn('[Firebase] Popup authentication notice:', popupErr?.code || popupErr?.message);
      }

      // 2. If Popup failed or blocked, check URL hash for Google OAuth 2.0 Implicit token
      if (!email && typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
        try {
          const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
          const accessToken = hashParams.get('access_token');
          if (accessToken) {
            const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
            if (userInfoRes.ok) {
              const userInfo = await userInfoRes.json();
              email = userInfo.email;
              name = userInfo.name || userInfo.given_name;
              googleUid = userInfo.sub;
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        } catch (hashErr) {
          console.warn('[Google OAuth] Hash token extraction note:', hashErr);
        }
      }

      // 3. If real Google credentials were obtained, verify with NIPUN backend
      if (email) {
        const backendRes = await api.googleVerify({
          email,
          name: name || email.split('@')[0],
          googleUid: googleUid || undefined,
        });

        if (backendRes.success && backendRes.user) {
          return { user: backendRes.user, firebaseUser: firebaseUser || undefined };
        }
      }

      // 4. Direct Google OAuth 2.0 Authorization Server Redirect
      if (typeof window !== 'undefined') {
        const clientId = firebaseConfigJson.oAuthClientId || '946189640461-49aqr0kegmsuk20asatus8stv2lnr2o0.apps.googleusercontent.com';
        const redirectUri = encodeURIComponent(window.location.origin);
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=email%20profile&prompt=select_account`;
        window.location.href = googleAuthUrl;
        return new Promise(() => {}) as any; // Pending navigation to Google OAuth screen
      }

      throw new Error('Google Authentication process could not be completed.');
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
};
