"use server";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import type { UserCredential } from "firebase/auth";

interface AuthResult {
  success: boolean;
  user?: UserCredential["user"];
  error?: string;
}

export async function registerUser(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string | null;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      // Optionally send email verification
      // await sendEmailVerification(userCredential.user);
      return { success: true, user: userCredential.user };
    }
    return { success: false, error: "User creation failed." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signInUser(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
