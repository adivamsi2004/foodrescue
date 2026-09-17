import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: AppUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, phone: string, role: UserRole, city: string, area: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (uid: string): Promise<AppUser | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as AppUser;
      }
      return null;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      const profile = await fetchProfile(currentUser.uid);
      if (profile) {
        setUserProfile(profile);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await fetchProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await fetchProfile(userCredential.user.uid);
      if (profile && !profile.isActive) {
        await signOut(auth);
        throw new Error("Your account has been suspended. Please contact support.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
      throw err;
    }
  };

  const register = async (
    email: string, 
    pass: string, 
    name: string, 
    phone: string, 
    role: UserRole, 
    city: string, 
    area: string
  ) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = userCredential.user.uid;

      // NGOs and Providers start as PENDING, Volunteers verified as APPROVED/VERIFIED automatically, ADMIN needs separate creation.
      const initialStatus = (role === 'NGO' || role === 'PROVIDER') ? 'PENDING' : 'APPROVED';

      const newUserProfile: AppUser = {
        uid,
        name,
        email,
        phone,
        role,
        verificationStatus: initialStatus,
        city,
        area,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      await setDoc(doc(db, 'users', uid), newUserProfile);
      
      // If role is NGO, create organization document too
      if (role === 'NGO') {
        const orgId = `org_${uid}`;
        await setDoc(doc(db, 'organizations', orgId), {
          ownerId: uid,
          name: `${name} Association`,
          type: 'FOOD_BANK',
          description: `Surplus food redistribution association led by ${name}.`,
          phone,
          email,
          address: `${area}, ${city}`,
          city,
          verificationStatus: 'PENDING',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      setUserProfile(newUserProfile);
    } catch (err: any) {
      setError(err.message || "Failed to register.");
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err: any) {
      setError(err.message || "Failed to log out.");
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      userProfile, 
      loading, 
      error, 
      login, 
      register, 
      logout, 
      resetPassword,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
