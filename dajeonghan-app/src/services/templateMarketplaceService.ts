import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  SharedTemplate,
  SharedHouseLayout,
  SharedRoom,
  SharedFurniture,
  TemplateCategory,
  TemplateReview,
  TemplateCreateInput,
  TemplateSortOption,
  TemplateTask,
} from '@/types/template.types';
import { getHouseLayout } from '@/services/houseService';
import { getTasks } from '@/services/firestoreService';

export class TemplateMarketplaceService {
  /**
   * 객체에서 undefined 값을 재귀적으로 제거 (Firestore는 undefined 불허)
   */
  private static removeUndefined<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;
    if (Array.isArray(obj)) {
      return (obj as any[]).map(item => this.removeUndefined(item)) as any;
    }
    const result: any = {};
    for (const key of Object.keys(obj as any)) {
      const value = (obj as any)[key];
      if (value !== undefined) {
        result[key] = this.removeUndefined(value);
      }
    }
    return result;
  }

  /** Firestore 문서 → SharedTemplate 변환 헬퍼 */
  private static docToTemplate(d: any): SharedTemplate {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt),
    } as SharedTemplate;
  }

  /** Firestore Timestamp / Date / 숫자(밀리초) / undefined 모두 Date로 변환 */
  private static toDate(value: any): Date {
    if (!value) return new Date();
    if (typeof value.toDate === 'function') return value.toDate(); // Firestore Timestamp
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    return new Date();
  }

  /** 공개 템플릿 전체 조회 (클라이언트 정렬용) */
  private static async fetchPublicTemplates(): Promise<SharedTemplate[]> {
    const q = query(
      collection(db, 'sharedTemplates'),
      where('isPublic', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => this.docToTemplate(d));
  }

  /**
   * 인기 템플릿 조회 (likeCount 기준, 클라이언트 정렬)
   */
  static async getPopularTemplates(limitCount: number = 20): Promise<SharedTemplate[]> {
    try {
      const all = await this.fetchPublicTemplates();
      return all
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, limitCount);
    } catch (error) {
      console.error('Get popular templates error:', error);
      return [];
    }
  }

  /**
   * 최신 템플릿 조회 (클라이언트 정렬)
   */
  static async getRecentTemplates(limitCount: number = 20): Promise<SharedTemplate[]> {
    try {
      const all = await this.fetchPublicTemplates();
      return all
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limitCount);
    } catch (error) {
      console.error('Get recent templates error:', error);
      return [];
    }
  }

  /**
   * 추천 템플릿 조회 (클라이언트 필터+정렬)
   */
  static async getFeaturedTemplates(): Promise<SharedTemplate[]> {
    try {
      const all = await this.fetchPublicTemplates();
      return all
        .filter(t => t.isFeatured)
        .sort((a, b) => b.usageCount - a.usageCount);
    } catch (error) {
      console.error('Get featured templates error:', error);
      return [];
    }
  }

  /**
   * 카테고리별 템플릿 조회 (클라이언트 필터+정렬)
   */
  static async getTemplatesByCategory(
    category: TemplateCategory,
    limitCount: number = 20
  ): Promise<SharedTemplate[]> {
    try {
      const all = await this.fetchPublicTemplates();
      return all
        .filter(t => t.category === category)
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, limitCount);
    } catch (error) {
      console.error('Get templates by category error:', error);
      return [];
    }
  }

  /**
   * 템플릿 검색 — 태그 + 이름 클라이언트 필터
   */
  static async searchTemplates(searchQuery: string): Promise<SharedTemplate[]> {
    try {
      const all = await this.fetchPublicTemplates();
      const q = searchQuery.toLowerCase();
      return all.filter(
        t =>
          t.tags.some(tag => tag.includes(q)) ||
          t.name.toLowerCase().includes(q)
      );
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
      
      return this.docToTemplate(docSnap);
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
   * 템플릿 리뷰 조회 (클라이언트 정렬)
   */
  static async getReviews(templateId: string, limitCount: number = 10): Promise<TemplateReview[]> {
    try {
      const q = query(
        collection(db, 'templateReviews'),
        where('templateId', '==', templateId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: this.toDate(d.data().createdAt),
          updatedAt: this.toDate(d.data().updatedAt),
        }) as TemplateReview)
        .sort((a, b) => b.helpfulCount - a.helpfulCount)
        .slice(0, limitCount);
    } catch (error) {
      console.error('Get reviews error:', error);
      return [];
    }
  }

  /**
   * 내가 생성한 템플릿 조회 (클라이언트 정렬)
   */
  static async getMyTemplates(userId: string): Promise<SharedTemplate[]> {
    try {
      const q = query(
        collection(db, 'sharedTemplates'),
        where('creatorId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(d => this.docToTemplate(d))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Get my templates error:', error);
      return [];
    }
  }

  /**
   * 정렬 옵션별 템플릿 조회 (모두 클라이언트 정렬)
   */
  static async getTemplatesSorted(
    sort: TemplateSortOption,
    limitCount: number = 50,
    userId?: string
  ): Promise<SharedTemplate[]> {
    try {
      let list: SharedTemplate[];

      if (sort === 'mine' && userId) {
        list = await this.getMyTemplates(userId);
      } else {
        list = await this.fetchPublicTemplates();
        if (sort === 'popular') {
          list.sort((a, b) => b.likeCount - a.likeCount);
        } else if (sort === 'downloads') {
          list.sort((a, b) => b.usageCount - a.usageCount);
        } else {
          list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
      }

      return list.slice(0, limitCount);
    } catch (error) {
      console.error('Get templates sorted error:', error);
      return [];
    }
  }

  /**
   * 현재 유저의 배치도+업무 전체를 스냅샷으로 Firestore에 저장
   */
  static async createFullTemplate(
    userId: string,
    meta: {
      creatorName: string;
      creatorAvatar?: string;
      name: string;
      description: string;
      tags: string[];
      category: TemplateCategory;
      isPublic: boolean;
      selectedFurnitureIds?: string[];
    }
  ): Promise<string> {
    const layout = await getHouseLayout(userId);
    if (!layout) throw new Error('배치도가 없습니다.');

    const allTasks = await getTasks(userId);
    const taskMap = new Map(allTasks.map(t => [t.id, t]));

    const sharedRooms: SharedRoom[] = layout.rooms.map(room => {
      const sharedFurnitures: SharedFurniture[] = room.furnitures
        .filter(f =>
          !meta.selectedFurnitureIds ||
          meta.selectedFurnitureIds.includes(f.id)
        )
        .map(f => {
          const linkedTasks: TemplateTask[] = f.linkedTaskIds
            .map(taskId => {
              const t = taskMap.get(taskId);
              if (!t) return null;
              const {
                id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua,
                completionHistory: _ch, dirtyScore: _ds, urgencyScore: _us,
                isCompleted: _ic, completedAt: _cAt, lastCompletedAt: _lca,
                completionDates: _cd, ...rest
              } = t;
              const { nextDue: _nd, lastCompleted: _lc, ...recurrenceRest } = rest.recurrence;
              return this.removeUndefined({ ...rest, recurrence: recurrenceRest }) as TemplateTask;
            })
            .filter((t): t is TemplateTask => t !== null);

          // FurnitureMetadata에서 Date 필드 제거 (Firestore Timestamp와 혼용 불가)
          let sanitizedMetadata: typeof f.furnitureMetadata | undefined;
          if (f.furnitureMetadata) {
            const { ...meta } = f.furnitureMetadata as any;
            const dateKeys = ['lastCleaned', 'lastWatered', 'lastFertilized', 'lastSheetChange',
              'lastOrganized', 'lastOilChange', 'lastInspection', 'infantBirthDate'];
            dateKeys.forEach(k => { if (meta[k] instanceof Date) delete meta[k]; });
            sanitizedMetadata = meta;
          }

          return {
            type: f.type,
            name: f.name,
            emoji: f.emoji,
            position: f.position,
            size: f.size,
            rotation: f.rotation,
            ...(sanitizedMetadata && { furnitureMetadata: sanitizedMetadata }),
            tasks: linkedTasks,
          } as SharedFurniture;
        });

      return {
        type: room.type,
        name: room.name,
        position: room.position,
        size: room.size,
        color: room.color,
        furnitures: sharedFurnitures,
      } as SharedRoom;
    });

    const houseLayout: SharedHouseLayout = {
      layoutType: layout.layoutType,
      canvasSize: layout.canvasSize,
      rooms: sharedRooms,
      character: layout.character,
    };

    const docRef = doc(collection(db, 'sharedTemplates'));
    const payload = this.removeUndefined({
      creatorId: userId,
      creatorName: meta.creatorName,
      creatorAvatar: meta.creatorAvatar ?? null,
      name: meta.name,
      description: meta.description,
      tags: meta.tags,
      category: meta.category,
      isPublic: meta.isPublic,
      isFeatured: false,
      houseLayout,
      tasks: [],
      usageCount: 0,
      likeCount: 0,
      commentCount: 0,
      reviewCount: 0,
      averageRating: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await setDoc(docRef, payload);

    return docRef.id;
  }
}
