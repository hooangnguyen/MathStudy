import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    onSnapshot,
    runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ClassData {
    id: string;
    name: string;
    grade: number;
    code: string;
    teacherId: string;
    studentIds: string[];
    createdAt: any;
    isActive: boolean;
    studentCount: number;
    submitted: number;
    totalAssignments: number;
    totalExpectedSubmissions: number;
    avgScore: number;
}

// Generate a random 6-character alphanumeric code
const generateClassCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Check if code is unique before returning
const getUniqueClassCode = async (): Promise<string> => {
    let isUnique = false;
    let code = '';
    const classesRef = collection(db, 'classes');

    while (!isUnique) {
        code = generateClassCode();
        const codeQuery = query(classesRef, where('code', '==', code));
        const querySnapshot = await getDocs(codeQuery);
        if (querySnapshot.empty) {
            isUnique = true;
        }
    }
    return code;
};

export const createClass = async (teacherId: string, name: string, grade: number): Promise<ClassData> => {
    try {
        const code = await getUniqueClassCode();
        const newClassRef = doc(collection(db, 'classes'));
        const classId = newClassRef.id;

        const classData: ClassData = {
            id: classId,
            name,
            grade,
            code,
            teacherId,
            studentIds: [],
            createdAt: serverTimestamp(),
            isActive: true,
            studentCount: 0,
            submitted: 0,
            totalAssignments: 0,
            totalExpectedSubmissions: 0,
            avgScore: 0
        };

        await setDoc(newClassRef, classData);
        return classData;
    } catch (error) {
        console.error('Error creating class:', error);
        throw error;
    }
};

export const subscribeToTeacherClasses = (teacherId: string, callback: (classes: ClassData[]) => void) => {
    const q = query(
        collection(db, 'classes'),
        where('teacherId', '==', teacherId),
        where('isActive', '==', true)
    );

    return onSnapshot(q, (snapshot) => {
        const classes: ClassData[] = [];
        snapshot.forEach((doc) => {
            classes.push(doc.data() as ClassData);
        });
        callback(classes);
    }, (error) => {
        console.error("Error subscribing to classes:", error);
    });
};

export const joinClass = async (studentId: string, classCode: string): Promise<ClassData> => {
    const code = classCode.trim().toUpperCase();
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, where('code', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error('Mã lớp không hợp lệ hoặc lớp không tồn tại.');
    }

    const classDoc = querySnapshot.docs[0];
    const classData = classDoc.data() as ClassData;

    if (classData.studentIds.includes(studentId)) {
        throw new Error('Bạn đã tham gia lớp này rồi.');
    }

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Read operations
            const classRef = doc(db, 'classes', classDoc.id);
            const userRef = doc(db, 'users', studentId);

            const latestClassDoc = await transaction.get(classRef);
            const userDoc = await transaction.get(userRef);

            if (!latestClassDoc.exists()) {
                throw new Error('Lớp không tồn tại.');
            }

            const latestClassData = latestClassDoc.data() as ClassData;
            if (latestClassData.studentIds.includes(studentId)) {
                throw new Error('Bạn đã tham gia lớp này rồi.');
            }

            // 2. Write operations
            const newStudentIds = [...latestClassData.studentIds, studentId];
            transaction.update(classRef, {
                studentIds: newStudentIds,
                studentCount: newStudentIds.length
            });

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const enrolledClasses = userData.enrolledClasses || [];
                if (!enrolledClasses.includes(classDoc.id)) {
                    transaction.update(userRef, {
                        enrolledClasses: [...enrolledClasses, classDoc.id]
                    });
                }
            } else {
                // Fallback for missing user profile initially
                transaction.set(userRef, { enrolledClasses: [classDoc.id] }, { merge: true });
            }
        });

        return classData;
    } catch (error) {
        console.error('Error joining class:', error);
        throw error;
    }
};

export const subscribeToStudentClass = (classId: string, callback: (classData: ClassData | null) => void) => {
    const classRef = doc(db, 'classes', classId);
    return onSnapshot(classRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as ClassData);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error subscribing to student class:", error);
    });
};
export const getStudentClasses = async (studentId: string): Promise<ClassData[]> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', studentId));
        if (!userDoc.exists()) return [];

        const userData = userDoc.data();
        const enrolledClasses = userData.enrolledClasses || [];

        if (enrolledClasses.length === 0) return [];

        const classes: ClassData[] = [];
        for (const classId of enrolledClasses) {
            const classDoc = await getDoc(doc(db, 'classes', classId));
            if (classDoc.exists()) {
                classes.push(classDoc.data() as ClassData);
            }
        }
        return classes;
    } catch (error) {
        console.error('Error getting student classes:', error);
        return [];
    }
};

export const getClassById = async (classId: string): Promise<ClassData | null> => {
    try {
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (classDoc.exists()) {
            return classDoc.data() as ClassData;
        }
        return null;
    } catch (error) {
        console.error('Error getting class:', error);
        return null;
    }
};

export const reCalculateClassStats = async (classId: string): Promise<void> => {
    try {
        const classRef = doc(db, 'classes', classId);
        const assignmentsRef = collection(classRef, 'assignments');
        const assignmentsSnapshot = await getDocs(assignmentsRef);

        let totalSubmitted = 0;
        let totalExpected = 0;
        let scoreSum = 0;
        let assignmentCount = 0;

        assignmentsSnapshot.forEach((doc) => {
            const data = doc.data();
            totalSubmitted += (data.completed || 0);
            totalExpected += (data.total || 0);
            scoreSum += (data.avgScore || 0);
            assignmentCount++;
        });

        const avgScore = assignmentCount > 0 ? Number((scoreSum / assignmentCount).toFixed(1)) : 0;

        await runTransaction(db, async (transaction) => {
            transaction.update(classRef, {
                submitted: totalSubmitted,
                totalExpectedSubmissions: totalExpected,
                totalAssignments: assignmentCount,
                avgScore: avgScore
            });
        });
    } catch (error) {
        console.error('Error recalculating class stats:', error);
        throw error;
    }
};
