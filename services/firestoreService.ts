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
    limit,
    startAfter,
    Timestamp,
    QueryDocumentSnapshot,
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
    design: GeneratedDesign,
    yardImageUrl?: string | null
): Promise<Omit<SavedDesign, 'id' | 'userId' | 'createdAt' | 'shortId'>> => {
    const timestamp = Date.now();
    const uploadedRenderImages: string[] = [];

    // Upload yard image if present and is a blob/data URL
    let uploadedYardImageUrl: string | undefined = undefined;
    if (yardImageUrl) {
        if (yardImageUrl.startsWith('blob:') || yardImageUrl.startsWith('data:')) {
            const path = `designs/${userId}/${timestamp}/yard_original.png`;
            console.log('Uploading yard image to Storage...');
            uploadedYardImageUrl = await uploadBase64Image(yardImageUrl, path);
            console.log(`  ✓ Uploaded yard image: ${uploadedYardImageUrl.substring(0, 60)}...`);
        } else if (yardImageUrl.startsWith('http')) {
            // Already a URL, keep it
            uploadedYardImageUrl = yardImageUrl;
        }
    }

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
        yardImageUrl: uploadedYardImageUrl,
        isPublic: false, // Default to private
        // shortId will be set by saveDesign
    };
};

// Generate a random 6-character alphanumeric ID
const generateShortId = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const saveDesign = async (
    userId: string,
    design: Omit<SavedDesign, 'id' | 'userId' | 'createdAt' | 'shortId'> | GeneratedDesign,
    isPublic?: boolean
): Promise<{ id: string; shortId: string }> => {
    console.log('🔄 Processing design for Firestore save...');

    // Check if it's a GeneratedDesign (needs image upload) or already sanitized
    let sanitizedDesign: Omit<SavedDesign, 'id' | 'userId' | 'createdAt' | 'shortId'>;

    if ('renderImages' in design && design.renderImages.some(img => img.startsWith('data:'))) {
        // Upload all base64 images to Storage and get URLs
        const yardUrl = 'yardImageUrl' in design ? design.yardImageUrl : undefined;
        sanitizedDesign = await uploadDesignImages(userId, design as GeneratedDesign, yardUrl);
    } else {
        // Already sanitized or has URLs
        sanitizedDesign = design as Omit<SavedDesign, 'id' | 'userId' | 'createdAt' | 'shortId'>;
    }

    // Override isPublic if specified
    if (isPublic !== undefined) {
        sanitizedDesign.isPublic = isPublic;
        console.log(`  Setting isPublic: ${isPublic}`);
    } else {
        console.log(`  isPublic not specified, using default: ${sanitizedDesign.isPublic ?? 'undefined'}`);
    }

    // Verify no base64 data in final object (safety check)
    const jsonStr = JSON.stringify(sanitizedDesign);
    if (jsonStr.includes('data:image')) {
        console.warn('⚠️  Warning: Base64 data still present in design object');
        console.warn('This may cause Firestore to exceed the 1MB limit');
    }

    console.log(`📦 Saving design to Firestore (${Math.round(jsonStr.length / 1024)}KB)...`);

    const shortId = generateShortId();

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'designs'), {
        userId,
        ...sanitizedDesign,
        shortId,
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

export const getPublicDesigns = async (limitCount: number = 100): Promise<SavedDesign[]> => {
    try {
        console.log('Getting public designs...');

        // Fetch ALL designs (not just isPublic=true) to handle cases where:
        // 1. Designs might have isPublic: false but should be shown
        // 2. Older designs might not have isPublic field set
        // We'll filter client-side to include isPublic === true OR isPublic === undefined/null
        let allDesigns: SavedDesign[] = [];
        let lastDoc: QueryDocumentSnapshot | null = null;
        const batchSize = 100; // Fetch in batches of 100

        do {
            let q;
            if (lastDoc) {
                // Continue from where we left off - fetch ALL designs, no isPublic filter
                q = query(
                    collection(db, 'designs'),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDoc),
                    limit(batchSize)
                );
            } else {
                // First batch - fetch ALL designs, no isPublic filter
                q = query(
                    collection(db, 'designs'),
                    orderBy('createdAt', 'desc'),
                    limit(batchSize)
                );
            }

            const querySnapshot = await getDocs(q);

            console.log(`  Batch fetched: ${querySnapshot.docs.length} designs (total so far: ${allDesigns.length})`);

            if (querySnapshot.empty) {
                console.log('  No more designs found, stopping pagination');
                break;
            }

            const batchDesigns = querySnapshot.docs.map((doc) => {
                const data = doc.data() as any;
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                } as SavedDesign;
            });

            allDesigns = [...allDesigns, ...batchDesigns];

            // Check if we got fewer results than requested (end of collection)
            if (querySnapshot.docs.length < batchSize) {
                console.log(`  Reached end of collection (got ${querySnapshot.docs.length} < ${batchSize})`);
                break;
            }

            // Get the last document for pagination
            lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

            // Safety check: don't fetch more than limitCount total (if specified and reasonable)
            // Only apply limit if it's less than a reasonable threshold (e.g., 1000)
            // This allows fetching all designs when limitCount is high
            if (limitCount && limitCount < 1000 && allDesigns.length >= limitCount) {
                console.log(`  Reached limit of ${limitCount} designs`);
                break;
            }
        } while (lastDoc);

        console.log(`Fetched ${allDesigns.length} total designs from Firestore (with pagination)`);
        console.log(`  Sample IDs: ${allDesigns.slice(0, 5).map(d => d.id).join(', ')}${allDesigns.length > 5 ? '...' : ''}`);

        // Filter to only exclude private designs (isPublic === false)
        // Keep all designs that are public (isPublic === true) OR don't have the field (undefined/null)
        // Also filter out designs without render images
        const publicDesigns = allDesigns.filter(design => {
            // Exclude designs without render images
            if (!design.renderImages || design.renderImages.length === 0) {
                console.log(`  Filtered out design without render images: ${design.id}`);
                return false;
            }
            // Only exclude if isPublic is explicitly false
            // Include if isPublic is true OR undefined/null (for backward compatibility)
            const isPublic = design.isPublic === true || design.isPublic === undefined || design.isPublic === null;
            if (!isPublic) {
                console.log(`  Filtered out private design: ${design.id} (isPublic: ${design.isPublic})`);
            }
            return isPublic;
        });

        // Already sorted by createdAt desc from the query, but ensure it's sorted
        let sortedDesigns = publicDesigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log(`Returning ${sortedDesigns.length} public designs (filtered out ${allDesigns.length - sortedDesigns.length} private/mock designs)`);

        // Return all designs or up to limitCount
        return limitCount ? sortedDesigns.slice(0, limitCount) : sortedDesigns;
    } catch (error: any) {
        console.error('Error fetching public designs:', error);

        // If error is due to missing index, try without orderBy as fallback
        if (error.code === 'failed-precondition') {
            console.warn('Composite index missing, falling back to query without orderBy (with pagination)');
            try {
                // Fallback: query without orderBy, use pagination to get all results, then sort client-side
                let allDesigns: SavedDesign[] = [];
                let lastDoc: QueryDocumentSnapshot | null = null;
                const batchSize = 100;

                do {
                    let q;
                    if (lastDoc) {
                        // Fallback: fetch ALL designs without orderBy
                        q = query(
                            collection(db, 'designs'),
                            startAfter(lastDoc),
                            limit(batchSize)
                        );
                    } else {
                        // Fallback: fetch ALL designs without orderBy
                        q = query(
                            collection(db, 'designs'),
                            limit(batchSize)
                        );
                    }

                    const querySnapshot = await getDocs(q);
                    if (querySnapshot.empty) break;

                    const batchDesigns = querySnapshot.docs.map((doc) => {
                        const data = doc.data() as any;
                        return {
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt?.toDate() || new Date(),
                        } as SavedDesign;
                    });

                    allDesigns = [...allDesigns, ...batchDesigns];

                    if (querySnapshot.docs.length < batchSize) break;
                    lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

                    if (limitCount && limitCount < 1000 && allDesigns.length >= limitCount) break;
                } while (lastDoc);

                // Filter to only exclude private designs (isPublic === false)
                // Keep all designs that are public (isPublic === true) OR don't have the field (undefined/null)
                const publicDesigns = allDesigns.filter(design => {
                    // Only exclude if isPublic is explicitly false
                    return design.isPublic === true || design.isPublic === undefined || design.isPublic === null;
                });
                const sortedDesigns = publicDesigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                console.log(`Fallback: Fetched ${sortedDesigns.length} public designs without orderBy`);
                return limitCount && limitCount < 1000 ? sortedDesigns.slice(0, limitCount) : sortedDesigns;
            } catch (fallbackError) {
                console.error('Fallback query also failed:', fallbackError);
            }
        }

        // Return empty array if DB fails - only show real designs from Firestore
        return [];
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

// ==================== DESIGNER PROFILES ====================

export interface DesignerProfile {
    id: string;
    userId: string;
    businessName: string;
    fullName: string;
    email: string;
    phone?: string;
    city: string;
    state: string;
    specialties: string[];
    yearsExperience: string;
    website?: string;
    bio: string;
    portfolioImages: string[];
    rating?: number;
    reviewCount?: number;
    isVerified?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Save a new designer profile
 */
export const saveDesignerProfile = async (
    userId: string,
    profileData: Omit<DesignerProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, 'designers'), {
            ...profileData,
            userId,
            rating: 0,
            reviewCount: 0,
            isVerified: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        console.log('Designer profile saved with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving designer profile:', error);
        throw error;
    }
};

/**
 * Get designer profile by user ID
 */
export const getDesignerProfileByUserId = async (userId: string): Promise<DesignerProfile | null> => {
    try {
        const q = query(
            collection(db, 'designers'),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as DesignerProfile;
    } catch (error) {
        console.error('Error fetching designer profile:', error);
        throw error;
    }
};

/**
 * Get all designers (for Business page)
 */
export const getAllDesigners = async (state?: string): Promise<DesignerProfile[]> => {
    try {
        let q;
        if (state) {
            q = query(
                collection(db, 'designers'),
                where('state', '==', state),
                orderBy('rating', 'desc')
            );
        } else {
            q = query(
                collection(db, 'designers'),
                orderBy('rating', 'desc')
            );
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docSnap => {
            const data = docSnap.data() as any;
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as DesignerProfile;
        });
    } catch (error) {
        console.error('Error fetching designers:', error);
        return [];
    }
};

/**
 * Get designer's designs (portfolio)
 */
export const getDesignerDesigns = async (userId: string): Promise<SavedDesign[]> => {
    try {
        const q = query(
            collection(db, 'designs'),
            where('userId', '==', userId),
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as SavedDesign[];
    } catch (error) {
        console.error('Error fetching designer designs:', error);
        return [];
    }
};
