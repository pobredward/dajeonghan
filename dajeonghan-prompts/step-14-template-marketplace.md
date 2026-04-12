# Step 14. 템플릿 마켓플레이스

> **🎯 목표**: 유저가 템플릿을 생성·공유·적용할 수 있는 커뮤니티 기능 구축

## 📌 단계 정보

**순서**: Step 14/15  
**Phase**: Phase 5 - 출시 (Launch)  
**의존성**: Step 02 (데이터 모델), Step 07 (온보딩), Step 12 (성장 전략) 완료 필수  
**예상 소요 시간**: 1-2일  
**난이도**: ⭐⭐⭐

### 이전 단계 요구사항
- ✅ Step 02 완료: 데이터 모델 정의
- ✅ Step 07 완료: 온보딩 시스템
- ✅ Step 12 완료: 성장 전략 기초

### 다음 단계
- **Step 15**: 테스트 및 배포 (최종 단계)

### 이 단계가 필요한 이유
- 바이럴 성장의 핵심 기능
- 사용자가 직접 콘텐츠 생성 → 네트워크 효과
- 온보딩 완료율 향상 (검증된 템플릿 제공)
- 커뮤니티 형성으로 리텐션 증가

---

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 유저가 현재 루틴을 템플릿으로 저장 가능
- ✅ 템플릿 마켓플레이스에서 탐색/검색 가능
- ✅ 템플릿 상세 페이지 (좋아요, 리뷰, 사용자 수)
- ✅ "내 루틴에 적용" 기능 (병합/교체 옵션)
- ✅ 딥링크로 템플릿 공유 가능
- ✅ 온보딩 단계에서 템플릿 선택 가능

**예상 소요 시간**: 1-2일

---

## 🚀 핵심 개념

### 템플릿 마켓플레이스의 가치

**문제**: 
- 사용자가 "어떻게 시작해야 할지" 막막함
- 기본 페르소나 6개로는 다양성 부족
- 커뮤니티 없이는 성장 한계

**해결책**:
- ✅ **크리에이터 이코노미**: 유저가 직접 템플릿 생성
- ✅ **검증된 템플릿**: 인기 템플릿 = 이미 검증됨
- ✅ **바이럴 루프**: 공유 → 신규 유입 → 또 공유
- ✅ **네트워크 효과**: 템플릿 많을수록 앱 가치 증가

### 핵심 지표

```
템플릿 생성률 = 활성 유저 중 템플릿 생성 비율
목표: 10% (100명 중 10명이 템플릿 생성)

템플릿 적용률 = 신규 유저 중 템플릿 적용 비율  
목표: 50% (온보딩 시 절반이 템플릿 선택)

공유율 = 템플릿 생성 후 공유 비율
목표: 80% (생성하면 대부분 공유)
```

---

## 1. 데이터 모델 확장

### SharedTemplate 타입 정의

`src/types/template.types.ts`:

```typescript
import { CleaningTask } from './cleaning.types';
import { FoodItem } from './fridge.types';
import { Medicine } from './medicine.types';

/**
 * 공유 템플릿 타입
 */
export interface SharedTemplate {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  
  // 템플릿 메타데이터
  name: string;
  description: string;
  tags: string[]; // ['미니멀', '주말', '빠른청소']
  category: TemplateCategory;
  thumbnail?: string; // 나중에 스크린샷 추가 가능
  
  // 템플릿 내용
  cleaningTasks: Omit<CleaningTask, 'userId' | 'id' | 'nextDue'>[]; // 템플릿이므로 userId 없음
  defaultFridgeItems?: Omit<FoodItem, 'userId' | 'id'>[];
  defaultMedicines?: Omit<Medicine, 'userId' | 'id'>[];
  
  // 통계
  usageCount: number; // 적용된 횟수
  likeCount: number;
  reviewCount: number;
  averageRating: number; // 0~5
  
  // 공개 설정
  isPublic: boolean;
  isFeatured: boolean; // 운영진 추천
  
  // 메타
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateCategory = 
  | 'student_living_alone'    // 학생 자취
  | 'worker_single'           // 직장인 1인
  | 'worker_roommate'         // 룸메이트
  | 'newlywed'                // 신혼
  | 'family_with_kids'        // 아이 있는 가족
  | 'pet_owner'               // 반려동물
  | 'minimalist'              // 미니멀리스트
  | 'weekend_warrior'         // 주말 집중형
  | 'custom';                 // 커스텀

/**
 * 템플릿 리뷰
 */
export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  
  rating: number; // 1-5
  comment: string;
  
  helpfulCount: number; // "도움이 됐어요" 카운트
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 템플릿 좋아요 (유저별)
 */
export interface TemplateLike {
  id: string;
  templateId: string;
  userId: string;
  createdAt: Date;
}

/**
 * 템플릿 사용 기록
 */
export interface TemplateUsage {
  id: string;
  templateId: string;
  userId: string;
  appliedAt: Date;
}
```

### 카테고리 상수

`src/constants/TemplateCategories.ts`:

```typescript
export const TEMPLATE_CATEGORIES = [
  {
    id: 'student_living_alone',
    name: '학생 자취',
    icon: '🎓',
    description: '혼자 사는 대학생을 위한 템플릿'
  },
  {
    id: 'worker_single',
    name: '직장인 1인',
    icon: '💼',
    description: '바쁜 직장인의 효율적인 루틴'
  },
  {
    id: 'worker_roommate',
    name: '룸메이트',
    icon: '👥',
    description: '함께 사는 룸메이트와 분담'
  },
  {
    id: 'newlywed',
    name: '신혼',
    icon: '💑',
    description: '신혼부부의 새로운 시작'
  },
  {
    id: 'family_with_kids',
    name: '아이 있는 가족',
    icon: '👨‍👩‍👧',
    description: '아이와 함께하는 가족 루틴'
  },
  {
    id: 'pet_owner',
    name: '반려동물',
    icon: '🐕',
    description: '반려동물과 함께하는 생활'
  },
  {
    id: 'minimalist',
    name: '미니멀리스트',
    icon: '✨',
    description: '최소한의 관리로 깔끔하게'
  },
  {
    id: 'weekend_warrior',
    name: '주말 집중형',
    icon: '⚡',
    description: '주말에 몰아서 하는 루틴'
  },
  {
    id: 'custom',
    name: '커스텀',
    icon: '🎨',
    description: '나만의 특별한 루틴'
  }
] as const;
```

---

## 2. 템플릿 서비스

### TemplateMarketplaceService

`src/services/templateMarketplaceService.ts`:

```typescript
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
  increment,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { SharedTemplate, TemplateCategory, TemplateReview } from '@/types/template.types';

export class TemplateMarketplaceService {
  /**
   * 인기 템플릿 조회 (사용 횟수 기준)
   */
  static async getPopularTemplates(limitCount: number = 20): Promise<SharedTemplate[]> {
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
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as SharedTemplate[];
  }

  /**
   * 최신 템플릿 조회
   */
  static async getRecentTemplates(limitCount: number = 20): Promise<SharedTemplate[]> {
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
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as SharedTemplate[];
  }

  /**
   * 추천 템플릿 조회 (운영진 추천)
   */
  static async getFeaturedTemplates(): Promise<SharedTemplate[]> {
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
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as SharedTemplate[];
  }

  /**
   * 카테고리별 템플릿 조회
   */
  static async getTemplatesByCategory(
    category: TemplateCategory,
    limitCount: number = 20
  ): Promise<SharedTemplate[]> {
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
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as SharedTemplate[];
  }

  /**
   * 템플릿 검색 (이름, 설명, 태그)
   */
  static async searchTemplates(searchQuery: string): Promise<SharedTemplate[]> {
    // Firestore는 full-text search가 약하므로 Algolia/Meilisearch 권장
    // 여기서는 간단히 태그 매칭만 구현
    const q = query(
      collection(db, 'sharedTemplates'),
      where('isPublic', '==', true),
      where('tags', 'array-contains', searchQuery.toLowerCase())
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as SharedTemplate[];
  }

  /**
   * 템플릿 상세 조회
   */
  static async getTemplateById(templateId: string): Promise<SharedTemplate | null> {
    const docRef = doc(db, 'sharedTemplates', templateId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt.toDate(),
      updatedAt: docSnap.data().updatedAt.toDate()
    } as SharedTemplate;
  }

  /**
   * 템플릿 생성
   */
  static async createTemplate(template: Omit<SharedTemplate, 'id'>): Promise<string> {
    const docRef = doc(collection(db, 'sharedTemplates'));
    
    await setDoc(docRef, {
      ...template,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return docRef.id;
  }

  /**
   * 템플릿 좋아요
   */
  static async likeTemplate(templateId: string, userId: string): Promise<void> {
    const likeId = `${userId}_${templateId}`;
    const likeRef = doc(db, 'templateLikes', likeId);
    
    // 좋아요 기록 생성
    await setDoc(likeRef, {
      templateId,
      userId,
      createdAt: Timestamp.now()
    });
    
    // 템플릿 likeCount 증가
    const templateRef = doc(db, 'sharedTemplates', templateId);
    await updateDoc(templateRef, {
      likeCount: increment(1)
    });
  }

  /**
   * 템플릿 좋아요 취소
   */
  static async unlikeTemplate(templateId: string, userId: string): Promise<void> {
    const likeId = `${userId}_${templateId}`;
    const likeRef = doc(db, 'templateLikes', likeId);
    
    // 좋아요 기록 삭제
    await deleteDoc(likeRef);
    
    // 템플릿 likeCount 감소
    const templateRef = doc(db, 'sharedTemplates', templateId);
    await updateDoc(templateRef, {
      likeCount: increment(-1)
    });
  }

  /**
   * 템플릿 적용 (usageCount 증가)
   */
  static async applyTemplate(
    templateId: string,
    userId: string
  ): Promise<void> {
    // 사용 기록 생성
    const usageRef = doc(collection(db, 'templateUsages'));
    await setDoc(usageRef, {
      templateId,
      userId,
      appliedAt: Timestamp.now()
    });
    
    // 템플릿 usageCount 증가
    const templateRef = doc(db, 'sharedTemplates', templateId);
    await updateDoc(templateRef, {
      usageCount: increment(1)
    });
  }

  /**
   * 템플릿 리뷰 작성
   */
  static async createReview(
    review: Omit<TemplateReview, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const docRef = doc(collection(db, 'templateReviews'));
    
    await setDoc(docRef, {
      ...review,
      helpfulCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // 템플릿 reviewCount 증가 및 평균 평점 재계산
    await this.updateTemplateRating(review.templateId);
    
    return docRef.id;
  }

  /**
   * 템플릿 평균 평점 재계산
   */
  private static async updateTemplateRating(templateId: string): Promise<void> {
    const q = query(
      collection(db, 'templateReviews'),
      where('templateId', '==', templateId)
    );
    
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => doc.data());
    
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    const templateRef = doc(db, 'sharedTemplates', templateId);
    await updateDoc(templateRef, {
      reviewCount: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10 // 소수점 1자리
    });
  }

  /**
   * 템플릿 리뷰 조회
   */
  static async getReviews(templateId: string, limitCount: number = 10): Promise<TemplateReview[]> {
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
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as TemplateReview[];
  }
}
```

---

## 3. 템플릿 생성 화면

`src/screens/templates/CreateTemplateScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  Switch,
  Alert,
  Share
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TaskSelector } from '@/components/TaskSelector';
import { Colors, Typography, Spacing } from '@/constants';
import { TEMPLATE_CATEGORIES } from '@/constants/TemplateCategories';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { TemplateSharingService } from '@/services/templateSharingService';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { SharedTemplate, TemplateCategory } from '@/types/template.types';

export const CreateTemplateScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const { tasks } = useTasks(currentUser?.uid);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('custom');
  const [tags, setTags] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    // 유효성 검사
    if (!name.trim()) {
      Alert.alert('오류', '템플릿 이름을 입력해주세요.');
      return;
    }
    
    if (selectedTaskIds.length === 0) {
      Alert.alert('오류', '최소 1개 이상의 테스크를 선택해주세요.');
      return;
    }

    setIsCreating(true);

    try {
      // 선택된 테스크 가져오기
      const selectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id));
      
      // 템플릿 객체 생성
      const template: Omit<SharedTemplate, 'id'> = {
        creatorId: currentUser!.uid,
        creatorName: currentUser!.displayName || '익명',
        creatorAvatar: currentUser!.photoURL || undefined,
        
        name: name.trim(),
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t),
        category,
        
        // userId, id, nextDue 제거
        cleaningTasks: selectedTasks.map(({ userId, id, nextDue, ...rest }) => rest),
        
        usageCount: 0,
        likeCount: 0,
        reviewCount: 0,
        averageRating: 0,
        
        isPublic,
        isFeatured: false,
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Firestore에 저장
      const templateId = await TemplateMarketplaceService.createTemplate(template);

      // 공유 링크 생성
      const shareLink = await TemplateSharingService.generateShareLink(templateId);
      
      // 성공 메시지
      Alert.alert(
        '템플릿 생성 완료! 🎉',
        '이제 다른 사람들과 공유할 수 있습니다.',
        [
          {
            text: '공유하기',
            onPress: () => handleShare(shareLink)
          },
          {
            text: '나중에',
            style: 'cancel',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Template creation error:', error);
      Alert.alert('오류', '템플릿 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleShare = async (link: string) => {
    try {
      await Share.share({
        message: `"${name}" 템플릿을 공유합니다! 다정한 앱에서 바로 적용하세요 ✨\n\n${link}`,
        url: link
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>기본 정보</Text>
        
        <Text style={styles.label}>템플릿 이름 *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="예: 미니멀리스트 주말 청소"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.label}>설명</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="이 템플릿에 대해 설명해주세요"
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>카테고리</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(value) => setCategory(value as TemplateCategory)}
            style={styles.picker}
          >
            {TEMPLATE_CATEGORIES.map(cat => (
              <Picker.Item 
                key={cat.id} 
                label={`${cat.icon} ${cat.name}`} 
                value={cat.id} 
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>태그 (쉼표로 구분)</Text>
        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder="예: 미니멀, 주말, 빠른청소"
          placeholderTextColor={Colors.textSecondary}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>포함할 테스크 선택 *</Text>
        <Text style={styles.hint}>
          현재 내 루틴에서 공유하고 싶은 테스크를 선택하세요
        </Text>
        
        <TaskSelector
          tasks={tasks}
          selectedIds={selectedTaskIds}
          onSelectionChange={setSelectedTaskIds}
        />
      </Card>

      <Card style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.label}>공개 템플릿으로 만들기</Text>
            <Text style={styles.hint}>
              다른 사람들이 이 템플릿을 볼 수 있습니다
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: Colors.lightGray, true: Colors.primary }}
          />
        </View>
      </Card>

      <Button
        title={isCreating ? '생성 중...' : '템플릿 생성하기'}
        onPress={handleCreate}
        disabled={isCreating}
        style={styles.createButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  card: {
    margin: Spacing.md,
    marginBottom: 0
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md
  },
  label: {
    ...Typography.bodyBold,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm
  },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.sm,
    backgroundColor: Colors.white
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    backgroundColor: Colors.white,
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  hint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  switchLabel: {
    flex: 1,
    marginRight: Spacing.md
  },
  createButton: {
    margin: Spacing.md
  }
});
```

---

## 4. 템플릿 마켓플레이스 화면

`src/screens/templates/TemplateMarketplaceScreen.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FAB } from '@/components/FAB';
import { TemplateCard } from '@/components/TemplateCard';
import { Colors, Typography, Spacing } from '@/constants';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { SharedTemplate } from '@/types/template.types';

type TabType = 'featured' | 'popular' | 'recent';

export const TemplateMarketplaceScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [activeTab, setActiveTab] = useState<TabType>('featured');
  const [templates, setTemplates] = useState<SharedTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [activeTab]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    
    try {
      let result: SharedTemplate[] = [];
      
      switch (activeTab) {
        case 'featured':
          result = await TemplateMarketplaceService.getFeaturedTemplates();
          break;
        case 'popular':
          result = await TemplateMarketplaceService.getPopularTemplates();
          break;
        case 'recent':
          result = await TemplateMarketplaceService.getRecentTemplates();
          break;
      }
      
      setTemplates(result);
    } catch (error) {
      console.error('Fetch templates error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTemplates();
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await TemplateMarketplaceService.searchTemplates(searchQuery);
      setTemplates(result);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplatePress = (template: SharedTemplate) => {
    navigation.navigate('TemplateDetail', { templateId: template.id });
  };

  return (
    <View style={styles.container}>
      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="템플릿 검색..."
          placeholderTextColor={Colors.textSecondary}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* 탭바 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'featured' && styles.activeTab]}
          onPress={() => setActiveTab('featured')}
        >
          <Text style={[styles.tabText, activeTab === 'featured' && styles.activeTabText]}>
            ⭐ 추천
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'popular' && styles.activeTab]}
          onPress={() => setActiveTab('popular')}
        >
          <Text style={[styles.tabText, activeTab === 'popular' && styles.activeTabText]}>
            🔥 인기
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
            🆕 최신
          </Text>
        </TouchableOpacity>
      </View>

      {/* 템플릿 리스트 */}
      <FlatList
        data={templates}
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            onPress={() => handleTemplatePress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={fetchTemplates}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다' : '템플릿이 없습니다'}
            </Text>
          </View>
        }
      />

      {/* 템플릿 생성 버튼 */}
      <FAB
        icon="+"
        label="내 템플릿 만들기"
        onPress={() => navigation.navigate('CreateTemplate')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  searchContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray
  },
  searchInput: {
    ...Typography.body,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    paddingLeft: Spacing.md
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: Colors.primary
  },
  tabText: {
    ...Typography.body,
    color: Colors.textSecondary
  },
  activeTabText: {
    ...Typography.bodyBold,
    color: Colors.primary
  },
  listContent: {
    padding: Spacing.md
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center'
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary
  }
});
```

계속해서 템플릿 상세 화면과 나머지 컴포넌트들을 작성하겠습니다...

---

## 5. 템플릿 상세 화면

`src/screens/templates/TemplateDetailScreen.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Alert,
  Share as RNShare
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ReviewList } from '@/components/ReviewList';
import { Colors, Typography, Spacing } from '@/constants';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { TemplateSharingService } from '@/services/templateSharingService';
import { useAuth } from '@/hooks/useAuth';
import { SharedTemplate } from '@/types/template.types';

export const TemplateDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  
  const { templateId } = route.params as { templateId: string };
  
  const [template, setTemplate] = useState<SharedTemplate | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const result = await TemplateMarketplaceService.getTemplateById(templateId);
      setTemplate(result);
    } catch (error) {
      console.error('Fetch template error:', error);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      Alert.alert('로그인 필요', '좋아요 기능을 사용하려면 로그인이 필요합니다.');
      return;
    }

    try {
      if (isLiked) {
        await TemplateMarketplaceService.unlikeTemplate(templateId, currentUser.uid);
        setIsLiked(false);
        setTemplate(prev => prev ? { ...prev, likeCount: prev.likeCount - 1 } : null);
      } else {
        await TemplateMarketplaceService.likeTemplate(templateId, currentUser.uid);
        setIsLiked(true);
        setTemplate(prev => prev ? { ...prev, likeCount: prev.likeCount + 1 } : null);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleApply = async () => {
    if (!currentUser) {
      Alert.alert('로그인 필요', '템플릿 적용을 하려면 로그인이 필요합니다.');
      return;
    }

    Alert.alert(
      '템플릿 적용',
      '이 템플릿을 내 루틴에 어떻게 적용할까요?',
      [
        {
          text: '기존 루틴과 병합',
          onPress: () => applyTemplate('merge')
        },
        {
          text: '기존 루틴 교체',
          onPress: () => applyTemplate('replace'),
          style: 'destructive'
        },
        {
          text: '취소',
          style: 'cancel'
        }
      ]
    );
  };

  const applyTemplate = async (mode: 'merge' | 'replace') => {
    if (!template || !currentUser) return;

    setIsApplying(true);

    try {
      // 템플릿 적용 로직 (Step 07의 OnboardingService 활용)
      await TemplateMarketplaceService.applyTemplate(templateId, currentUser.uid);
      
      // TODO: 실제 테스크 생성 로직 구현
      
      Alert.alert(
        '적용 완료! 🎉',
        '템플릿이 내 루틴에 추가되었습니다.',
        [
          {
            text: '확인',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (error) {
      console.error('Apply template error:', error);
      Alert.alert('오류', '템플릿 적용 중 오류가 발생했습니다.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleShare = async () => {
    if (!template) return;

    try {
      const shareLink = await TemplateSharingService.generateShareLink(templateId);
      
      await RNShare.share({
        message: `"${template.name}" 템플릿을 공유합니다! 다정한 앱에서 바로 적용하세요 ✨\n\n${shareLink}`,
        url: shareLink
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (!template) {
    return (
      <View style={styles.loadingContainer}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <Card style={styles.headerCard}>
        <Text style={styles.title}>{template.name}</Text>
        <Text style={styles.description}>{template.description}</Text>
        
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>👤</Text>
            <Text style={styles.metaText}>{template.creatorName}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📌</Text>
            <Text style={styles.metaText}>{template.usageCount}명 사용</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⭐</Text>
            <Text style={styles.metaText}>
              {template.averageRating > 0 ? template.averageRating.toFixed(1) : '-'}
            </Text>
          </View>
        </View>

        {/* 태그 */}
        {template.tags.length > 0 && (
          <View style={styles.tags}>
            {template.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 액션 버튼 */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.likeButton, isLiked && styles.likedButton]}
            onPress={handleLike}
          >
            <Text style={styles.likeIcon}>{isLiked ? '❤️' : '🤍'}</Text>
            <Text style={styles.likeText}>{template.likeCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareIcon}>📤</Text>
            <Text style={styles.shareText}>공유</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* 포함된 테스크 */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>포함된 테스크</Text>
        {template.cleaningTasks.map((task, index) => (
          <View key={index} style={styles.taskItem}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskMeta}>
              {task.estimatedMinutes}분 · {task.recurrence.type === 'daily' ? '매일' : 
               task.recurrence.type === 'weekly' ? '매주' : 
               `${task.recurrence.intervalDays}일마다`}
            </Text>
          </View>
        ))}
      </Card>

      {/* 리뷰 */}
      <Card style={styles.card}>
        <View style={styles.reviewHeader}>
          <Text style={styles.sectionTitle}>리뷰</Text>
          <TouchableOpacity onPress={() => navigation.navigate('WriteReview', { templateId })}>
            <Text style={styles.writeReviewText}>리뷰 작성</Text>
          </TouchableOpacity>
        </View>
        
        <ReviewList templateId={templateId} />
      </Card>

      {/* 적용 버튼 */}
      <View style={styles.applyButtonContainer}>
        <Button
          title={isApplying ? '적용 중...' : '내 루틴에 적용하기'}
          onPress={handleApply}
          disabled={isApplying}
          fullWidth
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerCard: {
    margin: Spacing.md
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.sm
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md
  },
  meta: {
    flexDirection: 'row',
    marginBottom: Spacing.md
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 4
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md
  },
  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs
  },
  tagText: {
    ...Typography.caption,
    color: Colors.primary
  },
  actions: {
    flexDirection: 'row'
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginRight: Spacing.sm
  },
  likedButton: {
    backgroundColor: '#FFE5E5'
  },
  likeIcon: {
    fontSize: 20,
    marginRight: Spacing.xs
  },
  likeText: {
    ...Typography.bodyBold
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8
  },
  shareIcon: {
    fontSize: 20,
    marginRight: Spacing.xs
  },
  shareText: {
    ...Typography.bodyBold
  },
  card: {
    margin: Spacing.md,
    marginTop: 0
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md
  },
  taskItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray
  },
  taskTitle: {
    ...Typography.bodyBold,
    marginBottom: 4
  },
  taskMeta: {
    ...Typography.caption,
    color: Colors.textSecondary
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  writeReviewText: {
    ...Typography.body,
    color: Colors.primary
  },
  applyButtonContainer: {
    padding: Spacing.md
  }
});
```

---

## 6. 필수 컴포넌트

### TemplateCard 컴포넌트

`src/components/TemplateCard.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SharedTemplate } from '@/types/template.types';
import { Colors, Typography, Spacing } from '@/constants';
import { TEMPLATE_CATEGORIES } from '@/constants/TemplateCategories';

interface Props {
  template: SharedTemplate;
  onPress?: () => void;
  compact?: boolean;
}

export const TemplateCard: React.FC<Props> = ({ template, onPress, compact = false }) => {
  const category = TEMPLATE_CATEGORIES.find(c => c.id === template.category);
  
  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{category?.icon || '📋'}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {template.name}
          </Text>
          <Text style={styles.creator} numberOfLines={1}>
            by {template.creatorName}
          </Text>
        </View>
      </View>
      
      {!compact && (
        <Text style={styles.description} numberOfLines={2}>
          {template.description}
        </Text>
      )}
      
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statIcon}>👤</Text>
          <Text style={styles.statText}>{template.usageCount}</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statText}>{template.likeCount}</Text>
        </View>
        
        {template.averageRating > 0 && (
          <View style={styles.stat}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statText}>{template.averageRating.toFixed(1)}</Text>
          </View>
        )}
        
        <View style={styles.stat}>
          <Text style={styles.statIcon}>📝</Text>
          <Text style={styles.statText}>{template.cleaningTasks.length}</Text>
        </View>
      </View>
      
      {template.tags.length > 0 && (
        <View style={styles.tags}>
          {template.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  compactCard: {
    padding: Spacing.sm
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  icon: {
    fontSize: 32,
    marginRight: Spacing.sm
  },
  headerText: {
    flex: 1
  },
  title: {
    ...Typography.h4,
    marginBottom: 2
  },
  creator: {
    ...Typography.caption,
    color: Colors.textSecondary
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20
  },
  stats: {
    flexDirection: 'row',
    marginBottom: Spacing.sm
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4
  },
  statText: {
    ...Typography.caption,
    color: Colors.textSecondary
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs
  },
  tagText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primary
  }
});
```

---

## 7. 추가 유틸리티 함수

`src/utils/templateUtils.ts`:

```typescript
import { SharedTemplate } from '@/types/template.types';

/**
 * 태그에서 자동 추출
 */
export function extractTags(description: string): string[] {
  const words = description.toLowerCase().split(/\s+/);
  
  const keywords = [
    '미니멀', '주말', '빠른', '청소', '정리',
    '대학생', '직장인', '가족', '1인', '룸메'
  ];
  
  return keywords.filter(keyword => 
    words.some(word => word.includes(keyword))
  );
}

/**
 * 템플릿 유사도 계산 (추천용)
 */
export function calculateTemplateSimilarity(
  template1: SharedTemplate,
  template2: SharedTemplate
): number {
  let score = 0;
  
  // 카테고리 같으면 +3
  if (template1.category === template2.category) {
    score += 3;
  }
  
  // 공통 태그 개수만큼 +1
  const commonTags = template1.tags.filter(tag => 
    template2.tags.includes(tag)
  );
  score += commonTags.length;
  
  return score;
}

/**
 * 템플릿 검색 점수 계산
 */
export function calculateSearchScore(
  template: SharedTemplate,
  query: string
): number {
  const lowerQuery = query.toLowerCase();
  let score = 0;
  
  // 이름에 정확히 포함: +10
  if (template.name.toLowerCase().includes(lowerQuery)) {
    score += 10;
  }
  
  // 설명에 포함: +5
  if (template.description.toLowerCase().includes(lowerQuery)) {
    score += 5;
  }
  
  // 태그에 포함: +3
  if (template.tags.some(tag => tag.includes(lowerQuery))) {
    score += 3;
  }
  
  // 인기도 보정
  score += Math.log10(template.usageCount + 1);
  
  return score;
}
```

---

## 8. 테스트 체크리스트

### 기능 테스트

- [ ] 템플릿 생성 가능
- [ ] 템플릿 이름, 설명, 카테고리, 태그 입력 가능
- [ ] 테스크 선택 가능
- [ ] 공개/비공개 설정 가능
- [ ] 생성 후 공유 링크 생성
- [ ] 템플릿 마켓플레이스 접근 가능
- [ ] 추천/인기/최신 탭 전환
- [ ] 검색 기능 작동
- [ ] 템플릿 카드 클릭 시 상세 페이지 이동
- [ ] 템플릿 상세에서 좋아요 가능
- [ ] 템플릿 상세에서 공유 가능
- [ ] 템플릿 적용 (병합/교체) 가능
- [ ] 리뷰 작성 가능
- [ ] 온보딩에서 템플릿 선택 가능
- [ ] 딥링크로 템플릿 열기 가능

### 데이터 검증

- [ ] Firestore에 sharedTemplates 컬렉션 생성
- [ ] Security Rules 작동 (공개 템플릿만 읽기 가능)
- [ ] 인덱스 자동 생성 또는 수동 생성
- [ ] usageCount, likeCount 자동 증가
- [ ] 템플릿 적용 시 usageCount 증가 확인

### UI/UX 테스트

- [ ] 템플릿 카드 디자인 일관성
- [ ] 로딩 상태 표시
- [ ] 빈 상태 메시지
- [ ] 에러 핸들링 (Alert)
- [ ] 60fps 유지

---

## 9. 문제 해결

### Q1: Firestore 인덱스 오류

```
The query requires an index. You can create it here: https://...
```

**해결**:
1. 오류 메시지의 링크 클릭
2. Firebase Console에서 인덱스 생성
3. 또는 `firestore.indexes.json` 수동 배포:

```bash
firebase deploy --only firestore:indexes
```

### Q2: 템플릿 검색이 느림

Firestore의 full-text search는 제한적입니다.

**해결**:
1. **Algolia** 또는 **Meilisearch** 통합
2. Cloud Functions에서 템플릿 생성 시 자동 인덱싱
3. 클라이언트에서 Algolia API 호출

### Q3: 템플릿 적용 시 중복 테스크

**해결**:
1. 적용 전 기존 테스크와 비교
2. 중복 확인 로직 추가
3. 사용자에게 선택 옵션 제공

---

## 10. 다음 단계

- **Step 13**: 최종 배포
  - 전체 기능 통합 테스트
  - EAS Build
  - 스토어 제출

---

## 참고 자료

- [Firebase Deep Linking](https://firebase.google.com/docs/dynamic-links)
- [Expo Linking](https://docs.expo.dev/guides/linking/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**축하합니다! 🎉**

템플릿 마켓플레이스 구현이 완료되었습니다. 이제 사용자들이 직접 템플릿을 생성하고 공유하여 커뮤니티를 형성할 수 있습니다.

**다음**: [step-13-deployment.md](./step-13-deployment.md)로 이동하여 최종 배포를 진행하세요!