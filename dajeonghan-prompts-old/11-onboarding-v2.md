# 11. 온보딩 v2 (공간 기반 통합)

> **🎯 목표**: 집 구조 설정을 포함한 직관적이고 빠른 온보딩 경험 제공

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 집 타입 선택 (원룸, 투룸 등)
- ✅ 방 배치도 설정 (drag & drop)
- ✅ 아이템 선택 (냉장고, 세탁기 등)
- ✅ 기본 기능 활성화
- ✅ 3분 이내 완료 가능

**예상 소요 시간**: 1일

---

## 🎯 온보딩 흐름 v2

### 전체 단계

```
1. Welcome (환영)
   ↓
2. Home Type (집 타입 선택)
   ↓
3. Room Setup (방 설정)
   ↓
4. Item Selection (아이템 선택)
   ↓
5. Quick Feature Setup (기본 기능 활성화)
   ↓
6. Complete (완료)
```

**목표 시간**: 2-3분

---

## 📱 1단계: Welcome

`src/screens/onboarding/WelcomeScreen.tsx`:

```typescript
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Button } from '@/components/Button';

export const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* 일러스트 */}
      <Image
        source={require('@/assets/illustrations/welcome.png')}
        style={styles.illustration}
      />

      {/* 타이틀 */}
      <Text style={styles.title}>
        다정한에 오신 걸 환영해요 👋
      </Text>

      {/* 서브타이틀 */}
      <Text style={styles.subtitle}>
        집안일을 쉽고 재미있게 관리해보세요
      </Text>

      {/* 핵심 가치 */}
      <View style={styles.features}>
        <FeaturePoint
          icon="🏠"
          text="내 집 구조에 맞게"
        />
        <FeaturePoint
          icon="⏰"
          icon="딱 필요한 알림만"
        />
        <FeaturePoint
          icon="📊"
          text="한눈에 보는 현황"
        />
      </View>

      {/* 시작 버튼 */}
      <Button
        title="시작하기"
        onPress={() => navigation.navigate('HomeTypeSelection')}
        style={styles.startButton}
      />

      {/* 소요 시간 안내 */}
      <Text style={styles.timeEstimate}>⏱️ 약 2분 소요</Text>
    </View>
  );
};

const FeaturePoint = ({ icon, text }) => (
  <View style={styles.featurePoint}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);
```

---

## 🏠 2단계: Home Type Selection

`src/screens/onboarding/HomeTypeSelectionScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { HomeType } from '@/types/home-layout.types';

export const HomeTypeSelectionScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState<HomeType | null>(null);

  const homeTypes = [
    {
      type: 'one_room' as HomeType,
      label: '원룸',
      icon: '🏠',
      description: '방 1개 + 욕실',
      illustration: require('@/assets/home-types/one_room.png')
    },
    {
      type: 'studio' as HomeType,
      label: '오픈형 원룸',
      icon: '🏡',
      description: '주방이 거실과 연결',
      illustration: require('@/assets/home-types/studio.png')
    },
    {
      type: 'two_room' as HomeType,
      label: '투룸',
      icon: '🏘️',
      description: '방 2개 + 욕실',
      illustration: require('@/assets/home-types/two_room.png')
    },
    {
      type: 'apartment' as HomeType,
      label: '아파트',
      icon: '🏢',
      description: '방 3개 이상',
      illustration: require('@/assets/home-types/apartment.png')
    },
    {
      type: 'custom' as HomeType,
      label: '직접 설정',
      icon: '✏️',
      description: '내 집에 맞게 커스텀',
      illustration: null
    }
  ];

  const handleNext = () => {
    if (!selectedType) return;

    // 기본 방 생성
    const defaultRooms = generateDefaultRooms(selectedType);
    
    navigation.navigate('RoomSetup', {
      homeType: selectedType,
      defaultRooms
    });
  };

  return (
    <View style={styles.container}>
      {/* 진행 바 */}
      <ProgressBar current={1} total={5} />

      {/* 타이틀 */}
      <Text style={styles.title}>어떤 집에 살고 계신가요?</Text>

      {/* 타입 선택 */}
      <ScrollView style={styles.typeList}>
        {homeTypes.map(homeType => (
          <HomeTypeCard
            key={homeType.type}
            homeType={homeType}
            selected={selectedType === homeType.type}
            onSelect={() => setSelectedType(homeType.type)}
          />
        ))}
      </ScrollView>

      {/* 다음 버튼 */}
      <Button
        title="다음"
        onPress={handleNext}
        disabled={!selectedType}
      />
    </View>
  );
};

const HomeTypeCard = ({ homeType, selected, onSelect }) => (
  <TouchableOpacity
    style={[
      styles.typeCard,
      selected && styles.typeCardSelected
    ]}
    onPress={onSelect}
  >
    {homeType.illustration && (
      <Image
        source={homeType.illustration}
        style={styles.typeIllustration}
      />
    )}
    
    <View style={styles.typeInfo}>
      <Text style={styles.typeIcon}>{homeType.icon}</Text>
      <Text style={styles.typeLabel}>{homeType.label}</Text>
      <Text style={styles.typeDescription}>{homeType.description}</Text>
    </View>

    {selected && (
      <View style={styles.checkmark}>
        <Text>✓</Text>
      </View>
    )}
  </TouchableOpacity>
);

// 기본 방 생성
function generateDefaultRooms(homeType: HomeType): Room[] {
  switch (homeType) {
    case 'one_room':
      return [
        { type: 'bedroom', name: '방', position: { x: 0, y: 0 } },
        { type: 'bathroom', name: '욕실', position: { x: 1, y: 0 } }
      ];
    case 'two_room':
      return [
        { type: 'living_room', name: '거실', position: { x: 0, y: 0 } },
        { type: 'kitchen', name: '주방', position: { x: 1, y: 0 } },
        { type: 'bedroom', name: '방1', position: { x: 0, y: 1 } },
        { type: 'bedroom', name: '방2', position: { x: 1, y: 1 } },
        { type: 'bathroom', name: '욕실', position: { x: 0, y: 2 } }
      ];
    // ... 다른 타입들
  }
}
```

---

## 🛋️ 3단계: Room Setup

`src/screens/onboarding/RoomSetupScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Room } from '@/types/home-layout.types';

export const RoomSetupScreen = ({ route, navigation }) => {
  const { homeType, defaultRooms } = route.params;
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);

  const handleNext = () => {
    navigation.navigate('ItemSelection', {
      homeType,
      rooms
    });
  };

  return (
    <View style={styles.container}>
      <ProgressBar current={2} total={5} />

      <Text style={styles.title}>방을 확인해주세요</Text>
      <Text style={styles.subtitle}>
        길게 눌러서 순서를 바꾸거나, X로 제거할 수 있어요
      </Text>

      {/* 방 목록 (드래그 가능) */}
      <DraggableFlatList
        data={rooms}
        keyExtractor={item => item.id}
        renderItem={({ item, drag, isActive }) => (
          <RoomRow
            room={item}
            onDrag={drag}
            isActive={isActive}
            onRemove={() => removeRoom(item.id)}
            onEdit={() => editRoom(item.id)}
          />
        )}
        onDragEnd={({ data }) => setRooms(data)}
      />

      {/* 방 추가 버튼 */}
      <Button
        title="+ 방 추가"
        variant="outline"
        onPress={() => addRoom()}
      />

      {/* 건너뛰기 / 다음 */}
      <View style={styles.navigation}>
        <Button
          title="건너뛰기"
          variant="text"
          onPress={handleNext}
        />
        <Button
          title="다음"
          onPress={handleNext}
        />
      </View>
    </View>
  );
};

const RoomRow = ({ room, onDrag, isActive, onRemove, onEdit }) => (
  <TouchableOpacity
    style={[
      styles.roomRow,
      isActive && styles.roomRowActive
    ]}
    onLongPress={onDrag}
  >
    {/* 드래그 핸들 */}
    <Text style={styles.dragHandle}>☰</Text>

    {/* 방 정보 */}
    <View style={styles.roomInfo}>
      <Text style={styles.roomIcon}>{getRoomIcon(room.type)}</Text>
      <Text style={styles.roomName}>{room.name}</Text>
    </View>

    {/* 액션 */}
    <TouchableOpacity onPress={onEdit}>
      <Text style={styles.editIcon}>✏️</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onRemove}>
      <Text style={styles.removeIcon}>✕</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);
```

---

## 🧊 4단계: Item Selection

`src/screens/onboarding/ItemSelectionScreen.tsx`:

```typescript
export const ItemSelectionScreen = ({ route, navigation }) => {
  const { homeType, rooms } = route.params;
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});

  // 방별 추천 아이템
  const recommendedItems = {
    kitchen: ['fridge', 'sink', 'stove'],
    bathroom: ['toilet', 'washbasin', 'washing_machine'],
    living_room: ['sofa', 'tv', 'air_purifier'],
    bedroom: ['bed', 'closet']
  };

  const handleNext = async () => {
    // HomeLayout 생성
    const homeLayout = await createHomeLayout(homeType, rooms, selectedItems);
    
    navigation.navigate('FeatureSetup', { homeLayout });
  };

  return (
    <ScrollView style={styles.container}>
      <ProgressBar current={3} total={5} />

      <Text style={styles.title}>어떤 것들을 관리하고 싶으신가요?</Text>
      <Text style={styles.subtitle}>
        자주 사용하는 것들을 선택해주세요
      </Text>

      {/* 방별 아이템 선택 */}
      {rooms.map(room => (
        <RoomItemSection
          key={room.id}
          room={room}
          recommendedItems={recommendedItems[room.type] || []}
          selectedItems={selectedItems[room.id] || []}
          onToggleItem={(itemType) => toggleItem(room.id, itemType)}
        />
      ))}

      <Button title="다음" onPress={handleNext} />
    </ScrollView>
  );
};

const RoomItemSection = ({ room, recommendedItems, selectedItems, onToggleItem }) => {
  const items = getItemsByRoomType(room.type);

  return (
    <View style={styles.roomSection}>
      <Text style={styles.roomSectionTitle}>
        {getRoomIcon(room.type)} {room.name}
      </Text>

      <View style={styles.itemGrid}>
        {items.map(item => {
          const isRecommended = recommendedItems.includes(item.type);
          const isSelected = selectedItems.includes(item.type);

          return (
            <ItemCard
              key={item.type}
              item={item}
              selected={isSelected}
              recommended={isRecommended}
              onToggle={() => onToggleItem(item.type)}
            />
          );
        })}
      </View>
    </View>
  );
};

const ItemCard = ({ item, selected, recommended, onToggle }) => (
  <TouchableOpacity
    style={[
      styles.itemCard,
      selected && styles.itemCardSelected
    ]}
    onPress={onToggle}
  >
    {recommended && (
      <View style={styles.recommendedBadge}>
        <Text style={styles.recommendedText}>추천</Text>
      </View>
    )}

    <Text style={styles.itemIcon}>{item.icon}</Text>
    <Text style={styles.itemName}>{item.name}</Text>

    {selected && (
      <View style={styles.selectedCheckmark}>
        <Text>✓</Text>
      </View>
    )}
  </TouchableOpacity>
);
```

---

## ⚙️ 5단계: Feature Setup

`src/screens/onboarding/FeatureSetupScreen.tsx`:

```typescript
export const FeatureSetupScreen = ({ route, navigation }) => {
  const { homeLayout } = route.params;

  const handleComplete = async () => {
    // 기본 프리셋 적용
    await applyDefaultFeatures(homeLayout);

    // 온보딩 완료
    await markOnboardingComplete();

    navigation.navigate('Main');
  };

  return (
    <View style={styles.container}>
      <ProgressBar current={4} total={5} />

      <Text style={styles.title}>거의 다 됐어요! 🎉</Text>
      <Text style={styles.subtitle}>
        기본 설정을 적용할게요
      </Text>

      {/* 적용될 기능 미리보기 */}
      <FeaturePreview>
        <FeatureItem
          icon="🧹"
          title="청소 알림"
          description="건강에 중요한 청소부터 알려드려요"
        />
        <FeatureItem
          icon="🧊"
          title="식재료 관리"
          description="유통기한을 놓치지 않도록 도와드려요"
        />
        <FeatureItem
          icon="📊"
          title="집 점수"
          description="한눈에 집 상태를 확인하세요"
        />
      </FeaturePreview>

      {/* 완료 버튼 */}
      <Button
        title="시작하기"
        onPress={handleComplete}
        style={styles.completeButton}
      />
    </View>
  );
};

// 기본 프리셋 적용
async function applyDefaultFeatures(homeLayout: HomeLayout): Promise<void> {
  for (const room of homeLayout.rooms) {
    for (const item of room.items) {
      // 프리셋 조회
      const preset = getPresetByItemType(item.type);
      if (!preset) continue;

      // 필수 기능만 활성화
      const essentialFeatures = preset.defaultFeatures.filter(f => f.required);
      
      for (const feature of essentialFeatures) {
        await ItemFeatureService.activateFeature(item.id, feature);
      }
    }
  }
}
```

---

## 🎉 6단계: Complete

`src/screens/onboarding/CompleteScreen.tsx`:

```typescript
export const CompleteScreen = ({ navigation }) => {
  useEffect(() => {
    // 2초 후 메인으로
    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* 축하 애니메이션 */}
      <LottieView
        source={require('@/assets/animations/celebration.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      />

      <Text style={styles.title}>모든 준비가 끝났어요! 🎉</Text>
      <Text style={styles.subtitle}>
        다정한과 함께 깔끔한 집을 만들어가요
      </Text>
    </View>
  );
};
```

---

## 🔧 온보딩 유틸리티

### OnboardingService

`src/services/OnboardingService.ts`:

```typescript
export class OnboardingService {
  /**
   * 온보딩 완료 여부 확인
   */
  static async isOnboardingComplete(userId: string): Promise<boolean> {
    const userDoc = await getDoc(doc(db, `users/${userId}`));
    return userDoc.data()?.onboardingCompleted || false;
  }

  /**
   * 온보딩 완료 처리
   */
  static async markOnboardingComplete(userId: string): Promise<void> {
    await updateDoc(doc(db, `users/${userId}`), {
      onboardingCompleted: true,
      onboardingCompletedAt: new Date()
    });
  }

  /**
   * 온보딩 리셋 (개발/테스트용)
   */
  static async resetOnboarding(userId: string): Promise<void> {
    await updateDoc(doc(db, `users/${userId}`), {
      onboardingCompleted: false
    });
  }
}
```

---

## 🎨 온보딩 UI 원칙

### 디자인 가이드

```typescript
// 온보딩 전용 테마
export const OnboardingTheme = {
  colors: {
    primary: '#4CAF50',
    background: '#FFFFFF',
    text: '#333333',
    textSecondary: '#666666',
    border: '#E0E0E0'
  },
  spacing: {
    page: 24,
    section: 16,
    item: 12
  },
  animation: {
    duration: 300,
    easing: 'ease-in-out'
  }
};

// 진행 바
export const ProgressBar = ({ current, total }) => {
  const progress = (current / total) * 100;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${progress}%` }
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {current} / {total}
      </Text>
    </View>
  );
};
```

---

## ✅ 테스트 체크리스트

- [ ] Welcome 화면 표시
- [ ] 집 타입 선택
- [ ] 기본 방 자동 생성
- [ ] 방 순서 변경 (drag & drop)
- [ ] 방 추가/제거
- [ ] 아이템 선택 (방별)
- [ ] 기본 프리셋 적용
- [ ] 온보딩 완료 후 메인 화면 이동
- [ ] 온보딩 완료 상태 저장

---

## 🚀 다음 단계

- **12-growth.md**: 사용자 리텐션 전략
- **13-ui-ux-v2.md**: UI/UX 최적화

---

**3분 만에 완료하는 직관적 온보딩! 🎉✨**
