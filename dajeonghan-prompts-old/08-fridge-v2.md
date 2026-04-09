# 08. 냉장고 모듈 v2 (공간 기반)

> **🎯 목표**: 냉장고를 아이템으로 취급하여 청소 + 재고 관리를 통합

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 냉장고가 "주방" Room의 하나의 Item
- ✅ 식재료 재고 관리 (Feature)
- ✅ 냉장고 청소 (Feature)
- ✅ 식재료 프리셋 300개 준비
- ✅ 유통기한 알림

**예상 소요 시간**: 4-5시간

---

## 🧊 냉장고 구조 v2

### v1 vs v2

**v1**:
```
FoodItem (flat)
  - 양파 (유통기한)
  - 우유 (유통기한)
```

**v2**:
```
Room (주방)
  └─ Item (냉장고)
       ├─ Feature (청소)
       │    └─ Task (냉장고 선반 청소)
       └─ Feature (재고)
            └─ Inventory (양파, 우유)
                 └─ Task (양파 정리)
```

---

## 📦 식재료 데이터 모델

### FoodInventory 타입

`src/types/inventory.types.ts`:

```typescript
export interface FoodInventory {
  id: string;
  userId: string;
  itemId: string;           // 냉장고 Item ID
  roomId: string;           // 주방 Room ID
  
  // 식재료 정보
  name: string;
  category: FoodCategory;
  icon: string;
  
  // 유통기한
  purchaseDate: Date;
  expiryDate: Date;
  daysRemaining: number;    // 계산값
  
  // 수량
  quantity: number;
  unit: string;             // 개, g, ml 등
  
  // 상태
  status: 'fresh' | 'use_soon' | 'expired';
  
  // 메타
  storageType: 'fridge' | 'freezer' | 'room_temp';
  memo?: string;
  photoUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export type FoodCategory =
  | 'vegetable'      // 채소
  | 'fruit'          // 과일
  | 'meat'           // 육류
  | 'seafood'        // 수산물
  | 'dairy'          // 유제품
  | 'grain'          // 곡물
  | 'sauce'          // 양념/소스
  | 'beverage'       // 음료
  | 'frozen'         // 냉동식품
  | 'processed'      // 가공식품
  | 'other';
```

---

## 🗂️ 식재료 프리셋

### FoodPreset (300개)

`src/data/foodPresets.ts`:

```typescript
export interface FoodPreset {
  id: string;
  name: string;
  category: FoodCategory;
  icon: string;
  defaultShelfLife: number;  // 기본 유통기한 (일)
  storageType: 'fridge' | 'freezer' | 'room_temp';
  tips?: string;             // 보관 팁
  variants?: string[];       // 변형 (예: 양파 → 깐 양파, 다진 양파)
}

// 채소 프리셋
export const VEGETABLE_PRESETS: FoodPreset[] = [
  {
    id: 'food_onion',
    name: '양파',
    category: 'vegetable',
    icon: '🧅',
    defaultShelfLife: 7,
    storageType: 'room_temp',
    tips: '서늘하고 통풍이 잘 되는 곳에 보관',
    variants: ['깐 양파', '다진 양파']
  },
  {
    id: 'food_carrot',
    name: '당근',
    category: 'vegetable',
    icon: '🥕',
    defaultShelfLife: 14,
    storageType: 'fridge',
    tips: '비닐팩에 담아 냉장 보관'
  },
  {
    id: 'food_lettuce',
    name: '상추',
    category: 'vegetable',
    icon: '🥬',
    defaultShelfLife: 5,
    storageType: 'fridge',
    tips: '물기를 제거한 후 키친타월로 감싸 보관'
  },
  {
    id: 'food_potato',
    name: '감자',
    category: 'vegetable',
    icon: '🥔',
    defaultShelfLife: 30,
    storageType: 'room_temp',
    tips: '사과와 함께 보관하면 싹이 덜 남'
  },
  // ... 총 100개 채소
];

// 육류 프리셋
export const MEAT_PRESETS: FoodPreset[] = [
  {
    id: 'food_chicken',
    name: '닭고기',
    category: 'meat',
    icon: '🍗',
    defaultShelfLife: 2,
    storageType: 'fridge',
    tips: '당일 소비 권장, 냉동 시 3개월'
  },
  {
    id: 'food_pork',
    name: '돼지고기',
    category: 'meat',
    icon: '🥓',
    defaultShelfLife: 3,
    storageType: 'fridge',
    tips: '랩으로 밀봉 후 냉장 보관'
  },
  {
    id: 'food_beef',
    name: '소고기',
    category: 'meat',
    icon: '🥩',
    defaultShelfLife: 5,
    storageType: 'fridge',
    tips: '핏물을 제거한 후 보관'
  },
  // ... 총 30개 육류
];

// 유제품 프리셋
export const DAIRY_PRESETS: FoodPreset[] = [
  {
    id: 'food_milk',
    name: '우유',
    category: 'dairy',
    icon: '🥛',
    defaultShelfLife: 7,
    storageType: 'fridge',
    tips: '개봉 후 3일 내 소비'
  },
  {
    id: 'food_yogurt',
    name: '요구르트',
    category: 'dairy',
    icon: '🥄',
    defaultShelfLife: 14,
    storageType: 'fridge'
  },
  {
    id: 'food_cheese',
    name: '치즈',
    category: 'dairy',
    icon: '🧀',
    defaultShelfLife: 30,
    storageType: 'fridge',
    tips: '밀봉 용기에 보관'
  },
  // ... 총 20개 유제품
];

// 전체 통합
export const ALL_FOOD_PRESETS = [
  ...VEGETABLE_PRESETS,
  ...FRUIT_PRESETS,
  ...MEAT_PRESETS,
  ...SEAFOOD_PRESETS,
  ...DAIRY_PRESETS,
  ...GRAIN_PRESETS,
  ...SAUCE_PRESETS,
  ...BEVERAGE_PRESETS,
  ...FROZEN_PRESETS,
  ...PROCESSED_PRESETS
];

// 검색 함수
export function searchFoodPreset(keyword: string): FoodPreset[] {
  return ALL_FOOD_PRESETS.filter(preset =>
    preset.name.includes(keyword)
  );
}

// 카테고리별 조회
export function getFoodPresetsByCategory(category: FoodCategory): FoodPreset[] {
  return ALL_FOOD_PRESETS.filter(preset => preset.category === category);
}
```

---

## 🍎 식재료 추가 UI

`src/screens/fridge/AddFoodScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { searchFoodPreset } from '@/data/foodPresets';
import { addDays } from 'date-fns';

export const AddFoodScreen = ({ route }) => {
  const { itemId, roomId } = route.params; // 냉장고 Item ID
  
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [shelfLife, setShelfLife] = useState(7);
  const [quantity, setQuantity] = useState(1);

  // 검색
  const handleSearch = (text: string) => {
    setKeyword(text);
    if (text.length >= 1) {
      const results = searchFoodPreset(text);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // 프리셋 선택
  const handleSelectPreset = (preset: FoodPreset) => {
    setSelectedPreset(preset);
    setShelfLife(preset.defaultShelfLife);
    setSearchResults([]);
  };

  // 추가
  const handleAdd = async () => {
    if (!selectedPreset) return;

    const food: FoodInventory = {
      id: `food_${Date.now()}`,
      userId: getCurrentUserId(),
      itemId,
      roomId,
      name: selectedPreset.name,
      category: selectedPreset.category,
      icon: selectedPreset.icon,
      purchaseDate: new Date(),
      expiryDate: addDays(new Date(), shelfLife),
      daysRemaining: shelfLife,
      quantity,
      unit: '개',
      status: 'fresh',
      storageType: selectedPreset.storageType,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await FoodInventoryService.addFood(food);

    // 유통기한 Task 자동 생성
    await createExpiryTask(food);

    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      {/* 검색 */}
      <SearchBar
        placeholder="식재료 검색 (예: 양파)"
        value={keyword}
        onChangeText={handleSearch}
      />

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <SearchResults>
          {searchResults.map(preset => (
            <PresetRow
              key={preset.id}
              preset={preset}
              onPress={() => handleSelectPreset(preset)}
            />
          ))}
        </SearchResults>
      )}

      {/* 선택된 프리셋 */}
      {selectedPreset && (
        <View style={styles.formSection}>
          <SelectedPreset preset={selectedPreset} />

          {/* 유통기한 조정 */}
          <FormField label="유통기한">
            <Counter
              value={shelfLife}
              onChange={setShelfLife}
              min={1}
              max={365}
              suffix="일"
            />
            <Text style={styles.hint}>
              기본: {selectedPreset.defaultShelfLife}일
            </Text>
          </FormField>

          {/* 수량 */}
          <FormField label="수량">
            <Counter
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={99}
              suffix="개"
            />
          </FormField>

          {/* 보관 팁 */}
          {selectedPreset.tips && (
            <TipBox>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>{selectedPreset.tips}</Text>
            </TipBox>
          )}

          {/* 추가 버튼 */}
          <Button
            title="추가하기"
            onPress={handleAdd}
          />
        </View>
      )}
    </ScrollView>
  );
};

const PresetRow = ({ preset, onPress }) => (
  <TouchableOpacity style={styles.presetRow} onPress={onPress}>
    <Text style={styles.presetIcon}>{preset.icon}</Text>
    <View style={styles.presetInfo}>
      <Text style={styles.presetName}>{preset.name}</Text>
      <Text style={styles.presetMeta}>
        {preset.storageType === 'fridge' ? '냉장' : preset.storageType === 'freezer' ? '냉동' : '실온'}
        {' · '}
        {preset.defaultShelfLife}일
      </Text>
    </View>
  </TouchableOpacity>
);
```

---

## 📋 냉장고 현황 화면

`src/screens/fridge/FridgeDetailScreen.tsx`:

```typescript
export const FridgeDetailScreen = ({ route }) => {
  const { itemId } = route.params;
  const { item } = useItem(itemId); // 냉장고 Item
  const { foods } = useFoodInventory(itemId);
  const { tasks } = useCleaningTasks({ itemId });

  // 탭
  const [activeTab, setActiveTab] = useState<'inventory' | 'cleaning'>('inventory');

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <FridgeHeader item={item} foods={foods} tasks={tasks} />

      {/* 탭 */}
      <TabBar>
        <Tab
          label="재고"
          active={activeTab === 'inventory'}
          onPress={() => setActiveTab('inventory')}
        />
        <Tab
          label="청소"
          active={activeTab === 'cleaning'}
          onPress={() => setActiveTab('cleaning')}
        />
      </TabBar>

      {/* 내용 */}
      {activeTab === 'inventory' && (
        <FridgeInventoryTab foods={foods} itemId={itemId} />
      )}
      {activeTab === 'cleaning' && (
        <FridgeCleaningTab tasks={tasks} />
      )}
    </View>
  );
};

// 재고 탭
const FridgeInventoryTab = ({ foods, itemId }) => {
  // 상태별 그룹핑
  const fresh = foods.filter(f => f.status === 'fresh');
  const useSoon = foods.filter(f => f.status === 'use_soon');
  const expired = foods.filter(f => f.status === 'expired');

  return (
    <ScrollView>
      {/* 유통기한 임박 */}
      {useSoon.length > 0 && (
        <Section title="⚠️ 곧 상해요" color="#FF9800">
          {useSoon.map(food => (
            <FoodRow key={food.id} food={food} />
          ))}
        </Section>
      )}

      {/* 만료 */}
      {expired.length > 0 && (
        <Section title="❌ 버려야 해요" color="#F44336">
          {expired.map(food => (
            <FoodRow key={food.id} food={food} />
          ))}
        </Section>
      )}

      {/* 신선 */}
      <Section title="✅ 신선해요" color="#4CAF50">
        {fresh.map(food => (
          <FoodRow key={food.id} food={food} />
        ))}
      </Section>

      {/* 추가 버튼 */}
      <Button
        title="+ 식재료 추가"
        onPress={() => navigateToAddFood(itemId)}
      />
    </ScrollView>
  );
};

const FoodRow = ({ food }) => {
  const color = {
    fresh: '#4CAF50',
    use_soon: '#FF9800',
    expired: '#F44336'
  }[food.status];

  return (
    <TouchableOpacity
      style={styles.foodRow}
      onPress={() => navigateToFoodDetail(food.id)}
    >
      <Text style={styles.foodIcon}>{food.icon}</Text>
      
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{food.name}</Text>
        <Text style={[styles.foodExpiry, { color }]}>
          {food.daysRemaining > 0
            ? `D-${food.daysRemaining}`
            : `${Math.abs(food.daysRemaining)}일 지남`}
        </Text>
      </View>

      <Text style={styles.foodQuantity}>
        {food.quantity}{food.unit}
      </Text>
    </TouchableOpacity>
  );
};
```

---

## 🔔 유통기한 알림

### 유통기한 Task 자동 생성

```typescript
// src/services/FoodInventoryService.ts

export class FoodInventoryService {
  /**
   * 식재료 추가 시 자동으로 유통기한 Task 생성
   */
  static async addFood(food: FoodInventory): Promise<void> {
    // 1. Firestore에 저장
    await saveDoc(db, `users/${food.userId}/inventories/${food.id}`, food);

    // 2. 유통기한 Task 생성
    const task: Task = {
      id: `task_expiry_${food.id}`,
      userId: food.userId,
      itemId: food.itemId,
      roomId: food.roomId,
      title: `${food.icon} ${food.name} 정리`,
      description: '유통기한이 임박했어요',
      type: 'food',
      recurrence: {
        type: 'fixed',
        interval: 1,
        unit: 'day',
        nextDue: food.expiryDate
      },
      priority: 'high',
      estimatedMinutes: 2,
      status: 'pending',
      notificationSettings: {
        enabled: true,
        timing: 'immediate',
        advanceHours: [24, 0] // 1일 전, 당일
      },
      completionHistory: [],
      scoreImpact: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await saveTask(task);
  }

  /**
   * 식재료 사용/폐기
   */
  static async removeFood(foodId: string): Promise<void> {
    // 1. 식재료 삭제
    await deleteDoc(db, `users/${userId}/inventories/${foodId}`);

    // 2. 연결된 Task 삭제
    const taskId = `task_expiry_${foodId}`;
    await deleteDoc(db, `users/${userId}/tasks/${taskId}`);
  }

  /**
   * 매일 실행: 유통기한 상태 업데이트
   */
  static async updateFoodStatus(): Promise<void> {
    const foods = await getAllFoods();

    for (const food of foods) {
      const daysRemaining = differenceInDays(food.expiryDate, new Date());
      
      let status: FoodInventory['status'];
      if (daysRemaining < 0) {
        status = 'expired';
      } else if (daysRemaining <= 2) {
        status = 'use_soon';
      } else {
        status = 'fresh';
      }

      if (food.status !== status) {
        await updateDoc(db, `users/${food.userId}/inventories/${food.id}`, {
          status,
          daysRemaining,
          updatedAt: new Date()
        });
      }
    }
  }
}
```

---

## 📊 냉장고 통계

### 식재료 낭비 추적

```typescript
const FridgeStatsScreen = () => {
  const { stats } = useFridgeStats();

  return (
    <ScrollView>
      {/* 이번 달 통계 */}
      <StatCard
        title="이번 달 버린 식재료"
        value={stats.wastedCount}
        suffix="개"
        icon="🗑️"
        color="#F44336"
      />
      <StatCard
        title="낭비 금액 (추정)"
        value={stats.wastedAmount}
        suffix="원"
        icon="💸"
        color="#FF9800"
      />
      <StatCard
        title="절약 성공"
        value={stats.savedCount}
        suffix="개"
        icon="✅"
        color="#4CAF50"
      />

      {/* 자주 버리는 식재료 */}
      <Section title="자주 버리는 식재료">
        {stats.mostWasted.map(food => (
          <FoodWasteRow key={food.name} food={food} />
        ))}
      </Section>

      {/* 추천 */}
      <TipBox>
        <Text>💡 {stats.mostWasted[0].name}는 {stats.mostWasted[0].count}번 버렸어요. 
        구매량을 줄여보세요.</Text>
      </TipBox>
    </ScrollView>
  );
};
```

---

## ✅ 테스트 체크리스트

- [ ] 냉장고 Item에 재고 Feature 추가
- [ ] 식재료 검색 (300개 프리셋)
- [ ] 식재료 추가 → 유통기한 Task 자동 생성
- [ ] 유통기한 임박 알림 (D-1, D-Day)
- [ ] 식재료 상태 자동 업데이트 (fresh/use_soon/expired)
- [ ] 냉장고 청소 + 재고 통합 화면
- [ ] 식재료 낭비 통계

---

## 🚀 다음 단계

- **09-medicine-v2.md**: 약 모듈 (공간 기반)
- **11-onboarding-v2.md**: 온보딩 (집 설정 포함)

---

**냉장고 통합 관리 완성! 🧊✨**
