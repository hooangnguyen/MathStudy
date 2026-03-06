import React, { useState } from 'react';
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
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<string | null>(null);
  const [studentClass, setStudentClass] = useState<{ id: string, name: string, teacher: string } | null>(null);
  const [duelInitialState, setDuelInitialState] = useState<'lobby' | 'create_room' | 'join_room' | 'waiting_room'>('lobby');

  const handleLogin = (role: 'student' | 'teacher') => {
    setUserRole(role);
    setIsLoggedIn(true);
    setActiveTab('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setShowSettings(false);
    setShowEditProfile(false);
    setDuelInitialState('lobby');
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'duel') {
      setDuelInitialState('lobby');
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    if (!isLoggedIn) {
      return <Auth onLogin={handleLogin} />;
    }

    if (showEditProfile) {
      return (
        <EditProfile 
          onBack={() => setShowEditProfile(false)} 
          onSave={(data) => {
            console.log('Saved profile:', data);
            setShowEditProfile(false);
          }}
        />
      );
    }

    if (showSettings) {
      return (
        <Settings 
          onBack={() => setShowSettings(false)} 
          onLogout={handleLogout}
          onEditProfile={() => setShowEditProfile(true)}
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
            onShowNotifications={() => setShowNotifications(true)} 
            onStartLesson={() => setCurrentLesson('Phép cộng phân số khác mẫu số')}
          />
        );
      case 'classroom':
        return userRole === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <Classroom studentClass={studentClass} onJoinClass={setStudentClass} />
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
            onShowNotifications={() => setShowNotifications(true)} 
            onStartLesson={() => setCurrentLesson('Phép cộng phân số khác mẫu số')}
          />
        );
    }
  };

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

        {!showSettings && !showEditProfile && !showNotifications && !currentLesson && isLoggedIn && (
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
