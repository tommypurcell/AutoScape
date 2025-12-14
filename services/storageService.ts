import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export const uploadImage = async (
    file: File | Blob,
    path: string
): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
};

export const uploadBase64Image = async (
    base64Data: string,
    path: string
): Promise<string> => {
    // Convert base64 to blob
    const base64 = base64Data.split(',')[1] || base64Data;
    const byteString = atob(base64);
    const mimeType = base64Data.match(/data:([^;]+);/)?.[1] || 'image/png';

    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([arrayBuffer], { type: mimeType });
    return uploadImage(blob, path);
};

export const deleteImage = async (path: string): Promise<void> => {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
};

/**
 * Upload a video from a base64 data URL or Blob
 */
export const uploadVideo = async (
    videoData: string | Blob,
    path: string
): Promise<string> => {
    let blob: Blob;

    if (typeof videoData === 'string') {
        // Handle base64 data URL (data:video/mp4;base64,...)
        const base64 = videoData.split(',')[1] || videoData;
        const byteString = atob(base64);
        const mimeType = videoData.match(/data:([^;]+);/)?.[1] || 'video/mp4';

        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }

        blob = new Blob([arrayBuffer], { type: mimeType });
    } else {
        blob = videoData;
    }

    console.log(`📹 Uploading video (${(blob.size / 1024 / 1024).toFixed(2)}MB) to ${path}...`);
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    console.log(`✅ Video uploaded: ${url.substring(0, 60)}...`);
    return url;
};
