# 12. 알림 최적화 v2

> **🎯 목표**: 알림 피로도를 줄이고 사용자가 원하는 방식으로만 알림 전달

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 다이제스트 알림 (하루 1회 요약)
- ✅ 조용한 시간 (방해 금지)
- ✅ 알림 우선순위 시스템
- ✅ 즉시/다이제스트/무음 선택 가능

**예상 소요 시간**: 1-1.5일

---

## 🔕 알림 피로도 문제

### 기존 문제점

```
❌ 나쁜 알림 전략:
  - 모든 Task마다 개별 알림
  - 하루에 10개+ 알림
  - 시간 관계없이 울림
  - 사용자 통제 불가

결과: 알림 끄고 앱 삭제
```

### 다정한의 해결책

```
✅ 다정한 알림 전략:
  - 하루 1~2회 요약 알림
  - 사용자가 설정한 시간에만
  - 급한 것만 즉시 알림
  - 완전한 사용자 제어

결과: 알림이 도움이 됨
```

---

## 📊 알림 우선순위 시스템

### 우선순위 레벨

`src/types/notification.types.ts`:

```typescript
export type NotificationPriority = 
  | 'critical'    // 즉시 알림 (약 복용, 유통기한 당일)
  | 'high'        // 다이제스트에 강조 (기한 초과)
  | 'medium'      // 다이제스트에 포함
  | 'low';        // 다이제스트 하단 or 제외

export interface NotificationSettings {
  enabled: boolean;
  
  // 타이밍
  timing: 'immediate' | 'digest' | 'silent';
  
  // 다이제스트 설정
  digestTime?: string;        // "08:00"
  digestFrequency?: 'daily' | 'twice_daily';  // 하루 1회 or 2회
  secondDigestTime?: string;  // "20:00" (2회일 때)
  
  // 조용한 시간
  quietHoursEnabled: boolean;
  quietStart?: string;        // "22:00"
  quietEnd?: string;          // "07:00"
  
  // 카테고리별 제어
  categories: {
    cleaning: NotificationPriority;
    food: NotificationPriority;
    medicine: NotificationPriority;
  };
}
```

---

## 📬 다이제스트 알림

### 다이제스트 생성 엔진

`src/services/DigestNotificationService.ts`:

```typescript
import { Task } from '@/types/task.types';
import { NotificationPriority } from '@/types/notification.types';
import { isPast, isToday, isTomorrow } from 'date-fns';

export class DigestNotificationService {
  /**
   * 다이제스트 생성 (하루 요약)
   */
  static async generateDigest(userId: string): Promise<DigestNotification> {
    const tasks = await this.getAllPendingTasks(userId);
    
    // 우선순위별 분류
    const critical = tasks.filter(t => this.getPriority(t) === 'critical');
    const high = tasks.filter(t => this.getPriority(t) === 'high');
    const medium = tasks.filter(t => this.getPriority(t) === 'medium');
    const low = tasks.filter(t => this.getPriority(t) === 'low');

    // 긴급 항목이 있으면 강조
    const hasCritical = critical.length > 0;

    return {
      userId,
      title: this.generateTitle(critical, high),
      body: this.generateBody(critical, high, medium),
      tasks: {
        critical,
        high,
        medium,
        low
      },
      hasCritical,
      generatedAt: new Date()
    };
  }

  /**
   * Task 우선순위 계산
   */
  private static getPriority(task: Task): NotificationPriority {
    // 1. 약 복용 → critical
    if (task.type === 'medicine') {
      return 'critical';
    }

    // 2. 식재료 유통기한 당일 → critical
    if (task.type === 'food' && isToday(task.recurrence.nextDue)) {
      return 'critical';
    }

    // 3. 기한 초과 → high
    if (isPast(task.recurrence.nextDue)) {
      return 'high';
    }

    // 4. 내일 마감 & healthPriority → high
    if (
      isTomorrow(task.recurrence.nextDue) &&
      task.cleaningMetadata?.healthPriority
    ) {
      return 'high';
    }

    // 5. 내일 마감 → medium
    if (isTomorrow(task.recurrence.nextDue)) {
      return 'medium';
    }

    // 6. 그 외 → low
    return 'low';
  }

  /**
   * 다이제스트 제목 생성
   */
  private static generateTitle(
    critical: Task[],
    high: Task[]
  ): string {
    if (critical.length > 0) {
      return `⚠️ 급한 일정 ${critical.length}개`;
    }

    if (high.length > 0) {
      return `📌 놓친 일정 ${high.length}개`;
    }

    return '✅ 오늘의 집안일';
  }

  /**
   * 다이제스트 본문 생성
   */
  private static generateBody(
    critical: Task[],
    high: Task[],
    medium: Task[]
  ): string {
    const lines: string[] = [];

    // Critical
    if (critical.length > 0) {
      lines.push(`⚠️ 급한 일: ${critical[0].title}`);
      if (critical.length > 1) {
        lines.push(`외 ${critical.length - 1}개`);
      }
    }

    // High
    if (high.length > 0) {
      lines.push(`📌 놓친 일: ${high[0].title}`);
      if (high.length > 1) {
        lines.push(`외 ${high.length - 1}개`);
      }
    }

    // Medium
    if (medium.length > 0 && critical.length === 0) {
      lines.push(`✅ 오늘 할 일: ${medium.length}개`);
    }

    return lines.join('\n');
  }

  /**
   * 다이제스트 발송
   */
  static async sendDigest(userId: string): Promise<void> {
    const settings = await this.getUserNotificationSettings(userId);

    // 알림 꺼져있으면 패스
    if (!settings.enabled || settings.timing === 'silent') {
      return;
    }

    // 조용한 시간이면 패스
    if (this.isQuietHour(settings)) {
      return;
    }

    // 다이제스트 생성
    const digest = await this.generateDigest(userId);

    // 알림 전송
    await sendPushNotification({
      userId,
      title: digest.title,
      body: digest.body,
      data: {
        type: 'digest',
        digestId: digest.id,
        hasCritical: digest.hasCritical
      },
      priority: digest.hasCritical ? 'high' : 'default'
    });

    // 발송 기록
    await this.logDigestSent(digest);
  }

  /**
   * 조용한 시간 체크
   */
  private static isQuietHour(settings: NotificationSettings): boolean {
    if (!settings.quietHoursEnabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = settings.quietStart!.split(':').map(Number);
    const [endHour, endMinute] = settings.quietEnd!.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // 자정 넘어가는 경우
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }
}
```

---

## ⏰ 다이제스트 스케줄링

### Cloud Function (Firebase Functions)

`functions/src/scheduledDigest.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DigestNotificationService } from './services/DigestNotificationService';

/**
 * 매일 아침 8시, 저녁 8시에 다이제스트 발송
 */
export const sendDailyDigests = functions.pubsub
  .schedule('0 8,20 * * *')  // 08:00, 20:00
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    const currentHour = new Date().getHours();
    
    // 모든 사용자 조회
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .get();

    const promises = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const settings = userDoc.data().notificationSettings;

      // 이 시간에 다이제스트를 받기로 한 사용자만
      if (shouldSendDigestNow(settings, currentHour)) {
        promises.push(
          DigestNotificationService.sendDigest(userId)
        );
      }
    }

    await Promise.all(promises);
    
    console.log(`Digests sent to ${promises.length} users`);
  });

function shouldSendDigestNow(
  settings: NotificationSettings,
  currentHour: number
): boolean {
  if (!settings.enabled || settings.timing !== 'digest') {
    return false;
  }

  const digestHour = parseInt(settings.digestTime!.split(':')[0]);

  // 하루 1회
  if (settings.digestFrequency === 'daily') {
    return currentHour === digestHour;
  }

  // 하루 2회
  if (settings.digestFrequency === 'twice_daily') {
    const secondHour = parseInt(settings.secondDigestTime!.split(':')[0]);
    return currentHour === digestHour || currentHour === secondHour;
  }

  return false;
}
```

---

## 🚨 즉시 알림 (Critical만)

### Critical 알림 발송

```typescript
// Task 생성/업데이트 시
export async function onTaskCreated(task: Task): Promise<void> {
  const priority = DigestNotificationService.getPriority(task);

  // critical만 즉시 알림
  if (priority === 'critical') {
    await sendImmediateNotification(task);
  }
}

async function sendImmediateNotification(task: Task): Promise<void> {
  const user = await getUserSettings(task.userId);

  // 조용한 시간 체크
  if (DigestNotificationService.isQuietHour(user.notificationSettings)) {
    // 다이제스트에 추가만 하고 즉시 발송 안 함
    return;
  }

  await sendPushNotification({
    userId: task.userId,
    title: getImmediateTitle(task),
    body: getImmediateBody(task),
    data: {
      type: 'immediate',
      taskId: task.id
    },
    priority: 'high',
    sound: 'default'
  });
}

function getImmediateTitle(task: Task): string {
  if (task.type === 'medicine') {
    return `💊 ${task.title} 복용 시간`;
  }
  if (task.type === 'food') {
    return `⚠️ ${task.title} 유통기한 만료`;
  }
  return task.title;
}
```

---

## ⚙️ 알림 설정 UI

`src/screens/settings/NotificationSettingsScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { NotificationSettings } from '@/types/notification.types';

export const NotificationSettingsScreen = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    timing: 'digest',
    digestTime: '08:00',
    digestFrequency: 'daily',
    quietHoursEnabled: true,
    quietStart: '22:00',
    quietEnd: '07:00',
    categories: {
      cleaning: 'medium',
      food: 'critical',
      medicine: 'critical'
    }
  });

  return (
    <ScrollView style={styles.container}>
      {/* 알림 켜기/끄기 */}
      <Section title="알림">
        <SettingRow
          label="알림 받기"
          value={settings.enabled}
          onValueChange={(enabled) =>
            setSettings({ ...settings, enabled })
          }
        />
      </Section>

      {settings.enabled && (
        <>
          {/* 알림 방식 */}
          <Section title="알림 방식">
            <RadioGroup
              options={[
                {
                  value: 'digest',
                  label: '다이제스트',
                  description: '하루 1~2회 요약해서 받기 (추천)'
                },
                {
                  value: 'immediate',
                  label: '즉시',
                  description: '모든 알림을 바로 받기'
                },
                {
                  value: 'silent',
                  label: '무음',
                  description: '알림 끄기 (앱 내에서만 확인)'
                }
              ]}
              value={settings.timing}
              onChange={(timing) =>
                setSettings({ ...settings, timing })
              }
            />
          </Section>

          {/* 다이제스트 설정 */}
          {settings.timing === 'digest' && (
            <Section title="다이제스트 시간">
              <TimePicker
                label="첫 번째 다이제스트"
                value={settings.digestTime}
                onChange={(digestTime) =>
                  setSettings({ ...settings, digestTime })
                }
              />

              <SettingRow
                label="하루 2회 받기"
                value={settings.digestFrequency === 'twice_daily'}
                onValueChange={(twice) =>
                  setSettings({
                    ...settings,
                    digestFrequency: twice ? 'twice_daily' : 'daily'
                  })
                }
              />

              {settings.digestFrequency === 'twice_daily' && (
                <TimePicker
                  label="두 번째 다이제스트"
                  value={settings.secondDigestTime || '20:00'}
                  onChange={(secondDigestTime) =>
                    setSettings({ ...settings, secondDigestTime })
                  }
                />
              )}
            </Section>
          )}

          {/* 조용한 시간 */}
          <Section title="조용한 시간">
            <SettingRow
              label="조용한 시간 설정"
              description="이 시간에는 긴급 알림도 오지 않아요"
              value={settings.quietHoursEnabled}
              onValueChange={(quietHoursEnabled) =>
                setSettings({ ...settings, quietHoursEnabled })
              }
            />

            {settings.quietHoursEnabled && (
              <>
                <TimePicker
                  label="시작"
                  value={settings.quietStart!}
                  onChange={(quietStart) =>
                    setSettings({ ...settings, quietStart })
                  }
                />
                <TimePicker
                  label="종료"
                  value={settings.quietEnd!}
                  onChange={(quietEnd) =>
                    setSettings({ ...settings, quietEnd })
                  }
                />
              </>
            )}
          </Section>

          {/* 카테고리별 설정 */}
          <Section title="카테고리별 알림">
            <CategoryPriorityRow
              icon="🧹"
              label="청소"
              value={settings.categories.cleaning}
              onChange={(priority) =>
                setSettings({
                  ...settings,
                  categories: { ...settings.categories, cleaning: priority }
                })
              }
            />
            <CategoryPriorityRow
              icon="🧊"
              label="식재료"
              value={settings.categories.food}
              onChange={(priority) =>
                setSettings({
                  ...settings,
                  categories: { ...settings.categories, food: priority }
                })
              }
            />
            <CategoryPriorityRow
              icon="💊"
              label="약"
              value={settings.categories.medicine}
              onChange={(priority) =>
                setSettings({
                  ...settings,
                  categories: { ...settings.categories, medicine: priority }
                })
              }
            />
          </Section>
        </>
      )}

      {/* 저장 */}
      <Button
        title="저장"
        onPress={() => saveNotificationSettings(settings)}
      />
    </ScrollView>
  );
};
```

---

## 📊 알림 효과 측정

### 알림 분석

```typescript
// 알림 발송 로그
interface NotificationLog {
  id: string;
  userId: string;
  type: 'digest' | 'immediate';
  sentAt: Date;
  openedAt?: Date;
  clicked: boolean;
}

// 알림 효과 측정
export async function analyzeNotificationEffectiveness(
  userId: string
): Promise<NotificationAnalytics> {
  const logs = await getNotificationLogs(userId, 30); // 30일

  const totalSent = logs.length;
  const totalOpened = logs.filter(l => l.clicked).length;
  const openRate = (totalOpened / totalSent) * 100;

  return {
    totalSent,
    totalOpened,
    openRate,
    avgOpenTime: calculateAvgOpenTime(logs),
    preferredTime: findPreferredTime(logs)
  };
}
```

---

## ✅ 테스트 체크리스트

- [ ] 다이제스트 알림 발송 (하루 1~2회)
- [ ] 긴급 알림 즉시 발송 (약, 유통기한)
- [ ] 조용한 시간 작동
- [ ] 알림 우선순위별 분류
- [ ] 사용자 설정 저장
- [ ] 알림 클릭 시 해당 화면 이동
- [ ] 알림 배지 카운트

---

## 🚀 다음 단계

- **14-deployment.md**: 배포 및 출시

---

**사용자 친화적인 알림 시스템 완성! 🔔✨**
