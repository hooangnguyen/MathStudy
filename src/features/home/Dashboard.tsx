import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Bell, Flame, Star, Trophy, List, ArrowDown, Heart, Hexagon, BookOpen, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../../app/FirebaseProvider';
import { Notifications } from '../notifications/Notifications';
import { loadQuestionBank } from '../lessons/questionBank';
import { subscribeToNotifications, Notification } from '../notifications/notificationService';
import { cn } from '../../lib/utils';
import { getPendingAssignments, type PendingAssignment } from '../assignments/assignmentService';
import { HomeHeader } from './HomeHeader';
import { ContinueLearningCard, type NextLesson } from './ContinueLearningCard';
import { PendingAssignments } from './PendingAssignments';

interface DashboardProps {
  onShowNotifications?: () => void;
  onStartLesson?: (title: string, topic?: string, id?: number) => void;
  grade?: number;
  points?: number;
  streak?: number;
  completedLessons?: number[];
  /** Mở bài tập để làm (chuyển sang tab Lớp học). */
  onOpenAssignment?: (classId: string, assignmentId: string) => void;
}

interface PathNodeProps {
  node: any;
  unitTitle: string;
  onStartLesson: (title: string, topic?: string, id?: number) => void;
}

const PathNode = memo(({ node, unitTitle, onStartLesson }: PathNodeProps) => {
  const isLocked = node.status === 'locked';
  const isCurrent = node.status === 'current';
  const isCompleted = node.status === 'completed';

  return (
    <div
      className="relative z-10"
      style={{ transform: `translateX(${node.offset}px)` }}
    >
      {/* Floating Label for Current Node */}
      {isCurrent && (
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute top-full mt-4 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-sm font-black text-white shadow-2xl whitespace-nowrap border border-white/20 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            Bắt đầu ngay
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900/90 border-t border-l border-white/20 rotate-45" />
          </div>
        </motion.div>
      )}

      {/* Node Button */}
      <motion.button
        whileHover={!isLocked ? { scale: 1.08, y: -4 } : {}}
        whileTap={!isLocked ? { scale: 0.94 } : {}}
        onClick={!isLocked ? () => onStartLesson(`${unitTitle} - Bài ${node.lessonIndex}`, node.topic, node.id) : undefined}
        className={cn(
          "w-[64px] h-[64px] rounded-[1.6rem] flex items-center justify-center relative transition-all duration-300 ease-out",
          !isLocked ? "cursor-pointer" : "opacity-70 grayscale-[0.4]",
          node.color,
          !isCompleted && !isCurrent && "blur-[0.5px] opacity-50 grayscale-[0.6]"
        )}
        style={{
          boxShadow: (isCompleted || isCurrent)
            ? `0 10px 0 ${node.shadow}, 0 15px 30px -5px ${node.shadow}dd, inset 0 2px 4px rgba(255,255,255,0.4)`
            : `0 4px 0 ${node.shadow}40`
        }}
      >
        <div aria-label={`Bài ${node.lessonIndex}${isCompleted ? ' (đã xong)' : isLocked ? ' (chưa mở)' : ''}`} className="w-[44px] h-[44px] rounded-[1.1rem] bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
          {isCompleted ? (
            <Star size={26} className="text-white fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
          ) : (
            // Số thứ tự bài giúp học sinh biết mình đang ở đâu trên lộ trình
            <span className={cn("text-2xl font-black text-white drop-shadow", isLocked && "opacity-70")}>{node.lessonIndex}</span>
          )}
        </div>

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/10 rounded-[1.6rem]" />
        )}

        {/* Checkmark for completed */}
        {isCompleted && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full border-[3px] border-white shadow-xl flex items-center justify-center text-white"
          >
            <CheckCircle2 size={18} strokeWidth={3} />
          </motion.div>
        )}

        {/* Shine effect */}
        <div className="absolute inset-x-2 top-1 h-3 bg-white/30 rounded-full blur-[2px] pointer-events-none" />
      </motion.button>

      {/* Node Label (Optional) */}
      {!isLocked && (
        <div className="absolute top-1/2 -left-36 -translate-y-1/2 w-28 text-right pr-4 hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight">Màn {node.id}</p>
        </div>
      )}
    </div>
  );
});

PathNode.displayName = 'PathNode';

export const Dashboard: React.FC<DashboardProps> = ({
  onShowNotifications,
  onStartLesson,
  grade = 1,
  points = 0,
  streak = 0,
  completedLessons: completedLessonsProp,
  onOpenAssignment
}) => {
  const { user, userProfile } = useFirebase();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [gradeData, setGradeData] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Load grade-specific data for the map
  useEffect(() => {
    const loadGradeData = async () => {
      setIsDataLoading(true);
      try {
        setGradeData(await loadQuestionBank(grade));
      } catch (error) {
        console.error('Failed to load question data:', error);
        setGradeData([]);
      } finally {
        setIsDataLoading(false);
      }
    };
    loadGradeData();
  }, [grade]);

  // Use gradeData instead of curriculumData
  const curriculumData = gradeData;
  const studentGrade = userProfile?.grade || grade;
  const completedLessonsRaw = (completedLessonsProp && completedLessonsProp.length > 0)
    ? completedLessonsProp
    : (userProfile?.completedLessons || []);

  const completedLessons = useMemo(() =>
    completedLessonsRaw.map(id => String(id)),
    [completedLessonsRaw]
  );

  const handleLessonStart = useCallback((title: string, topic?: string, id?: number) => {
    onStartLesson?.(title, topic, id);
  }, [onStartLesson]);

  // Dynamically generate pathData based on the selected grade and progress
  const pathData = React.useMemo(() => {
    const gradeQuestions = curriculumData.filter(q => Number(q.grade) === Number(studentGrade));
    const topics = [...new Set(gradeQuestions.map(q => q.topic))];

    const unitGradients = [
      'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600',
      'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600',
      'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600',
      'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600',
      'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600',
    ];

    const unitShadows = [
      '#4338ca', // indigo-700
      '#be123c', // rose-700
      '#c26b00', // amber-700
      '#059669', // emerald-700
      '#0284c7', // blue-700
    ];

    let foundCurrent = false;

    return {
      units: topics.map((topic, index) => {
        const nodes = Array.from({ length: 10 }, (_, i) => {
          const lessonId = index * 10 + i + 1;
          const isFinished = completedLessons.includes(String(lessonId));

          let status: 'completed' | 'current' | 'locked' = 'locked';
          if (isFinished) {
            status = 'completed';
          } else if (!foundCurrent) {
            status = 'current';
            foundCurrent = true;
          }

          return {
            id: lessonId,
            type: 'lesson' as const,
            status,
            icon: 'star',
            color: `bg-${unitGradients[index % unitGradients.length].split(' ')[1].split('-')[1]}-500`,
            shadow: unitShadows[index % unitShadows.length],
            offset: (i % 2 === 0 ? 1 : -1) * (i * 10 % 40),
            topic: topic,
            lessonIndex: i + 1
          };
        });

        return {
          id: `u${index + 1}`,
          title: topic,
          description: `Luyện tập các kiến thức về ${topic.toLowerCase()}.`,
          color: unitGradients[index % unitGradients.length],
          nodes
        };
      })
    };
  }, [studentGrade, completedLessons, curriculumData]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
    });
    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Bài học tiếp theo (nút "Học ngay")
  const nextLesson = useMemo<NextLesson | null>(() => {
    for (const unit of pathData.units) {
      const current = unit.nodes.find(n => n.status === 'current');
      if (current) {
        return {
          id: current.id,
          title: `${unit.title} - Bài ${current.lessonIndex}`,
          topic: current.topic,
          unitTitle: unit.title,
          lessonIndex: current.lessonIndex,
          lessonsInUnit: unit.nodes.length,
          completedInUnit: unit.nodes.filter(n => n.status === 'completed').length,
        };
      }
    }
    return null;
  }, [pathData]);

  // Bài tập chưa nộp ở các lớp đã tham gia
  const enrolledClasses: string[] = userProfile?.enrolledClasses || [];
  const enrolledKey = enrolledClasses.join(',');
  const [pending, setPending] = useState<PendingAssignment[] | null>(null);
  useEffect(() => {
    if (!user) return;
    if (enrolledClasses.length === 0) { setPending([]); return; }
    let cancelled = false;
    getPendingAssignments(user.uid, enrolledClasses)
      .then(items => { if (!cancelled) setPending(items); })
      .catch(() => { if (!cancelled) setPending([]); });
    return () => { cancelled = true; };
  }, [user?.uid, enrolledKey]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-rose-50/20 relative font-sans overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] -left-[15%] w-[50%] h-[50%] bg-indigo-300/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] -right-[15%] w-[60%] h-[60%] bg-rose-300/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[10%] w-[40%] h-[40%] bg-violet-200/15 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-cyan-200/10 rounded-full blur-[80px]" />
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto pb-32 relative no-scrollbar">
        <div className="max-w-md mx-auto relative pt-5 px-5">
          <div className="space-y-6 mb-8">
            <HomeHeader
              name={userProfile?.name}
              avatar={userProfile?.avatar}
              grade={studentGrade}
              streak={streak}
              points={points}
              unreadCount={unreadCount}
              onShowNotifications={() => setShowNotifications(true)}
            />
            <ContinueLearningCard
              next={nextLesson}
              loading={isDataLoading}
              onStart={(next) => handleLessonStart(next.title, next.topic, next.id)}
            />
            <PendingAssignments
              items={pending}
              onOpen={(item) => onOpenAssignment?.(item.classId, item.assignmentId)}
            />
            <h2 className="text-lg font-black text-slate-900 pt-2">Lộ trình học</h2>
          </div>

          {isDataLoading && (
            <div className="space-y-4" aria-label="Đang tải lộ trình">
              <div className="h-24 rounded-3xl bg-slate-200/70 animate-pulse" />
              <div className="mx-auto w-16 h-16 rounded-3xl bg-slate-200/70 animate-pulse" />
              <div className="mx-auto w-16 h-16 rounded-3xl bg-slate-200/70 animate-pulse" />
            </div>
          )}

          {/* Unit Sections */}
          <div className="space-y-12">
            {pathData.units.map((unit, uIndex) => (
              <div key={unit.id} className="relative">
                {/* Unit Header Card */}
                <div className={cn(
                  "sticky top-0 z-50 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] text-white shadow-2xl mb-6 md:mb-8 overflow-hidden mx-[-10px]",
                  "background-size-[200%_200%] animate-gradient",
                  unit.color,
                  "border-b-4 border-black/10"
                )}>
                  {/* Glassmorphism backgrounds */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/15 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <span className="bg-black/20 backdrop-blur-md px-3 py-1 md:px-4 md:py-1.5 rounded-xl md:rounded-2xl text-xs font-black border border-white/20">
                        Chương {uIndex + 1}
                      </span>
                      <div className="bg-white/20 p-1.5 md:p-2 rounded-lg md:rounded-xl backdrop-blur-sm">
                        <LayoutGrid className="w-[18px] h-[18px] md:w-5 md:h-5 text-white" />
                      </div>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black mb-1 md:mb-1.5 tracking-tight drop-shadow-sm">{unit.title}</h2>
                    <p className="text-xs md:text-[13px] font-semibold opacity-90 leading-relaxed max-w-[90%] drop-shadow-sm">
                      {unit.description}
                    </p>
                  </div>
                </div>

                {/* Path Nodes for this Unit */}
                <div className="flex flex-col items-center gap-12 relative px-4">
                  {/* Vertical connector line */}
                  <div className="absolute top-0 bottom-0 w-2.5 bg-slate-200/50 rounded-full -z-0 overflow-hidden">
                    <motion.div 
                      animate={{ y: ["-100%", "100%"] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className={cn("w-full h-1/2 bg-gradient-to-b from-transparent via-white to-transparent opacity-40")}
                    />
                  </div>

                  {unit.nodes.map((node) => (
                    <PathNode
                      key={node.id}
                      node={node}
                      unitTitle={unit.title}
                      onStartLesson={handleLessonStart}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showNotifications && (
          <Notifications
            userRole="student"
            onBack={() => setShowNotifications(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
