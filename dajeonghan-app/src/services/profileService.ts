import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
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
  const sanitized = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  );
  await updateDoc(userRef, sanitized);
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
    username: data.username,
    displayName: data.displayName,
    photoURL: data.photoURL,
    bio: data.bio,
  };
};

export const getPublicProfileByUsername = async (username: string): Promise<PublicProfile | null> => {
  const usernameSnap = await getDoc(doc(db, `usernames/${username}`));
  if (!usernameSnap.exists()) return null;
  const { uid } = usernameSnap.data() as { uid: string };
  return getPublicProfile(uid);
};

// ============================================================================
// Username (아이디) 관리
// ============================================================================

/** 영소문자·숫자·언더스코어, 3~20자 */
export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const snap = await getDoc(doc(db, `usernames/${username}`));
  return !snap.exists();
};

/**
 * username 설정/변경 (배치 처리로 원자적 처리)
 * - users/{uid}.username 업데이트
 * - usernames/{newUsername} = { uid } 생성
 * - usernames/{oldUsername} 삭제 (이전 username이 있는 경우)
 */
export const setUsername = async (
  uid: string,
  newUsername: string,
  oldUsername?: string
): Promise<void> => {
  const batch = writeBatch(db);

  batch.update(doc(db, `users/${uid}`), { username: newUsername });
  batch.set(doc(db, `usernames/${newUsername}`), { uid });

  if (oldUsername && oldUsername !== newUsername) {
    batch.delete(doc(db, `usernames/${oldUsername}`));
  }

  await batch.commit();
};

/**
 * username 또는 displayName 접두어로 유저 검색
 * Firestore는 전문 검색 미지원이므로 startAt/endAt 범위 쿼리 사용
 */
export const searchUsersByUsername = async (queryStr: string): Promise<PublicProfile[]> => {
  if (!queryStr || queryStr.length < 1) return [];

  const normalized = queryStr.toLowerCase();
  const end = normalized + '\uf8ff';

  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    orderBy('username'),
    startAt(normalized),
    endAt(end)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      userId: d.id,
      username: data.username,
      displayName: data.displayName,
      photoURL: data.photoURL,
      bio: data.bio,
    } as PublicProfile;
  });
};

export const ProfileService = {
  updateProfile,
  uploadProfileImage,
  getPublicProfile,
  isUsernameAvailable,
  setUsername,
  searchUsersByUsername,
};
