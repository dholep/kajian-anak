import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { EventConfig, Participant } from './types';
import { initialEventConfig, initialParticipants } from './data/initialData';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Firestore Collections & Docs
const PARTICIPANTS_COLLECTION = 'participants';
const SETTINGS_COLLECTION = 'settings';
const CONFIG_DOC_ID = 'event_config';
const ADMIN_DOC_ID = 'admin_account';

/**
 * Subscribe to real-time participants list
 */
export function subscribeParticipants(callback: (participants: Participant[]) => void) {
  const participantsRef = collection(db, PARTICIPANTS_COLLECTION);
  return onSnapshot(participantsRef, (snapshot) => {
    if (snapshot.empty) {
      // If collection is empty on cloud, seed with initial mock data
      seedInitialParticipants().then(() => {
        callback(initialParticipants);
      });
      return;
    }
    const list: Participant[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Participant);
    });
    // Sort by registeredAt descending
    list.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
    callback(list);
  }, (err) => {
    console.warn('Firestore participant subscription fallback:', err);
  });
}

/**
 * Subscribe to real-time event configuration
 */
export function subscribeEventConfig(callback: (config: EventConfig) => void) {
  const configDocRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
  return onSnapshot(configDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as EventConfig);
    } else {
      // Seed default config
      setDoc(configDocRef, initialEventConfig).then(() => {
        callback(initialEventConfig);
      });
    }
  }, (err) => {
    console.warn('Firestore event config subscription fallback:', err);
  });
}

/**
 * Subscribe to real-time Admin Credentials
 */
export function subscribeAdminCredentials(callback: (creds: { username: string; passwordHash: string }) => void) {
  const adminDocRef = doc(db, SETTINGS_COLLECTION, ADMIN_DOC_ID);
  return onSnapshot(adminDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as { username: string; passwordHash: string };
      if (data && data.passwordHash) {
        callback(data);
      }
    }
  }, (err) => {
    console.warn('Firestore admin credentials subscription notice:', err);
  });
}

/**
 * Add or update single participant
 */
export async function saveParticipantToFirestore(participant: Participant): Promise<void> {
  try {
    const docRef = doc(db, PARTICIPANTS_COLLECTION, participant.id);
    await setDoc(docRef, participant, { merge: true });
  } catch (err) {
    console.error('Error saving participant to Firestore:', err);
    throw err;
  }
}

/**
 * Delete participant
 */
export async function deleteParticipantFromFirestore(participantId: string): Promise<void> {
  try {
    const docRef = doc(db, PARTICIPANTS_COLLECTION, participantId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting participant from Firestore:', err);
    throw err;
  }
}

/**
 * Update event configuration
 */
export async function saveConfigToFirestore(config: EventConfig): Promise<void> {
  try {
    const configDocRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    await setDoc(configDocRef, config, { merge: true });
  } catch (err) {
    console.error('Error saving config to Firestore:', err);
    throw err;
  }
}

/**
 * Check-in participant
 */
export async function checkInParticipantInFirestore(participantId: string): Promise<Participant | null> {
  try {
    const docRef = doc(db, PARTICIPANTS_COLLECTION, participantId);
    const attendedAt = new Date().toISOString();
    await updateDoc(docRef, {
      attendanceStatus: 'hadir',
      attendedAt
    });
    return null;
  } catch (err) {
    console.error('Error check-in participant in Firestore:', err);
    return null;
  }
}

/**
 * Seed initial participants
 */
export async function seedInitialParticipants(): Promise<void> {
  try {
    const batch = writeBatch(db);
    initialParticipants.forEach((p) => {
      const docRef = doc(db, PARTICIPANTS_COLLECTION, p.id);
      batch.set(docRef, p);
    });
    await batch.commit();
  } catch (err) {
    console.error('Error seeding participants:', err);
  }
}

/**
 * Reset all database data to defaults
 */
export async function resetDatabaseToDefaults(): Promise<void> {
  try {
    // Delete all current participants
    const participantsRef = collection(db, PARTICIPANTS_COLLECTION);
    const snap = await getDocs(participantsRef);
    const batch = writeBatch(db);
    snap.forEach((d) => {
      batch.delete(d.ref);
    });
    // Add default participants
    initialParticipants.forEach((p) => {
      const docRef = doc(db, PARTICIPANTS_COLLECTION, p.id);
      batch.set(docRef, p);
    });
    // Set default config
    const configDocRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    batch.set(configDocRef, initialEventConfig);
    
    await batch.commit();
  } catch (err) {
    console.error('Error resetting database to defaults:', err);
    throw err;
  }
}

/**
 * Cloud Admin Credentials
 */
export async function getCloudAdminCredentials(): Promise<{ username: string; passwordHash: string } | null> {
  try {
    const adminDocRef = doc(db, SETTINGS_COLLECTION, ADMIN_DOC_ID);
    const docSnap = await getDoc(adminDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as { username: string; passwordHash: string };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveCloudAdminCredentials(username: string, passwordHash: string): Promise<void> {
  try {
    const adminDocRef = doc(db, SETTINGS_COLLECTION, ADMIN_DOC_ID);
    await setDoc(adminDocRef, { username, passwordHash }, { merge: true });
  } catch (err) {
    console.warn('Could not save admin creds to Firestore:', err);
  }
}
