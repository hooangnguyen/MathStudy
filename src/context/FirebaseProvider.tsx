import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { setUserOnline } from '../services/userService';

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
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await refreshProfile();
        // Cập nhật trạng thái online
        await setUserOnline(user.uid, true);
      } else {
        setUserProfile(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Cập nhật offline khi đóng tab
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user) {
        await setUserOnline(user.uid, false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  // Validate connection to Firestore
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDoc(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, userProfile, isAuthReady, db, auth, refreshProfile }}>
      {children}
    </FirebaseContext.Provider>
  );
};
