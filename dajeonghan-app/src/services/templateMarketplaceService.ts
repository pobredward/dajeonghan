import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { SharedTemplate, TemplateCategory, TemplateReview, TemplateCreateInput } from '@/types/template.types';

export class TemplateMarketplaceService {
  /**
   * 인기 템플릿 조회 (사용 횟수 기준)
   */
  static async getPopularTemplates(limitCount: number = 20): Promise<SharedTemplate[]> {
    try {
      const q = query(
        collection(db, 'sharedTemplates'),
        where('isPublic', '==', true),
        orderBy('usageCount', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as SharedTemplate[];
    } catch (error) {
      console.error('Get popular templates error:', error);
      return [];
    }
  }

  /**
   * 최신 템플릿 조회
   */
  static async getRecentTemplates(limitCount: number = 20): Promise<SharedTemplate[]> {
    try {
      const q = query(
        collection(db, 'sharedTemplates'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as SharedTemplate[];
    } catch (error) {
      console.error('Get recent templates error:', error);
      return [];
    }
  }

  /**
   * 추천 템플릿 조회 (운영진 추천)
   */
  static async getFeaturedTemplates(): Promise<SharedTemplate[]> {
    try {
      const q = query(
        collection(db, 'sharedTemplates'),
        where('isPublic', '==', true),
        where('isFeatured', '==', true),
        orderBy('usageCount', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as SharedTemplate[];
    } catch (error) {
      console.error('Get featured templates error:', error);
      return [];
    }
  }

  /**
   * 카테고리별 템플릿 조회
   */
  static async getTemplatesByCategory(
    category: TemplateCategory,
    limitCount: number = 20
  ): Promise<SharedTemplate[]> {
    try {
      const q = query(
        collection(db, 'sharedTemplates'),
        where('isPublic', '==', true),
        where('category', '==', category),
        orderBy('likeCount', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as SharedTemplate[];
    } catch (error) {
      console.error('Get templates by category error:', error);
      return [];
    }
  }

  /**
   * 템플릿 검색 (태그 기반)
   */
  static async searchTemplates(searchQuery: string): Promise<SharedTemplate[]> {
    try {
      const q = query(
        collection(db, 'sharedTemplates'),
        where('isPublic', '==', true),
        where('tags', 'array-contains', searchQuery.toLowerCase())
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as SharedTemplate[];
    } catch (error) {
      console.error('Search templates error:', error);
      return [];
    }
  }

  /**
   * 템플릿 상세 조회
   */
  static async getTemplateById(templateId: string): Promise<SharedTemplate | null> {
    try {
      const docRef = doc(db, 'sharedTemplates', templateId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
      } as SharedTemplate;
    } catch (error) {
      console.error('Get template by id error:', error);
      return null;
    }
  }

  /**
   * 템플릿 생성
   */
  static async createTemplate(template: TemplateCreateInput): Promise<string> {
    try {
      const docRef = doc(collection(db, 'sharedTemplates'));
      
      await setDoc(docRef, {
        ...template,
        usageCount: 0,
        likeCount: 0,
        reviewCount: 0,
        averageRating: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Create template error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 좋아요
   */
  static async likeTemplate(templateId: string, userId: string): Promise<void> {
    try {
      const likeId = `${userId}_${templateId}`;
      const likeRef = doc(db, 'templateLikes', likeId);
      
      await setDoc(likeRef, {
        templateId,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      const templateRef = doc(db, 'sharedTemplates', templateId);
      await updateDoc(templateRef, {
        likeCount: increment(1)
      });
    } catch (error) {
      console.error('Like template error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 좋아요 취소
   */
  static async unlikeTemplate(templateId: string, userId: string): Promise<void> {
    try {
      const likeId = `${userId}_${templateId}`;
      const likeRef = doc(db, 'templateLikes', likeId);
      
      await deleteDoc(likeRef);
      
      const templateRef = doc(db, 'sharedTemplates', templateId);
      await updateDoc(templateRef, {
        likeCount: increment(-1)
      });
    } catch (error) {
      console.error('Unlike template error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 좋아요 상태 확인
   */
  static async checkIfLiked(templateId: string, userId: string): Promise<boolean> {
    try {
      const likeId = `${userId}_${templateId}`;
      const likeRef = doc(db, 'templateLikes', likeId);
      const likeSnap = await getDoc(likeRef);
      
      return likeSnap.exists();
    } catch (error) {
      console.error('Check if liked error:', error);
      return false;
    }
  }

  /**
   * 템플릿 적용 (usageCount 증가)
   */
  static async applyTemplate(
    templateId: string,
    userId: string
  ): Promise<void> {
    try {
      const usageRef = doc(collection(db, 'templateUsages'));
      await setDoc(usageRef, {
        templateId,
        userId,
        appliedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      const templateRef = doc(db, 'sharedTemplates', templateId);
      await updateDoc(templateRef, {
        usageCount: increment(1)
      });
    } catch (error) {
      console.error('Apply template error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 리뷰 작성
   */
  static async createReview(
    review: Omit<TemplateReview, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount'>
  ): Promise<string> {
    try {
      const docRef = doc(collection(db, 'templateReviews'));
      
      await setDoc(docRef, {
        ...review,
        helpfulCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      await this.updateTemplateRating(review.templateId);
      
      return docRef.id;
    } catch (error) {
      console.error('Create review error:', error);
      throw error;
    }
  }

  /**
   * 템플릿 평균 평점 재계산
   */
  private static async updateTemplateRating(templateId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'templateReviews'),
        where('templateId', '==', templateId)
      );
      
      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => doc.data());
      
      if (reviews.length === 0) {
        return;
      }
      
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      const templateRef = doc(db, 'sharedTemplates', templateId);
      await updateDoc(templateRef, {
        reviewCount: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10
      });
    } catch (error) {
      console.error('Update template rating error:', error);
    }
  }

  /**
   * 템플릿 리뷰 조회
   */
  static async getReviews(templateId: string, limitCount: number = 10): Promise<TemplateReview[]> {
    try {
      const q = query(
        collection(db, 'templateReviews'),
        where('templateId', '==', templateId),
        orderBy('helpfulCount', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as TemplateReview[];
    } catch (error) {
      console.error('Get reviews error:', error);
      return [];
    }
  }

  /**
   * 내가 생성한 템플릿 조회
   */
  static async getMyTemplates(userId: string): Promise<SharedTemplate[]> {
    try {
      const q = query(
        collection(db, 'sharedTemplates'),
        where('creatorId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as SharedTemplate[];
    } catch (error) {
      console.error('Get my templates error:', error);
      return [];
    }
  }
}
