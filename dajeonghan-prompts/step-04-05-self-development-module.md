# Step 04-05. 자기계발 모듈 구현

> **🎯 목표**: 습관 형성과 목표 달성을 위한 트래킹 시스템 구현 (추후 확장)

## 📌 단계 정보

**순서**: Step 04-05/12  
**Phase**: Phase 2 - 기능 모듈 (Features)  
**의존성**: Step 03 완료 필수  
**병렬 가능**: Step 04-01~04-04와 동시 진행 가능  
**예상 소요 시간**: TBD (추후 설계)  
**난이도**: ⭐⭐⭐

### 이전 단계 요구사항
- ✅ Step 03 완료: 공통 엔진 (RecurrenceEngine, PriorityCalculator 등)

### 다음 단계
- **Step 05**: 온보딩 시스템

### 현재 상태
**설계 진행 중** - 이 모듈은 추후 Phase 3에서 구현 예정입니다.

---

## 🎯 목표 및 비전

### 핵심 컨셉

자기계발 모듈은 **"습관 형성"**과 **"목표 추적"**을 위한 시스템입니다:
- ✅ 작은 습관부터 시작 (예: 하루 10분 독서)
- ✅ 시각적 진행률 피드백
- ✅ 연속 달성 배지 시스템
- ✅ 목표 달성 시 성취감 제공

### 차별화 요소

다른 습관 트래커 앱들과의 차이:
1. **다정한 통합**: 청소/냉장고/약/자기관리와 함께 관리
2. **부담 최소화**: 복잡한 기록보다 간단한 체크
3. **알림 통합**: 기존 다이제스트 알림에 자연스럽게 포함

---

## 📋 잠재적 기능 목록

### 카테고리

```typescript
export type SelfDevelopmentCategory = 
  | 'reading'      // 📚 독서
  | 'exercise'     // 🏋️ 운동
  | 'learning'     // 🎓 학습 (온라인 강의, 자격증)
  | 'meditation'   // 🧘 명상/마음챙김
  | 'hobby'        // 🎨 취미 (악기, 그림)
  | 'language'     // 💬 외국어 학습
  | 'journaling'   // 📝 일기 작성
  | 'networking'   // 👥 네트워킹
  | 'side_project' // 💡 사이드 프로젝트
  | 'custom';      // ⚙️ 커스텀
```

### 기능 아이디어

#### 1. 독서 트래커 📚
- 읽고 있는 책 목록
- 페이지 진행률
- 독서 시간 기록
- 독서 노트 (간단한 메모)

#### 2. 운동 기록 🏋️
- 운동 종류 (유산소, 근력, 스트레칭)
- 운동 시간 기록
- 주간 목표 달성률
- 휴식일 관리

#### 3. 학습 트래커 🎓
- 온라인 강의 진행률
- 학습 시간 기록
- 자격증 준비 D-day
- 학습 자료 링크

#### 4. 습관 형성 ⭐
- 7일 연속 달성 배지
- 30일 챌린지
- 연속 기록 (streak)
- 최장 기록 보관

#### 5. 목표 설정 🎯
- SMART 목표 설정
- 단기/중기/장기 목표
- 마일스톤 설정
- 목표 달성률 시각화

---

## 데이터 모델 (초안)

`src/modules/self-development/types.ts`:

```typescript
import { LifeObject } from '@/types/task.types';

export interface SelfDevelopmentObject extends LifeObject {
  type: 'self_development';
  metadata: SelfDevelopmentMetadata;
}

export interface SelfDevelopmentMetadata {
  category: SelfDevelopmentCategory;
  
  // 목표 설정
  goal: string; // '하루 30분 독서', '주 3회 운동'
  
  // 진행률 추적
  progressTracking: ProgressTracking;
  
  // 연속 기록
  streak?: StreakInfo;
  
  // 배지
  badges?: Badge[];
  
  // 메모
  notes?: string;
}

export type SelfDevelopmentCategory = 
  | 'reading' | 'exercise' | 'learning' | 'meditation' 
  | 'hobby' | 'language' | 'journaling' | 'networking' 
  | 'side_project' | 'custom';

export interface ProgressTracking {
  target: number;      // 목표값 (예: 100페이지, 60분)
  current: number;     // 현재값
  unit: string;        // '페이지', '분', '회'
  startDate: Date;
  targetDate?: Date;   // 목표 달성 날짜
}

export interface StreakInfo {
  currentStreak: number;  // 현재 연속 일수
  longestStreak: number;  // 최장 연속 일수
  lastCompletedDate: Date;
}

export interface Badge {
  id: string;
  name: string;          // '7일 연속', '30일 챌린지'
  icon: string;          // '🔥', '⭐', '🏆'
  earnedDate: Date;
  description: string;
}

export interface DevelopmentLog {
  id: string;
  userId: string;
  objectId: string;
  date: Date;
  completed: boolean;
  progress?: number;     // 오늘 진행량 (30분 독서)
  note?: string;
}
```

---

## UI 컨셉 (스케치)

### 홈 화면

```
┌─────────────────────────────────────┐
│  📚 자기계발                          │
├─────────────────────────────────────┤
│                                     │
│  🔥 3일 연속 달성 중!                 │
│                                     │
│  [오늘 할 일]                         │
│  ✓ 독서 30분         [완료] [건너뛰기]│
│  ○ 운동 30분         [완료] [건너뛰기]│
│  ○ 영어 단어 10개    [완료] [건너뛰기]│
│                                     │
│  [진행 중인 목표]                     │
│  📖 "오브젝트" 읽기                   │
│  ▓▓▓▓▓▓▓▓░░ 80% (320/400 페이지)    │
│                                     │
│  🏋️ 주 3회 운동                      │
│  ▓▓▓░░░░░░░ 2/3회 (이번 주)        │
│                                     │
│  [획득한 배지]                        │
│  🔥 7일 연속   ⭐ 30일 챌린지        │
│                                     │
└─────────────────────────────────────┘
```

### 상세 화면

```
┌─────────────────────────────────────┐
│  📖 "오브젝트" 읽기                   │
├─────────────────────────────────────┤
│                                     │
│  진행률: 80% (320/400 페이지)        │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░               │
│                                     │
│  시작일: 2026-04-01                 │
│  목표일: 2026-04-30                 │
│  남은 기간: 18일                     │
│                                     │
│  [이번 주 기록]                       │
│  월 ✓ 50페이지                       │
│  화 ✓ 30페이지                       │
│  수 ✓ 40페이지                       │
│  목 - (오늘)                         │
│  금 -                               │
│                                     │
│  [메모]                              │
│  - 5장: 객체지향 설계 원칙 정리       │
│  - 리팩토링 예제 코드 따라해보기       │
│                                     │
└─────────────────────────────────────┘
```

---

## 핵심 기능 설계 (예정)

### 1. 연속 기록 (Streak)

```typescript
export class StreakService {
  /**
   * 연속 기록 업데이트
   */
  static updateStreak(
    lastDate: Date, 
    completedToday: boolean
  ): StreakInfo {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 어제 완료했으면 연속 증가
    if (this.isSameDay(lastDate, yesterday) && completedToday) {
      return {
        currentStreak: currentStreak + 1,
        longestStreak: Math.max(currentStreak + 1, longestStreak),
        lastCompletedDate: now
      };
    }
    
    // 오늘 완료 (새로 시작)
    if (completedToday) {
      return {
        currentStreak: 1,
        longestStreak: Math.max(1, longestStreak),
        lastCompletedDate: now
      };
    }
    
    // 연속 끊김
    return {
      currentStreak: 0,
      longestStreak,
      lastCompletedDate: now
    };
  }
}
```

### 2. 배지 시스템

```typescript
export class BadgeService {
  /**
   * 배지 획득 체크
   */
  static checkBadges(streak: StreakInfo): Badge[] {
    const badges: Badge[] = [];
    
    // 7일 연속
    if (streak.currentStreak >= 7) {
      badges.push({
        id: 'streak_7',
        name: '7일 연속',
        icon: '🔥',
        earnedDate: new Date(),
        description: '7일 연속으로 목표를 달성했어요!'
      });
    }
    
    // 30일 챌린지
    if (streak.currentStreak >= 30) {
      badges.push({
        id: 'streak_30',
        name: '30일 챌린지',
        icon: '⭐',
        earnedDate: new Date(),
        description: '30일 연속 달성! 정말 대단해요!'
      });
    }
    
    // 100일 마스터
    if (streak.currentStreak >= 100) {
      badges.push({
        id: 'streak_100',
        name: '100일 마스터',
        icon: '🏆',
        earnedDate: new Date(),
        description: '100일 연속 달성! 습관의 달인!'
      });
    }
    
    return badges;
  }
}
```

### 3. 진행률 시각화

```typescript
export class ProgressService {
  /**
   * 진행률 계산
   */
  static calculateProgress(
    current: number, 
    target: number
  ): {
    percentage: number;
    remaining: number;
    isCompleted: boolean;
  } {
    const percentage = (current / target) * 100;
    const remaining = Math.max(0, target - current);
    
    return {
      percentage: Math.min(100, percentage),
      remaining,
      isCompleted: current >= target
    };
  }
  
  /**
   * 예상 달성일 계산
   */
  static estimateCompletionDate(
    current: number,
    target: number,
    startDate: Date,
    logsPerDay: number
  ): Date {
    const remaining = target - current;
    const daysNeeded = Math.ceil(remaining / logsPerDay);
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);
    
    return estimatedDate;
  }
}
```

---

## 온보딩 통합 (추후)

### 질문 예시

```json
{
  "id": "self_development_goals",
  "question": "이루고 싶은 목표가 있나요?",
  "type": "multi_select",
  "options": [
    { "id": "reading", "label": "📚 독서 습관", "value": "reading" },
    { "id": "exercise", "label": "🏋️ 규칙적인 운동", "value": "exercise" },
    { "id": "learning", "label": "🎓 새로운 학습", "value": "learning" },
    { "id": "meditation", "label": "🧘 명상/마음챙김", "value": "meditation" },
    { "id": "none", "label": "아직 없어요", "value": "none" }
  ]
}
```

---

## 알림 통합

### 다이제스트에 포함

```typescript
// DigestService에 추가
export const generateSelfDevDigest = (
  objects: SelfDevelopmentObject[]
): string => {
  const todayItems = objects.filter(obj => 
    // 오늘 할 일
  );
  
  return `📚 자기계발 ${todayItems.length}개`;
};
```

---

## 구현 우선순위

### Phase 1: MVP (최소 기능)
- [ ] 독서 트래커
- [ ] 7일 연속 배지
- [ ] 간단한 진행률 표시

### Phase 2: 확장
- [ ] 운동 기록
- [ ] 30일 챌린지 배지
- [ ] 주간/월간 통계

### Phase 3: 고급 기능
- [ ] 학습 트래커
- [ ] 목표 설정 마법사
- [ ] 동기부여 메시지
- [ ] 소셜 기능 (친구와 함께 챌린지)

---

## 참고 앱 분석

### 경쟁 앱들
- **Habitica**: 게임화, 캐릭터 성장
- **Streaks**: 심플한 연속 기록
- **Way of Life**: 긍정/부정 습관 추적
- **Productive**: 할 일 + 습관 통합

### 다정한의 차별화
- ✅ 생활 관리와 통합 (청소/식사/약/자기관리와 함께)
- ✅ 부담 최소화 (간단한 체크만)
- ✅ 알림 피로 없음 (기존 다이제스트 활용)

---

## 다음 단계

이 모듈은 **Phase 3 확장 단계**에서 구현 예정입니다.

현재는:
1. ✅ Step 04-01: 청소 모듈
2. ✅ Step 04-02: 냉장고 모듈
3. ✅ Step 04-03: 약 모듈
4. ✅ Step 04-04: 자기관리 모듈

위 4개 모듈을 먼저 완성하는 것을 권장합니다.

---

**이 문서는 추후 업데이트 예정입니다.**
