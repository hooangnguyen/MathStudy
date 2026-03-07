import React, { useState, useEffect } from 'react';
import { Bell, Flame, Star, Trophy, List, ArrowDown, Heart, Hexagon, MessageSquare, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/utils';
import { Chat } from '../features/chat/Chat';
import { getCurriculum, Lesson } from '../services/dataService';

interface DashboardProps {
  onShowNotifications?: () => void;
  onStartLesson?: (title: string) => void;
  grade?: number;
  points?: number;
  streak?: number;
}

const pathData = {
  header: {
    part: 'PHẦN 2, CỬA 13',
    title: 'Miêu tả thói quen hằng ngày',
    color: 'bg-[#f49000]',
    shadow: 'shadow-[#c26b00]',
  },
  sections: [
    {
      id: 's1',
      nodes: [
        { id: 1, type: 'lesson', status: 'completed', icon: '🎧', color: 'bg-[#f49000]', shadow: '#c26b00', offset: 30 },
        { id: 2, type: 'checkpoint', status: 'completed', icon: '🏆', color: 'bg-[#f49000]', shadow: '#c26b00', offset: -10 },
      ]
    },
    {
      id: 's2',
      divider: 'Đặt phòng khách sạn',
      nodes: [
        { id: 3, type: 'lesson', status: 'current', icon: '⭐', color: 'bg-[#ff4b4b]', shadow: '#c22b2b', offset: 0 },
        { id: 4, type: 'lesson', status: 'locked', icon: '📹', color: 'bg-[#ff4b4b]', shadow: '#c22b2b', offset: 40 },
        { id: 5, type: 'lesson', status: 'locked', icon: '📖', color: 'bg-[#ff4b4b]', shadow: '#c22b2b', offset: 40, hasCharacter: true },
        { id: 6, type: 'lesson', status: 'locked', icon: '📹', color: 'bg-[#ff4b4b]', shadow: '#c22b2b', offset: 0 },
      ]
    }
  ]
};

export const Dashboard: React.FC<DashboardProps> = ({
  onShowNotifications,
  onStartLesson,
  grade = 5,
  points = 0,
  streak = 0
}) => {
  const [showChat, setShowChat] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurriculum = async () => {
      setLoading(true);
      const data = await getCurriculum(grade);
      setLessons(data);
      setLoading(false);
    };
    fetchCurriculum();
  }, [grade]);

  return (
    <div className="flex flex-col h-full bg-[#f7f7f7] relative font-sans">
      {/* Top Stats Bar (Sticky) */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Flame size={20} className="text-orange-500 fill-orange-500" />
              <span className="font-bold text-slate-400">{streak}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Star size={20} className="text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-yellow-500">{points.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => onShowNotifications?.()}
            className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors relative"
          >
            <Bell size={24} />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-50"></span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto pb-32 relative no-scrollbar">
        <div className="max-w-md mx-auto relative pt-4 px-4">

          {/* Unit Header Banner (Sticky below top bar) */}
          <div className="sticky top-4 z-40 mb-8">
            <div className={cn(
              "rounded-2xl text-white flex overflow-hidden",
              pathData.header.color,
              "shadow-[0_4px_0_rgb(0,0,0,0.1)]"
            )}>
              <div className="flex-1 p-4">
                <h2 className="text-sm font-bold opacity-90 uppercase tracking-wider mb-1">
                  CHƯƠNG TRÌNH LỚP {grade}
                </h2>
                <h1 className="text-xl font-black leading-tight">
                  {lessons.length > 0 ? lessons[0].title : 'Đang tải lộ trình...'}
                </h1>
              </div>
              <div className="w-16 bg-black/10 flex items-center justify-center cursor-pointer active:bg-black/20 transition-colors">
                <List size={28} className="text-white" />
              </div>
            </div>
          </div>

          {/* Path Nodes */}
          <div className="py-4 relative flex flex-col items-center">
            {pathData.sections.map((section, sIndex) => (
              <React.Fragment key={section.id}>
                {/* Section Divider */}
                {section.divider && (
                  <div className="w-full flex items-center justify-center gap-4 my-8">
                    <div className="h-px bg-slate-300 flex-1 max-w-[60px]" />
                    <span className="text-slate-500 font-bold text-lg">{section.divider}</span>
                    <div className="h-px bg-slate-300 flex-1 max-w-[60px]" />
                  </div>
                )}

                {/* Nodes */}
                <div className="space-y-6 w-full flex flex-col items-center relative">
                  {section.nodes.map((node, index) => {
                    const isLocked = node.status === 'locked';
                    const isCurrent = node.status === 'current';
                    const isCompleted = node.status === 'completed';

                    return (
                      <div
                        key={node.id}
                        className="relative flex justify-center w-full"
                      >
                        {/* Character Illustration (Placeholder) */}
                        {node.hasCharacter && (
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
                            <div className="w-24 h-32 relative">
                              {/* Simple CSS character representation */}
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-20 bg-red-500 rounded-t-3xl rounded-b-xl" />
                              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-orange-200 rounded-full" />
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-6 bg-yellow-400 rounded-t-full" />
                              <div className="absolute top-2 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">🏀</div>
                            </div>
                          </div>
                        )}

                        <div
                          className="relative"
                          style={{ transform: `translateX(${node.offset}px)` }}
                        >
                          {/* Floating Label for Current Node */}
                          {isCurrent && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 animate-bounce">
                              <div className="bg-white px-4 py-2 rounded-xl text-sm font-black text-slate-700 shadow-lg whitespace-nowrap border-2 border-slate-200">
                                Bắt đầu
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-slate-200 rotate-45" />
                              </div>
                            </div>
                          )}

                          {/* Node Button */}
                          <button
                            onClick={!isLocked ? () => onStartLesson?.('Bài học mới') : undefined}
                            className={cn(
                              "w-[80px] h-[80px] rounded-full flex items-center justify-center relative transition-transform z-10",
                              !isLocked && "active:scale-95 cursor-pointer",
                              isLocked && "opacity-90",
                              node.color
                            )}
                            style={{
                              boxShadow: `0 8px 0 ${node.shadow}`
                            }}
                          >
                            <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center">
                              {isCompleted ? (
                                <span className="text-4xl text-white drop-shadow-md">{node.icon}</span>
                              ) : isCurrent ? (
                                <span className="text-4xl text-white drop-shadow-md">{node.icon}</span>
                              ) : (
                                <span className="text-4xl text-white drop-shadow-md">{node.icon}</span>
                              )}
                            </div>

                            {/* Inner highlight for 3D effect */}
                            <div className="absolute inset-0 rounded-full border-[3px] border-white/20 pointer-events-none" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button (Jump to current) */}
      <button className="absolute bottom-6 right-6 w-14 h-14 bg-white rounded-full shadow-xl border-2 border-slate-200 flex items-center justify-center text-blue-400 active:scale-95 transition-transform z-40">
        <ArrowDown size={28} strokeWidth={3} />
      </button>

      {/* Overlays */}
      <AnimatePresence>
        {showChat && (
          <Chat
            onClose={() => setShowChat(false)}
            studentName="Cô Thu Hương"
            isTeacherView={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
