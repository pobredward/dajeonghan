import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { PublicProfile } from '../types/user.types';

// ============================================================================
// 프로필 업데이트
// ============================================================================

export interface ProfileUpdatePayload {
  displayName?: string;
  bio?: string;
  photoURL?: string;
}

export const updateProfile = async (
  uid: string,
  payload: ProfileUpdatePayload
): Promise<void> => {
  const userRef = doc(db, `users/${uid}`);
  await updateDoc(userRef, payload);
};

// ============================================================================
// 프로필 이미지 업로드
// ============================================================================

export const uploadProfileImage = async (
  uid: string,
  localUri: string
): Promise<string> => {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const storageRef = ref(storage, `profile_images/${uid}.jpg`);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });

  const downloadURL = await getDownloadURL(storageRef);
  await updateDoc(doc(db, `users/${uid}`), { photoURL: downloadURL });

  return downloadURL;
};

// ============================================================================
// 공개 프로필 조회
// ============================================================================

export const getPublicProfile = async (uid: string): Promise<PublicProfile | null> => {
  const snap = await getDoc(doc(db, `users/${uid}`));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    userId: uid,
    displayName: data.displayName,
    photoURL: data.photoURL,
    bio: data.bio,
  };
};

export const ProfileService = {
  updateProfile,
  uploadProfileImage,
  getPublicProfile,
};
