import React, { useState, useEffect, lazy, Suspense } from 'react';
import { MobileContainer } from './components/common/MobileContainer';
import { Navigation } from './components/common/Navigation';
import { LoadingScreen } from './components/common/LoadingScreen';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const MathDuel = lazy(() => import('./pages/MathDuel').then(m => ({ default: m.MathDuel })));
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const EditProfile = lazy(() => import('./pages/EditProfile').then(m => ({ default: m.EditProfile })));
const Notifications = lazy(() => import('./components/common/Notifications').then(m => ({ default: m.Notifications })));
const LessonView = lazy(() => import('./components/common/LessonView').then(m => ({ default: m.LessonView })));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const TeacherHome = lazy(() => import('./pages/TeacherHome').then(m => ({ default: m.TeacherHome })));
const Classroom = lazy(() => import('./pages/Classroom').then(m => ({ default: m.Classroom })));
const Messages = lazy(() => import('./pages/Messages').then(m => ({ default: m.Messages })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils/utils';
import { useFirebase } from './context/FirebaseProvider';
import { signOut } from 'firebase/auth';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { getUserProfile, saveUserProfile, getAchievements, Achievement, UserPreferences, updateProgress } from './services/userService';

export default function App() {
  const authContext = useFirebase();
  const { user, isAuthReady, auth } = authContext;
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(true);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
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
    completedLessons?: number[];
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
              completedLessons: profile.completedLessons || [],
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

  const { userProfile } = authContext;

  // Sync userData with userProfile from context
  useEffect(() => {
    if (userProfile) {
      setUserData(prev => ({
        ...prev,
        ...userProfile,
        points: userProfile.points ?? prev?.points ?? 0,
        streak: userProfile.streak ?? prev?.streak ?? 0,
        completedLessons: userProfile.completedLessons ?? prev?.completedLessons ?? [],
      }));
    }
  }, [userProfile]);

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
    const getActiveComponent = () => {
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
              grade={userData?.grade || 1}
              points={userData?.points || 0}
              streak={userData?.streak || 0}
              completedLessons={userData?.completedLessons || []}
              onShowNotifications={() => setShowNotifications(true)}
              onStartLesson={(title, topic, id) => {
                setCurrentLesson(title);
                setCurrentTopic(topic || null);
                setCurrentLessonId(id || null);
              }}
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
              userRole={userRole}
              userId={user?.uid}
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
              grade={userData?.grade || 1}
              points={userData?.points || 0}
              streak={userData?.streak || 0}
              completedLessons={userData?.completedLessons || []}
              onShowNotifications={() => setShowNotifications(true)}
              onStartLesson={(title, topic, id) => {
                setCurrentLesson(title);
                setCurrentTopic(topic || null);
                setCurrentLessonId(id || null);
              }}
            />
          );
      }
    };

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
        <Suspense fallback={<LoadingScreen />}>
          <Onboarding
            onComplete={handleOnboardingComplete}
            initialGrade={userData?.grade || 5}
            name={userData?.name || user?.displayName || ''}
          />
        </Suspense>
      );
    }

    if (showEditProfile) {
      return (
        <Suspense fallback={<LoadingScreen />}>
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
                setUserData(prev => prev ? { ...prev, ...data } : null);
                setShowEditProfile(false);
              }
            }}
          />
        </Suspense>
      );
    }

    if (showSettings) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <Settings
            uid={user?.uid}
            preferences={userData?.preferences}
            onBack={() => setShowSettings(false)}
            onLogout={handleLogout}
            onEditProfile={() => setShowEditProfile(true)}
            userName={userData?.name}
            onPreferencesChanged={(newPrefs) => setUserData(prev => prev ? { ...prev, preferences: newPrefs } : null)}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<LoadingScreen />}>
        {getActiveComponent()}
      </Suspense>
    );
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
            <Suspense fallback={null}>
              <Notifications onBack={() => setShowNotifications(false)} userRole={userRole} />
            </Suspense>
          )}
        </AnimatePresence>

        {/* Lesson View Overlay */}
        <AnimatePresence>
          {currentLesson && (
            <Suspense fallback={<LoadingScreen />}>
              <LessonView
                lessonTitle={currentLesson}
                topic={currentTopic || undefined}
                grade={userData?.grade || 1}
                onClose={() => {
                  setCurrentLesson(null);
                  setCurrentTopic(null);
                  setCurrentLessonId(null);
                }}
                onComplete={async (score) => {
                  const lessonIdToSave = currentLessonId;
                  const uid = user?.uid;

                  // Clear UI state immediately
                  setCurrentLesson(null);
                  setCurrentTopic(null);
                  setCurrentLessonId(null);

                  if (uid && lessonIdToSave !== null) {
                    // Optimistic Update
                    setUserData(prev => {
                      if (!prev) return null;
                      const alreadyCompleted = prev.completedLessons || [];
                      if (alreadyCompleted.includes(lessonIdToSave)) return prev;
                      return {
                        ...prev,
                        completedLessons: [...alreadyCompleted, lessonIdToSave],
                        points: (prev.points || 0) + (score * 10)
                      };
                    });

                    try {
                      console.log(`Saving progress: Lesson ${lessonIdToSave}, Score ${score}`);
                      await updateProgress(uid, lessonIdToSave, score);
                      await authContext.refreshProfile();
                      console.log("Progress saved and profile refreshed.");
                    } catch (error) {
                      console.error("Error saving progress:", error);
                    }
                  }
                }}
              />
            </Suspense>
          )}
        </AnimatePresence>
      </div>
    </MobileContainer>
  );
}
