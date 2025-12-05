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
import { uploadBase64Image } from './storageService';

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

/**
 * Processes a GeneratedDesign and uploads all base64 images to Firebase Storage.
 * Returns a sanitized design object with Storage URLs instead of base64 data.
 *
 * This prevents Firestore from exceeding the 1MB document limit.
 */
const uploadDesignImages = async (
    userId: string,
    design: GeneratedDesign
): Promise<Omit<SavedDesign, 'id' | 'userId' | 'createdAt'>> => {
    const timestamp = Date.now();
    const uploadedRenderImages: string[] = [];

    // Upload all render images (typically 1-3 images, 3-7MB each)
    console.log(`Uploading ${design.renderImages.length} render image(s) to Storage...`);
    for (let i = 0; i < design.renderImages.length; i++) {
        const base64Image = design.renderImages[i];

        // Skip if already a URL (already uploaded)
        if (base64Image.startsWith('http')) {
            uploadedRenderImages.push(base64Image);
            continue;
        }

        const path = `designs/${userId}/${timestamp}/render_${i}.png`;
        console.log(`  Uploading render ${i + 1}/${design.renderImages.length}...`);
        const url = await uploadBase64Image(base64Image, path);
        uploadedRenderImages.push(url);
        console.log(`  ✓ Uploaded: ${url.substring(0, 60)}...`);
    }

    // Upload plan image if present
    let uploadedPlanImage = design.planImage || '';
    if (design.planImage && !design.planImage.startsWith('http')) {
        const path = `designs/${userId}/${timestamp}/plan.png`;
        console.log('Uploading plan image to Storage...');
        uploadedPlanImage = await uploadBase64Image(design.planImage, path);
        console.log(`  ✓ Uploaded: ${uploadedPlanImage.substring(0, 60)}...`);
    }

    // Process plant palette images if present
    let processedEstimates = { ...design.estimates };
    if (design.estimates.plantPalette && design.estimates.plantPalette.length > 0) {
        console.log(`Processing ${design.estimates.plantPalette.length} plant palette images...`);
        processedEstimates.plantPalette = await Promise.all(
            design.estimates.plantPalette.map(async (plant, idx) => {
                // Skip if already a URL or missing
                if (!plant.image_url || plant.image_url.startsWith('http')) {
                    return plant;
                }

                const path = `designs/${userId}/${timestamp}/plant_${idx}.png`;
                const url = await uploadBase64Image(plant.image_url, path);
                return { ...plant, image_url: url };
            })
        );
        console.log(`  ✓ Processed ${processedEstimates.plantPalette.length} plant images`);
    }

    // Return sanitized design with Storage URLs
    return {
        renderImages: uploadedRenderImages,
        planImage: uploadedPlanImage,
        estimates: processedEstimates,
        analysis: design.analysis,
        isPublic: false, // Default to private
    };
};

export const saveDesign = async (
    userId: string,
    design: GeneratedDesign,
    isPublic: boolean = false
): Promise<void> => {
    console.log('🔄 Processing design for Firestore save...');

    // Upload all base64 images to Storage and get URLs
    const sanitizedDesign = await uploadDesignImages(userId, design);

    // Override isPublic if specified
    sanitizedDesign.isPublic = isPublic;

    // Verify no base64 data in final object (safety check)
    const jsonStr = JSON.stringify(sanitizedDesign);
    if (jsonStr.includes('data:image')) {
        console.warn('⚠️  Warning: Base64 data still present in design object');
        console.warn('This may cause Firestore to exceed the 1MB limit');
    }

    console.log(`📦 Saving design to Firestore (${Math.round(jsonStr.length / 1024)}KB)...`);

    // Save to Firestore
    await addDoc(collection(db, 'designs'), {
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
                ...sanitizedDesign,
                shortId,
                ...design,
                isPublic: design.isPublic || false,
                createdAt: Timestamp.now(),
            });

            console.log('✅ Design saved successfully to Firestore');
            return { id: docRef.id, shortId };
        };

        export const getUserDesigns = async (userId: string): Promise<SavedDesign[]> => {
            const q = query(
                collection(db, 'designs'),
                where('userId', '==', userId)
                // orderBy('createdAt', 'desc') // Removed to avoid composite index requirement
            );

            try {
                const querySnapshot = await getDocs(q);
                const designs = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt.toDate(),
                })) as SavedDesign[];

                // Sort client-side instead
                return designs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            } catch (error: any) {
                console.error('Error fetching user designs:', error);
                if (error.code === 'permission-denied') {
                    console.error('Permission denied. Check Firestore Rules and Auth state.');
                } else if (error.code === 'failed-precondition') {
                    console.error('Failed precondition. Likely missing index.', error.message);
                }
                throw error;
            }
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
