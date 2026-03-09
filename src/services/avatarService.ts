import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const AVATARS_FOLDER = 'avatars';

/**
 * Upload avatar image to Firebase Storage
 * @param uid - User ID
 * @param imageData - Base64 string or Blob
 * @returns Download URL of uploaded image
 */
export const uploadAvatar = async (uid: string, imageData: string | Blob): Promise<string> => {
  try {
    // Convert base64 to Blob if needed
    let blob: Blob;
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      const response = await fetch(imageData);
      blob = await response.blob();
    } else if (imageData instanceof Blob) {
      blob = imageData;
    } else {
      throw new Error('Invalid image data');
    }

    // Create storage reference
    const avatarRef = ref(storage, `${AVATARS_FOLDER}/${uid}`);

    // Upload the image
    await uploadBytes(avatarRef, blob, {
      contentType: 'image/jpeg',
      cacheControl: 'public,max-age=31536000',
    });

    // Get download URL
    const downloadURL = await getDownloadURL(avatarRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

/**
 * Delete avatar from Firebase Storage
 * @param uid - User ID
 */
export const deleteAvatar = async (uid: string): Promise<void> => {
  try {
    const avatarRef = ref(storage, `${AVATARS_FOLDER}/${uid}`);
    await deleteObject(avatarRef);
  } catch (error: any) {
    // Ignore if file doesn't exist
    if (error.code !== 'storage/object-not-found') {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  }
};

/**
 * Check if a string is a valid base64 image
 */
export const isBase64Image = (str: string): boolean => {
  return str.startsWith('data:image/');
};

/**
 * Check if URL is from Firebase Storage
 */
export const isFirebaseStorageUrl = (url: string): boolean => {
  return url.includes('firebasestorage.googleapis.com');
};
