# Step 05. 템플릿 온보딩 시스템

> **🎯 목표**: 5분 이내에 "오늘 할 일 5개"를 생성하여 즉시 가치를 체감시키는 온보딩 구현

## 📌 단계 정보

**순서**: Step 05/12  
**Phase**: Phase 3 - 사용자 경험 (Experience)  
**의존성**: Step 04-01, 04-02, 04-03 완료 필수 (04-04, 04-05는 선택)  
**예상 소요 시간**: 1일  
**난이도**: ⭐⭐⭐

### 이전 단계 요구사항
- ✅ Step 04-01 완료: 청소 모듈 (청소 템플릿 필요)
- ✅ Step 04-02 완료: 냉장고 모듈 (냉장고 템플릿 필요)
- ✅ Step 04-03 완료: 약 모듈 (약 템플릿 필요)
- ⭕ Step 04-04 선택: 자기관리 모듈 (선택사항)
- ⭕ Step 04-05 선택: 자기계발 모듈 (선택사항)

### 다음 단계
- **Step 06**: 알림 시스템

### 이 단계가 필요한 이유
- 사용자가 앱을 처음 시작할 때 필수
- "오늘 할 일" 즉시 생성으로 가치 체감
- 이탈률 감소 핵심 기능

---

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 6가지 페르소나 선택 화면 작동
- ✅ 7개 이하의 환경 질문으로 프로필 생성 (자기관리/성별 질문 추가)
- ✅ 템플릿 기반 자동 일정 생성 (청소+냉장고+약+자기관리+자기계발)
- ✅ 온보딩 완료 즉시 "오늘 할 일" 표시
- ✅ 고급 설정은 7일 후 노출 (점진적 공개)

**예상 소요 시간**: 1일

---

## 🚀 핵심 개념

### 온보딩의 중요성

**통계**: 앱 온보딩 완료율 평균 20-30%, 다정한 목표 70%+

일반적인 생활 관리 앱의 문제:
- ❌ 처음부터 모든 정보 입력 요구 → 피로감
- ❌ 세팅만 하고 실제 사용 안 함 → 이탈
- ❌ 가치를 체감하기까지 시간 소요 → 삭제

다정한의 해결책:
- ✅ **3단계만에 완료**: 페르소나 선택 → 환경 질문 → 완료
- ✅ **즉시 가치 제공**: 설정 끝나자마자 "오늘 할 일 5개" 표시
- ✅ **점진적 공개**: 고급 기능은 사용하면서 자연스럽게 발견

### 핵심 원칙

1. **즉시 가치**: 3단계만에 "오늘 할 일 5개" 생성
2. **선택 최소화**: 최대 5개 질문만
3. **결과 우선**: 세팅보다 실행 유도
4. **점진적 공개**: 고급 설정은 7일 후

---

## 페르소나 정의

`src/templates/personas.json`:

```json
{
  "personas": [
    {
      "id": "student_20s_male",
      "name": "20대 초반 자취 대학생 (남)",
      "icon": "🎓",
      "description": "혼자 사는 대학생, 간단한 청소 루틴 필요",
      "defaultEnvironment": {
        "hasWasher": true,
        "hasDryer": false,
        "usesCoinLaundry": false,
        "cookingFrequency": "sometimes",
        "hasPet": false,
        "householdSize": 1
      }
    },
    {
      "id": "student_20s_female",
      "name": "20대 초반 자취 대학생 (여)",
      "icon": "👩‍🎓",
      "description": "혼자 사는 대학생, 정리정돈 중시",
      "defaultEnvironment": {
        "hasWasher": true,
        "hasDryer": false,
        "usesCoinLaundry": false,
        "cookingFrequency": "often",
        "hasPet": false,
        "householdSize": 1
      }
    },
    {
      "id": "worker_single",
      "name": "직장인 (1인)",
      "icon": "💼",
      "description": "혼자 사는 직장인, 주말 집중 청소",
      "defaultEnvironment": {
        "hasWasher": true,
        "hasDryer": false,
        "usesCoinLaundry": false,
        "cookingFrequency": "rarely",
        "hasPet": false,
        "householdSize": 1
      }
    },
    {
      "id": "worker_roommate",
      "name": "직장인 (룸메)",
      "icon": "👥",
      "description": "룸메와 함께 사는 직장인, 분담 필요",
      "defaultEnvironment": {
        "hasWasher": true,
        "hasDryer": false,
        "usesCoinLaundry": false,
        "cookingFrequency": "sometimes",
        "hasPet": false,
        "householdSize": 2
      }
    },
    {
      "id": "newlywed",
      "name": "신혼",
      "icon": "💑",
      "description": "신혼부부, 함께 만드는 루틴",
      "defaultEnvironment": {
        "hasWasher": true,
        "hasDryer": true,
        "usesCoinLaundry": false,
        "cookingFrequency": "daily",
        "hasPet": false,
        "householdSize": 2
      }
    },
    {
      "id": "pet_owner",
      "name": "반려동물 집사",
      "icon": "🐕",
      "description": "반려동물과 함께, 청결 관리 중요",
      "defaultEnvironment": {
        "hasWasher": true,
        "hasDryer": false,
        "usesCoinLaundry": false,
        "cookingFrequency": "often",
        "hasPet": true,
        "householdSize": 1
      }
    }
  ]
}
```

## 온보딩 질문 플로우

### 온보딩 흐름 확장

```
기존 플로우:
페르소나 선택 → 질문 → 완료

확장 플로우:
페르소나 선택 → 질문 → [템플릿 선택 (선택사항)] → 완료

또는 딥링크 진입:
공유 링크 클릭 → 템플릿 미리보기 → 질문 → 적용 → 완료
```

`src/templates/questionFlow.json`:

```json
{
  "questions": [
    {
      "id": "washer",
      "question": "세탁기가 있나요?",
      "type": "boolean",
      "options": [
        { "id": "yes", "label": "있어요", "value": true },
        { "id": "no", "label": "없어요 (코인세탁)", "value": false }
      ]
    },
    {
      "id": "dryer",
      "question": "건조기가 있나요?",
      "type": "boolean",
      "condition": { "washer": true },
      "options": [
        { "id": "yes", "label": "있어요", "value": true },
        { "id": "no", "label": "없어요", "value": false }
      ]
    },
    {
      "id": "cooking",
      "question": "요리는 얼마나 자주 하나요?",
      "type": "select",
      "options": [
        { "id": "rarely", "label": "거의 안 함", "value": "rarely" },
        { "id": "sometimes", "label": "가끔", "value": "sometimes" },
        { "id": "often", "label": "자주", "value": "often" },
        { "id": "daily", "label": "매일", "value": "daily" }
      ]
    },
    {
      "id": "medicine",
      "question": "복용 중인 약이 있나요?",
      "type": "boolean",
      "options": [
        { "id": "yes", "label": "있어요", "value": true },
        { "id": "no", "label": "없어요", "value": false }
      ]
    },
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
    },
    {
      "id": "notification",
      "question": "알림은 어떻게 받고 싶나요?",
      "type": "select",
      "options": [
        { "id": "digest", "label": "조용한 비서 (하루 2회 다이제스트)", "value": "digest" },
        { "id": "immediate", "label": "강한 루틴 (즉시 알림)", "value": "immediate" },
        { "id": "minimal", "label": "필요할 때만 (앱 내에서만)", "value": "minimal" }
      ]
    }
  ]
}
```

## 온보딩 서비스

`src/screens/onboarding/OnboardingService.ts`:

```typescript
import { UserProfile, PersonaType, UserEnvironment } from '@/types/user.types';
import { CleaningService } from '@/modules/cleaning/cleaningService';
import { Task } from '@/types/task.types';
import personas from '@/templates/personas.json';

export class OnboardingService {
  /**
   * 페르소나로부터 프로필 생성
   */
  static createProfileFromPersona(
    userId: string,
    personaId: PersonaType,
    answers: Record<string, any>
  ): UserProfile {
    const persona = personas.personas.find(p => p.id === personaId);
    
    if (!persona) {
      throw new Error('Invalid persona');
    }

    const environment: UserEnvironment = {
      hasWasher: answers.washer ?? persona.defaultEnvironment.hasWasher,
      hasDryer: answers.dryer ?? persona.defaultEnvironment.hasDryer,
      usesCoinLaundry: !answers.washer,
      cookingFrequency: answers.cooking ?? persona.defaultEnvironment.cookingFrequency,
      hasPet: persona.defaultEnvironment.hasPet,
      householdSize: persona.defaultEnvironment.householdSize
    };

    return {
      userId,
      persona: personaId,
      environment,
      notificationMode: answers.notification ?? 'digest',
      digestTimes: ['09:00', '20:00'],
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * 초기 테스크 생성 (청소 모듈)
   */
  static async createInitialTasks(
    userId: string,
    profile: UserProfile
  ): Promise<Task[]> {
    // 청소 테스크
    const cleaningTasks = CleaningService.createTasksFromTemplate(
      userId,
      profile.persona,
      profile.environment
    );

    // 냉장고는 사용자가 직접 추가
    // 약도 사용자가 직접 추가

    return cleaningTasks;
  }

  /**
   * 공유 템플릿으로부터 테스크 생성
   */
  static async createTasksFromTemplate(
    userId: string,
    template: SharedTemplate
  ): Promise<Task[]> {
    const tasks: Task[] = [];
    
    // 청소 테스크 생성
    for (const taskTemplate of template.cleaningTasks) {
      const task: Task = {
        id: generateId(),
        userId,
        objectId: taskTemplate.objectId,
        
        title: taskTemplate.title,
        description: taskTemplate.description,
        type: taskTemplate.type,
        
        recurrence: {
          ...taskTemplate.recurrence,
          nextDue: new Date() // 오늘부터 시작
        },
        
        priority: taskTemplate.priority,
        status: 'pending',
        estimatedMinutes: taskTemplate.estimatedMinutes,
        
        completionHistory: [],
        
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      tasks.push(task);
    }
    
    // TODO: 냉장고/약 템플릿도 적용
    
    return tasks;
  }

  /**
   * "오늘 할 일" 즉시 생성
   */
  static generateFirstDayTasks(tasks: Task[]): Task[] {
    // 간단한 것부터 5개
    const sorted = tasks
      .sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)
      .slice(0, 5);

    return sorted;
  }
}
```

## 온보딩 화면들

### 1. 페르소나 선택

`src/screens/onboarding/PersonaSelectionScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { PersonaType } from '@/types/user.types';
import personas from '@/templates/personas.json';

interface Props {
  onSelect: (personaId: PersonaType) => void;
}

export const PersonaSelectionScreen: React.FC<Props> = ({ onSelect }) => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>어떤 분이신가요?</Text>
      <Text style={styles.subtitle}>
        생활 패턴에 맞는 추천을 드릴게요
      </Text>

      <View style={styles.grid}>
        {personas.personas.map(persona => (
          <TouchableOpacity
            key={persona.id}
            style={styles.card}
            onPress={() => onSelect(persona.id as PersonaType)}
          >
            <Text style={styles.icon}>{persona.icon}</Text>
            <Text style={styles.personaName}>{persona.name}</Text>
            <Text style={styles.description}>{persona.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center'
  },
  grid: {
    gap: 16
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  icon: {
    fontSize: 48,
    marginBottom: 12
  },
  personaName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center'
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  }
});
```

### 2. 질문 화면

`src/screens/onboarding/QuestionScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import questionFlow from '@/templates/questionFlow.json';

interface Props {
  onComplete: (answers: Record<string, any>) => void;
}

export const QuestionScreen: React.FC<Props> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const questions = questionFlow.questions;
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (value: any) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: value
    };
    setAnswers(newAnswers);

    // 다음 질문으로
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 완료
      onComplete(newAnswers);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.question}>{currentQuestion.question}</Text>

      <View style={styles.options}>
        {currentQuestion.options.map(option => (
          <TouchableOpacity
            key={option.id}
            style={styles.option}
            onPress={() => handleAnswer(option.value)}
          >
            <Text style={styles.optionText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.hint}>
        {currentQuestionIndex + 1} / {questions.length}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center'
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 40
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2
  },
  question: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center'
  },
  options: {
    gap: 12
  },
  option: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center'
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600'
  },
  hint: {
    marginTop: 24,
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  }
});
```

### 3. 첫 할 일 화면

`src/screens/onboarding/FirstTasksScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Task } from '@/types/task.types';

interface Props {
  tasks: Task[];
  onStart: () => void;
}

export const FirstTasksScreen: React.FC<Props> = ({ tasks, onStart }) => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.celebration}>🎉</Text>
      <Text style={styles.title}>준비 완료!</Text>
      <Text style={styles.subtitle}>
        오늘부터 시작할 수 있는{'\n'}할 일 {tasks.length}개를 준비했어요
      </Text>

      <View style={styles.taskList}>
        {tasks.map((task, index) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskNumber}>
              <Text style={styles.taskNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskTime}>{task.estimatedMinutes}분 소요</Text>
            </View>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.startButton} onPress={onStart}>
        <Text style={styles.startButtonText}>시작하기</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        💡 완료하거나 미루기만 누르면 돼요!{'\n'}
        복잡한 설정은 나중에 해도 됩니다.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  celebration: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24
  },
  taskList: {
    marginBottom: 32,
    gap: 12
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12
  },
  taskNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  taskNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  taskInfo: {
    flex: 1
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  taskTime: {
    fontSize: 12,
    color: '#666'
  },
  checkmark: {
    fontSize: 20,
    color: '#ccc'
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
  },
  hint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20
  }
});
```

## 온보딩 플로우 통합

### 템플릿 선택 화면 추가

`src/screens/onboarding/TemplateSelectionScreen.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TemplateCard } from '@/components/TemplateCard';
import { Button } from '@/components/Button';
import { Colors, Typography, Spacing } from '@/constants';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { SharedTemplate } from '@/types/template.types';
import { PersonaType } from '@/types/user.types';

interface Props {
  persona: PersonaType;
  onSelect: (template: SharedTemplate | null) => void;
}

export const TemplateSelectionScreen: React.FC<Props> = ({ persona, onSelect }) => {
  const [templates, setTemplates] = useState<SharedTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchRecommendedTemplates();
  }, [persona]);
  
  const fetchRecommendedTemplates = async () => {
    try {
      // 페르소나에 맞는 카테고리 매핑
      const categoryMap: Record<PersonaType, TemplateCategory> = {
        'student_20s_male': 'student_living_alone',
        'student_20s_female': 'student_living_alone',
        'worker_single': 'worker_single',
        'worker_roommate': 'worker_roommate',
        'newlywed': 'newlywed',
        'pet_owner': 'pet_owner'
      };
      
      const category = categoryMap[persona] || 'custom';
      
      // 해당 카테고리의 인기 템플릿 3개 가져오기
      const allTemplates = await TemplateMarketplaceService.getTemplatesByCategory(category, 3);
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Fetch templates error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>추천 템플릿</Text>
      <Text style={styles.subtitle}>
        다른 사람들이 만든 검증된 루틴을 선택하거나{'\n'}
        기본 템플릿으로 시작할 수 있습니다
      </Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>추천 템플릿 불러오는 중...</Text>
        </View>
      ) : (
        <>
          {templates.length > 0 ? (
            <View style={styles.templatesContainer}>
              {templates.map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateCard}
                  onPress={() => onSelect(template)}
                >
                  <TemplateCard template={template} compact />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              아직 추천 템플릿이 없습니다
            </Text>
          )}
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <Button
            title="기본 템플릿으로 시작"
            onPress={() => onSelect(null)}
            variant="outline"
            fullWidth
          />
          
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => {
              // 템플릿 마켓플레이스로 이동
              // navigation.navigate('TemplateMarketplace');
            }}
          >
            <Text style={styles.browseText}>더 많은 템플릿 둘러보기 →</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.md
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center'
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary
  },
  templatesContainer: {
    marginBottom: Spacing.lg
  },
  templateCard: {
    marginBottom: Spacing.md
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: Spacing.lg
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.lightGray
  },
  dividerText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md
  },
  browseButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md
  },
  browseText: {
    ...Typography.body,
    color: Colors.primary
  }
});
```

### 온보딩 플로우 통합 (수정)

`src/screens/onboarding/OnboardingFlow.tsx`:

```tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { PersonaSelectionScreen } from './PersonaSelectionScreen';
import { QuestionScreen } from './QuestionScreen';
import { TemplateSelectionScreen } from './TemplateSelectionScreen';
import { FirstTasksScreen } from './FirstTasksScreen';
import { OnboardingService } from './OnboardingService';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';
import { PersonaType } from '@/types/user.types';
import { SharedTemplate } from '@/types/template.types';

interface Props {
  userId: string;
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<Props> = ({ userId, onComplete }) => {
  const [step, setStep] = useState<'persona' | 'questions' | 'template' | 'tasks'>('persona');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<SharedTemplate | null>(null);
  const [firstTasks, setFirstTasks] = useState<any[]>([]);

  const handlePersonaSelect = (personaId: PersonaType) => {
    setSelectedPersona(personaId);
    setStep('questions');
  };

  const handleQuestionsComplete = async (questionAnswers: Record<string, any>) => {
    setAnswers(questionAnswers);
    
    // 템플릿 선택 단계로 이동
    setStep('template');
  };

  const handleTemplateSelect = async (template: SharedTemplate | null) => {
    setSelectedTemplate(template);

    // 프로필 생성
    const profile = OnboardingService.createProfileFromPersona(
      userId,
      selectedPersona!,
      answers
    );

    let tasks: any[] = [];

    if (template) {
      // 템플릿 적용
      tasks = await OnboardingService.createTasksFromTemplate(userId, template);
      
      // 템플릿 사용 기록
      await TemplateMarketplaceService.applyTemplate(template.id, userId);
    } else {
      // 기본 템플릿 사용
      tasks = await OnboardingService.createInitialTasks(userId, profile);
    }

    const firstDay = OnboardingService.generateFirstDayTasks(tasks);

    setFirstTasks(firstDay);
    setStep('tasks');

    // Firestore에 저장
    // await saveUserProfile(profile);
    // await saveTasks(tasks);
  };

  const handleStart = () => {
    onComplete();
  };

  return (
    <View style={{ flex: 1 }}>
      {step === 'persona' && (
        <PersonaSelectionScreen onSelect={handlePersonaSelect} />
      )}
      {step === 'questions' && (
        <QuestionScreen onComplete={handleQuestionsComplete} />
      )}
      {step === 'template' && selectedPersona && (
        <TemplateSelectionScreen 
          persona={selectedPersona}
          onSelect={handleTemplateSelect} 
        />
      )}
      {step === 'tasks' && (
        <FirstTasksScreen tasks={firstTasks} onStart={handleStart} />
      )}
    </View>
  );
};
```

## 7일 후 고급 설정 배너

`src/components/AdvancedSettingsBanner.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onOpen: () => void;
  onDismiss: () => void;
}

export const AdvancedSettingsBanner: React.FC<Props> = ({ onOpen, onDismiss }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚙️</Text>
      <View style={styles.content}>
        <Text style={styles.title}>고급 설정이 열렸어요!</Text>
        <Text style={styles.subtitle}>
          이제 주기, 알림, 모듈을 자유롭게 커스터마이징할 수 있습니다.
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onOpen}>
        <Text style={styles.buttonText}>보기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
        <Text style={styles.dismissText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    fontSize: 32,
    marginRight: 12
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: '#666'
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600'
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4
  },
  dismissText: {
    fontSize: 24,
    color: '#999'
  }
});
```

## 다음 단계
- 08-notifications.md: 알림 시스템 구현
- 다이제스트 중심 알림 및 피로 관리
