// creditService.ts
// Service for managing user credits and subscriptions

import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserCredits {
  credits: number;
  freeCreditsUsed: number;
  totalCreditsPurchased: number;
  lastUpdated: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'use' | 'refund' | 'reserve' | 'release' | 'admin_grant';
  amount: number;
  idempotencyKey?: string;
  designId?: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

const FREE_CREDITS = 2;

// In-memory cache for recent idempotency keys (cleared on page reload)
const processedIdempotencyKeys = new Set<string>();

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
 * Supports idempotency key to prevent double-crediting from webhook retries
 */
export const addCredits = async (
  userId: string,
  creditsToAdd: number,
  isPurchase: boolean = true,
  idempotencyKey?: string
): Promise<UserCredits> => {
  try {
    // Check idempotency to prevent double-crediting
    if (idempotencyKey) {
      // Check in-memory cache first (fast path)
      if (processedIdempotencyKeys.has(idempotencyKey)) {
        console.log(`⚠️ Duplicate request detected (memory cache): ${idempotencyKey}`);
        return await getUserCredits(userId);
      }

      // Check Firestore for persistence across server restarts
      const transactionsRef = collection(db, 'creditTransactions');
      const q = query(
        transactionsRef,
        where('idempotencyKey', '==', idempotencyKey),
        where('status', '==', 'completed')
      );
      const existingTx = await getDocs(q);

      if (!existingTx.empty) {
        console.log(`⚠️ Duplicate request detected (Firestore): ${idempotencyKey}`);
        processedIdempotencyKeys.add(idempotencyKey);
        return await getUserCredits(userId);
      }
    }

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

    // Record transaction for idempotency
    if (idempotencyKey) {
      const txRef = doc(collection(db, 'creditTransactions'));
      await setDoc(txRef, {
        userId,
        type: 'purchase',
        amount: creditsToAdd,
        idempotencyKey,
        timestamp: new Date(),
        status: 'completed',
      });
      processedIdempotencyKeys.add(idempotencyKey);
    }

    const updatedCredits = await getUserCredits(userId);
    console.log(`✅ Added ${creditsToAdd} credit(s). New balance: ${updatedCredits.credits}`);
    return updatedCredits;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
};

/**
 * Reserve credits before generation (deduct immediately)
 * Returns a reservation ID that can be used to refund if generation fails
 */
export const reserveCredits = async (userId: string, creditsToReserve: number = 1): Promise<string> => {
  try {
    const userCreditsRef = doc(db, 'userCredits', userId);
    const userCreditsSnap = await getDoc(userCreditsRef);

    if (!userCreditsSnap.exists()) {
      throw new Error('User credits not initialized');
    }

    const currentData = userCreditsSnap.data();
    const currentCredits = currentData.credits || 0;

    if (currentCredits < creditsToReserve) {
      throw new Error('Insufficient credits');
    }

    // Deduct credits immediately
    await updateDoc(userCreditsRef, {
      credits: increment(-creditsToReserve),
      lastUpdated: new Date(),
    });

    // Create reservation record
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const txRef = doc(db, 'creditTransactions', reservationId);
    await setDoc(txRef, {
      userId,
      type: 'reserve',
      amount: creditsToReserve,
      timestamp: new Date(),
      status: 'pending', // Will be updated to 'completed' or 'refunded'
    });

    console.log(`✅ Reserved ${creditsToReserve} credit(s). Reservation ID: ${reservationId}`);
    return reservationId;
  } catch (error) {
    console.error('Error reserving credits:', error);
    throw error;
  }
};

/**
 * Complete a credit reservation (mark as used)
 */
export const completeReservation = async (reservationId: string, designId?: string): Promise<void> => {
  try {
    const txRef = doc(db, 'creditTransactions', reservationId);
    await updateDoc(txRef, {
      status: 'completed',
      designId,
      completedAt: new Date(),
    });
    console.log(`✅ Reservation ${reservationId} completed`);
  } catch (error) {
    console.error('Error completing reservation:', error);
    throw error;
  }
};

/**
 * Refund credits from a failed reservation
 */
export const refundReservation = async (reservationId: string, reason?: string): Promise<UserCredits> => {
  try {
    const txRef = doc(db, 'creditTransactions', reservationId);
    const txSnap = await getDoc(txRef);

    if (!txSnap.exists()) {
      throw new Error('Reservation not found');
    }

    const txData = txSnap.data();

    if (txData.status !== 'pending') {
      console.log(`⚠️ Reservation ${reservationId} already ${txData.status}, skipping refund`);
      return await getUserCredits(txData.userId);
    }

    // Refund the credits
    const userCreditsRef = doc(db, 'userCredits', txData.userId);
    await updateDoc(userCreditsRef, {
      credits: increment(txData.amount),
      lastUpdated: new Date(),
    });

    // Update reservation status
    await updateDoc(txRef, {
      status: 'refunded',
      refundReason: reason || 'Generation failed',
      refundedAt: new Date(),
    });

    const updatedCredits = await getUserCredits(txData.userId);
    console.log(`✅ Refunded ${txData.amount} credit(s) for reservation ${reservationId}. New balance: ${updatedCredits.credits}`);
    return updatedCredits;
  } catch (error) {
    console.error('Error refunding reservation:', error);
    throw error;
  }
};

/**
 * Get all users' credits (admin function)
 */
export const getAllUserCredits = async (): Promise<Record<string, UserCredits>> => {
  try {
    const creditsRef = collection(db, 'userCredits');
    const creditsSnap = await getDocs(creditsRef);

    const creditsMap: Record<string, UserCredits> = {};
    creditsSnap.forEach((doc) => {
      const data = doc.data();
      creditsMap[doc.id] = {
        credits: data.credits || 0,
        freeCreditsUsed: data.freeCreditsUsed || 0,
        totalCreditsPurchased: data.totalCreditsPurchased || 0,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    });

    return creditsMap;
  } catch (error) {
    console.error('Error getting all user credits:', error);
    throw error;
  }
};

/**
 * Admin grant credits to a user
 */
export const adminGrantCredits = async (
  userId: string,
  creditsToGrant: number,
  adminId: string,
  reason?: string
): Promise<UserCredits> => {
  try {
    const userCreditsRef = doc(db, 'userCredits', userId);
    const userCreditsSnap = await getDoc(userCreditsRef);

    if (!userCreditsSnap.exists()) {
      // Initialize if doesn't exist
      await initializeUserCredits(userId);
    }

    await updateDoc(userCreditsRef, {
      credits: increment(creditsToGrant),
      lastUpdated: new Date(),
    });

    // Record the admin grant transaction
    const txRef = doc(collection(db, 'creditTransactions'));
    await setDoc(txRef, {
      userId,
      type: 'admin_grant',
      amount: creditsToGrant,
      adminId,
      reason: reason || 'Admin granted credits',
      timestamp: new Date(),
      status: 'completed',
    });

    const updatedCredits = await getUserCredits(userId);
    console.log(`✅ Admin granted ${creditsToGrant} credit(s) to user ${userId}. New balance: ${updatedCredits.credits}`);
    return updatedCredits;
  } catch (error) {
    console.error('Error granting credits:', error);
    throw error;
  }
};

/**
 * Get credit transaction history (optionally filtered by userId)
 */
export const getCreditHistory = async (userId?: string, limitCount: number = 100): Promise<CreditTransaction[]> => {
  try {
    const transactionsRef = collection(db, 'creditTransactions');
    let q;

    if (userId) {
      q = query(
        transactionsRef,
        where('userId', '==', userId)
      );
    } else {
      q = query(transactionsRef);
    }

    const txSnap = await getDocs(q);
    const transactions: CreditTransaction[] = [];

    txSnap.forEach((doc) => {
      const data = doc.data() as {
        userId: string;
        type: 'purchase' | 'use' | 'refund' | 'reserve' | 'release' | 'admin_grant';
        amount: number;
        idempotencyKey?: string;
        designId?: string;
        timestamp?: { toDate: () => Date };
        status: 'pending' | 'completed' | 'failed';
      };
      transactions.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        idempotencyKey: data.idempotencyKey,
        designId: data.designId,
        timestamp: data.timestamp?.toDate() || new Date(),
        status: data.status,
      });
    });

    // Sort by timestamp descending
    transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return transactions.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting credit history:', error);
    throw error;
  }
};
