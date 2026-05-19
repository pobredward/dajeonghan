import {
  collection,
  doc,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { TemplateComment } from '@/types/template.types';

function toDate(value: any): Date {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return new Date();
}

export class TemplateCommentService {
  /**
   * 댓글 작성
   */
  static async addComment(
    templateId: string,
    userId: string,
    userName: string,
    content: string,
    userAvatar?: string
  ): Promise<TemplateComment> {
    try {
      const data: any = {
        templateId,
        userId,
        userName,
        content: content.trim(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      if (userAvatar) data.userAvatar = userAvatar;

      const ref = await addDoc(collection(db, 'templateComments'), data);

      await updateDoc(doc(db, 'sharedTemplates', templateId), {
        commentCount: increment(1),
      });

      return {
        id: ref.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as TemplateComment;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  }

  /**
   * 댓글 목록 조회 (클라이언트 최신순 정렬)
   */
  static async getComments(
    templateId: string,
    limitCount: number = 30
  ): Promise<TemplateComment[]> {
    try {
      const q = query(
        collection(db, 'templateComments'),
        where('templateId', '==', templateId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: toDate(d.data().createdAt),
          updatedAt: toDate(d.data().updatedAt),
        }) as TemplateComment)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limitCount);
    } catch (error) {
      console.error('Get comments error:', error);
      return [];
    }
  }

  /**
   * 댓글 삭제 (본인 댓글만)
   */
  static async deleteComment(
    commentId: string,
    templateId: string
  ): Promise<void> {
    try {
      await deleteDoc(doc(db, 'templateComments', commentId));
      await updateDoc(doc(db, 'sharedTemplates', templateId), {
        commentCount: increment(-1),
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  }
}
