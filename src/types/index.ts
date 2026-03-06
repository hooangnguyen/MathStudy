export type GradeLevel = 'elementary' | 'middle';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  grade: GradeLevel;
  icon: string;
  color: string;
}

export interface UserProgress {
  points: number;
  completedLessons: string[];
  streak: number;
}
