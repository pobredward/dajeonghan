# 🏠 집 구조 커스터마이징 시스템

## 개요

사용자가 원룸/투룸/쓰리룸/포룸 중 선택하고, 방 크기와 가구를 자유롭게 배치할 수 있는 인터랙티브 집 관리 시스템입니다.

## 주요 기능

### 1. 집 타입 선택 (HouseLayoutSelectionScreen)
- ✅ 원룸: 통합 공간 + 욕실
- ✅ 투룸: 거실, 침실, 욕실
- ✅ 쓰리룸: 거실 + 방2개 + 욕실
- ✅ 포룸: 거실 + 주방 + 방3개

### 2. 집 에디터 (HouseEditorScreen)
**방 관리**:
- 방 추가/삭제
- 방 이름 변경
- 방 타입 변경 (거실, 침실, 주방, 욕실 등)

**가구 배치**:
- 18종 가구 지원
  - 주방: 냉장고, 싱크대, 가스레인지
  - 침실: 침대, 옷장, 화장대
  - 욕실: 변기, 욕조, 샤워기, 거울
  - 거실: 소파, TV, 테이블, 식물
  - 서재: 책상, 의자, 책장
  - 기타: 세탁기
- 가구 추가/삭제
- 각 가구는 이모지로 표시

### 3. 집 맵 뷰 (HouseMapScreen)
- 전체 집 구조 시각화
- 방별 가구 배치 확인
- 가구 클릭 → 연결된 작업 확인
- 먼지 쌓임 효과 (dirtyScore)
- 작업 개수 뱃지 표시
- 캐릭터 배치 (자기관리 접근)

## 데이터 구조

### HouseLayout
```typescript
interface HouseLayout {
  id: string;
  userId: string;
  layoutType: 'studio' | 'one_room' | 'two_room' | 'three_room' | 'four_room';
  totalRooms: number;
  canvasSize: { width: number; height: number };
  rooms: Room[];
  character: {
    position: { x: number; y: number };
    emoji: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Room
```typescript
interface Room {
  id: string;
  type: RoomType; // living_room, kitchen, bedroom, bathroom 등
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  furnitures: Furniture[];
}
```

### Furniture
```typescript
interface Furniture {
  id: string;
  type: FurnitureType; // bed, desk, fridge 등
  name: string;
  emoji: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  linkedObjectIds: string[]; // 연결된 LifeObject ID들
  dirtyScore: number; // 0-100
}
```

## Firestore 저장 구조

```
users/{userId}/
  └─ houseLayout/
      └─ main/
          ├─ layoutType: 'two_room'
          ├─ totalRooms: 3
          ├─ canvasSize: { width: 400, height: 500 }
          ├─ rooms: [...]
          ├─ character: {...}
          ├─ createdAt: Timestamp
          └─ updatedAt: Timestamp
```

## 사용 흐름

### 첫 사용자
1. "내 집" 탭 클릭
2. HouseLayoutSelectionScreen 표시
3. 원룸/투룸/쓰리룸/포룸 선택
4. HouseEditorScreen 자동 표시
5. 가구 추가/배치
6. "저장" 클릭
7. HouseMapScreen으로 이동

### 기존 사용자
1. "내 집" 탭 클릭
2. HouseMapScreen 바로 표시 (저장된 구조)
3. "✏️ 편집" 버튼 → HouseEditorScreen
4. 수정 후 저장

## 서비스 함수

### houseService.ts

```typescript
// 집 레이아웃 조회
await getHouseLayout(userId);

// 집 레이아웃 저장
await saveHouseLayout(layout);

// 방 추가
await addRoom(userId, roomData);

// 방 삭제
await removeRoom(userId, roomId);

// 가구 추가
await addFurniture(userId, roomId, furnitureData);

// 가구 삭제
await removeFurniture(userId, roomId, furnitureId);

// 템플릿 가져오기
const template = getLayoutTemplate('two_room');
```

## 컴포넌트 계층

```
TabNavigator
└─ HouseSetupFlow (Smart Component)
    ├─ HouseLayoutSelectionScreen (Step 1)
    ├─ HouseEditorScreen (Step 2)
    └─ HouseMapScreen (Final View)
```

## 향후 개선 사항

### Phase 1 (현재 완료)
- ✅ 집 타입 선택
- ✅ 가구 추가/삭제
- ✅ Firestore 저장
- ✅ 맵 뷰 시각화

### Phase 2 (다음 단계)
- [ ] 드래그로 방 크기 조정
- [ ] 드래그로 가구 위치 이동
- [ ] 가구 회전 (0°, 90°, 180°, 270°)
- [ ] 실시간 미리보기

### Phase 3 (고급 기능)
- [ ] 집 구조 템플릿 공유
- [ ] AI 추천 레이아웃
- [ ] 3D 뷰 (선택적)
- [ ] 사진 배경 (실제 집 사진 위에 오버레이)

## 주의사항

1. **SVG 성능**: 방과 가구가 많아지면 렌더링 성능 저하 가능
   - 해결: React Native Skia 고려
   
2. **데이터 크기**: 가구가 많으면 Firestore 문서 크기 증가
   - 해결: 가구 개수 제한 (방당 최대 20개)

3. **UX**: 처음 사용자에게는 복잡할 수 있음
   - 해결: 튜토리얼 추가 필요

## 테스트 시나리오

1. 새 사용자 온보딩
   - [ ] 집 타입 선택 화면 표시
   - [ ] 투룸 선택
   - [ ] 에디터에서 침대 추가
   - [ ] 저장 후 맵 뷰 확인

2. 기존 사용자
   - [ ] 저장된 집 구조 로드
   - [ ] 편집 버튼 클릭
   - [ ] 가구 추가
   - [ ] 저장 후 반영 확인

3. 가구 상호작용
   - [ ] 냉장고 클릭
   - [ ] 모달 표시
   - [ ] 연결된 작업 확인

## 기술 스택

- **UI**: React Native + Expo
- **그래픽**: react-native-svg
- **상태**: React Hooks
- **저장**: Firestore
- **타입**: TypeScript

## 관련 파일

```
src/
├── screens/house/
│   ├── HouseLayoutSelectionScreen.tsx   # 집 타입 선택
│   ├── HouseEditorScreen.tsx            # 집 에디터
│   ├── HouseMapScreen.tsx               # 집 맵 뷰
│   └── HouseSetupFlow.tsx               # 통합 플로우
├── types/
│   └── house.types.ts                   # 타입 정의
└── services/
    └── houseService.ts                  # Firestore 서비스
```

## 완료! 🎉

이제 사용자는:
1. 원룸/투룸/쓰리룸/포룸 선택 가능
2. 방 개수/크기 커스터마이징 가능
3. 가구 자유롭게 배치 가능
4. 시각적으로 집 전체 확인 가능

앱을 실행하고 "🏠 내 집" 탭을 확인해보세요!
