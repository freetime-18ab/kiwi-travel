// @ts-ignore
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, collection, getDocs, writeBatch, doc } from "firebase/firestore";
// @ts-ignore
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { mockSchedules, mockBookings, mockExpenses, mockJournals, mockMembers, mockTodos, mockPackingList } from "./mockData";

// Standard Vite environment variable access
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

// Safety Check: If config is missing (local dev without .env), prevent crash but warn user
let app;
let db: any = null;
let auth: any = null;
let storage: any = null;

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;

if (!isConfigValid) {
  console.warn("⚠️ Firebase Configuration Missing. Running in Offline Mock Mode.");
  console.warn("To connect to Firebase, create a .env file with VITE_FIREBASE_... keys.");
} else {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);

    // Enable offline persistence
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.warn('Persistence not supported by browser');
        }
    });
  } catch (e) {
    console.error("Error initializing Firebase:", e);
    db = null; // Ensure fallback kicks in on error
  }
}

export { db, auth, storage };

// --- SEED DATA (New Zealand Trip) ---
export const seedDatabase = async () => {
  if (!db) {
    console.log("Skipping seedDatabase: Offline Mode Active.");
    return;
  }
  try {
    const eventsColl = collection(db, "schedules");
    const snapshot = await getDocs(eventsColl);

    // Only seed if database is empty
    if (!snapshot.empty) return;

    console.log("Seeding database with KiwiTravel itinerary...");
    const batch = writeBatch(db);

    // 1. Schedules
    mockSchedules.forEach(e => {
      const ref = doc(collection(db, "schedules"));
      batch.set(ref, { ...e, id: ref.id }); 
    });

    // 2. Bookings
    mockBookings.forEach(b => {
      const ref = doc(collection(db, "bookings"));
      batch.set(ref, { ...b, id: ref.id });
    });

    // 3. Expenses
    mockExpenses.forEach(e => {
      const ref = doc(collection(db, "expenses"));
      batch.set(ref, { ...e, id: ref.id });
    });
    
    // 4. Journals
    mockJournals.forEach(j => {
      const ref = doc(collection(db, "journals"));
      batch.set(ref, { ...j, id: ref.id });
    });

    // 5. Members
    mockMembers.forEach(m => {
        const ref = doc(collection(db, "members"));
        batch.set(ref, { ...m, id: ref.id });
    });

    // 6. Todos
    mockTodos.forEach(t => {
        const ref = doc(collection(db, "todos"));
        batch.set(ref, { ...t, id: ref.id });
    });

    // 7. Packing List
    mockPackingList.forEach(p => {
        const ref = doc(collection(db, "packing"));
        batch.set(ref, { ...p, id: ref.id });
    });

    await batch.commit();
    console.log("Database seeded!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};