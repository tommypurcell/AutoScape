import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    User,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    getIdToken,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { syncUser } from '../services/firestoreService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AuthContextType {
    user: User | null;
    userRole: 'user' | 'admin' | 'pro' | null;
    credits: number;
    setCredits: React.Dispatch<React.SetStateAction<number>>;
    loading: boolean;
    sessionError: string | null;
    refreshSession: () => Promise<boolean>;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    sendVerificationEmail: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<'user' | 'admin' | 'pro' | null>(null);
    const [credits, setCredits] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);

    // Refresh the session token - returns true if successful, false if user needs to re-login
    const refreshSession = useCallback(async (): Promise<boolean> => {
        if (!auth.currentUser) {
            setSessionError('No active session');
            return false;
        }

        try {
            // Force refresh the token
            await getIdToken(auth.currentUser, true);
            setSessionError(null);
            return true;
        } catch (err: any) {
            console.error('Session refresh failed:', err);

            // Handle specific error cases
            if (err.code === 'auth/user-token-expired' ||
                err.code === 'auth/user-disabled' ||
                err.code === 'auth/user-not-found') {
                setSessionError('Your session has expired. Please sign in again.');
                await signOut(auth);
                return false;
            }

            // Network errors - don't sign out, let user retry
            if (err.code === 'auth/network-request-failed') {
                setSessionError('Network error. Please check your connection.');
                return false;
            }

            setSessionError('Session error. Please try again.');
            return false;
        }
    }, []);

    // Periodically refresh token to prevent expiration (every 30 minutes)
    useEffect(() => {
        if (!user) return;

        const refreshInterval = setInterval(async () => {
            try {
                await getIdToken(auth.currentUser!, true);
            } catch (err) {
                console.warn('Background token refresh failed:', err);
            }
        }, 30 * 60 * 1000); // 30 minutes

        return () => clearInterval(refreshInterval);
    }, [user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setSessionError(null); // Clear any session errors on auth state change
            if (user) {
                // Sync user data to Firestore
                await syncUser(user).catch(err => console.error("Failed to sync user:", err));
                // Fetch user role
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserRole(data.role || 'user');
                        setCredits(typeof data.credits === 'number' ? data.credits : 0);
                    } else {
                        setUserRole('user');
                        setCredits(0);
                    }
                } catch (err) {
                    console.error("Failed to fetch user role:", err);
                    setUserRole('user');
                    setCredits(0);
                }
            } else {
                setUserRole(null);
                setCredits(0);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            console.error("Google sign-in failed:", err);
            throw err;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUpWithEmail = async (email: string, password: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Send verification email after signup
        if (userCredential.user) {
            try {
                await sendEmailVerification(userCredential.user);
            } catch (err) {
                console.warn('Could not send verification email:', err);
            }
        }
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const sendVerificationEmail = async () => {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        } else {
            throw new Error('No user logged in');
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const value = {
        user,
        userRole,
        credits,
        setCredits,
        loading,
        sessionError,
        refreshSession,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        sendVerificationEmail,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
