# Step 04-04. 자기관리 모듈 구현

> **🎯 목표**: "오늘 할 자기관리"를 자동으로 추천하는 스마트 그루밍 관리 시스템 구현

## 📌 단계 정보

**순서**: Step 04-04/12  
**Phase**: Phase 2 - 기능 모듈 (Features)  
**의존성**: Step 03 완료 필수  
**병렬 가능**: Step 04-01, 04-02, 04-03과 동시 진행 가능  
**예상 소요 시간**: 1.5-2일  
**난이도**: ⭐⭐⭐

### 이전 단계 요구사항
- ✅ Step 03 완료: 공통 엔진 (RecurrenceEngine, PriorityCalculator 등)

### 다음 단계
- **Step 05**: 온보딩 시스템 (Step 04-01~04-05 완료 후)

### 병렬 진행 가능
- Step 04-01 (청소 모듈)과 동시 진행 가능
- Step 04-02 (냉장고 모듈)과 동시 진행 가능
- Step 04-03 (약 모듈)과 동시 진행 가능
- 서로 독립적이므로 충돌 없음

### 이 단계가 필요한 이유
- 경쟁 우위 확보 (경쟁 앱은 청소/가사만 집중)
- 타겟 확대 (전 연령대)
- 한국 그루밍 문화 반영 (2026년 시장 규모 1조 5천억원)
- 외부 서비스 제휴 기회 (미용실, 네일샵)

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 5개 카테고리별 자기관리 객체 생성 및 관리 가능
- ✅ 성별 맞춤형 템플릿 작동 (남성/여성/논바이너리)
- ✅ 외부 서비스 예약 정보 관리
- ✅ 부위별 제모 관리
- ✅ 자기관리 화면에서 완료/미루기 작동

**예상 소요 시간**: 1.5-2일

---

## 🧖 핵심 개념

### 자기관리 모듈의 차별화

**다정한의 자기관리 모듈은 단순 리마인더가 아닙니다**:

1. **한국 문화 반영**: 2026년 그루밍 트렌드 (남성 제모 보편화, 스킨케어 일상화)
2. **성별 맞춤형**: 남성/여성/논바이너리에 따른 다른 추천
3. **외부 서비스 통합**: 미용실, 네일샵, 왁싱샵 예약 정보 관리
4. **부위별 세밀 관리**: 제모 부위별 다른 주기

### 주요 기능

- **5개 카테고리**: 피부관리, 신체관리, 제모, 헤어관리, 도구관리
- **40+ 세부 항목**: 세안, 각질제거, 손톱정리, 코털제거, 제모 등
- **주기별 자동화**: 일일/주간/격주/월간 주기 자동 계산
- **외부 서비스 연동**: 예약 날짜, 장소, 연락처 관리

---

## 데이터 확장

`src/modules/self-care/types.ts`:

```typescript
import { Task, LifeObject } from '@/types/task.types';

export interface SelfCareObject extends LifeObject {
  type: 'self_care';
  metadata: SelfCareMetadata;
}

export interface SelfCareMetadata {
  category: SelfCareCategory;
  subcategory: string; // '세안', '손톱정리', '다리제모' 등
  
  // 부위별 관리 (제모 전용)
  bodyPart?: BodyPart;
  
  // 예상 소요 시간
  estimatedMinutes: number;
  
  // 필요한 도구/제품
  requiredProducts?: string[]; // ['클렌저', '토너', '보습제']
  
  // 외부 서비스 필요 여부
  requiresService: boolean; // 미용실, 네일샵, 왁싱샵 등
  
  // 서비스 정보
  serviceInfo?: ServiceInfo;
  
  // 성별 맞춤 (선택사항)
  gender?: 'male' | 'female' | 'non_binary' | 'all';
  
  // 마지막 수행 날짜
  lastPerformed?: Date;
  
  // 다음 예정일
  nextDue?: Date;
}

export type SelfCareCategory = 
  | 'skincare'        // 피부관리
  | 'body_care'       // 신체관리
  | 'hair_removal'    // 제모
  | 'hair_care'       // 헤어관리
  | 'tool_maintenance'; // 도구관리

export type BodyPart = 
  | 'face'      // 얼굴
  | 'underarm'  // 겨드랑이
  | 'arms'      // 팔
  | 'legs'      // 다리
  | 'bikini'    // 비키니
  | 'full_body'; // 전신

export interface ServiceInfo {
  name: string;        // '헤어샵 이름', '네일샵 이름'
  location: string;    // '강남역 1번 출구'
  contact: string;     // '02-1234-5678'
  lastVisit?: Date;
  nextAppointment?: Date;
  notes?: string;      // '담당 디자이너: 김OO'
}

export interface SelfCareTask extends Task {
  type: 'self_care';
}

// 카테고리별 세부 항목
export const SKINCARE_ITEMS = [
  '세안', '각질제거', '토너', '세럼/에센스', 
  '보습제', '자외선차단제', '얼굴팩', '코팩', '립밤'
] as const;

export const BODY_CARE_ITEMS = [
  '샤워', '바디로션', '손톱정리', '발톱정리', 
  '코털제거', '귀청소', '각질제거(바디)'
] as const;

export const HAIR_REMOVAL_ITEMS = [
  '얼굴제모', '수염정리', '겨드랑이제모', '팔제모', 
  '다리제모', '비키니제모', '전신제모'
] as const;

export const HAIR_CARE_ITEMS = [
  '샴푸', '컨디셔너', '두피관리', '헤어트리트먼트', 
  '헤어스타일링', '미용실방문'
] as const;

export const TOOL_MAINTENANCE_ITEMS = [
  '칫솔교체', '면도기날교체', '화장솔세척', 
  '드라이기청소', '전동칫솔헤드교체'
] as const;
```

---

## 자기관리 템플릿 데이터

`src/modules/self-care/templates/selfCareTemplates.json`:

```json
{
  "male_basic": [
    {
      "name": "아침 세안",
      "category": "skincare",
      "subcategory": "세안",
      "interval": 1,
      "unit": "day",
      "estimatedMinutes": 3,
      "priority": "high",
      "gender": "male",
      "requiredProducts": ["클렌저"]
    },
    {
      "name": "자외선 차단제",
      "category": "skincare",
      "subcategory": "자외선차단제",
      "interval": 1,
      "unit": "day",
      "estimatedMinutes": 2,
      "priority": "medium",
      "gender": "all",
      "requiredProducts": ["선크림"]
    },
    {
      "name": "수염 면도",
      "category": "hair_removal",
      "subcategory": "수염정리",
      "interval": 1,
      "unit": "day",
      "estimatedMinutes": 5,
      "priority": "medium",
      "gender": "male",
      "requiredProducts": ["면도기", "셰이빙폼"]
    },
    {
      "name": "손톱 정리",
      "category": "body_care",
      "subcategory": "손톱정리",
      "interval": 10,
      "unit": "day",
      "estimatedMinutes": 10,
      "priority": "low",
      "gender": "all"
    },
    {
      "name": "코털 제거",
      "category": "body_care",
      "subcategory": "코털제거",
      "interval": 14,
      "unit": "day",
      "estimatedMinutes": 5,
      "priority": "low",
      "gender": "all"
    },
    {
      "name": "미용실 방문",
      "category": "hair_care",
      "subcategory": "미용실방문",
      "interval": 21,
      "unit": "day",
      "estimatedMinutes": 60,
      "priority": "medium",
      "requiresService": true,
      "gender": "all"
    },
    {
      "name": "칫솔 교체",
      "category": "tool_maintenance",
      "subcategory": "칫솔교체",
      "interval": 90,
      "unit": "day",
      "estimatedMinutes": 2,
      "priority": "low",
      "gender": "all"
    }
  ],
  "male_grooming_advanced": [
    {
      "name": "스킨케어 루틴 (5단계)",
      "category": "skincare",
      "subcategory": "세안",
      "interval": 1,
      "unit": "day",
      "estimatedMinutes": 15,
      "priority": "high",
      "gender": "male",
      "requiredProducts": ["클렌저", "토너", "세럼", "보습제", "자외선차단제"]
    },
    {
      "name": "각질 제거 (밤)",
      "category": "skincare",
      "subcategory": "각질제거",
      "interval": 3,
      "unit": "day",
      "estimatedMinutes": 10,
      "priority": "medium",
      "gender": "all"
    },
    {
      "name": "얼굴 팩",
      "category": "skincare",
      "subcategory": "얼굴팩",
      "interval": 7,
      "unit": "day",
      "estimatedMinutes": 20,
      "priority": "medium",
      "gender": "all"
    },
    {
      "name": "코팩",
      "category": "skincare",
      "subcategory": "코팩",
      "interval": 7,
      "unit": "day",
      "estimatedMinutes": 10,
      "priority": "low",
      "gender": "all"
    },
    {
      "name": "얼굴 제모 (왁싱)",
      "category": "hair_removal",
      "subcategory": "얼굴제모",
      "bodyPart": "face",
      "interval": 21,
      "unit": "day",
      "estimatedMinutes": 30,
      "priority": "medium",
      "requiresService": true,
      "gender": "male"
    },
    {
      "name": "겨드랑이 제모",
      "category": "hair_removal",
      "subcategory": "겨드랑이제모",
      "bodyPart": "underarm",
      "interval": 28,
      "unit": "day",
      "estimatedMinutes": 15,
      "priority": "low",
      "requiresService": false,
      "gender": "all"
    },
    {
      "name": "전신 제모",
      "category": "hair_removal",
      "subcategory": "전신제모",
      "bodyPart": "full_body",
      "interval": 42,
      "unit": "day",
      "estimatedMinutes": 90,
      "priority": "low",
      "requiresService": true,
      "gender": "all"
    }
  ],
  "female_basic": [
    {
      "name": "아침 스킨케어",
      "category": "skincare",
      "subcategory": "세안",
      "interval": 1,
      "unit": "day",
      "estimatedMinutes": 10,
      "priority": "high",
      "gender": "female",
      "requiredProducts": ["클렌저", "토너", "보습제", "선크림"]
    },
    {
      "name": "얼굴 팩",
      "category": "skincare",
      "subcategory": "얼굴팩",
      "interval": 7,
      "unit": "day",
      "estimatedMinutes": 20,
      "priority": "medium",
      "gender": "all"
    },
    {
      "name": "각질 제거",
      "category": "skincare",
      "subcategory": "각질제거",
      "interval": 3,
      "unit": "day",
      "estimatedMinutes": 10,
      "priority": "medium",
      "gender": "all"
    },
    {
      "name": "손톱/발톱 정리",
      "category": "body_care",
      "subcategory": "손톱정리",
      "interval": 14,
      "unit": "day",
      "estimatedMinutes": 20,
      "priority": "medium",
      "gender": "all"
    },
    {
      "name": "다리 제모",
      "category": "hair_removal",
      "subcategory": "다리제모",
      "bodyPart": "legs",
      "interval": 30,
      "unit": "day",
      "estimatedMinutes": 30,
      "priority": "medium",
      "gender": "female"
    },
    {
      "name": "겨드랑이 제모",
      "category": "hair_removal",
      "subcategory": "겨드랑이제모",
      "bodyPart": "underarm",
      "interval": 21,
      "unit": "day",
      "estimatedMinutes": 15,
      "priority": "medium",
      "gender": "all"
    },
    {
      "name": "미용실 방문",
      "category": "hair_care",
      "subcategory": "미용실방문",
      "interval": 21,
      "unit": "day",
      "estimatedMinutes": 90,
      "priority": "medium",
      "requiresService": true,
      "gender": "all"
    }
  ]
}
```

---

## 자기관리 서비스

`src/modules/self-care/selfCareService.ts`:

```typescript
import { SelfCareObject, SelfCareMetadata, SelfCareCategory, BodyPart } from './types';
import { UserProfile } from '@/types/user.types';
import { RecurrenceEngine } from '@/core/engines/RecurrenceEngine';
import selfCareTemplates from './templates/selfCareTemplates.json';
import { addDays } from 'date-fns';

export class SelfCareService {
  /**
   * 템플릿으로부터 자기관리 객체 생성
   */
  static createObjectsFromTemplate(
    userId: string,
    gender: 'male' | 'female' | 'non_binary',
    groomingLevel: 'basic' | 'intermediate' | 'advanced'
  ): SelfCareObject[] {
    // 성별 및 레벨에 맞는 템플릿 선택
    const templateKey = this.getTemplateKey(gender, groomingLevel);
    const templates = selfCareTemplates[templateKey as keyof typeof selfCareTemplates] || [];
    
    return templates.map((item, index) => {
      const now = new Date();
      
      return {
        id: `selfcare_${userId}_${index}_${Date.now()}`,
        userId,
        type: 'self_care',
        name: item.name,
        metadata: {
          category: item.category as SelfCareCategory,
          subcategory: item.subcategory,
          bodyPart: item.bodyPart as BodyPart | undefined,
          estimatedMinutes: item.estimatedMinutes,
          requiredProducts: item.requiredProducts,
          requiresService: item.requiresService || false,
          gender: item.gender as any,
          lastPerformed: undefined,
          nextDue: addDays(now, item.interval)
        },
        createdAt: now,
        updatedAt: now
      };
    });
  }

  /**
   * 템플릿 키 선택
   */
  private static getTemplateKey(
    gender: 'male' | 'female' | 'non_binary',
    level: 'basic' | 'intermediate' | 'advanced'
  ): string {
    if (gender === 'male') {
      return level === 'advanced' ? 'male_grooming_advanced' : 'male_basic';
    } else if (gender === 'female') {
      return 'female_basic'; // female_advanced 추가 가능
    } else {
      // 논바이너리는 기본 템플릿 제공
      return 'male_basic';
    }
  }

  /**
   * 카테고리별 필터링
   */
  static filterByCategory(
    objects: SelfCareObject[],
    category: SelfCareCategory
  ): SelfCareObject[] {
    return objects.filter(obj => obj.metadata.category === category);
  }

  /**
   * 오늘 할 자기관리 추천
   */
  static getTodayRecommendations(
    objects: SelfCareObject[]
  ): SelfCareObject[] {
    const now = new Date();
    
    return objects
      .filter(obj => {
        const nextDue = obj.metadata.nextDue;
        return nextDue && nextDue <= now;
      })
      .sort((a, b) => {
        // 우선순위: 일일 루틴 > 주기 루틴
        const priorityMap = { high: 3, medium: 2, low: 1 };
        return priorityMap[b.priority] - priorityMap[a.priority];
      });
  }

  /**
   * 외부 서비스 필요 항목 (예약 필요)
   */
  static getServiceRequiredItems(
    objects: SelfCareObject[]
  ): SelfCareObject[] {
    return objects.filter(obj => obj.metadata.requiresService);
  }

  /**
   * 부위별 제모 관리
   */
  static getHairRemovalByPart(
    objects: SelfCareObject[],
    bodyPart: BodyPart
  ): SelfCareObject[] {
    return objects.filter(obj => 
      obj.metadata.category === 'hair_removal' &&
      obj.metadata.bodyPart === bodyPart
    );
  }

  /**
   * 일일 루틴 (매일 하는 것들)
   */
  static getDailyRoutine(objects: SelfCareObject[]): SelfCareObject[] {
    // interval이 1일인 항목들
    return objects.filter(obj => {
      // recurrence 정보가 있으면 확인
      // 여기서는 간단히 특정 항목들만 필터링
      const dailyItems = ['세안', '자외선차단제', '수염정리', '샤워', '바디로션'];
      return dailyItems.includes(obj.metadata.subcategory);
    });
  }

  /**
   * 주간 루틴 (주 1-2회)
   */
  static getWeeklyRoutine(objects: SelfCareObject[]): SelfCareObject[] {
    const weeklyItems = ['각질제거', '얼굴팩', '코팩', '화장솔세척'];
    return objects.filter(obj => 
      weeklyItems.includes(obj.metadata.subcategory)
    );
  }

  /**
   * 월간 루틴 (2-4주마다)
   */
  static getMonthlyRoutine(objects: SelfCareObject[]): SelfCareObject[] {
    const monthlyItems = ['손톱정리', '발톱정리', '미용실방문', '제모'];
    return objects.filter(obj => 
      monthlyItems.some(item => obj.metadata.subcategory.includes(item))
    );
  }

  /**
   * 제품 필요 항목 (쇼핑 리스트)
   */
  static getRequiredProducts(objects: SelfCareObject[]): string[] {
    const products = new Set<string>();
    
    objects.forEach(obj => {
      if (obj.metadata.requiredProducts) {
        obj.metadata.requiredProducts.forEach(p => products.add(p));
      }
    });
    
    return Array.from(products);
  }
}
```

---

## UI 컴포넌트

### SelfCareCard

`src/modules/self-care/components/SelfCareCard.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SelfCareObject } from '../types';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Colors, Typography, Spacing } from '@/constants';

interface Props {
  item: SelfCareObject;
  onComplete: () => void;
  onPostpone: () => void;
  onEditService?: () => void;
}

export const SelfCareCard: React.FC<Props> = ({ 
  item, 
  onComplete, 
  onPostpone,
  onEditService 
}) => {
  const getCategoryIcon = () => {
    switch (item.metadata.category) {
      case 'skincare': return '🧖';
      case 'body_care': return '💅';
      case 'hair_removal': return '✂️';
      case 'hair_care': return '💇';
      case 'tool_maintenance': return '🔧';
      default: return '✨';
    }
  };

  const getCategoryLabel = () => {
    switch (item.metadata.category) {
      case 'skincare': return '피부관리';
      case 'body_care': return '신체관리';
      case 'hair_removal': return '제모';
      case 'hair_care': return '헤어관리';
      case 'tool_maintenance': return '도구관리';
      default: return '자기관리';
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{getCategoryIcon()}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.category}>{getCategoryLabel()}</Text>
          </View>
        </View>
        <Badge text={`${item.metadata.estimatedMinutes}분`} variant="primary" />
      </View>

      {/* 외부 서비스 정보 */}
      {item.metadata.requiresService && item.metadata.serviceInfo && (
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceLabel}>📍 {item.metadata.serviceInfo.name}</Text>
          <Text style={styles.serviceDetail}>{item.metadata.serviceInfo.location}</Text>
          {item.metadata.serviceInfo.nextAppointment && (
            <Text style={styles.serviceDetail}>
              다음 예약: {item.metadata.serviceInfo.nextAppointment.toLocaleDateString('ko-KR')}
            </Text>
          )}
          {onEditService && (
            <TouchableOpacity onPress={onEditService}>
              <Text style={styles.editService}>예약 정보 수정</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 부위 정보 (제모) */}
      {item.metadata.bodyPart && (
        <View style={styles.bodyPartBadge}>
          <Text style={styles.bodyPartText}>부위: {item.metadata.bodyPart}</Text>
        </View>
      )}

      {/* 필요한 제품 */}
      {item.metadata.requiredProducts && item.metadata.requiredProducts.length > 0 && (
        <View style={styles.products}>
          <Text style={styles.productsLabel}>필요한 제품:</Text>
          <Text style={styles.productsList}>
            {item.metadata.requiredProducts.join(', ')}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.completeButton]}
          onPress={onComplete}
        >
          <Text style={styles.buttonText}>✓ 완료</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.postponeButton]}
          onPress={onPostpone}
        >
          <Text style={styles.buttonText}>→ 미루기</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1
  },
  icon: {
    fontSize: 24,
    marginRight: Spacing.sm
  },
  titleContainer: {
    flex: 1
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: 2
  },
  category: {
    ...Typography.caption,
    color: Colors.textSecondary
  },
  serviceInfo: {
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm
  },
  serviceLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4
  },
  serviceDetail: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2
  },
  editService: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: 4
  },
  bodyPartBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm
  },
  bodyPartText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600'
  },
  products: {
    marginBottom: Spacing.sm
  },
  productsLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2
  },
  productsList: {
    ...Typography.bodySmall,
    color: Colors.textPrimary
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center'
  },
  completeButton: {
    backgroundColor: Colors.secondary
  },
  postponeButton: {
    backgroundColor: Colors.accent
  },
  buttonText: {
    ...Typography.label,
    color: Colors.white
  }
});
```

---

## 자기관리 홈 화면

`src/modules/self-care/screens/SelfCareHomeScreen.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SelfCareService } from '../selfCareService';
import { SelfCareCard } from '../components/SelfCareCard';
import { SelfCareObject, SelfCareCategory } from '../types';
import { LifeEngineService } from '@/core/LifeEngineService';
import { Colors, Typography, Spacing } from '@/constants';

export const SelfCareHomeScreen: React.FC = () => {
  const [todayItems, setTodayItems] = useState<SelfCareObject[]>([]);
  const [dailyRoutine, setDailyRoutine] = useState<SelfCareObject[]>([]);
  const [serviceItems, setServiceItems] = useState<SelfCareObject[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    // Firestore에서 자기관리 객체 로드
    const allItems: SelfCareObject[] = []; // 실제로는 FirestoreService.getSelfCareObjects()
    
    const today = SelfCareService.getTodayRecommendations(allItems);
    const daily = SelfCareService.getDailyRoutine(allItems);
    const service = SelfCareService.getServiceRequiredItems(allItems);
    
    setTodayItems(today);
    setDailyRoutine(daily);
    setServiceItems(service);
  };

  const handleComplete = async (item: SelfCareObject) => {
    // 완료 처리
    const userProfile = {}; // Context에서 가져오기
    await LifeEngineService.completeTask(item as any, userProfile as any);
    loadItems();
  };

  const handlePostpone = async (item: SelfCareObject) => {
    // 미루기 처리
    const userProfile = {};
    await LifeEngineService.postponeTask(item as any, userProfile as any);
    loadItems();
  };

  return (
    <ScrollView style={styles.container}>
      {/* 오늘 할 자기관리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌟 오늘 할 자기관리</Text>
        <Text style={styles.sectionSubtitle}>
          {todayItems.length}개 · 총 {todayItems.reduce((sum, i) => sum + i.metadata.estimatedMinutes, 0)}분
        </Text>
        
        {todayItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>오늘은 할 일이 없어요!</Text>
          </View>
        ) : (
          todayItems.map(item => (
            <SelfCareCard
              key={item.id}
              item={item}
              onComplete={() => handleComplete(item)}
              onPostpone={() => handlePostpone(item)}
            />
          ))
        )}
      </View>

      {/* 일일 루틴 */}
      {dailyRoutine.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>☀️ 일일 루틴</Text>
          <Text style={styles.sectionSubtitle}>매일 하는 기본 관리</Text>
          
          {dailyRoutine.map(item => (
            <SelfCareCard
              key={item.id}
              item={item}
              onComplete={() => handleComplete(item)}
              onPostpone={() => handlePostpone(item)}
            />
          ))}
        </View>
      )}

      {/* 예약 필요 */}
      {serviceItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 예약 필요</Text>
          <Text style={styles.sectionSubtitle}>미용실, 네일샵 등</Text>
          
          {serviceItems.map(item => (
            <SelfCareCard
              key={item.id}
              item={item}
              onComplete={() => handleComplete(item)}
              onPostpone={() => handlePostpone(item)}
              onEditService={() => {
                // 예약 정보 수정 화면으로 이동
              }}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  section: {
    padding: Spacing.md
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center'
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary
  }
});
```

---

## 온보딩 통합

`step-05-onboarding.md`에 추가할 질문:

```json
{
  "id": "self_care_level",
  "question": "자기관리는 얼마나 하시나요?",
  "type": "select",
  "options": [
    { "id": "basic", "label": "기본만 (세안, 손톱 정리)", "value": "basic" },
    { "id": "intermediate", "label": "보통 (스킨케어, 미용실)", "value": "intermediate" },
    { "id": "advanced", "label": "철저히 (제모, 정기 관리)", "value": "advanced" },
    { "id": "none", "label": "하지 않음", "value": "none" }
  ]
},
{
  "id": "gender",
  "question": "성별을 선택해주세요 (맞춤 추천용)",
  "type": "select",
  "options": [
    { "id": "male", "label": "남성", "value": "male" },
    { "id": "female", "label": "여성", "value": "female" },
    { "id": "non_binary", "label": "논바이너리", "value": "non_binary" },
    { "id": "skip", "label": "건너뛰기", "value": "all" }
  ]
}
```

---

## 개인정보 보호

### 로컬 우선 저장

`src/modules/self-care/storage/secureStorage.ts`:

```typescript
import * as SecureStore from 'expo-secure-store';
import { SelfCareObject } from '../types';

const SELF_CARE_KEY = 'self_care';

export class SecureSelfCareStorage {
  /**
   * 자기관리 객체 저장 (로컬)
   */
  static async saveSelfCareObjects(
    userId: string, 
    objects: SelfCareObject[]
  ): Promise<void> {
    const key = `${SELF_CARE_KEY}_${userId}`;
    await SecureStore.setItemAsync(key, JSON.stringify(objects));
  }

  /**
   * 자기관리 객체 불러오기
   */
  static async loadSelfCareObjects(userId: string): Promise<SelfCareObject[]> {
    const key = `${SELF_CARE_KEY}_${userId}`;
    const data = await SecureStore.getItemAsync(key);
    
    if (!data) return [];
    
    return JSON.parse(data);
  }

  /**
   * 모든 데이터 삭제
   */
  static async deleteAllData(userId: string): Promise<void> {
    const key = `${SELF_CARE_KEY}_${userId}`;
    await SecureStore.deleteItemAsync(key);
  }
}
```

---

## 다음 단계
- **step-04-05-self-development-module.md**: 자기계발 모듈 구현
- **step-05-onboarding.md**: 온보딩에 자기관리 질문 추가
