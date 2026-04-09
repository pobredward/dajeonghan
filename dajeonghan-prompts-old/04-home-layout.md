# 04. 집 배치도 시스템 (Home Layout System)

> **🎯 목표**: 사용자의 실제 집 구조를 디지털로 재현하는 직관적인 공간 설정 시스템 구현

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 집 유형 선택 화면 작동 (원룸, 투룸, 아파트, 커스텀)
- ✅ Drag & Drop 방 배치 기능
- ✅ 방별 아이템 팔레트 시스템
- ✅ 아이템 활성화/비활성화 토글
- ✅ HomeLayout 데이터 Firestore 저장

**예상 소요 시간**: 1.5-2일

---

## 🏗️ 데이터 모델

### 핵심 타입 정의

`src/types/home-layout.types.ts`:

```typescript
export type HomeType = 
  | 'one_room'      // 원룸
  | 'studio'        // 오픈형 원룸
  | 'two_room'      // 투룸
  | 'apartment'     // 아파트
  | 'custom';       // 직접 구성

export type RoomType =
  | 'kitchen'       // 주방
  | 'bathroom'      // 화장실
  | 'living_room'   // 거실
  | 'bedroom'       // 침실
  | 'entrance'      // 현관
  | 'balcony'       // 베란다
  | 'storage'       // 창고/다용도실
  | 'custom';       // 커스텀

export type ItemType =
  // 주방
  | 'fridge'        // 냉장고
  | 'sink'          // 싱크대
  | 'stove'         // 가스레인지/인덕션
  | 'microwave'     // 전자레인지
  | 'dishwasher'    // 식기세척기
  | 'oven'          // 오븐
  | 'rice_cooker'   // 밥솥
  // 화장실
  | 'toilet'        // 변기
  | 'washbasin'     // 세면대
  | 'shower'        // 샤워부스
  | 'bathtub'       // 욕조
  | 'washing_machine' // 세탁기
  | 'dryer'         // 건조기
  // 거실
  | 'sofa'          // 소파
  | 'tv'            // TV
  | 'air_purifier'  // 공기청정기
  | 'humidifier'    // 가습기
  // 침실
  | 'bed'           // 침대
  | 'closet'        // 옷장
  | 'desk'          // 책상
  // 기타
  | 'plant'         // 화분
  | 'custom';       // 커스텀

export interface HomeLayout {
  id: string;
  userId: string;
  homeType: HomeType;
  totalArea?: number;        // 평수 (선택)
  rooms: Room[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  type: RoomType;
  name: string;               // "주방", "안방", "작은방" 등
  customName?: string;        // 사용자 지정 이름
  position: { x: number; y: number };  // 지도에서의 위치
  size: { width: number; height: number }; // 상대적 크기
  color: string;              // UI 테마 색상
  items: RoomItem[];
  score: number;              // 0-100 (계산값)
  isEnabled: boolean;         // 활성화 여부
}

export interface RoomItem {
  id: string;
  type: ItemType;
  name: string;
  customName?: string;
  icon: string;               // emoji 또는 icon name
  position: { x: number; y: number };  // 방 안에서의 상대 위치
  features: ItemFeature[];
  score: number;              // 0-100 (계산값)
  isEnabled: boolean;
  metadata?: any;             // 아이템별 추가 정보
}

export interface ItemFeature {
  id: string;
  category: FeatureCategory;
  name: string;
  enabled: boolean;
  config: any;                // 기능별 설정
}

export type FeatureCategory =
  | 'cleaning'                // 청소 주기
  | 'inventory'               // 재고 관리
  | 'maintenance'             // 유지보수
  | 'reminder';               // 일반 알림
```

---

## 🎨 UI 구현

### 1. 집 유형 선택 화면

`src/screens/onboarding/HomeTypeSelectionScreen.tsx`:

```typescript
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HomeType } from '@/types/home-layout.types';

const HOME_TYPES = [
  {
    id: 'one_room' as HomeType,
    name: '원룸',
    icon: '🏠',
    description: '주방과 거실이 하나로, 화장실 분리',
    estimatedTime: '5분',
    defaultRooms: ['main_room', 'bathroom']
  },
  {
    id: 'studio' as HomeType,
    name: '오픈형 원룸',
    icon: '🏘️',
    description: '모든 공간이 오픈된 구조',
    estimatedTime: '3분',
    defaultRooms: ['open_space', 'bathroom']
  },
  {
    id: 'two_room' as HomeType,
    name: '투룸',
    icon: '🏡',
    description: '방 2개 + 거실 + 주방 + 화장실',
    estimatedTime: '8분',
    defaultRooms: ['living_room', 'bedroom', 'bedroom2', 'kitchen', 'bathroom']
  },
  {
    id: 'apartment' as HomeType,
    name: '아파트 (3룸+)',
    icon: '🏢',
    description: '방 3개 이상 + 베란다',
    estimatedTime: '10분',
    defaultRooms: ['living_room', 'master_bedroom', 'bedroom2', 'bedroom3', 'kitchen', 'bathroom', 'balcony']
  },
  {
    id: 'custom' as HomeType,
    name: '직접 구성',
    icon: '✏️',
    description: '처음부터 자유롭게 만들기',
    estimatedTime: '15분',
    defaultRooms: []
  }
];

export const HomeTypeSelectionScreen = () => {
  const navigation = useNavigation();

  const handleSelectHomeType = (homeType: HomeType) => {
    navigation.navigate('RoomSetup', { homeType });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>어떤 집에 사시나요?</Text>
        <Text style={styles.subtitle}>
          당신의 집 구조를 선택하면 자동으로 설정해드려요
        </Text>
      </View>

      <View style={styles.cardContainer}>
        {HOME_TYPES.map((homeType) => (
          <TouchableOpacity
            key={homeType.id}
            style={styles.card}
            onPress={() => handleSelectHomeType(homeType.id)}
          >
            <Text style={styles.cardIcon}>{homeType.icon}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{homeType.name}</Text>
              <Text style={styles.cardDescription}>
                {homeType.description}
              </Text>
              <Text style={styles.cardTime}>
                ⏱️ 예상 시간: {homeType.estimatedTime}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 나중에 언제든지 방을 추가하거나 수정할 수 있어요
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
  },
  cardContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  cardTime: {
    fontSize: 12,
    color: '#2196F3',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});
```

---

### 2. 방 설정 화면 (Drag & Drop)

`src/screens/onboarding/RoomSetupScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Room, RoomType } from '@/types/home-layout.types';
import { generateRoomId } from '@/utils/idGenerator';

interface RoomSetupScreenProps {
  route: {
    params: {
      homeType: HomeType;
    };
  };
}

export const RoomSetupScreen: React.FC<RoomSetupScreenProps> = ({ route }) => {
  const { homeType } = route.params;
  const [rooms, setRooms] = useState<Room[]>(
    getDefaultRoomsForHomeType(homeType)
  );

  const renderRoomItem = ({ item, drag, isActive }: RenderItemParams<Room>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.roomItem,
            isActive && styles.roomItemActive,
          ]}
        >
          <View style={styles.dragHandle}>
            <Text style={styles.dragHandleIcon}>☰</Text>
          </View>
          <View style={styles.roomContent}>
            <Text style={styles.roomName}>{item.name}</Text>
            <Text style={styles.roomSize}>
              {item.size.width}×{item.size.height}
            </Text>
          </View>
          <Switch
            value={item.isEnabled}
            onValueChange={(value) => {
              const updated = rooms.map(r =>
                r.id === item.id ? { ...r, isEnabled: value } : r
              );
              setRooms(updated);
            }}
          />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>방 배치하기</Text>
        <Text style={styles.subtitle}>
          길게 눌러서 순서를 변경하거나, 토글로 비활성화하세요
        </Text>
      </View>

      <DraggableFlatList
        data={rooms}
        onDragEnd={({ data }) => setRooms(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderRoomItem}
        contentContainerStyle={styles.listContainer}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // 방 추가 모달 열기
          }}
        >
          <Text style={styles.addButtonText}>+ 방 추가</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            // 다음 단계: 아이템 선택
          }}
        >
          <Text style={styles.nextButtonText}>다음</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

// 집 유형별 기본 방 생성
function getDefaultRoomsForHomeType(homeType: HomeType): Room[] {
  const baseRooms: { [key in HomeType]: Partial<Room>[] } = {
    one_room: [
      { type: 'living_room', name: '거실/주방', size: { width: 3, height: 3 } },
      { type: 'bathroom', name: '화장실', size: { width: 2, height: 2 } },
    ],
    studio: [
      { type: 'living_room', name: '메인 공간', size: { width: 4, height: 3 } },
      { type: 'bathroom', name: '화장실', size: { width: 2, height: 2 } },
    ],
    two_room: [
      { type: 'living_room', name: '거실', size: { width: 3, height: 3 } },
      { type: 'kitchen', name: '주방', size: { width: 2, height: 2 } },
      { type: 'bedroom', name: '안방', size: { width: 3, height: 3 } },
      { type: 'bedroom', name: '작은방', size: { width: 2, height: 2 } },
      { type: 'bathroom', name: '화장실', size: { width: 2, height: 2 } },
    ],
    apartment: [
      { type: 'living_room', name: '거실', size: { width: 4, height: 3 } },
      { type: 'kitchen', name: '주방', size: { width: 3, height: 2 } },
      { type: 'bedroom', name: '안방', size: { width: 3, height: 3 } },
      { type: 'bedroom', name: '작은방', size: { width: 2, height: 2 } },
      { type: 'bedroom', name: '서재', size: { width: 2, height: 2 } },
      { type: 'bathroom', name: '화장실', size: { width: 2, height: 2 } },
      { type: 'balcony', name: '베란다', size: { width: 3, height: 1 } },
    ],
    custom: [],
  };

  return baseRooms[homeType].map((room, index) => ({
    id: generateRoomId(),
    type: room.type!,
    name: room.name!,
    position: { x: 0, y: index * 100 },
    size: room.size!,
    color: getRoomColor(room.type!),
    items: [],
    score: 100,
    isEnabled: true,
  }));
}

function getRoomColor(roomType: RoomType): string {
  const colors = {
    kitchen: '#FF9800',
    bathroom: '#2196F3',
    living_room: '#4CAF50',
    bedroom: '#9C27B0',
    entrance: '#795548',
    balcony: '#00BCD4',
    storage: '#607D8B',
    custom: '#9E9E9E',
  };
  return colors[roomType];
}

const styles = StyleSheet.create({
  // ... 스타일 정의
});
```

---

### 3. 아이템 선택 화면

`src/screens/onboarding/ItemSelectionScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Room, RoomItem, ItemType } from '@/types/home-layout.types';
import { Checkbox } from '@/components/Checkbox';

const ITEM_PRESETS: { [key in RoomType]?: ItemPresetGroup } = {
  kitchen: {
    required: [
      { type: 'fridge', name: '냉장고', icon: '🧊' },
      { type: 'sink', name: '싱크대', icon: '🚰' },
    ],
    optional: [
      { type: 'stove', name: '가스레인지/인덕션', icon: '🔥' },
      { type: 'microwave', name: '전자레인지', icon: '📻' },
      { type: 'dishwasher', name: '식기세척기', icon: '🍽️' },
      { type: 'oven', name: '오븐', icon: '🥐' },
      { type: 'rice_cooker', name: '밥솥', icon: '🍚' },
    ],
  },
  bathroom: {
    required: [
      { type: 'toilet', name: '변기', icon: '🚽' },
      { type: 'washbasin', name: '세면대', icon: '🚿' },
    ],
    optional: [
      { type: 'shower', name: '샤워부스', icon: '🚿' },
      { type: 'bathtub', name: '욕조', icon: '🛁' },
      { type: 'washing_machine', name: '세탁기', icon: '👕' },
      { type: 'dryer', name: '건조기', icon: '💨' },
    ],
  },
  // ... 다른 방 타입
};

interface ItemSelectionScreenProps {
  room: Room;
  onComplete: (items: RoomItem[]) => void;
}

export const ItemSelectionScreen: React.FC<ItemSelectionScreenProps> = ({
  room,
  onComplete,
}) => {
  const presets = ITEM_PRESETS[room.type] || { required: [], optional: [] };
  const [selectedItems, setSelectedItems] = useState<Set<ItemType>>(
    new Set(presets.required.map(item => item.type))
  );

  const toggleItem = (itemType: ItemType) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(itemType)) {
      newSet.delete(itemType);
    } else {
      newSet.add(itemType);
    }
    setSelectedItems(newSet);
  };

  const handleNext = () => {
    const items: RoomItem[] = Array.from(selectedItems).map((type, index) => {
      const preset = [...presets.required, ...presets.optional].find(
        p => p.type === type
      )!;
      
      return {
        id: `${room.id}_${type}_${Date.now()}`,
        type,
        name: preset.name,
        icon: preset.icon,
        position: { x: index * 50, y: 50 },
        features: [],
        score: 100,
        isEnabled: true,
      };
    });

    onComplete(items);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{room.name}에 있는 것들</Text>
        <Text style={styles.subtitle}>
          있는 것만 체크하세요 (나중에 추가/삭제 가능)
        </Text>
      </View>

      {/* 필수 아이템 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>필수 아이템</Text>
        <Text style={styles.sectionSubtitle}>
          기본으로 선택되어 있어요
        </Text>
        {presets.required.map((item) => (
          <ItemCheckbox
            key={item.type}
            item={item}
            checked={selectedItems.has(item.type)}
            onToggle={() => toggleItem(item.type)}
            disabled={false}
          />
        ))}
      </View>

      {/* 선택 아이템 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>선택 아이템</Text>
        <Text style={styles.sectionSubtitle}>
          있다면 체크하세요
        </Text>
        {presets.optional.map((item) => (
          <ItemCheckbox
            key={item.type}
            item={item}
            checked={selectedItems.has(item.type)}
            onToggle={() => toggleItem(item.type)}
          />
        ))}
      </View>

      {/* 커스텀 추가 */}
      <TouchableOpacity style={styles.addCustomButton}>
        <Text style={styles.addCustomButtonText}>
          + 여기에 없는 아이템 추가
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            다음 ({selectedItems.size}개 선택됨)
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const ItemCheckbox = ({ item, checked, onToggle, disabled = false }) => (
  <TouchableOpacity
    style={[styles.itemRow, checked && styles.itemRowChecked]}
    onPress={onToggle}
    disabled={disabled}
  >
    <Text style={styles.itemIcon}>{item.icon}</Text>
    <Text style={styles.itemName}>{item.name}</Text>
    <Checkbox checked={checked} onChange={onToggle} disabled={disabled} />
  </TouchableOpacity>
);
```

---

## 🔧 서비스 레이어

`src/services/homeLayoutService.ts`:

```typescript
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/firebaseConfig';
import { HomeLayout, Room, RoomItem } from '@/types/home-layout.types';

export class HomeLayoutService {
  /**
   * 홈 레이아웃 저장
   */
  static async saveHomeLayout(userId: string, layout: HomeLayout): Promise<void> {
    const layoutRef = doc(db, `users/${userId}/homeLayout/main`);
    await setDoc(layoutRef, {
      ...layout,
      updatedAt: new Date()
    });
  }

  /**
   * 홈 레이아웃 조회
   */
  static async getHomeLayout(userId: string): Promise<HomeLayout | null> {
    const layoutRef = doc(db, `users/${userId}/homeLayout/main`);
    const layoutSnap = await getDoc(layoutRef);
    
    if (!layoutSnap.exists()) return null;
    
    return layoutSnap.data() as HomeLayout;
  }

  /**
   * 방 추가
   */
  static async addRoom(userId: string, room: Room): Promise<void> {
    const layout = await this.getHomeLayout(userId);
    if (!layout) throw new Error('HomeLayout not found');

    layout.rooms.push(room);
    await this.saveHomeLayout(userId, layout);
  }

  /**
   * 아이템 추가
   */
  static async addItem(
    userId: string,
    roomId: string,
    item: RoomItem
  ): Promise<void> {
    const layout = await this.getHomeLayout(userId);
    if (!layout) throw new Error('HomeLayout not found');

    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');

    room.items.push(item);
    await this.saveHomeLayout(userId, layout);
  }

  /**
   * 전체 점수 계산
   */
  static calculateOverallScore(layout: HomeLayout): number {
    if (layout.rooms.length === 0) return 100;

    const enabledRooms = layout.rooms.filter(r => r.isEnabled);
    if (enabledRooms.length === 0) return 100;

    const totalScore = enabledRooms.reduce((sum, room) => sum + room.score, 0);
    return Math.round(totalScore / enabledRooms.length);
  }
}
```

---

## ✅ 테스트 체크리스트

- [ ] 집 유형 선택 화면에서 5가지 옵션 표시
- [ ] 각 옵션 클릭 시 다음 화면 이동
- [ ] 방 목록 Drag & Drop 순서 변경 작동
- [ ] 방 활성화/비활성화 토글 작동
- [ ] 아이템 선택 화면에서 필수/선택 구분 표시
- [ ] 선택한 아이템 수 실시간 표시
- [ ] Firestore에 HomeLayout 저장 확인
- [ ] 저장된 레이아웃 불러오기 확인

---

## 🚀 다음 단계

- **05-space-items.md**: 아이템별 기능 설정
- **06-visualization.md**: 시각화 시스템

---

**집의 디지털 트윈을 만들었습니다! 🏠✨**
