import { initializeApp } from 'firebase/app';
import {
  getAuth,
  PhoneAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBxjqV3W7LDur69YrrR-lZog3c15JC4JQs',
  authDomain: 'nutrilens-86f6e.firebaseapp.com',
  projectId: 'nutrilens-86f6e',
  storageBucket: 'nutrilens-86f6e.firebasestorage.app',
  messagingSenderId: '518162744352',
  appId: '1:518162744352:android:de16814c514cf49acca845',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Step 1 — Send OTP to phone number
// Uses Expo's FirebaseRecaptchaVerifierModal (see usage below)
export const sendOTP = (phoneNumber, recaptchaVerifier) => {
  const provider = new PhoneAuthProvider(auth);
  return provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
};

// Step 2 — Verify OTP and sign in
export const verifyOTP = (verificationId, otp) => {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  return signInWithCredential(auth, credential);
};

// Listen to auth state changes
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
