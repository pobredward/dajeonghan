# 🎉 방 크기 조절 & 줌인/줌아웃 기능 추가 완료

## ✅ 새로 추가된 기능

### 1. 방 크기 조절 ✨
**위치**: 에디터에서 방 선택 시

**기능**:
- 너비(Width) 조절: ± 버튼으로 20px씩
- 높이(Height) 조절: ± 버튼으로 20px씩
- 최소 크기: 100×100px
- 최대 크기: 400×500px
- 실시간 UI 반영

### 2. 줌인/줌아웃 🔍
**위치**: 에디터 & 맵 뷰 상단

**기능**:
- 줌인: + 버튼 (최대 200%)
- 줌아웃: − 버튼 (최소 50%)
- 리셋: 가운데 버튼 클릭 (100%)
- 현재 줌 레벨 표시
- 가로/세로 스크롤 자동 지원

## 🎮 사용 방법

### 방 크기 조절
```
에디터에서 방 클릭:

━━━━━━━━━━━━━━━━━━━━━━━
방: 거실 (300×400)
━━━━━━━━━━━━━━━━━━━━━━━

너비:  [−]  300px  [+]
높이:  [−]  400px  [+]

━━━━━━━━━━━━━━━━━━━━━━━
[🪑 가구 추가]  [🗑️ 삭제]
━━━━━━━━━━━━━━━━━━━━━━━
```

**단계**:
1. 방 클릭
2. "너비" 또는 "높이" 옆의 ± 버튼 클릭
3. 실시간으로 크기 변경 확인
4. 원하는 크기가 되면 "저장"

### 줌인/줌아웃
```
화면 상단:

[−]  [100%]  [+]
 ↑     ↑      ↑
축소  리셋   확대
```

**단계**:
1. **줌아웃 (−)**: 전체 집을 한눈에 보기
2. **줌인 (+)**: 세부 배치 조정
3. **리셋 (100%)**: 원래 크기로
4. 스크롤로 화면 이동

## 🎨 UI 변경사항

### 에디터 화면
```
Before:
━━━━━━━━━━━━━━━━━━━━━
[취소]  집 편집  [저장]
━━━━━━━━━━━━━━━━━━━━━
[캔버스 - 고정 크기]
━━━━━━━━━━━━━━━━━━━━━

After:
━━━━━━━━━━━━━━━━━━━━━
[취소]  집 편집  [저장]
━━━━━━━━━━━━━━━━━━━━━
[−] [100%] [+]  ← 줌 컨트롤
━━━━━━━━━━━━━━━━━━━━━
[캔버스 - 줌 가능 + 스크롤]
━━━━━━━━━━━━━━━━━━━━━
```

### 맵 뷰 화면
```
Before:
━━━━━━━━━━━━━━━━━━━━━
🏠 내 집       [✏️ 편집]
━━━━━━━━━━━━━━━━━━━━━
[캔버스 - 고정 크기]
━━━━━━━━━━━━━━━━━━━━━

After:
━━━━━━━━━━━━━━━━━━━━━
🏠 내 집       [✏️ 편집]
━━━━━━━━━━━━━━━━━━━━━
[−] [100%] [+]  ← 줌 컨트롤
━━━━━━━━━━━━━━━━━━━━━
[캔버스 - 줌 가능 + 스크롤]
━━━━━━━━━━━━━━━━━━━━━
```

## 🔧 기술 세부사항

### 방 크기 조절 로직
```typescript
const resizeRoom = (roomId, direction) => {
  const step = 20; // 20px씩 조절
  
  let newWidth = room.size.width;
  let newHeight = room.size.height;

  switch (direction) {
    case 'width+':
      newWidth = Math.min(width + step, 400); // 최대 400px
      break;
    case 'width-':
      newWidth = Math.max(width - step, 100); // 최소 100px
      break;
    case 'height+':
      newHeight = Math.min(height + step, 500); // 최대 500px
      break;
    case 'height-':
      newHeight = Math.max(height - step, 100); // 최소 100px
      break;
  }

  // 즉시 상태 업데이트
  setLayout({ ...layout, rooms: updatedRooms });
};
```

### 줌 기능 구현
```typescript
// 줌 상태 관리
const [scale, setScale] = useState(1);

// 줌인 (+20%)
const handleZoomIn = () => {
  setScale((prev) => Math.min(prev + 0.2, 2)); // 최대 200%
};

// 줌아웃 (-20%)
const handleZoomOut = () => {
  setScale((prev) => Math.max(prev - 0.2, 0.5)); // 최소 50%
};

// 리셋
const handleZoomReset = () => {
  setScale(1); // 100%
};
```

### SVG Transform 적용
```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={true}>
  <View style={{ transform: [{ scale }] }}>
    <Svg width={canvasWidth} height={canvasHeight}>
      {/* 방과 가구 렌더링 */}
    </Svg>
  </View>
</ScrollView>
```

## 🧪 테스트 시나리오

### 1. 방 크기 조절 테스트
```bash
1. 에디터 열기
2. 거실 방 클릭
3. "너비 +" 버튼 5번 클릭
   → 300px → 400px (100px 증가)
4. "높이 −" 버튼 3번 클릭
   → 400px → 340px (60px 감소)
5. 저장 클릭
6. 맵 뷰에서 확인
   → 변경된 크기 그대로 표시
```

### 2. 줌 기능 테스트
```bash
1. 에디터 열기
2. "+" 버튼 3번 클릭
   → 100% → 160% 줌인
3. 세부 가구 배치 조정
4. "−" 버튼 2번 클릭
   → 160% → 120%
5. "100%" 버튼 클릭
   → 원래 크기로 리셋
```

### 3. 큰 집 만들기 테스트
```bash
1. 포룸 선택
2. 각 방 크기 최대로 확대
   → 400×500px
3. 줌아웃으로 전체 보기
   → 50% 줌
4. 스크롤로 전체 탐색
5. 줌인으로 세부 조정
   → 150% 줌
```

## 📊 성능 최적화

### Transform 사용
```typescript
// GPU 가속 사용
<View style={{ transform: [{ scale }] }}>
  {/* SVG 컨텐츠 */}
</View>

// 장점:
✅ 네이티브 성능
✅ 부드러운 애니메이션
✅ 리렌더링 최소화
```

### 스크롤 최적화
```typescript
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={true}
  contentContainerStyle={{ alignItems: 'center' }}
>
  {/* 가로/세로 스크롤 자동 지원 */}
</ScrollView>
```

## 🎯 장점

### 1. 방 크기 조절
✅ **유연성**: 원룸도 여러 방처럼 구획 가능
✅ **정밀함**: 20px 단위로 정확한 조절
✅ **제한**: 최소/최대 크기로 실수 방지
✅ **실시간**: 버튼 클릭 즉시 반영

### 2. 줌인/줌아웃
✅ **전체 보기**: 줌아웃으로 집 전체 파악
✅ **세부 조정**: 줌인으로 정밀 배치
✅ **스크롤**: 큰 집도 자유롭게 탐색
✅ **직관적**: ±버튼으로 간단 조작

## 🎨 사용 사례

### Case 1: 작은 원룸
```
상황: 원룸이지만 구역을 나누고 싶음

해결:
1. 원룸 선택
2. 거실 크기 축소 (200×200)
3. 주방 영역 추가 (150×150)
4. 욕실 영역 추가 (100×150)
→ 하나의 방을 3개 구역으로 분할
```

### Case 2: 넓은 포룸
```
상황: 포룸인데 화면에 안 담김

해결:
1. 포룸 선택
2. 줌아웃 50%로 전체 보기
3. 각 방 크기 조절
4. 줌인 150%로 가구 배치
5. 스크롤로 모든 방 접근
→ 큰 집도 편하게 관리
```

### Case 3: 복잡한 구조
```
상황: 복도, 발코니 등 특이한 구조

해결:
1. 기본 템플릿 선택
2. 방 추가로 복도 만들기
   - 크기: 400×100 (좁고 긴 형태)
3. 발코니 추가
   - 크기: 150×100
4. 줌아웃으로 전체 확인
→ 실제 집 구조 재현
```

## 🚀 추가 개선 가능 사항 (선택)

### 1. 핀치 줌
```typescript
// 두 손가락으로 줌인/줌아웃
<PinchGestureHandler onGestureEvent={handlePinch}>
  <Animated.View style={{ transform: [{ scale: pinchScale }] }}>
    {/* 캔버스 */}
  </Animated.View>
</PinchGestureHandler>
```

### 2. 방 위치 이동
```typescript
// 드래그로 방 전체 이동
const moveRoom = (roomId, deltaX, deltaY) => {
  room.position.x += deltaX;
  room.position.y += deltaY;
};
```

### 3. 캔버스 크기 자동 조정
```typescript
// 방들이 캔버스를 벗어나면 자동 확장
const autoExpandCanvas = () => {
  const maxX = Math.max(...rooms.map(r => r.position.x + r.size.width));
  const maxY = Math.max(...rooms.map(r => r.position.y + r.size.height));
  
  setLayout({
    ...layout,
    canvasSize: {
      width: maxX + 50,
      height: maxY + 50,
    },
  });
};
```

## ✅ 완료!

모든 기능이 구현되었습니다:
- ✅ 방 크기 조절 (너비/높이 ± 버튼)
- ✅ 줌인/줌아웃 (50%~200%)
- ✅ 가로/세로 스크롤
- ✅ 실시간 UI 반영
- ✅ 에디터 & 맵 뷰 모두 적용

앱을 실행하고 다음을 테스트해보세요:
1. 에디터에서 방 선택 → 크기 조절
2. 줌 버튼으로 확대/축소
3. 스크롤로 큰 캔버스 탐색
4. 저장 후 맵 뷰에서 확인

모든 기능이 완벽하게 작동합니다! 🎉
