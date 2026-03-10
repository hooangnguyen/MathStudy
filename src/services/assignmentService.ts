import {
    collection,
    doc,
    setDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    getDoc,
    runTransaction,
    getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendNotification } from './notificationService';

export interface QuestionData {
    id: number;
    type: string;
    text: string;
    options: string[];
    correctAnswer?: number;
    points: number;
}

export interface AssignmentSettings {
    shuffleQuestions: boolean;
    showScoreImmediate: boolean;
}

export interface DraftAssignmentData {
    id: string;
    teacherId: string;
    title: string;
    description: string;
    questions: QuestionData[];
    settings: AssignmentSettings;
    createdAt: any;
    updatedAt: any;
}

export interface AssignmentData {
    id: string;
    title: string;
    description: string;
    dueDate: any;
    status: 'Đang diễn ra' | 'Đã kết thúc';
    total: number;
    completed: number;
    avgScore: number;
    questions: QuestionData[];
    settings: AssignmentSettings;
    createdAt: any;
    classId: string;
}

export const createAssignment = async (
    classId: string,
    title: string,
    description: string,
    dueDate: Date,
    totalStudents: number,
    questions: QuestionData[],
    settings: AssignmentSettings
): Promise<AssignmentData> => {
    try {
        const classRef = doc(db, 'classes', classId);
        const assignmentsRef = collection(classRef, 'assignments');
        const newAssignmentRef = doc(assignmentsRef);

        const assignmentData: AssignmentData = {
            id: newAssignmentRef.id,
            title,
            description,
            dueDate,
            status: 'Đang diễn ra',
            total: totalStudents,
            completed: 0,
            avgScore: 0,
            questions,
            settings,
            createdAt: serverTimestamp(),
            classId
        };

        await runTransaction(db, async (transaction) => {
            const classDoc = await transaction.get(classRef);
            if (!classDoc.exists()) throw new Error("Class not found");

            const classData = classDoc.data();
            const currentTotal = classData?.totalAssignments || 0;
            const currentExpected = classData?.totalExpectedSubmissions || 0;
            const studentIds = classData?.studentIds || [];

            transaction.update(classRef, {
                totalAssignments: currentTotal + 1,
                totalExpectedSubmissions: currentExpected + totalStudents
            });
            transaction.set(newAssignmentRef, assignmentData);

            // Send notifications to all students in the class
            for (const studentId of studentIds) {
                sendNotification(
                    studentId,
                    'assignment',
                    'Bài tập mới từ giáo viên',
                    `Bạn có bài tập mới: "${title}". Hạn nộp: ${dueDate.toLocaleString('vi-VN')}`,
                    { classId, assignmentId: newAssignmentRef.id }
                ).catch(err => console.error("Error sending student notification:", err));
            }
        });

        return assignmentData;
    } catch (error) {
        console.error('Error creating assignment:', error);
        throw error;
    }
};

export const subscribeToClassAssignments = (classId: string, callback: (assignments: AssignmentData[]) => void) => {
    const classRef = doc(db, 'classes', classId);
    const assignmentsRef = collection(classRef, 'assignments');
    const q = query(assignmentsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const assignments: AssignmentData[] = [];
        snapshot.forEach((doc) => {
            assignments.push(doc.data() as AssignmentData);
        });
        callback(assignments);
    }, (error) => {
        console.error("Error subscribing to assignments:", error);
    });
};

export interface SubmissionData {
    id: string; // studentId
    studentName: string;
    score: number;
    answers: any[];
    submittedAt: any;
    feedback?: string;
    gradedAt?: any;
}

export const submitAssignment = async (
    classId: string,
    assignmentId: string,
    studentId: string,
    studentName: string,
    answers: any[],
    score: number
) => {
    try {
        await runTransaction(db, async (transaction) => {
            const classRef = doc(db, 'classes', classId);
            const assignmentRef = doc(db, 'classes', classId, 'assignments', assignmentId);
            const submissionRef = doc(assignmentRef, 'submissions', studentId);
            const userRef = doc(db, 'users', studentId);

            // 1. READ OPERATIONS FIRST
            const [classDoc, assignmentDoc, submissionDoc, userDoc] = await Promise.all([
                transaction.get(classRef),
                transaction.get(assignmentRef),
                transaction.get(submissionRef),
                transaction.get(userRef)
            ]);

            if (!assignmentDoc.exists()) {
                throw new Error("Assignment does not exist!");
            }

            if (submissionDoc.exists()) {
                throw new Error("Student has already submitted this assignment.");
            }

            const assignmentData = assignmentDoc.data() as AssignmentData;

            // 2. PREPARE DATA
            const submissionData: SubmissionData = {
                id: studentId,
                studentName,
                score,
                answers,
                submittedAt: serverTimestamp()
            };

            const oldCompleted = assignmentData.completed || 0;
            const oldAvg = assignmentData.avgScore || 0;
            const newCompleted = oldCompleted + 1;
            const newAvg = Number((((oldAvg * oldCompleted) + score) / newCompleted).toFixed(1));

            // 3. WRITE OPERATIONS LAST
            transaction.set(submissionRef, submissionData);
            transaction.update(assignmentRef, {
                completed: newCompleted,
                avgScore: newAvg
            });

            // Update user profile totalCompletedAssignments
            if (userDoc.exists()) {
                const userData = userDoc.data();
                transaction.update(userRef, {
                    totalCompletedAssignments: (userData.totalCompletedAssignments || 0) + 1
                });
            }

            if (classDoc.exists()) {
                const classData = classDoc.data();
                const currentSubmitted = classData.submitted || 0;
                const teacherId = classData.teacherId;

                transaction.update(classRef, {
                    submitted: currentSubmitted + 1
                });

                // Send notification to the teacher
                if (teacherId) {
                    sendNotification(
                        teacherId,
                        'submission',
                        'Nộp bài mới',
                        `Học sinh ${studentName} vừa nộp bài cho "${assignmentData.title}"`,
                        { classId, assignmentId, studentId }
                    ).catch(err => console.error("Error sending teacher notification:", err));
                }
            }
        });
    } catch (error) {
        console.error('Transaction failed: ', error);
        throw error;
    }
};

// Map of assignmentId -> SubmissionData
export const getStudentSubmissions = async (
    classId: string,
    studentId: string,
    assignmentIds: string[]
): Promise<Record<string, SubmissionData>> => {
    if (!assignmentIds || assignmentIds.length === 0) return {};

    try {
        const promises = assignmentIds.map(async (assignmentId) => {
            const subRef = doc(db, 'classes', classId, 'assignments', assignmentId, 'submissions', studentId);
            const subDoc = await getDoc(subRef);
            if (subDoc.exists()) {
                return { key: assignmentId, data: subDoc.data() as SubmissionData };
            }
            return null;
        });

        const results = await Promise.all(promises);
        const map: Record<string, SubmissionData> = {};
        for (const res of results) {
            if (res) {
                map[res.key] = res.data;
            }
        }
        return map;
    } catch (error) {
        console.error("Error fetching student submissions:", error);
        return {};
    }
};

// --- DRAFT ASSIGNMENTS ---

export const saveDraftAssignment = async (
    teacherId: string,
    title: string,
    description: string,
    questions: QuestionData[],
    settings: AssignmentSettings,
    draftId?: string
): Promise<string> => {
    try {
        const draftsRef = collection(db, 'drafts');
        let draftDocRef;

        if (draftId) {
            draftDocRef = doc(draftsRef, draftId);
            await setDoc(draftDocRef, {
                id: draftId,
                teacherId,
                title,
                description,
                questions,
                settings,
                updatedAt: serverTimestamp()
            }, { merge: true }); // Using merge: true again but specifically ensuring questions are replaced correctly if needed, or just ensuring all fields exist. Actually, merge: true is safer here to keep createdAt.
        } else {
            draftDocRef = doc(draftsRef);
            await setDoc(draftDocRef, {
                id: draftDocRef.id,
                teacherId,
                title,
                description,
                questions,
                settings,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        return draftDocRef.id;
    } catch (error) {
        console.error('Error saving draft:', error);
        throw error;
    }
};

export const subscribeToDraftAssignments = (teacherId: string, callback: (drafts: DraftAssignmentData[]) => void) => {
    const draftsRef = collection(db, 'drafts');
    const q = query(draftsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const drafts: DraftAssignmentData[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data() as DraftAssignmentData;
            if (data.teacherId === teacherId) {
                drafts.push(data);
            }
        });
        callback(drafts);
    }, (error) => {
        console.error("Error subscribing to drafts:", error);
    });
};

export const validateDraftForAutoGrading = (draft: DraftAssignmentData) => {
    const issues: string[] = [];
    draft.questions.forEach((q, index) => {
        if (q.type === 'multiple_choice') {
            if (typeof q.correctAnswer !== 'number') {
                issues.push(`Câu ${index + 1} (${q.text.slice(0, 30)}...) chưa chọn đáp án đúng.`);
            }
        } else if (q.type === 'checkbox') {
            const arr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
            if (arr.length === 0) {
                issues.push(`Câu ${index + 1} (${q.text.slice(0, 30)}...) chưa chọn đáp án đúng (ít nhất một đáp án).`);
            }
        }
    });
    return issues;
};

export const deleteDraftAssignment = async (draftId: string) => {
    try {
        const { deleteDoc } = await import('firebase/firestore');
        const draftRef = doc(db, 'drafts', draftId);
        await deleteDoc(draftRef);
    } catch (error) {
        console.error('Error deleting draft:', error);
        throw error;
    }
};

export const subscribeToSubmissions = (
    classId: string,
    assignmentId: string,
    callback: (submissions: SubmissionData[]) => void
) => {
    const submissionsRef = collection(db, 'classes', classId, 'assignments', assignmentId, 'submissions');
    const q = query(submissionsRef, orderBy('submittedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const submissions: SubmissionData[] = [];
        snapshot.forEach((doc) => {
            submissions.push(doc.data() as SubmissionData);
        });
        callback(submissions);
    }, (error) => {
        console.error("Error subscribing to submissions:", error);
    });
};

export const updateSubmissionGrade = async (
    classId: string,
    assignmentId: string,
    studentId: string,
    gradeData: {
        score: number;
        feedback?: string;
        answers?: any[]; // Allow updating marked answers
    }
) => {
    try {
        const submissionRef = doc(db, 'classes', classId, 'assignments', assignmentId, 'submissions', studentId);
        await setDoc(submissionRef, {
            ...gradeData,
            gradedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating grade:', error);
        throw error;
    }
};
