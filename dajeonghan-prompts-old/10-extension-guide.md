# 10. 확장 모듈 가이드 (Extension Guide)

> **🎯 목표**: 새로운 공간, 아이템, 기능을 자유롭게 추가할 수 있는 확장 시스템 이해 및 구현

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 확장 시스템의 원리 이해
- ✅ 새 아이템 타입 추가 방법 숙지
- ✅ 커스텀 기능 생성 방법 이해
- ✅ 2개 이상의 확장 예시 구현 (반려동물 or 차량)

**예상 소요 시간**: 0.5-1일 (학습 + 실습)

---

## 🧩 확장 시스템의 원리

### 핵심 개념

다정한은 **"무한 확장 가능한 플러그인 구조"**로 설계되었습니다.

```
[Core System] (변경 불가)
  - HomeLayout 관리
  - ScoreCalculator
  - RecurrenceEngine
  - Task 생성/완료 로직

[Extension Points] (확장 가능)
  1. 새 RoomType 추가
  2. 새 ItemType 추가
  3. 새 FeatureCategory 추가
  4. 새 ItemPreset 추가
  5. 커스텀 점수 계산 로직
```

---

## 📦 확장 예시 1: 반려동물 관리

### Step 1: 타입 정의

`src/types/extensions/pet.types.ts`:

```typescript
import { ItemType, FeatureCategory } from '@/types/home-layout.types';

// 새 ItemType 추가
export type PetItemType = 
  | 'pet_feeding_station'    // 사료/물 급여소
  | 'pet_litter_box'         // 화장실
  | 'pet_bed'                // 침대
  | 'pet_toy_box';           // 장난감 보관함

// 새 FeatureCategory (선택)
export type PetFeatureCategory = 
  | 'feeding'                // 급여
  | 'health'                 // 건강
  | 'grooming'               // 미용
  | 'exercise';              // 운동

// 반려동물 메타데이터
export interface PetMetadata {
  petName: string;
  petType: 'dog' | 'cat' | 'other';
  breed?: string;
  age?: number;
  weight?: number;
  vetInfo?: {
    name: string;
    phone: string;
    lastVisit?: Date;
  };
}

// Item 확장
export interface PetItem extends RoomItem {
  type: PetItemType;
  metadata: {
    ...RoomItem['metadata'],
    pet: PetMetadata;
  };
}
```

### Step 2: 프리셋 생성

`src/data/extensions/petPresets.ts`:

```typescript
import { ItemPreset } from '@/data/itemPresets';

export const PET_PRESETS: ItemPreset[] = [
  {
    id: 'preset_pet_feeding_001',
    itemType: 'pet_feeding_station',
    name: '반려동물 급여소',
    description: '사료와 물 관리',
    icon: '🍖',
    category: '반려동물',
    isSystemPreset: true,
    isPublic: true,
    defaultFeatures: [
      {
        category: 'cleaning',
        name: '사료 그릇 청소',
        description: '매일 씻기',
        enabled: true,
        required: true,
        config: {
          cleaning: {
            interval: 1,
            unit: 'day',
            estimatedMinutes: 5,
            priority: 'high',
            healthPriority: true
          }
        }
      },
      {
        category: 'cleaning',
        name: '물 그릇 청소',
        description: '매일 물 갈아주기',
        enabled: true,
        required: true,
        config: {
          cleaning: {
            interval: 1,
            unit: 'day',
            estimatedMinutes: 3,
            priority: 'high',
            healthPriority: true
          }
        }
      },
      {
        category: 'inventory',
        name: '사료 재고',
        description: '사료 남은 양 확인',
        enabled: true,
        required: true,
        config: {
          inventory: {
            type: 'supply',
            trackExpiry: true,
            lowStockAlert: true,
            alertThreshold: 7  // 7일치 남으면 알림
          }
        }
      },
      {
        category: 'reminder',
        name: '급여 시간',
        description: '정해진 시간에 사료 주기',
        enabled: true,
        required: false,
        config: {
          reminder: {
            interval: 1,
            unit: 'day',
            message: '밥 줄 시간이에요',
            customTime: '08:00'
          }
        }
      }
    ]
  },
  
  {
    id: 'preset_pet_litter_001',
    itemType: 'pet_litter_box',
    name: '고양이 화장실',
    description: '배변 관리',
    icon: '🐱',
    category: '반려동물',
    isSystemPreset: true,
    isPublic: true,
    defaultFeatures: [
      {
        category: 'cleaning',
        name: '배변 치우기',
        description: '매일 2회',
        enabled: true,
        required: true,
        config: {
          cleaning: {
            interval: 1,
            unit: 'day',
            estimatedMinutes: 5,
            priority: 'urgent',
            healthPriority: true
          }
        }
      },
      {
        category: 'cleaning',
        name: '모래 전체 교체',
        description: '주 1회 전체 교체',
        enabled: true,
        required: true,
        config: {
          cleaning: {
            interval: 7,
            unit: 'day',
            estimatedMinutes: 15,
            priority: 'high',
            healthPriority: true
          }
        }
      },
      {
        category: 'inventory',
        name: '고양이 모래 재고',
        description: '모래 남은 양',
        enabled: true,
        required: false,
        config: {
          inventory: {
            type: 'supply',
            trackExpiry: false,
            lowStockAlert: true
          }
        }
      }
    ]
  }
];
```

### Step 3: UI 추가

```typescript
// 반려동물 공간 추가
const PET_ROOM: Room = {
  id: 'room_pet',
  type: 'custom',
  name: '반려동물 공간',
  customName: '🐾 강아지 공간',
  color: '#FF6B6B',
  items: []
};

// 온보딩에 추가
const OnboardingQuestion = {
  id: 'has_pet',
  question: '반려동물을 키우시나요?',
  options: [
    { id: 'dog', label: '강아지 🐕' },
    { id: 'cat', label: '고양이 🐱' },
    { id: 'both', label: '둘 다' },
    { id: 'none', label: '안 키워요' }
  ],
  onSelect: async (answer) => {
    if (answer !== 'none') {
      // 반려동물 공간 자동 추가
      await HomeLayoutService.addRoom(userId, PET_ROOM);
      
      // 기본 아이템 추가
      if (answer === 'dog' || answer === 'both') {
        await addPetItem('pet_feeding_station', '강아지 밥그릇');
      }
      if (answer === 'cat' || answer === 'both') {
        await addPetItem('pet_litter_box', '고양이 화장실');
      }
    }
  }
};
```

---

## 🚗 확장 예시 2: 차량 관리

### Step 1: 타입 정의

`src/types/extensions/vehicle.types.ts`:

```typescript
export type VehicleItemType = 
  | 'car'
  | 'motorcycle'
  | 'bicycle'
  | 'electric_scooter';

export interface VehicleMetadata {
  brand: string;
  model: string;
  year: number;
  licensePlate?: string;
  purchaseDate?: Date;
  mileage?: number;
  insurance?: {
    company: string;
    expiryDate: Date;
    policyNumber: string;
  };
}
```

### Step 2: 프리셋 생성

`src/data/extensions/vehiclePresets.ts`:

```typescript
export const VEHICLE_PRESETS: ItemPreset[] = [
  {
    id: 'preset_car_001',
    itemType: 'car',
    name: '자동차',
    description: '차량 관리',
    icon: '🚗',
    category: '차량',
    isSystemPreset: true,
    isPublic: true,
    defaultFeatures: [
      {
        category: 'cleaning',
        name: '세차',
        description: '외부 세차',
        enabled: true,
        required: false,
        config: {
          cleaning: {
            interval: 14,
            unit: 'day',
            estimatedMinutes: 30,
            priority: 'low'
          }
        }
      },
      {
        category: 'cleaning',
        name: '실내 청소',
        description: '실내 청소기',
        enabled: true,
        required: false,
        config: {
          cleaning: {
            interval: 30,
            unit: 'day',
            estimatedMinutes: 20,
            priority: 'low'
          }
        }
      },
      {
        category: 'maintenance',
        name: '정기 점검',
        description: '엔진 오일, 타이어 등',
        enabled: true,
        required: true,
        config: {
          maintenance: {
            interval: 6,
            unit: 'month',
            estimatedCost: 100000,
            professionalRequired: true
          }
        }
      },
      {
        category: 'maintenance',
        name: '타이어 공기압',
        description: '공기압 확인',
        enabled: true,
        required: false,
        config: {
          maintenance: {
            interval: 1,
            unit: 'month',
            professionalRequired: false
          }
        }
      },
      {
        category: 'reminder',
        name: '보험 갱신',
        description: '자동차 보험 만료 알림',
        enabled: true,
        required: true,
        config: {
          reminder: {
            interval: 1,
            unit: 'year',
            message: '보험 갱신 시기입니다'
          }
        }
      }
    ]
  }
];
```

### Step 3: 전용 화면 (선택)

```typescript
// src/screens/extensions/VehicleDetailScreen.tsx

const VehicleDetailScreen = ({ vehicle }: { vehicle: PetItem }) => {
  return (
    <ScrollView>
      {/* 차량 정보 */}
      <VehicleInfo>
        <Text>{vehicle.metadata.brand} {vehicle.metadata.model}</Text>
        <Text>주행거리: {vehicle.metadata.mileage}km</Text>
      </VehicleInfo>

      {/* 다음 정비 */}
      <NextMaintenance>
        <Text>다음 정기 점검: D-15</Text>
      </NextMaintenance>

      {/* 보험 정보 */}
      <InsuranceInfo>
        <Text>보험 만료: {vehicle.metadata.insurance.expiryDate}</Text>
      </InsuranceInfo>

      {/* 기능 목록 */}
      <FeatureList features={vehicle.features} />
    </ScrollView>
  );
};
```

---

## 🔧 커스텀 기능 생성기

### 사용자가 직접 만드는 기능

`src/screens/items/CustomFeatureCreatorScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ItemFeaturePreset } from '@/data/itemPresets';

export const CustomFeatureCreatorScreen = ({ itemId }) => {
  const [featureName, setFeatureName] = useState('');
  const [category, setCategory] = useState<FeatureCategory>('cleaning');
  const [interval, setInterval] = useState(7);
  const [unit, setUnit] = useState<'day' | 'week' | 'month'>('day');
  const [minutes, setMinutes] = useState(15);

  const handleCreate = async () => {
    const customFeature: ItemFeaturePreset = {
      category,
      name: featureName,
      description: '',
      enabled: true,
      required: false,
      config: {
        [category]: {
          interval,
          unit,
          estimatedMinutes: minutes,
          priority: 'medium'
        }
      }
    };

    await ItemFeatureService.activateFeature(itemId, customFeature);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>커스텀 기능 만들기</Text>

      {/* 기능 이름 */}
      <FormField label="기능 이름">
        <TextInput
          value={featureName}
          onChangeText={setFeatureName}
          placeholder="예: 반려동물 목욕"
          style={styles.input}
        />
      </FormField>

      {/* 카테고리 선택 */}
      <FormField label="카테고리">
        <RadioGroup
          options={[
            { label: '청소', value: 'cleaning', icon: '🧹' },
            { label: '재고', value: 'inventory', icon: '📦' },
            { label: '유지보수', value: 'maintenance', icon: '🔧' },
            { label: '알림', value: 'reminder', icon: '⏰' }
          ]}
          value={category}
          onChange={setCategory}
        />
      </FormField>

      {/* 주기 설정 */}
      <FormField label="반복 주기">
        <IntervalPicker
          interval={interval}
          unit={unit}
          onChangeInterval={setInterval}
          onChangeUnit={setUnit}
        />
      </FormField>

      {/* 예상 시간 */}
      <FormField label="예상 소요 시간">
        <DurationPicker
          value={minutes}
          onChange={setMinutes}
        />
      </FormField>

      {/* 생성 버튼 */}
      <Button
        title="기능 추가"
        onPress={handleCreate}
        disabled={!featureName}
      />
    </ScrollView>
  );
};
```

---

## 📖 확장 템플릿 모음

### 1. 화분 관리

```typescript
const PLANT_PRESET: ItemPreset = {
  id: 'preset_plant_001',
  itemType: 'plant',
  name: '화분',
  icon: '🪴',
  category: '거실/베란다',
  defaultFeatures: [
    {
      category: 'reminder',
      name: '물 주기',
      enabled: true,
      config: {
        reminder: {
          interval: 3,
          unit: 'day',
          message: '화분에 물 줄 시간이에요'
        }
      }
    },
    {
      category: 'reminder',
      name: '햇빛 쬐기',
      enabled: true,
      config: {
        reminder: {
          interval: 7,
          unit: 'day',
          message: '화분을 햇빛에 내놓으세요'
        }
      }
    },
    {
      category: 'maintenance',
      name: '분갈이',
      enabled: true,
      config: {
        maintenance: {
            interval: 1,
          unit: 'year',
          professionalRequired: false
        }
      }
    }
  ]
};
```

### 2. 공부방/서재

```typescript
const STUDY_ROOM_PRESET = {
  roomType: 'custom',
  name: '공부방',
  icon: '📚',
  defaultItems: [
    {
      type: 'desk',
      name: '책상',
      icon: '🪑',
      features: [
        {
          category: 'cleaning',
          name: '책상 정리',
          interval: 1,
          unit: 'day',
          estimatedMinutes: 10
        },
        {
          category: 'reminder',
          name: '공부 시간',
          interval: 1,
          unit: 'day',
          message: '공부 시작!',
          customTime: '19:00'
        }
      ]
    },
    {
      type: 'bookshelf',
      name: '책장',
      icon: '📚',
      features: [
        {
          category: 'cleaning',
          name: '먼지 털기',
          interval: 14,
          unit: 'day',
          estimatedMinutes: 15
        }
      ]
    }
  ]
};
```

### 3. 홈짐

```typescript
const HOME_GYM_PRESET = {
  roomType: 'custom',
  name: '홈짐',
  icon: '🏋️',
  defaultItems: [
    {
      type: 'exercise_mat',
      name: '운동 매트',
      icon: '🧘',
      features: [
        {
          category: 'cleaning',
          name: '매트 세척',
          interval: 7,
          unit: 'day',
          estimatedMinutes: 10
        },
        {
          category: 'reminder',
          name: '운동 시간',
          interval: 1,
          unit: 'day',
          message: '운동 시작!',
          customTime: '07:00'
        }
      ]
    },
    {
      type: 'weights',
      name: '아령/기구',
      icon: '💪',
      features: [
        {
          category: 'cleaning',
          name: '기구 닦기',
          interval: 3,
          unit: 'day',
          estimatedMinutes: 5
        }
      ]
    }
  ]
};
```

---

## 🎓 확장 개발 가이드

### 새 아이템 타입 추가하기

#### 1. 타입 정의
```typescript
// src/types/extensions/your-category.types.ts
export type YourItemType = 'your_item_type';

// ItemType에 추가
// src/types/home-layout.types.ts에서:
export type ItemType = 
  // ... 기존 타입
  | YourItemType;
```

#### 2. 프리셋 생성
```typescript
// src/data/extensions/yourPresets.ts
export const YOUR_PRESETS: ItemPreset[] = [
  {
    id: 'preset_your_item_001',
    itemType: 'your_item_type',
    name: '당신의 아이템',
    icon: '🎯',
    category: '당신의 카테고리',
    defaultFeatures: [
      // 기능들...
    ]
  }
];
```

#### 3. 프리셋 등록
```typescript
// src/data/itemPresets.ts
import { YOUR_PRESETS } from './extensions/yourPresets';

export const ALL_ITEM_PRESETS = [
  ...KITCHEN_PRESETS,
  ...BATHROOM_PRESETS,
  ...YOUR_PRESETS,  // 🆕 추가
];
```

#### 4. UI 추가 (선택)
```typescript
// 전용 화면이 필요하면:
// src/screens/extensions/YourItemDetailScreen.tsx
```

### 체크리스트
- [ ] 타입 정의
- [ ] 프리셋 생성
- [ ] 프리셋 등록
- [ ] 테스트 (아이템 추가 → 기능 활성화 → Task 생성)

---

## 💡 확장 아이디어 모음

### 라이프스타일
```
🎮 게임/취미
  - 게임기 먼지 제거
  - 게임 디스크 정리
  - 플레이 시간 관리

📚 독서
  - 독서 목표
  - 책 정리
  - 도서관 반납

🎸 악기
  - 연습 스케줄
  - 악기 관리
  - 줄/리드 교체
```

### 웰빙
```
🧘 요가/명상
  - 매트 청소
  - 명상 시간 알림
  - 일주일 횟수 추적

💆 마사지 기구
  - 청소
  - 정기 점검
  - 사용 알림
```

### 생산성
```
💼 재택 근무
  - 책상 정리
  - 업무 시작/종료 알림
  - 의자 높이 조정 알림

🖨️ 프린터
  - 토너 교체
  - 용지 재고
  - 정기 점검
```

---

## 🌐 커뮤니티 프리셋 공유 (Phase 3)

### 공유 시스템 설계

```typescript
// 사용자가 만든 프리셋 공유
interface SharedPreset extends ItemPreset {
  authorId: string;
  authorName: string;
  usageCount: number;
  rating: number;           // 1-5
  reviews: Review[];
  tags: string[];
  isVerified: boolean;      // 관리자 검증
}

// 프리셋 마켓플레이스
const PresetMarketplace = () => {
  const [presets, setPresets] = useState<SharedPreset[]>([]);
  const [category, setCategory] = useState('all');

  return (
    <View>
      <SearchBar placeholder="프리셋 검색" />
      <CategoryFilter value={category} onChange={setCategory} />
      
      <PresetGrid>
        {presets.map(preset => (
          <PresetCard
            key={preset.id}
            preset={preset}
            onInstall={() => installPreset(preset)}
          />
        ))}
      </PresetGrid>
    </View>
  );
};
```

---

## ✅ 확장 체크리스트

### MVP에 포함할 확장
- [ ] 반려동물 관리 (있으면)
- [ ] 화분 관리 (있으면)

### Phase 2에 추가할 확장
- [ ] 차량 관리
- [ ] 재정 관리 (공과금, 구독)
- [ ] 관계 관리 (생일, 기념일)

### Phase 3에 추가할 확장
- [ ] 커뮤니티 프리셋 공유
- [ ] 사용자 커스텀 무제한
- [ ] API 공개 (서드파티 통합)

---

## 🚀 다음 단계

- **11-onboarding-v2.md**: 집 설정 통합 온보딩
- **07-09**: 기존 모듈들을 공간 기반으로 재구성

---

**무한히 확장 가능한 플러그인 시스템을 이해했습니다! 🔌✨**
