// Utility to get random questions for duel from data files

export interface DuelQuestion {
    grade: number;
    topic: string;
    sub_topic: string;
    difficulty: string;
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
}

// Get random questions from grade data
// TODO: Add grade2.json, grade3.json... files and re-enable grade-specific loading
export const getRandomQuestions = async (grade: number, count: number = 10): Promise<DuelQuestion[]> => {
    try {
        // Using grade1.json for all grades until grade-specific files are added
        const module = await import('../data/questions/grade1.json');
        const allQuestions: DuelQuestion[] = module.default as any[];

        // Shuffle and take required number
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    } catch (error) {
        console.error(`Error loading questions:`, error);
        return [];
    }
};

// Get random questions from multiple grades
export const getRandomQuestionsFromGrades = async (grades: number[], countPerGrade: number = 5): Promise<DuelQuestion[]> => {
    const allQuestions: DuelQuestion[] = [];

    for (const grade of grades) {
        const questions = await getRandomQuestions(grade, countPerGrade);
        allQuestions.push(...questions);
    }

    // Shuffle all questions
    return allQuestions.sort(() => Math.random() - 0.5);
};
