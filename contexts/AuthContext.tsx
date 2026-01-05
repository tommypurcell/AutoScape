import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
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
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
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
        await signInWithPopup(auth, googleProvider);
    };

    const signInWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUpWithEmail = async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
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
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
