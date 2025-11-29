import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
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
    createdAt: Date;
    yardImageUrl: string;
    renderImages: string[];
    planImage: string;
    estimates: any;
    analysis: any;
}

export const saveDesign = async (userId: string, design: GeneratedDesign): Promise<string> => {
    const designData = {
        userId,
        createdAt: Timestamp.now(),
        renderImages: design.renderImages,
        planImage: design.planImage,
        estimates: design.estimates,
        analysis: design.analysis,
    };

    const docRef = await addDoc(collection(db, 'designs'), designData);
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
