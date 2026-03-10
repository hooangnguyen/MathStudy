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
export const getRandomQuestions = async (grade: number, count: number = 10): Promise<DuelQuestion[]> => {
    try {
        const module = await import(`../data/questions/grade${grade}.json`);
        const allQuestions: DuelQuestion[] = module.default as any[];

        // Shuffle and take required number
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    } catch (error) {
        console.error(`Error loading questions for grade ${grade}:`, error);
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

// Get random mixed questions from all available grades (1-9)
export const getRandomMixedQuestions = async (totalCount: number = 10): Promise<DuelQuestion[]> => {
    try {
        const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // To be efficient, we don't want to load all files if we only need a few questions
        // But for a simple approach, we can pick a random grade for each question slot
        const result: DuelQuestion[] = [];

        // Let's load a few questions from each grade to ensure variety
        const countPerGrade = Math.ceil(totalCount / grades.length) + 2;
        const allPossible = await getRandomQuestionsFromGrades(grades, countPerGrade);

        return allPossible.sort(() => Math.random() - 0.5).slice(0, totalCount);
    } catch (error) {
        console.error("Error getting mixed questions:", error);
        return [];
    }
};
