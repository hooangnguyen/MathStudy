import { storage } from '../config/firebase';
// Firebase Storage is bypassed since the user does not have a billing account.
// We will store compressed Base64 strings directly in Firestore instead.

/**
 * Upload avatar image to Firebase Storage (Bypassed - Returns Base64 directly)
 * @param uid - User ID
 * @param imageData - Base64 string or Blob
 * @returns Download URL of uploaded image (or Base64 string)
 */
export const uploadAvatar = async (uid: string, imageData: string | Blob): Promise<string> => {
  try {
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      return imageData; // Already base64, return directly to save in Firestore
    } else if (imageData instanceof Blob) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageData);
      });
    }
    throw new Error('Invalid image data');
  } catch (error) {
    console.error('Error processing avatar:', error);
    throw error;
  }
};

/**
 * Upload chat image to Firebase Storage (Bypassed - Returns Base64 directly)
 * @param conversationId - Conversation ID
 * @param imageData - Base64 string or Blob
 * @returns Download URL of uploaded image (or Base64 string)
 */
export const uploadChatImage = async (conversationId: string, imageData: string | Blob): Promise<string> => {
  try {
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      return imageData;
    } else if (imageData instanceof Blob) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageData);
      });
    }
    throw new Error('Invalid image data');
  } catch (error) {
    console.error('Error processing chat image:', error);
    throw error;
  }
};

/**
 * Delete avatar from Firebase Storage (Bypassed)
 * @param uid - User ID
 */
export const deleteAvatar = async (uid: string): Promise<void> => {
  // Do nothing since we save base64 directly in Firestore. 
  // It will be overwritten when user changes avatar.
  return Promise.resolve();
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

