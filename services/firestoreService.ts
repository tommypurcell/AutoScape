import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { GeneratedDesign } from '../types';

export interface SavedDesign {
    id: string;
    userId: string;
    isPublic?: boolean;
    createdAt: Date;
    renderImages: string[];
    planImage: string;
    estimates: any;
    analysis: any;
}

export const saveDesign = async (userId: string, design: Omit<SavedDesign, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'designs'), {
        userId,
        ...design,
        isPublic: design.isPublic || false,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
};

export const getUserDesigns = async (userId: string): Promise<SavedDesign[]> => {
    const q = query(
        collection(db, 'designs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
    })) as SavedDesign[];
};

export const deleteDesign = async (designId: string): Promise<void> => {
    await deleteDoc(doc(db, 'designs', designId));
};

export const getPublicDesigns = async (limitCount: number = 20): Promise<SavedDesign[]> => {
    try {
        // Simple query without orderBy to avoid composite index requirement
        // We'll sort client-side instead
        const q = query(
            collection(db, 'designs'),
            where('isPublic', '==', true)
        );

        const querySnapshot = await getDocs(q);
        const designs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as SavedDesign[];

        // Sort by date (newest first) and limit client-side
        return designs
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limitCount);
    } catch (error) {
        console.error('Error fetching public designs:', error);
        throw error;
    }
};

export const getDesignById = async (designId: string): Promise<SavedDesign | null> => {
    try {
        const docRef = doc(db, 'designs', designId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            } as SavedDesign;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching design:', error);
        throw error;
    }
};
