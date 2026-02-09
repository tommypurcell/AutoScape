// creditService.ts
// Service for managing user credits and subscriptions

import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserCredits {
  credits: number;
  freeCreditsUsed: number;
  totalCreditsPurchased: number;
  lastUpdated: Date;
}

const FREE_CREDITS = 2;

/**
 * Initialize user credits (give 2 free credits)
 */
export const initializeUserCredits = async (userId: string): Promise<UserCredits> => {
  try {
    const userCreditsRef = doc(db, 'userCredits', userId);
    const userCreditsSnap = await getDoc(userCreditsRef);

    if (!userCreditsSnap.exists()) {
      // New user - give them 2 free credits
      const initialCredits: UserCredits = {
        credits: FREE_CREDITS,
        freeCreditsUsed: 0,
        totalCreditsPurchased: 0,
        lastUpdated: new Date(),
      };

      await setDoc(userCreditsRef, {
        ...initialCredits,
        lastUpdated: new Date(),
      });

      console.log(`✅ Initialized ${FREE_CREDITS} free credits for user ${userId}`);
      return initialCredits;
    }

    // User already exists, return current credits
    const data = userCreditsSnap.data();
    return {
      credits: data.credits || 0,
      freeCreditsUsed: data.freeCreditsUsed || 0,
      totalCreditsPurchased: data.totalCreditsPurchased || 0,
      lastUpdated: data.lastUpdated?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error initializing user credits:', error);
    throw error;
  }
};

/**
 * Get user's current credit balance
 */
export const getUserCredits = async (userId: string): Promise<UserCredits> => {
  try {
    const userCreditsRef = doc(db, 'userCredits', userId);
    const userCreditsSnap = await getDoc(userCreditsRef);

    if (!userCreditsSnap.exists()) {
      // User doesn't have credits yet, initialize them
      return await initializeUserCredits(userId);
    }

    const data = userCreditsSnap.data();
    return {
      credits: data.credits || 0,
      freeCreditsUsed: data.freeCreditsUsed || 0,
      totalCreditsPurchased: data.totalCreditsPurchased || 0,
      lastUpdated: data.lastUpdated?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting user credits:', error);
    throw error;
  }
};

/**
 * Check if user has enough credits
 */
export const hasEnoughCredits = async (userId: string, requiredCredits: number = 1): Promise<boolean> => {
  const userCredits = await getUserCredits(userId);
  return userCredits.credits >= requiredCredits;
};

/**
 * Use credits (deduct from user's balance)
 */
export const useCredits = async (userId: string, creditsToUse: number = 1): Promise<UserCredits> => {
  try {
    const userCreditsRef = doc(db, 'userCredits', userId);
    const userCreditsSnap = await getDoc(userCreditsRef);

    if (!userCreditsSnap.exists()) {
      throw new Error('User credits not initialized');
    }

    const currentData = userCreditsSnap.data();
    const currentCredits = currentData.credits || 0;

    if (currentCredits < creditsToUse) {
      throw new Error('Insufficient credits');
    }

    // Determine if this is a free credit being used
    const freeCreditsRemaining = FREE_CREDITS - (currentData.freeCreditsUsed || 0);
    const freeCreditsToUse = Math.min(creditsToUse, freeCreditsRemaining);
    const paidCreditsToUse = creditsToUse - freeCreditsToUse;

    await updateDoc(userCreditsRef, {
      credits: increment(-creditsToUse),
      freeCreditsUsed: increment(freeCreditsToUse),
      lastUpdated: new Date(),
    });

    const updatedCredits = await getUserCredits(userId);
    console.log(`✅ Used ${creditsToUse} credit(s). Remaining: ${updatedCredits.credits}`);
    return updatedCredits;
  } catch (error) {
    console.error('Error using credits:', error);
    throw error;
  }
};

/**
 * Add credits to user's account (after purchase)
 */
export const addCredits = async (userId: string, creditsToAdd: number, isPurchase: boolean = true): Promise<UserCredits> => {
  try {
    const userCreditsRef = doc(db, 'userCredits', userId);
    const userCreditsSnap = await getDoc(userCreditsRef);

    if (!userCreditsSnap.exists()) {
      // Initialize if doesn't exist
      await initializeUserCredits(userId);
    }

    await updateDoc(userCreditsRef, {
      credits: increment(creditsToAdd),
      totalCreditsPurchased: isPurchase ? increment(creditsToAdd) : increment(0),
      lastUpdated: new Date(),
    });

    const updatedCredits = await getUserCredits(userId);
    console.log(`✅ Added ${creditsToAdd} credit(s). New balance: ${updatedCredits.credits}`);
    return updatedCredits;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
};
