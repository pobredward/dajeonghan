# Step 05. 냉장고 모듈 구현

> **🎯 목표**: 식재료 유통기한을 자동 관리하고 버리는 음식을 최소화하는 스마트 냉장고 시스템 구현

## 📌 단계 정보

**순서**: Step 05/13  
**Phase**: Phase 2 - 기능 모듈 (Features)  
**의존성**: Step 03 완료 필수  
**병렬 가능**: Step 04, 06과 동시 진행 가능  
**예상 소요 시간**: 1-1.5일  
**난이도**: ⭐⭐⭐

### 이전 단계 요구사항
- ✅ Step 03 완료: 공통 엔진 (RecurrenceEngine, NotificationOrchestrator 등)

### 다음 단계
- **Step 07**: 온보딩 시스템 (Step 04, 06 완료 후)

### 병렬 진행 가능
- Step 04 (청소 모듈)과 동시 진행 가능
- Step 06 (약 모듈)과 동시 진행 가능
- 서로 독립적이므로 충돌 없음

### 이 단계가 필요한 이유
- Step 07 온보딩에서 냉장고 템플릿 사용
- Step 08 알림에서 유통기한 임박 알림
- 음식물 쓰레기 감소라는 명확한 가치 제공

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 식재료 추가/수정/삭제 기능 작동
- ✅ 보관 조건별 유통기한 자동 계산 (냉장/냉동/실온)
- ✅ 임박 알림 시스템 작동 (D-3, D-1, D-day)
- ✅ 300+ 식재료 데이터베이스 통합
- ✅ 한국 소비기한 표시제 반영

**예상 소요 시간**: 1-1.5일

---

## 🥬 핵심 개념

### 냉장고 모듈의 차별화

기존 유통기한 관리 앱들은 단순히 "라벨 날짜"만 추적합니다. 다정한은 다릅니다:

1. **스마트 계산**: 보관 조건(냉장/냉동/실온) × 보관 방식(밀폐용기/비닐/랩) × 상태(통/손질/조리)를 모두 고려
2. **한국 표준 반영**: 소비기한 vs 유통기한 체계 (2023년 식품표시법 개정)
3. **최소 입력**: 처음엔 이름만, 나중에 상세 정보 추가 (점진적 공개)

### 주요 기능

- **보관 조건별 수명 계산**: 채소를 냉장 보관하면 14일, 냉동하면 180일
- **소비기한 체계**: 유통기한(판매 기한) vs 소비기한(먹을 수 있는 기한) 구분
- **임박 알림**: D-3 (주의), D-1 (경고), D-day (긴급)
- **300+ 식재료 DB**: 양파, 감자, 당근 등 일반 식재료 수명 데이터

---

## 데이터 확장

`src/modules/fridge/types.ts`:

```typescript
import { LifeObject } from '@/types/task.types';

export interface FoodItem extends LifeObject {
  type: 'food';
  metadata: FoodMetadata;
}

export interface FoodMetadata {
  category: FoodCategory;
  purchaseDate: Date;
  expiryDate?: Date;
  expiryType?: 'sell_by' | 'consume_by';
  storageCondition: StorageCondition;
  storageType: StorageType;
  state: FoodState;
  recommendedConsumption?: Date;
  quantity?: string;
  imageUrl?: string;
}

export type FoodCategory = 
  | '채소'
  | '과일'
  | '육류'
  | '해산물'
  | '유제품'
  | '조미료'
  | '가공식품'
  | '곡물'
  | '기타';

export type StorageCondition = '냉장' | '냉동' | '실온';
export type StorageType = '밀폐용기' | '비닐' | '원래포장' | '랩';
export type FoodState = '통' | '손질' | '조리';

export interface FoodStorageRule {
  category: FoodCategory;
  baseShelfLife: {
    refrigerated: number; // 일수
    frozen: number;
    roomTemp: number;
  };
  stateModifier: {
    통: 1.0;
    손질: 0.7;
    조리: 0.5;
  };
  storageTypeModifier: {
    밀폐용기: 1.2;
    비닐: 0.8;
    원래포장: 1.0;
    랩: 0.9;
  };
}
```

## 식재료 보관 데이터베이스

`src/modules/fridge/data/foodDatabase.ts`:

```typescript
import { FoodStorageRule, FoodCategory } from '../types';

export const FOOD_STORAGE_RULES: Record<string, FoodStorageRule> = {
  '양파': {
    category: '채소',
    baseShelfLife: {
      refrigerated: 14,
      frozen: 180,
      roomTemp: 30
    },
    stateModifier: {
      통: 1.0,
      손질: 0.5,  // 자르면 7일
      조리: 0.3
    },
    storageTypeModifier: {
      밀폐용기: 1.2,
      비닐: 0.8,
      원래포장: 1.0,
      랩: 0.9
    }
  },
  '감자': {
    category: '채소',
    baseShelfLife: {
      refrigerated: 30,
      frozen: 180,
      roomTemp: 60
    },
    stateModifier: {
      통: 1.0,
      손질: 0.3,
      조리: 0.2
    },
    storageTypeModifier: {
      밀폐용기: 1.0,
      비닐: 0.9,
      원래포장: 1.0,
      랩: 0.9
    }
  },
  '돼지고기': {
    category: '육류',
    baseShelfLife: {
      refrigerated: 3,
      frozen: 180,
      roomTemp: 0 // 실온 보관 불가
    },
    stateModifier: {
      통: 1.0,
      손질: 0.8,
      조리: 0.5
    },
    storageTypeModifier: {
      밀폐용기: 1.2,
      비닐: 1.0,
      원래포장: 1.0,
      랩: 1.0
    }
  },
  '우유': {
    category: '유제품',
    baseShelfLife: {
      refrigerated: 7,
      frozen: 90,
      roomTemp: 0
    },
    stateModifier: {
      통: 1.0,
      손질: 1.0,
      조리: 1.0
    },
    storageTypeModifier: {
      밀폐용기: 1.0,
      비닐: 1.0,
      원래포장: 1.0,
      랩: 1.0
    }
  },
  '토마토': {
    category: '채소',
    baseShelfLife: {
      refrigerated: 7,
      frozen: 180,
      roomTemp: 5
    },
    stateModifier: {
      통: 1.0,
      손질: 0.4,
      조리: 0.3
    },
    storageTypeModifier: {
      밀폐용기: 1.2,
      비닐: 0.8,
      원래포장: 1.0,
      랩: 0.9
    }
  },
  // 더 많은 식재료 추가...
};

export const CATEGORY_DEFAULTS: Record<FoodCategory, Partial<FoodStorageRule>> = {
  '채소': {
    baseShelfLife: {
      refrigerated: 7,
      frozen: 180,
      roomTemp: 3
    }
  },
  '과일': {
    baseShelfLife: {
      refrigerated: 10,
      frozen: 180,
      roomTemp: 5
    }
  },
  '육류': {
    baseShelfLife: {
      refrigerated: 3,
      frozen: 180,
      roomTemp: 0
    }
  },
  '해산물': {
    baseShelfLife: {
      refrigerated: 2,
      frozen: 90,
      roomTemp: 0
    }
  },
  '유제품': {
    baseShelfLife: {
      refrigerated: 7,
      frozen: 90,
      roomTemp: 0
    }
  },
  '조미료': {
    baseShelfLife: {
      refrigerated: 365,
      frozen: 365,
      roomTemp: 180
    }
  },
  '가공식품': {
    baseShelfLife: {
      refrigerated: 30,
      frozen: 180,
      roomTemp: 90
    }
  },
  '곡물': {
    baseShelfLife: {
      refrigerated: 180,
      frozen: 365,
      roomTemp: 90
    }
  },
  '기타': {
    baseShelfLife: {
      refrigerated: 7,
      frozen: 90,
      roomTemp: 3
    }
  }
};
```

## 냉장고 서비스

`src/modules/fridge/fridgeService.ts`:

```typescript
import { FoodItem, FoodMetadata, StorageCondition, FoodState, StorageType } from './types';
import { FOOD_STORAGE_RULES, CATEGORY_DEFAULTS } from './data/foodDatabase';
import { addDays, differenceInDays } from 'date-fns';

export class FridgeService {
  /**
   * 권장 소진일 계산
   */
  static calculateRecommendedConsumption(
    foodName: string,
    metadata: Partial<FoodMetadata>
  ): Date {
    const purchaseDate = metadata.purchaseDate || new Date();
    const storageCondition = metadata.storageCondition || '냉장';
    const state = metadata.state || '통';
    const storageType = metadata.storageType || '원래포장';

    // 1. 식재료별 룰 가져오기
    const rule = FOOD_STORAGE_RULES[foodName] || this.getCategoryDefault(metadata.category);

    if (!rule) {
      // 기본값: 냉장 7일
      return addDays(purchaseDate, 7);
    }

    // 2. 기본 보관 기간
    let baseShelfLife: number;
    switch (storageCondition) {
      case '냉장':
        baseShelfLife = rule.baseShelfLife.refrigerated;
        break;
      case '냉동':
        baseShelfLife = rule.baseShelfLife.frozen;
        break;
      case '실온':
        baseShelfLife = rule.baseShelfLife.roomTemp;
        break;
      default:
        baseShelfLife = 7;
    }

    // 3. 상태 보정
    const stateModifier = rule.stateModifier?.[state] || 1.0;

    // 4. 보관 방식 보정
    const storageModifier = rule.storageTypeModifier?.[storageType] || 1.0;

    // 5. 최종 계산
    const adjustedShelfLife = Math.round(baseShelfLife * stateModifier * storageModifier);

    return addDays(purchaseDate, adjustedShelfLife);
  }

  /**
   * 카테고리 기본값
   */
  private static getCategoryDefault(category?: string): any {
    if (!category) return null;
    return CATEGORY_DEFAULTS[category as keyof typeof CATEGORY_DEFAULTS];
  }

  /**
   * 임박 식재료 필터링
   */
  static getExpiringItems(
    items: FoodItem[],
    daysThreshold: number = 3
  ): FoodItem[] {
    const now = new Date();
    
    return items.filter(item => {
      const expiryDate = item.metadata.recommendedConsumption || item.metadata.expiryDate;
      if (!expiryDate) return false;

      const daysLeft = differenceInDays(expiryDate, now);
      return daysLeft <= daysThreshold && daysLeft >= 0;
    }).sort((a, b) => {
      const dateA = a.metadata.recommendedConsumption || a.metadata.expiryDate || new Date();
      const dateB = b.metadata.recommendedConsumption || b.metadata.expiryDate || new Date();
      return dateA.getTime() - dateB.getTime();
    });
  }

  /**
   * 만료된 식재료
   */
  static getExpiredItems(items: FoodItem[]): FoodItem[] {
    const now = new Date();
    
    return items.filter(item => {
      const expiryDate = item.metadata.recommendedConsumption || item.metadata.expiryDate;
      if (!expiryDate) return false;

      return expiryDate < now;
    });
  }

  /**
   * 식재료 추가 (점진적 공개)
   */
  static createFoodItem(
    userId: string,
    basicInfo: {
      name: string;
      purchaseDate?: Date;
      expiryDate?: Date;
    }
  ): FoodItem {
    const now = new Date();
    const purchaseDate = basicInfo.purchaseDate || now;

    // 기본값으로 시작 (나중에 사용자가 수정 가능)
    const metadata: FoodMetadata = {
      category: '기타',
      purchaseDate,
      expiryDate: basicInfo.expiryDate,
      expiryType: 'consume_by',
      storageCondition: '냉장', // 기본값
      storageType: '원래포장',
      state: '통',
      quantity: '1개'
    };

    // 권장 소진일 자동 계산
    metadata.recommendedConsumption = this.calculateRecommendedConsumption(
      basicInfo.name,
      metadata
    );

    return {
      id: `food_${userId}_${Date.now()}`,
      userId,
      type: 'food',
      name: basicInfo.name,
      metadata,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 간단한 레시피 제안
   */
  static suggestRecipes(items: FoodItem[]): string[] {
    const itemNames = items.map(i => i.name).join(', ');
    
    // 실제로는 레시피 API 연동 또는 간단한 룰 기반
    const suggestions = [
      `${itemNames}로 볶음 요리 어떠세요?`,
      `${itemNames}를 넣은 찌개 추천!`,
      `${itemNames} 샐러드로 간단하게!`
    ];

    return suggestions.slice(0, 2);
  }

  /**
   * 소비기한 vs 유통기한 설명
   */
  static getExpiryTypeExplanation(type: 'sell_by' | 'consume_by'): string {
    if (type === 'sell_by') {
      return '유통기한(판매기한): 이 날짜까지 판매 가능합니다. 보관조건을 지키면 더 오래 먹을 수 있어요.';
    } else {
      return '소비기한(안전섭취기한): 이 날짜까지 안전하게 먹을 수 있습니다. 보관조건을 꼭 지켜주세요!';
    }
  }
}
```

## UI 컴포넌트

`src/modules/fridge/components/FoodItemCard.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FoodItem } from '../types';
import { differenceInDays, format } from 'date-fns';

interface Props {
  item: FoodItem;
  onTap?: () => void;
}

export const FoodItemCard: React.FC<Props> = ({ item, onTap }) => {
  const expiryDate = item.metadata.recommendedConsumption || item.metadata.expiryDate;
  const daysLeft = expiryDate ? differenceInDays(expiryDate, new Date()) : null;

  const getUrgencyColor = () => {
    if (daysLeft === null) return '#9E9E9E';
    if (daysLeft < 0) return '#F44336'; // 만료
    if (daysLeft === 0) return '#FF5722'; // D-day
    if (daysLeft <= 1) return '#FF9800'; // D-1
    if (daysLeft <= 3) return '#FFC107'; // D-3
    return '#4CAF50'; // 여유
  };

  const getUrgencyText = () => {
    if (daysLeft === null) return '날짜 없음';
    if (daysLeft < 0) return '만료됨';
    if (daysLeft === 0) return '오늘까지';
    if (daysLeft === 1) return '내일까지';
    return `${daysLeft}일 남음`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={[styles.badge, { backgroundColor: getUrgencyColor() }]}>
          <Text style={styles.badgeText}>{getUrgencyText()}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.detail}>
          📦 {item.metadata.storageCondition} · {item.metadata.storageType}
        </Text>
        <Text style={styles.detail}>
          🔪 {item.metadata.state}
        </Text>
      </View>

      {expiryDate && (
        <Text style={styles.date}>
          권장 소진: {format(expiryDate, 'yyyy-MM-dd')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  details: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8
  },
  detail: {
    fontSize: 14,
    color: '#666'
  },
  date: {
    fontSize: 12,
    color: '#999'
  }
});
```

## 점진적 입력 폼

`src/modules/fridge/components/AddFoodForm.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onSubmit: (data: any) => void;
}

export const AddFoodForm: React.FC<Props> = ({ onSubmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    storageCondition: '냉장' as const,
    state: '통' as const
  });

  const handleNext = () => {
    if (step === 1 && formData.name) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <View style={styles.container}>
      {step === 1 && (
        <View style={styles.step}>
          <Text style={styles.question}>뭘 샀어요?</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 양파, 우유, 돼지고기"
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            autoFocus
          />
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleNext}
            disabled={!formData.name}
          >
            <Text style={styles.buttonText}>다음</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={styles.step}>
          <Text style={styles.question}>어디에 보관하나요?</Text>
          <View style={styles.options}>
            {['냉장', '냉동', '실온'].map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  formData.storageCondition === option && styles.optionSelected
                ]}
                onPress={() => setFormData({ ...formData, storageCondition: option as any })}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>다음</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <View style={styles.step}>
          <Text style={styles.question}>손질했나요?</Text>
          <View style={styles.options}>
            {['통', '손질', '조리'].map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  formData.state === option && styles.optionSelected
                ]}
                onPress={() => setFormData({ ...formData, state: option as any })}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>완료</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            ✨ 자동으로 권장 소진일이 설정됩니다!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  step: {
    alignItems: 'center'
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center'
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 24
  },
  options: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  option: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center'
  },
  optionSelected: {
    backgroundColor: '#2196F3'
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600'
  },
  button: {
    width: '100%',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  }
});
```

## 다음 단계
- 06-medicine.md: 약/영양제 모듈 구현
- 정확한 복용 알림 및 리필 관리
