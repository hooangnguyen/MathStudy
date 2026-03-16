import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const testCreateClass = async () => {
    try {
        console.log("Signing in (ensure you have a test user or just anonymous if allowed)...");
        let user;
        try {
            const cred = await createUserWithEmailAndPassword(auth, "test2@test.com", "123456");
            user = cred.user;
        } catch (e) {
            if (e.code === 'auth/email-already-in-use') {
                const cred = await signInWithEmailAndPassword(auth, "test2@test.com", "123456");
                user = cred.user;
            } else {
                throw e;
            }
        }
        console.log("Logged in as", user.uid);

        const classesRef = collection(db, 'classes');
        const codeQuery = query(classesRef, where('code', '==', 'TEST12'));
        console.log("Executing getDocs...");
        const snap = await getDocs(codeQuery);
        console.log("Docs empty?", snap.empty);

        console.log("Creating doc...");
        const newRef = doc(classesRef);
        await setDoc(newRef, {
            id: newRef.id,
            name: "Test Class",
            grade: 5,
            code: "TEST12",
            teacherId: user.uid,
            studentIds: [],
            createdAt: serverTimestamp(),
            isActive: true,
            studentCount: 0,
            submitted: 0,
            totalAssignments: 0,
            totalExpectedSubmissions: 0,
            avgScore: 0
        });
        console.log("Created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("FAILED:", error.code, error.message);
        process.exit(1);
    }
};

testCreateClass();
