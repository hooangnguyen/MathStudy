import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { setUserOnline } from '../services/userService';

const PROFILE_CACHE_KEY = 'ms_user_profile';

interface FirebaseContextType {
  user: User | null;
  userProfile: any | null;
  isAuthReady: boolean;
  db: typeof db;
  auth: typeof auth;
  refreshProfile: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pre-load from cache so UI renders immediately on revisit
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(() => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isAuthReady, setIsAuthReady] = useState(false);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
          // Update cache
          try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data)); } catch { }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await refreshProfile();
        setUserOnline(firebaseUser.uid, true).catch(() => { });
      } else {
        setUserProfile(null);
        try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch { }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Mark offline when tab closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        setUserOnline(user.uid, false).catch(() => { });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  return (
    <FirebaseContext.Provider value={{ user, userProfile, isAuthReady, db, auth, refreshProfile }}>
      {children}
    </FirebaseContext.Provider>
  );
};
