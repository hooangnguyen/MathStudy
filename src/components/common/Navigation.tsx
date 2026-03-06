import React from 'react';
import { Home, BookOpen, User, Trophy, Swords, FileText, GraduationCap, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../utils/utils';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: 'student' | 'teacher' | null;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, userRole }) => {
  const tabs = userRole === 'teacher' ? [
    { id: 'home', icon: Home, label: 'Trang chủ' },
    { id: 'classroom', icon: GraduationCap, label: 'Lớp học' },
    { id: 'messages', icon: MessageSquare, label: 'Tin nhắn' },
    { id: 'profile', icon: User, label: 'Cá nhân' },
  ] : [
    { id: 'home', icon: Home, label: 'Trang chủ' },
    { id: 'classroom', icon: GraduationCap, label: 'Lớp học' },
    { id: 'duel', icon: Swords, label: 'Đối kháng' },
    { id: 'messages', icon: MessageSquare, label: 'Tin nhắn' },
    { id: 'profile', icon: User, label: 'Cá nhân' },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      <div className="md:hidden h-20 bg-white border-t border-slate-200 flex items-center justify-around px-2 shrink-0 pb-safe z-50 w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 transition-colors duration-300 px-3 py-2 rounded-2xl flex-1",
                isActive ? "text-[#1cb0f6]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-nav-tab-mobile"
                  className="absolute inset-0 bg-blue-50 rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ 
                  y: isActive ? -2 : 0,
                  scale: isActive ? 1.1 : 1
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className={cn(
                "text-[10px] uppercase tracking-wider transition-all",
                isActive ? "font-black" : "font-bold"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop Sidebar Nav */}
      <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-slate-200 p-4 z-50">
        <div className="text-3xl font-black text-[#58cc02] mb-10 px-4 pt-4 tracking-tight">
          MathMastery
        </div>
        <div className="flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex items-center gap-4 transition-colors duration-300 px-4 py-3 rounded-2xl w-full text-left border-2",
                  isActive 
                    ? "text-[#1cb0f6] bg-blue-50 border-blue-100" 
                    : "text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn(
                  "text-sm uppercase tracking-wider transition-all",
                  isActive ? "font-black" : "font-bold"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
