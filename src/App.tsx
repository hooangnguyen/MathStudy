import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
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
const ClassQuiz = lazy(() => import('./pages/ClassQuiz').then(m => ({ default: m.ClassQuiz })));
const Messages = lazy(() => import('./pages/Messages').then(m => ({ default: m.Messages })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils/utils';
import { useFirebase } from './context/FirebaseProvider';
import { signOut } from 'firebase/auth';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { getUserProfile, saveUserProfile, getAchievements, Achievement, UserPreferences, updateProgress } from './services/userService';
import { subscribeToNotifications, Notification } from './services/notificationService';
import { audioService } from './utils/audio';

// Preload helpers (improves perceived responsiveness)
const preloadStudentCore = () =>
  Promise.allSettled([
    import('./pages/Classroom'),
    import('./pages/Messages'),
    import('./pages/Leaderboard'),
  ]);

const preloadTeacherCore = () =>
  Promise.allSettled([
    import('./pages/TeacherDashboard'),
    import('./pages/TeacherHome'),
    import('./pages/Messages'),
  ]);

const preloadCommonOverlays = () =>
  Promise.allSettled([
    import('./components/common/Notifications'),
    import('./components/common/LessonView'),
    import('./pages/Settings'),
    import('./pages/EditProfile'),
  ]);

const runWhenIdle = (fn: () => void, timeoutMs = 1500) => {
  const w = window as any;
  if (typeof w.requestIdleCallback === 'function') {
    return w.requestIdleCallback(fn, { timeout: timeoutMs });
  }
  return window.setTimeout(fn, timeoutMs);
};

const TAB_STORAGE_KEY = 'mathstudy_active_tab';
const VALID_TABS = ['home', 'classroom', 'quiz', 'messages', 'duel', 'rank', 'profile'];

function getInitialTab(): string {
  try {
    const saved = sessionStorage.getItem(TAB_STORAGE_KEY);
    return saved && VALID_TABS.includes(saved) ? saved : 'home';
  } catch {
    return 'home';
  }
}

export default function App() {
  const authContext = useFirebase();
  const { user, isAuthReady, auth } = authContext;
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const setTab = useCallback((tab: string) => {
    setActiveTab(tab);
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch (_) {}
  }, []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(true);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationDeepLink, setNotificationDeepLink] = useState<{
    target: 'classroom' | 'messages' | 'duel' | 'rank' | 'profile' | 'home';
    role: 'student' | 'teacher';
    classId?: string;
    assignmentId?: string;
    studentId?: string;
    action?: 'take' | 'result' | 'grade' | 'students';
  } | null>(null);
  const [isDuelInProgress, setIsDuelInProgress] = useState(false);
  const [isAssignmentInProgress, setIsAssignmentInProgress] = useState(false);
  const [exitDuelToken, setExitDuelToken] = useState(0);
  const [exitAssignmentToken, setExitAssignmentToken] = useState(0);
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
    totalCompletedAssignments?: number;
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
        totalCompletedAssignments: userProfile.totalCompletedAssignments ?? prev?.totalCompletedAssignments ?? 0,
      }));
    }
  }, [userProfile]);

  // Warm up next screens in background after login
  useEffect(() => {
    if (!isAuthReady || !user || !userRole) return;
    const handle = runWhenIdle(() => {
      preloadCommonOverlays();
      if (userRole === 'teacher') preloadTeacherCore();
      else preloadStudentCore();
    }, 1200);

    return () => {
      const w = window as any;
      if (typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [isAuthReady, user, userRole]);

  // Global notification sound listener
  useEffect(() => {
    if (!user) return;
    let prevUnreadCount = 0;
    const unsubscribe = subscribeToNotifications(user.uid, (data) => {
      const currentUnreadCount = data.filter(n => !n.read).length;
      if (currentUnreadCount > prevUnreadCount && prevUnreadCount > 0) {
        // Only play sound if the number of UNREAD notifications actually increased
        // and it's not the initial load (prevUnreadCount > 0 prevents sound on login)
        audioService.playNotification(userData?.preferences);
      }
      // Initialize prevUnreadCount to current count on first load, or update it
      // if it's the first load (0 to X), we just set the baseline without playing.
      if (prevUnreadCount === 0 && currentUnreadCount > 0) {
          prevUnreadCount = currentUnreadCount;
      } else {
          prevUnreadCount = currentUnreadCount;
      }
    });

    return () => unsubscribe();
  }, [user, userData?.preferences]);

  // Apply Global Styles based on Preferences
  useEffect(() => {
    const prefs = userData?.preferences;
    const htmlDiv = document.documentElement;

    // Dark Mode
    if (prefs?.darkMode) {
      htmlDiv.classList.add('theme-dark');
    } else {
      htmlDiv.classList.remove('theme-dark');
    }

    // Eye Protection
    if (prefs?.eyeProtection) {
      htmlDiv.classList.add('theme-eye-protection');
    } else {
      htmlDiv.classList.remove('theme-eye-protection');
    }

    // Font Size (using tailwind rem scaling)
    if (prefs?.fontSize === 'Nhỏ') {
      htmlDiv.style.fontSize = '14px';
    } else if (prefs?.fontSize === 'Lớn') {
      htmlDiv.style.fontSize = '18px';
    } else {
      htmlDiv.style.fontSize = '16px'; // Default
    }

    // Language (Sets Lang attribute, fully translating app requires i18n)
    if (prefs?.language === 'English') {
      htmlDiv.lang = 'en';
    } else {
      htmlDiv.lang = 'vi'; // Default
    }

  }, [userData?.preferences]);

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
    setTab('home');
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
    if (tab !== activeTab) {
      if (isDuelInProgress) {
        const ok = window.confirm('Bạn đang trong trận đấu. Nếu thoát bây giờ bạn sẽ bị tính là THUA. Bạn có muốn thoát không?');
        if (!ok) return;
        // Kết thúc trận đấu cho cả hai nhưng giữ nguyên tab hiện tại,
        // để học sinh xem màn hình kết quả xong rồi mới tự chuyển tab.
        setExitDuelToken(t => t + 1);
        return;
      }

      if (isAssignmentInProgress) {
        const ok = window.confirm('Bạn đang làm bài tập dở. Nếu thoát bây giờ bài làm chưa được lưu. Bạn có muốn thoát không?');
        if (!ok) return;
        setExitAssignmentToken(t => t + 1);
      }

      // Xóa deep link khi rời khỏi tab classroom để khi quay lại không bị ép vào danh sách học sinh / grader
      if (activeTab === 'classroom') {
        setNotificationDeepLink(null);
      }
    }
    if (tab === 'duel') {
      setDuelInitialState('lobby');
    }
    setTab(tab);
  };

  const handleNotificationNavigate = (notif: Notification) => {
    const meta = (notif.metadata || {}) as Record<string, any>;

    if (notif.type === 'assignment') {
      setNotificationDeepLink({
        target: 'classroom',
        role: 'student',
        classId: meta.classId,
        assignmentId: meta.assignmentId,
        action: 'take',
      });
      setTab('classroom');
      return;
    }

    if (notif.type === 'submission') {
      setNotificationDeepLink({
        target: 'classroom',
        role: 'teacher',
        classId: meta.classId,
        assignmentId: meta.assignmentId,
        studentId: meta.studentId,
        action: 'grade',
      });
      setTab('classroom');
      return;
    }

    if (notif.type === 'student_join') {
      setNotificationDeepLink({
        target: 'classroom',
        role: 'teacher',
        classId: meta.classId,
        studentId: meta.studentId,
        action: 'students',
      });
      setTab('classroom');
      return;
    }

    if (notif.type === 'duel') {
      setTab('duel');
      return;
    }

    if (notif.type === 'achievement') {
      setTab('profile');
      return;
    }

    // Fallback
    setTab('home');
  };

  const renderContent = () => {
    const getActiveComponent = () => {
      switch (activeTab) {
        case 'home':
          return userRole === 'teacher' ? (
            <TeacherHome
              onNavigate={setTab}
              onShowNotifications={() => setShowNotifications(true)}
              onCreateRoom={() => setTab('quiz')}
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
            <TeacherDashboard
              deepLink={notificationDeepLink?.role === 'teacher' && notificationDeepLink.target === 'classroom'
                ? {
                  classId: notificationDeepLink.classId,
                  assignmentId: notificationDeepLink.assignmentId,
                  studentId: notificationDeepLink.studentId,
                  action: notificationDeepLink.action,
                }
                : undefined}
            />
          ) : (
            <Classroom
              enrolledClassId={userData?.enrolledClasses?.[0]}
              deepLink={notificationDeepLink?.role === 'student' && notificationDeepLink.target === 'classroom'
                ? {
                  assignmentId: notificationDeepLink.assignmentId,
                  action: notificationDeepLink.action,
                }
                : undefined}
              onJoinSuccess={(classId) => setUserData(prev => prev ? { ...prev, enrolledClasses: [...(prev.enrolledClasses || []), classId] } : null)}
              onAssignmentInProgressChange={setIsAssignmentInProgress}
              exitAssignmentToken={exitAssignmentToken}
            />
          );
        case 'quiz':
          return <ClassQuiz userRole={userRole} />;
        case 'messages':
          return <Messages userRole={userRole} />;
        case 'duel':
          return (
            <MathDuel
              userRole={userRole}
              initialState={duelInitialState}
              onDuelStateChange={(s) => setIsDuelInProgress(s === 'playing' || s === 'room_playing')}
              onExitDuel={() => setTab('home')}
              exitDuelToken={exitDuelToken}
              onNavigate={setTab}
            />
          );
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
              onNavigate={setTab}
              onShowNotifications={() => setShowNotifications(true)}
              onCreateRoom={() => setTab('quiz')}
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
              <Notifications
                onBack={() => setShowNotifications(false)}
                userRole={userRole}
                onNavigateToSource={handleNotificationNavigate}
              />
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
