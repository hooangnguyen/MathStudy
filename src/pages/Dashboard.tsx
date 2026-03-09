import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Bell, Flame, Star, Trophy, List, ArrowDown, Heart, Hexagon, BookOpen, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useFirebase } from '../context/FirebaseProvider';
import { cn } from '../utils/utils';
import { getCurriculum } from '../services/dataService';

interface DashboardProps {
  onShowNotifications?: () => void;
  onStartLesson?: (title: string, topic?: string, id?: number) => void;
  grade?: number;
  points?: number;
  streak?: number;
  completedLessons?: number[];
}
// curriculumData is now loaded dynamically inside the component

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
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-14 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="bg-slate-900 px-4 py-2 rounded-2xl text-[10px] font-black text-white shadow-xl whitespace-nowrap border border-slate-700 uppercase tracking-widest">
            Bắt đầu ngay
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 rotate-45" />
          </div>
        </motion.div>
      )}

      {/* Node Button */}
      <motion.button
        whileHover={!isLocked ? { scale: 1.05 } : {}}
        whileTap={!isLocked ? { scale: 0.95 } : {}}
        onClick={!isLocked ? () => onStartLesson(`${unitTitle} - Bài ${node.lessonIndex}`, node.topic, node.id) : undefined}
        className={cn(
          "w-[76px] h-[76px] rounded-[1.8rem] flex items-center justify-center relative transition-all duration-200 ease-out shadow-xl",
          !isLocked ? "cursor-pointer" : "opacity-80 grayscale-[0.2]",
          node.color,
          !isCompleted && !isCurrent && "blur-[1.5px] opacity-60 grayscale-[0.5]"
        )}
        style={{
          boxShadow: (isCompleted || isCurrent)
            ? `0 8px 0 ${node.shadow}, 0 12px 20px -5px ${node.shadow}80`
            : `0 4px 0 ${node.shadow}40`
        }}
      >
        <div className="w-[52px] h-[52px] rounded-[1.2rem] bg-black/10 flex items-center justify-center">
          {node.icon === 'star' ? (
            <Star size={32} className={cn(
              "text-sky-300 fill-sky-300 drop-shadow-lg",
              (!isCompleted && !isCurrent) && "opacity-50"
            )} />
          ) : (
            <span className="text-3xl drop-shadow-lg filter grayscale-[0]">{node.icon}</span>
          )}
        </div>

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/10 rounded-[1.8rem] backdrop-blur-[1px] flex items-center justify-center" />
        )}

        {/* Checkmark for completed */}
        {isCompleted && (
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center text-white">
            <CheckCircle2 size={16} strokeWidth={3} />
          </div>
        )}

        {/* Shine effect */}
        <div className="absolute inset-0 rounded-[1.8rem] border-t-2 border-l-2 border-white/30 pointer-events-none" />
      </motion.button>

      {/* Node Label (Optional) */}
      {!isLocked && (
        <div className="absolute top-1/2 -left-32 -translate-y-1/2 w-24 text-right pr-4 hidden md:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Màn {node.id}</p>
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
  completedLessons: completedLessonsProp
}) => {
  const { user, userProfile } = useFirebase();
  const [gradeData, setGradeData] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Load grade-specific data for the map
  // TODO: import grade-specific files (grade2.json, grade3.json...) when they are added
  useEffect(() => {
    const loadGradeData = async () => {
      setIsDataLoading(true);
      try {
        const module = await import('../data/questions/grade1.json');
        setGradeData(module.default);
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
      'from-orange-400 to-amber-500',
      'from-rose-500 to-pink-600',
      'from-indigo-500 to-violet-600',
      'from-emerald-500 to-teal-600',
      'from-blue-500 to-cyan-600',
    ];

    const unitShadows = [
      '#c26b00',
      '#be123c',
      '#4338ca',
      '#047857',
      '#0369a1',
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
            color: `bg-${unitGradients[index % unitGradients.length].split(' ')[0].split('-')[1]}-500`,
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

  return (
    <div className="flex flex-col h-full bg-[#fdfdfd] relative font-sans overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-rose-200/20 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-amber-200/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Stats Bar */}
      <div className="relative z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100"
            >
              <Flame size={18} className="text-orange-500 fill-orange-500" />
              <span className="font-black text-orange-600 text-sm">{streak}</span>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100"
            >
              <Star size={18} className="text-amber-500 fill-amber-500" />
              <span className="font-black text-amber-600 text-sm">{points.toLocaleString()}</span>
            </motion.div>
          </div>

          <button
            onClick={() => onShowNotifications?.()}
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all relative border border-slate-100 active:scale-95"
          >
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto pb-32 relative no-scrollbar">
        <div className="max-w-md mx-auto relative pt-0 px-6">


          {/* Unit Sections */}
          <div className="space-y-16">
            {pathData.units.map((unit, uIndex) => (
              <div key={unit.id} className="relative">
                {/* Unit Header Card */}
                <div className={cn(
                  "sticky top-0 z-50 bg-gradient-to-br p-4 rounded-b-[2rem] text-white shadow-xl mb-6 overflow-hidden mx-[-24px] px-[24px]",
                  unit.color
                )}>
                  <div className="relative z-10 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-white/20 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                        Chương {uIndex + 1}
                      </span>
                      <LayoutGrid size={16} className="opacity-60" />
                    </div>
                    <h2 className="text-lg font-black mb-1">{unit.title}</h2>
                    <p className="text-[10px] font-bold opacity-80 leading-tight max-w-[95%]">
                      {unit.description}
                    </p>
                  </div>
                  {/* Decorative icon background */}
                  <BookOpen size={72} className="absolute -right-2 -bottom-2 opacity-10 rotate-12" />
                </div>

                {/* Path Nodes for this Unit */}
                <div className="flex flex-col items-center gap-12 relative px-4">
                  {/* Vertical connector line (optional, for visual flow) */}
                  <div className="absolute top-0 bottom-0 w-2 bg-slate-100 rounded-full -z-0" />

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
    </div>
  );
};
