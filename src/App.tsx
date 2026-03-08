import React, { useState, useEffect } from 'react';
import { MobileContainer } from './components/common/MobileContainer';
import { Navigation } from './components/common/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import { MathDuel } from './pages/MathDuel';
import { Auth } from './pages/Auth';
import { Settings } from './pages/Settings';
import { EditProfile } from './pages/EditProfile';
import { Notifications } from './components/common/Notifications';
import { LessonView } from './components/common/LessonView';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherHome } from './pages/TeacherHome';
import { Classroom } from './pages/Classroom';
import { Messages } from './pages/Messages';
import { Onboarding } from './pages/Onboarding';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils/utils';
import { useFirebase } from './context/FirebaseProvider';
import { signOut } from 'firebase/auth';
import { getUserProfile, saveUserProfile, getAchievements, Achievement, UserPreferences } from './services/userService';

export default function App() {
  const { user, isAuthReady, auth } = useFirebase();
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(true);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<string | null>(null);
  const [studentClass, setStudentClass] = useState<{ id: string, name: string, teacher: string } | null>(null);
  const [duelInitialState, setDuelInitialState] = useState<'lobby' | 'create_room' | 'join_room' | 'waiting_room'>('lobby');
  const [userData, setUserData] = useState<{
    role?: 'student' | 'teacher';
    grade?: number;
    name?: string;
    points?: number;
    streak?: number;
    avatar?: string;
    achievements?: Achievement[];
    school?: string;
    subject?: string;
    enrolledClasses?: string[];
    preferences?: UserPreferences;
  } | null>(null);

  // Sync Firebase Auth state with local App state
  useEffect(() => {
    const syncProfile = async () => {
      if (isAuthReady) {
        if (user) {
          setIsLoggedIn(true);
          setIsSyncingProfile(true);
          const profile = await getUserProfile(user.uid);

          if (profile) {
            setUserData({
              role: profile.role,
              grade: profile.grade,
              name: profile.name,
              avatar: profile.avatar,
              points: profile.points,
              streak: profile.streak,
              school: profile.school,
              subject: profile.subject,
              enrolledClasses: profile.enrolledClasses || [],
              preferences: profile.preferences
            });

            if (profile.onboarded) {
              const achievements = await getAchievements(user.uid);
              setUserRole(profile.role);
              setUserData(prev => prev ? { ...prev, achievements } : null);
              setShowOnboarding(false);
            } else {
              setShowOnboarding(true);
            }
          } else {
            setShowOnboarding(true);
          }
          setIsSyncingProfile(false);
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
          setUserData(null);
          setShowOnboarding(false);
          setIsSyncingProfile(false);
        }
      }
    };

    syncProfile();
  }, [user, isAuthReady]);

  const handleLogin = (role: 'student' | 'teacher' | 'new_user') => {
    // The useEffect will automatically catch the user state change and sync the profile.
    setIsLoggedIn(true);
  };

  const handleOnboardingComplete = (data: { role: 'student' | 'teacher'; grade?: number; name?: string }) => {
    console.log('Onboarding complete:', data);
    setUserRole(data.role);
    setUserData(prev => ({
      ...prev,
      role: data.role,
      grade: data.grade,
      name: data.name,
      points: prev?.points || 0,
      streak: prev?.streak || 0,
    }));
    setShowOnboarding(false);
    setActiveTab('home');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setUserRole(null);
      setShowSettings(false);
      setShowEditProfile(false);
      setDuelInitialState('lobby');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'duel') {
      setDuelInitialState('lobby');
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    if (!isAuthReady || isSyncingProfile) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full" />
        </div>
      );
    }

    if (!isLoggedIn) {
      return <Auth onLogin={handleLogin} />;
    }

    if (showOnboarding) {
      return (
        <Onboarding
          onComplete={handleOnboardingComplete}
          initialGrade={userData?.grade || 5}
          name={userData?.name || user?.displayName || ''}
        />
      );
    }

    if (showEditProfile) {
      return (
        <EditProfile
          onBack={() => setShowEditProfile(false)}
          initialData={{
            name: userData?.name || '',
            email: user?.email || '',
            avatar: userData?.avatar,
            grade: userData?.grade,
            role: userData?.role,
            school: userData?.school,
            subject: userData?.subject
          }}
          onSave={async (data) => {
            if (user) {
              await saveUserProfile(user.uid, data);
              // Refresh user data locally
              setUserData(prev => prev ? { ...prev, ...data } : null);
              setShowEditProfile(false);
            }
          }}
        />
      );
    }

    if (showSettings) {
      return (
        <Settings
          uid={user?.uid}
          preferences={userData?.preferences}
          onBack={() => setShowSettings(false)}
          onLogout={handleLogout}
          onEditProfile={() => setShowEditProfile(true)}
          userName={userData?.name}
          onPreferencesChanged={(newPrefs) => setUserData(prev => prev ? { ...prev, preferences: newPrefs } : null)}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return userRole === 'teacher' ? (
          <TeacherHome
            onNavigate={setActiveTab}
            onShowNotifications={() => setShowNotifications(true)}
            onCreateRoom={() => {
              setDuelInitialState('create_room');
              setActiveTab('duel');
            }}
          />
        ) : (
          <Dashboard
            grade={userData?.grade || 5}
            points={userData?.points || 0}
            streak={userData?.streak || 0}
            onShowNotifications={() => setShowNotifications(true)}
            onStartLesson={() => setCurrentLesson('Phép cộng phân số khác mẫu số')}
          />
        );
      case 'classroom':
        return userRole === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <Classroom
            enrolledClassId={userData?.enrolledClasses?.[0]}
            onJoinSuccess={(classId) => setUserData(prev => prev ? { ...prev, enrolledClasses: [...(prev.enrolledClasses || []), classId] } : null)}
          />
        );
      case 'messages':
        return <Messages userRole={userRole} />;
      case 'duel':
        return <MathDuel userRole={userRole} initialState={duelInitialState} />;
      case 'rank':
        return <Leaderboard />;
      case 'profile':
        return (
          <Profile
            onSettings={() => setShowSettings(true)}
            onEditProfile={() => setShowEditProfile(true)}
            userData={userData || undefined}
          />
        );
      default:
        return userRole === 'teacher' ? (
          <TeacherHome
            onNavigate={setActiveTab}
            onShowNotifications={() => setShowNotifications(true)}
            onCreateRoom={() => {
              setDuelInitialState('create_room');
              setActiveTab('duel');
            }}
          />
        ) : (
          <Dashboard
            grade={userData?.grade || 5}
            points={userData?.points || 0}
            streak={userData?.streak || 0}
            onShowNotifications={() => setShowNotifications(true)}
            onStartLesson={() => setCurrentLesson('Phép cộng phân số khác mẫu số')}
          />
        );
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full"
        />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <MobileContainer>
        <Auth onLogin={handleLogin} />
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="flex flex-col md:flex-row h-full relative w-full">
        <div className={cn(
          "flex-1 overflow-hidden relative w-full h-full",
          isLoggedIn && !showSettings && !showEditProfile && !showNotifications && !currentLesson ? "md:pl-64" : ""
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={showEditProfile ? 'edit-profile' : showSettings ? 'settings' : activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {!showSettings && !showEditProfile && !showNotifications && !showOnboarding && !currentLesson && isLoggedIn && (
          <Navigation activeTab={activeTab} onTabChange={handleTabChange} userRole={userRole} />
        )}

        {/* Notifications Overlay */}
        <AnimatePresence>
          {showNotifications && (
            <Notifications onBack={() => setShowNotifications(false)} userRole={userRole} />
          )}
        </AnimatePresence>

        {/* Lesson View Overlay */}
        <AnimatePresence>
          {currentLesson && (
            <LessonView
              lessonTitle={currentLesson}
              onClose={() => setCurrentLesson(null)}
              onComplete={() => {
                setCurrentLesson(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </MobileContainer>
  );
}
