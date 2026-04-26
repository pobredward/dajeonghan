import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  increment,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PublicProfile } from '../types/user.types';

// ============================================================================
// 팔로우 / 언팔로우
// ============================================================================

export const followUser = async (myUid: string, targetUid: string): Promise<void> => {
  if (myUid === targetUid) return;

  const followingRef = doc(db, `users/${myUid}/following/${targetUid}`);
  const followerRef = doc(db, `users/${targetUid}/followers/${myUid}`);

  await Promise.all([
    setDoc(followingRef, { createdAt: serverTimestamp() }),
    setDoc(followerRef, { createdAt: serverTimestamp() }),
    updateDoc(doc(db, `users/${myUid}`), { followingCount: increment(1) }),
    updateDoc(doc(db, `users/${targetUid}`), { followersCount: increment(1) }),
  ]);
};

export const unfollowUser = async (myUid: string, targetUid: string): Promise<void> => {
  const followingRef = doc(db, `users/${myUid}/following/${targetUid}`);
  const followerRef = doc(db, `users/${targetUid}/followers/${myUid}`);

  await Promise.all([
    deleteDoc(followingRef),
    deleteDoc(followerRef),
    updateDoc(doc(db, `users/${myUid}`), { followingCount: increment(-1) }),
    updateDoc(doc(db, `users/${targetUid}`), { followersCount: increment(-1) }),
  ]);
};

// ============================================================================
// 팔로우 여부 확인
// ============================================================================

export const isFollowing = async (myUid: string, targetUid: string): Promise<boolean> => {
  const ref = doc(db, `users/${myUid}/following/${targetUid}`);
  const snap = await getDoc(ref);
  return snap.exists();
};

// ============================================================================
// 팔로워 / 팔로잉 목록 조회
// ============================================================================

const resolvePublicProfile = async (uid: string): Promise<PublicProfile> => {
  const snap = await getDoc(doc(db, `users/${uid}`));
  if (snap.exists()) {
    const data = snap.data();
    return {
      userId: uid,
      displayName: data.displayName,
      photoURL: data.photoURL,
      bio: data.bio,
    };
  }
  return { userId: uid };
};

export const getFollowers = async (uid: string): Promise<PublicProfile[]> => {
  const colRef = collection(db, `users/${uid}/followers`);
  const snap = await getDocs(colRef);
  return Promise.all(snap.docs.map((d) => resolvePublicProfile(d.id)));
};

export const getFollowing = async (uid: string): Promise<PublicProfile[]> => {
  const colRef = collection(db, `users/${uid}/following`);
  const snap = await getDocs(colRef);
  return Promise.all(snap.docs.map((d) => resolvePublicProfile(d.id)));
};

export const FollowService = {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing,
};
