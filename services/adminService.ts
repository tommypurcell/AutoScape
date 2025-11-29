import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    deleteDoc,
    doc,
    getDoc,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SavedDesign } from './firestoreService';

export interface AdminStats {
    totalUsers: number;
    totalDesigns: number;
    totalBudget: number;
    recentDesigns: number;
}

export interface DesignStyleCount {
    style: string;
    count: number;
}

export interface AdminDesign extends SavedDesign {
    userEmail?: string;
}

// Simple admin check - can be configured via .env
const ADMIN_EMAILS = [
    'admin@autoscape.com',
    // Add more admin emails here or load from env
];

export const isAdmin = (email: string | null): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email) || email.endsWith('@autoscape.com');
};

export const getAdminStats = async (): Promise<AdminStats> => {
    try {
        const designsRef = collection(db, 'designs');
        const allDesigns = await getDocs(designsRef);

        // Calculate stats
        const totalDesigns = allDesigns.size;
        let totalBudget = 0;
        let recentCount = 0;
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        allDesigns.forEach((doc) => {
            const data = doc.data();
            if (data.estimates?.totalCost) {
                totalBudget += data.estimates.totalCost;
            }
            if (data.createdAt?.toDate().getTime() > oneDayAgo) {
                recentCount++;
            }
        });

        return {
            totalUsers: 0, // Would need Firebase Auth API to get this
            totalDesigns,
            totalBudget,
            recentDesigns: recentCount,
        };
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
    }
};

export const getAllDesigns = async (limitCount: number = 50): Promise<AdminDesign[]> => {
    try {
        const q = query(
            collection(db, 'designs'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as AdminDesign[];
    } catch (error) {
        console.error('Error fetching all designs:', error);
        throw error;
    }
};

export const getStyleDistribution = async (): Promise<DesignStyleCount[]> => {
    try {
        const designsRef = collection(db, 'designs');
        const allDesigns = await getDocs(designsRef);

        const styleCounts = new Map<string, number>();

        allDesigns.forEach((doc) => {
            const data = doc.data();
            const style = data.analysis?.style || 'Unknown';
            styleCounts.set(style, (styleCounts.get(style) || 0) + 1);
        });

        return Array.from(styleCounts.entries())
            .map(([style, count]) => ({ style, count }))
            .sort((a, b) => b.count - a.count);
    } catch (error) {
        console.error('Error fetching style distribution:', error);
        throw error;
    }
};

export const deleteDesignAdmin = async (designId: string): Promise<void> => {
    await deleteDoc(doc(db, 'designs', designId));
};
