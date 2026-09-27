/**
 * CLI Script: Assign Admin Custom Claims to Firebase Authentication Account
 *
 * Usage:
 *   npx tsx scripts/set-admin-claims.ts wayongohlaurence@gmail.com
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'chuka-efootball-hub';
const TARGET_EMAIL = process.argv[2] || 'wayongohlaurence@gmail.com';

async function setAdminClaims() {
  console.log('=====================================================');
  console.log('CHUKA eFOOTBALL — FIREBASE ADMIN CLAIMS ASSIGNMENT');
  console.log('=====================================================');
  console.log(`Target Email: ${TARGET_EMAIL}`);
  console.log(`Project ID:   ${PROJECT_ID}`);

  let app;
  let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

  if (!serviceAccountJson && fs.existsSync(serviceAccountPath)) {
    try {
      serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
      console.log(`✓ Loaded service account credentials from file: ${serviceAccountPath}`);
    } catch (readErr: any) {
      console.warn(`! Could not read ${serviceAccountPath}: ${readErr.message}`);
    }
  }

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      app = initializeApp({ credential: cert(parsed), projectId: PROJECT_ID }, 'adminCli');
      console.log('✓ Initialized Firebase Admin SDK with explicit service account credentials.');
    } catch (e: any) {
      console.warn('! Failed to parse service account JSON, falling back to project ID:', e.message);
      app = initializeApp({ projectId: PROJECT_ID }, 'adminCli');
    }
  } else {
    app = initializeApp({ projectId: PROJECT_ID }, 'adminCli');
    console.log('✓ Initialized Firebase Admin SDK with project ID.');
  }

  const auth = getAuth(app);

  try {
    console.log(`\n1. Looking up Firebase Authentication user for: ${TARGET_EMAIL}...`);
    const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
    console.log(`✓ User found: UID=${userRecord.uid}, DisplayName=${userRecord.displayName || '(none)'}`);
    console.log(`  Current Custom Claims:`, userRecord.customClaims || '(none)');

    const isOwner = TARGET_EMAIL.toLowerCase().trim() === 'wayongohlaurence@gmail.com' || TARGET_EMAIL.toLowerCase().trim() === 'wayongohlawrence@gmail.com';
    const newClaims = {
      admin: true,
      role: isOwner ? 'SUPER_ADMIN' : 'admin',
      isSuperAdmin: isOwner,
    };

    console.log(`\n2. Assigning admin custom claims:`, newClaims);
    await auth.setCustomUserClaims(userRecord.uid, newClaims);
    console.log(`✓ Successfully assigned custom claims to UID: ${userRecord.uid}`);

    // Verify
    const updatedUser = await auth.getUser(userRecord.uid);
    console.log(`✓ Verification lookup claims:`, updatedUser.customClaims);
    console.log('\n=====================================================');
    console.log('ADMIN PRIVILEGES GRANTED SUCCESSFULLY');
    console.log('=====================================================');
    console.log('Next step: The user should refresh their ID token in the app:');
    console.log('  await currentUser.getIdToken(true);');
    console.log('Or sign out and sign back in.\n');
  } catch (err: any) {
    console.error('\n✗ Error assigning custom claims:', err.message);
    if (err.message && err.message.includes('Identity Toolkit API')) {
      console.log('\nNotice: The Google Cloud environment requires service account credentials with Identity Toolkit access.');
      console.log('You can provide FIREBASE_SERVICE_ACCOUNT_KEY in .env to grant direct Admin SDK privileges.');
    }
    process.exit(1);
  }
}

setAdminClaims();
