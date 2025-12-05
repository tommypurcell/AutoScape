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
    shortId: string; // 6-character shareable ID
    userId: string;
    yardImageUrl?: string; // Original yard image for comparison
    isPublic?: boolean;
    createdAt: Date;
    renderImages: string[];
    planImage: string;
    estimates: any;
    analysis: any;
}

// Generate a random 6-character alphanumeric ID
const generateShortId = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const saveDesign = async (userId: string, design: Omit<SavedDesign, 'id' | 'userId' | 'createdAt' | 'shortId'>): Promise<{ id: string; shortId: string }> => {
    const shortId = generateShortId();
    const docRef = await addDoc(collection(db, 'designs'), {
        userId,
        shortId,
        ...design,
        isPublic: design.isPublic || false,
        createdAt: Timestamp.now(),
    });
    return { id: docRef.id, shortId };
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

import { styleReferences } from '../data/styleReferences';

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

        // Sort by date (newest first)
        let sortedDesigns = designs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // If we have fewer than 10 designs, add mock designs from styleReferences
        if (sortedDesigns.length < 10) {
            const needed = 12 - sortedDesigns.length;

            // Use styleReferences to generate consistent mock data
            // We cycle through the available styles
            for (let i = 0; i < needed; i++) {
                const styleRef = styleReferences[i % styleReferences.length];
                // Ensure we have a valid image URL, fallback to a placeholder if needed
                const imageUrl = styleRef.imageUrl || 'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&q=80&w=800';

                sortedDesigns.push({
                    id: `mock-${i}`,
                    shortId: `mock-${i}`,
                    userId: 'mock-user',
                    yardImageUrl: imageUrl,
                    isPublic: true,
                    createdAt: new Date(Date.now() - i * 86400000), // 1 day apart
                    renderImages: [imageUrl],
                    planImage: imageUrl, // Placeholder
                    estimates: { total_cost: "$15,000 - $25,000" },
                    analysis: {
                        style: styleRef.name,
                        description: styleRef.description || `A beautiful ${styleRef.name} design.`
                    }
                } as any);
            }
        }

        return sortedDesigns.slice(0, limitCount);
    } catch (error) {
        console.error('Error fetching public designs:', error);
        // Fallback to mocks if DB fails
        return styleReferences.slice(0, 10).map((styleRef, i) => ({
            id: `mock-fallback-${i}`,
            shortId: `mock-${i}`,
            userId: 'mock-user',
            yardImageUrl: styleRef.imageUrl,
            isPublic: true,
            createdAt: new Date(),
            renderImages: [styleRef.imageUrl],
            planImage: styleRef.imageUrl,
            estimates: { total_cost: "$10,000+" },
            analysis: { style: styleRef.name, description: styleRef.description }
        } as any));
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

export const getDesignByShortId = async (shortId: string): Promise<SavedDesign | null> => {
    try {
        const q = query(
            collection(db, 'designs'),
            where('shortId', '==', shortId)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const docSnap = querySnapshot.docs[0];
        return {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        } as SavedDesign;
    } catch (error) {
        console.error('Error fetching design by shortId:', error);
        throw error;
    }
};
