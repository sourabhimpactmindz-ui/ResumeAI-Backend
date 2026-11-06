import 'dotenv/config';
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const formatPrivateKey = (key) => {
  if (!key) return undefined;
  // Strip surrounding quotes if present (common when copied into hosting envs like Railway)
  let cleaned = key.trim().replace(/^["']|["']$/g, '');
  // Replace escaped \n with actual newlines
  return cleaned.replace(/\\n/g, '\n');
};

let authInstance = null;

try {
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️ Firebase Admin credentials missing or incomplete in environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).");
  } else {
    const app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

    authInstance = getAuth(app);
    console.log("✅ Firebase Admin Initialized successfully");
  }
} catch (error) {
  console.error("❌ Firebase Admin Initialization Error:", error.message);
}

export const auth = authInstance;
