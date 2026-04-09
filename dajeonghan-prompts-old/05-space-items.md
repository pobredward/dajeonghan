# 05. 공간 기반 아이템 관리 시스템

> **🎯 목표**: 각 아이템(냉장고, 싱크대 등)별로 다양한 기능을 설정하고 관리하는 유연한 시스템 구현

## 📋 완료 기준

이 단계를 완료하면:
- ✅ 아이템별 기능 카테고리 시스템 작동 (청소, 재고, 유지보수)
- ✅ 프리셋 시스템 구현 (관리자 + 사용자 정의)
- ✅ 10개 이상 아이템의 기본 프리셋 준비
- ✅ 아이템 상세 화면에서 기능 활성화/설정 가능
- ✅ 기능별 Task 자동 생성

**예상 소요 시간**: 1-1.5일

---

## 🧩 아이템 기능 시스템

### 핵심 개념

```
아이템 (Item)
  ↓
기능 카테고리 (Feature Category)
  - 청소 (Cleaning)
  - 재고 (Inventory)
  - 유지보수 (Maintenance)
  - 알림 (Reminder)
  ↓
구체적 기능 (Feature)
  - 냉장고 선반 청소 (청소)
  - 식재료 관리 (재고)
  - 필터 교체 (유지보수)
  ↓
Task 생성
```

---

## 📦 아이템 프리셋 시스템

### 데이터 구조

`src/data/itemPresets.ts`:

```typescript
import { ItemType, ItemFeature, FeatureCategory } from '@/types/home-layout.types';

export interface ItemPreset {
  id: string;
  itemType: ItemType;
  name: string;
  description: string;
  icon: string;
  category: string;                    // 주방, 화장실 등
  defaultFeatures: ItemFeaturePreset[];
  isSystemPreset: boolean;             // 관리자 프리셋
  isPublic: boolean;                   // 커뮤니티 공유
  usageCount?: number;                 // 사용 횟수
  rating?: number;                     // 평점
}

export interface ItemFeaturePreset {
  category: FeatureCategory;
  name: string;
  description: string;
  enabled: boolean;                    // 기본 활성화 여부
  required: boolean;                   // 필수 기능
  config: {
    // 청소 주기
    cleaning?: {
      interval: number;
      unit: 'day' | 'week' | 'month';
      estimatedMinutes: number;
      priority: 'urgent' | 'high' | 'medium' | 'low';
      healthPriority?: boolean;        // 건강 관련 우선순위
    };
    
    // 재고 관리
    inventory?: {
      type: 'food' | 'supply' | 'medicine';
      trackExpiry: boolean;
      lowStockAlert: boolean;
      autoReorder?: boolean;
    };
    
    // 유지보수
    maintenance?: {
      interval: number;
      unit: 'day' | 'week' | 'month' | 'year';
      estimatedCost?: number;
      professionalRequired?: boolean;
    };
    
    // 일반 알림
    reminder?: {
      interval: number;
      unit: 'day' | 'week' | 'month';
      message: string;
    };
  };
}

// 주방 아이템 프리셋
export const KITCHEN_PRESETS: ItemPreset[] = [
  {
    id: 'preset_fridge_001',
    itemType: 'fridge',
    name: '냉장고',
    description: '식재료 보관 및 관리',
    icon: '🧊',
    category: '주방',
    isSystemPreset: true,
    isPublic: true,
    defaultFeatures: [
      {
        category: 'cleaning',
        name: '냉장고 선반 청소',
        description: '선반과 서랍 닦기',
        enabled: true,
        required: false,
        config: {
          cleaning: {
            interval: 7,
            unit: 'day',
            estimatedMinutes: 15,
            priority: 'medium',
            healthPriority: true
          }
        }
      },
      {
        category: 'cleaning',
        name: '냉장고 성에 제거',
        description: '냉동실 성에 제거',
        enabled: true,
        required: false,
        config: {
          cleaning: {
            interval: 30,
            unit: 'day',
            estimatedMinutes: 30,
            priority: 'low'
          }
        }
      },
      {
        category: 'cleaning',
        name: '냉장고 외부 닦기',
        description: '손잡이, 외부 표면',
        enabled: true,
        required: false,
        config: {
          cleaning: {
            interval: 3,
            unit: 'day',
            estimatedMinutes: 5,
            priority: 'low'
          }
        }
      },
      {
        category: 'inventory',
        name: '식재료 관리',
        description: '유통기한 추적 및 알림',
        enabled: true,
        required: true,
        config: {
          inventory: {
            type: 'food',
            trackExpiry: true,
            lowStockAlert: false
          }
        }
      },
      {
        category: 'maintenance',
        name: '냉장고 탈취제 교체',
        description: '냉장고 냄새 제거',
        enabled: true,
        required: false,
        config: {
          maintenance: {
            interval: 90,
            unit: 'day',
            estimatedCost: 5000
          }
        }
      }
    ]
  },
  
  {
    id: 'preset_sink_001',
    itemType: 'sink',
    name: '싱크대',
    description: '주방 싱크대 및 배수구',
    icon: '🚰',
    category: '주방',
    isSystemPreset: true,
    isPublic: true,
    defaultFeatures: [
      {
        category: 'cleaning',
        name: '싱크대 청소',
        description: '싱크대 표면 및 수도꼭지',
        enabled: true,
        required: true,
        config: {
          cleaning: {
            interval: 2,
            unit: 'day',
            estimatedMinutes: 10,
            priority: 'high',
            healthPriority: true
          }
        }
      },
      {
        category: 'cleaning',
        name: '배수구 청소',
        description: '배수구 및 거름망',
        enabled: true,
        required: false,
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
        category: 'cleaning',
        name: '수도꼭지 물때 제거',
        description: '석회질 제거',
        enabled: true,
        required: false,
        config: {
          cleaning: {
            interval: 14,
            unit: 'day',
            estimatedMinutes: 10,
            priority: 'low'
          }
        }
      },
      {
        category: 'inventory',
        name: '주방 세제 재고',
        description: '설거지 세제, 수세미 등',
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
  },
  
  {
    id: 'preset_stove_001',
    itemType: 'stove',
    name: '가스레인지/인덕션',
    description: '조리 기구',
    icon: '🔥',
    category: '주방',
    isSystemPreset: true,
    isPublic: true,
    defaultFeatures: [
      {
        category: 'cleaning',
        name: '가스레인지 청소',
        description: '상판 및 버너',
        enabled: true,
        required: true,
        config: {
          cleaning: {
            interval: 3,
            unit: 'day',
            estimatedMinutes: 15,
            priority: 'high',
            healthPriority: true
          }
        }
      },
      {
        category: 'cleaning',
        name: '오븐 그릴 청소',
        description: '그릴 내부 청소',
        enabled: false,
        required: false,
        config: {
          cleaning: {
            interval: 14,
            unit: 'day',
            estimatedMinutes: 30,
            priority: 'medium'
          }
        }
      },
      {
        category: 'maintenance',
        name: '가스 안전 점검',
        description: '가스 누출 확인',
        enabled: true,
        required: false,
        config: {
          maintenance: {
            interval: 6,
            unit: 'month',
            professionalRequired: true
          }
        }
      }
    ]
  },
  
  // 세탁기
  {
    id: 'preset_washing_machine_001',
    itemType: 'washing_machine',
    name: '세탁기',
    description: '의류 세탁',
    icon: '👕',
    category: '화장실',
    isSystemPreset: true,
    isPublic: true,
    defaultFeatures: [
      {
        category: 'cleaning',
        name: '세탁조 청소',
        description: '통돌이 청소',
        enabled: true,
        required: true,
        config: {
          cleaning: {
            interval: 30,
            unit: 'day',
            estimatedMinutes: 90,
            priority: 'high',
            healthPriority: true
          }
        }
      },
      {
        category: 'cleaning',
        name: '필터 청소',
        description: '먼지 필터 청소',
        enabled: true,
        required: true,
        config: {
          cleaning: {
            interval: 7,
            unit: 'day',
            estimatedMinutes: 5,
            priority: 'medium'
          }
        }
      },
      {
        category: 'maintenance',
        name: '배수 펌프 점검',
        description: '배수 상태 확인',
        enabled: true,
        required: false,
        config: {
          maintenance: {
            interval: 6,
            unit: 'month',
            professionalRequired: false
          }
        }
      },
      {
        category: 'inventory',
        name: '세제 재고',
        description: '세탁 세제, 섬유유연제',
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
  },
  
  // 공기청정기
  {
    id: 'preset_air_purifier_001',
    itemType: 'air_purifier',
    name: '공기청정기',
    description: '실내 공기 관리',
    icon: '💨',
    category: '거실',
    isSystemPreset: true,
    isPublic: true,
    defaultFeatures: [
      {
        category: 'cleaning',
        name: '외부 먼지 제거',
        description: '공기청정기 외부 닦기',
        enabled: true,
        required: false,
        config: {
          cleaning: {
            interval: 7,
            unit: 'day',
            estimatedMinutes: 5,
            priority: 'low'
          }
        }
      },
      {
        category: 'maintenance',
        name: '필터 교체',
        description: 'HEPA 필터 교체',
        enabled: true,
        required: true,
        config: {
          maintenance: {
            interval: 6,
            unit: 'month',
            estimatedCost: 50000,
            professionalRequired: false
          }
        }
      },
      {
        category: 'maintenance',
        name: '필터 청소',
        description: '프리 필터 청소',
        enabled: true,
        required: false,
        config: {
          maintenance: {
            interval: 14,
            unit: 'day',
            estimatedMinutes: 10,
            professionalRequired: false
          }
        }
      }
    ]
  }
];

// 다른 카테고리 프리셋
export const BATHROOM_PRESETS: ItemPreset[] = [
  // 변기, 세면대, 샤워부스 등
];

export const LIVING_ROOM_PRESETS: ItemPreset[] = [
  // 소파, TV, 화분 등
];

export const BEDROOM_PRESETS: ItemPreset[] = [
  // 침대, 옷장 등
];

// 전체 프리셋 통합
export const ALL_ITEM_PRESETS = [
  ...KITCHEN_PRESETS,
  ...BATHROOM_PRESETS,
  ...LIVING_ROOM_PRESETS,
  ...BEDROOM_PRESETS
];

// 프리셋 검색
export function getPresetByItemType(itemType: ItemType): ItemPreset | undefined {
  return ALL_ITEM_PRESETS.find(preset => preset.itemType === itemType);
}

// 카테고리별 프리셋
export function getPresetsByCategory(category: string): ItemPreset[] {
  return ALL_ITEM_PRESETS.filter(preset => preset.category === category);
}
```

---

## 🎨 UI 구현

### 1. 아이템 상세 화면

`src/screens/items/ItemDetailScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { RoomItem } from '@/types/home-layout.types';
import { getPresetByItemType } from '@/data/itemPresets';
import { ScoreCircle } from '@/components/ScoreCircle';

interface ItemDetailScreenProps {
  route: {
    params: {
      itemId: string;
    };
  };
}

export const ItemDetailScreen: React.FC<ItemDetailScreenProps> = ({ route }) => {
  const { itemId } = route.params;
  const item = useItem(itemId); // custom hook
  const preset = getPresetByItemType(item.type);
  const [activeTab, setActiveTab] = useState<'overview' | 'features'>('overview');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{item.icon}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemType}>{preset?.name}</Text>
        </View>
        <ScoreCircle score={item.score} size="medium" />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            개요
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'features' && styles.tabActive]}
          onPress={() => setActiveTab('features')}
        >
          <Text style={[styles.tabText, activeTab === 'features' && styles.tabTextActive]}>
            기능 설정
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'overview' && (
          <ItemOverviewTab item={item} />
        )}
        {activeTab === 'features' && (
          <ItemFeaturesTab item={item} preset={preset} />
        )}
      </ScrollView>
    </View>
  );
};

// 개요 탭
const ItemOverviewTab = ({ item }) => {
  const tasks = useItemTasks(item.id);
  
  return (
    <View style={styles.overviewContainer}>
      {/* 상태 요약 */}
      <StatusSummary item={item} tasks={tasks} />
      
      {/* 최근 활동 */}
      <RecentActivities itemId={item.id} />
      
      {/* 통계 */}
      <Statistics itemId={item.id} />
    </View>
  );
};

// 기능 설정 탭
const ItemFeaturesTab = ({ item, preset }) => {
  const [features, setFeatures] = useState(item.features);

  const groupedFeatures = groupBy(
    preset?.defaultFeatures || [],
    'category'
  );

  return (
    <View style={styles.featuresContainer}>
      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
        <FeatureCategory
          key={category}
          category={category}
          features={categoryFeatures}
          enabledFeatures={features}
          onToggleFeature={(featureId) => {
            // 기능 활성화/비활성화
            toggleFeature(item.id, featureId);
          }}
          onConfigureFeature={(featureId) => {
            // 기능 상세 설정
            navigateToFeatureConfig(item.id, featureId);
          }}
        />
      ))}

      {/* 커스텀 기능 추가 */}
      <TouchableOpacity
        style={styles.addCustomFeatureButton}
        onPress={() => navigateToCustomFeatureCreator(item.id)}
      >
        <Text style={styles.addCustomFeatureText}>
          + 커스텀 기능 추가
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// 기능 카테고리 섹션
const FeatureCategory = ({
  category,
  features,
  enabledFeatures,
  onToggleFeature,
  onConfigureFeature
}) => {
  const categoryInfo = {
    cleaning: { name: '청소 주기', icon: '🧹', color: '#2196F3' },
    inventory: { name: '재고 관리', icon: '📦', color: '#4CAF50' },
    maintenance: { name: '유지보수', icon: '🔧', color: '#FF9800' },
    reminder: { name: '일반 알림', icon: '⏰', color: '#9C27B0' }
  }[category];

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
        <Text style={styles.categoryName}>{categoryInfo.name}</Text>
      </View>

      {features.map((feature) => {
        const isEnabled = enabledFeatures.some(f => f.id === feature.id);
        
        return (
          <FeatureRow
            key={feature.name}
            feature={feature}
            enabled={isEnabled}
            onToggle={() => onToggleFeature(feature.id)}
            onConfigure={() => onConfigureFeature(feature.id)}
          />
        );
      })}
    </View>
  );
};

// 기능 행
const FeatureRow = ({ feature, enabled, onToggle, onConfigure }) => {
  return (
    <View style={[styles.featureRow, enabled && styles.featureRowEnabled]}>
      <Switch value={enabled} onValueChange={onToggle} />
      
      <View style={styles.featureInfo}>
        <Text style={styles.featureName}>{feature.name}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
        
        {/* 설정 미리보기 */}
        {enabled && feature.config.cleaning && (
          <Text style={styles.featureConfig}>
            {feature.config.cleaning.interval}
            {feature.config.cleaning.unit === 'day' ? '일' : feature.config.cleaning.unit === 'week' ? '주' : '개월'}마다
            {' · '}
            {feature.config.cleaning.estimatedMinutes}분
          </Text>
        )}
      </View>

      {enabled && (
        <TouchableOpacity
          style={styles.configButton}
          onPress={onConfigure}
        >
          <Text style={styles.configButtonText}>⚙️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // ... 스타일 정의
});
```

---

### 2. 기능 상세 설정 화면

`src/screens/items/FeatureConfigScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ItemFeaturePreset } from '@/data/itemPresets';

interface FeatureConfigScreenProps {
  route: {
    params: {
      itemId: string;
      featureId: string;
    };
  };
}

export const FeatureConfigScreen: React.FC<FeatureConfigScreenProps> = ({ route }) => {
  const { itemId, featureId } = route.params;
  const feature = useFeature(itemId, featureId);
  const [config, setConfig] = useState(feature.config);

  // 청소 주기 설정
  if (feature.category === 'cleaning') {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{feature.name} 설정</Text>

        {/* 주기 설정 */}
        <Section title="청소 주기">
          <IntervalPicker
            value={config.cleaning.interval}
            unit={config.cleaning.unit}
            onChange={(interval, unit) => {
              setConfig({
                ...config,
                cleaning: { ...config.cleaning, interval, unit }
              });
            }}
          />
        </Section>

        {/* 예상 시간 */}
        <Section title="예상 소요 시간">
          <DurationPicker
            value={config.cleaning.estimatedMinutes}
            onChange={(minutes) => {
              setConfig({
                ...config,
                cleaning: { ...config.cleaning, estimatedMinutes: minutes }
              });
            }}
          />
        </Section>

        {/* 우선순위 */}
        <Section title="우선순위">
          <PriorityPicker
            value={config.cleaning.priority}
            onChange={(priority) => {
              setConfig({
                ...config,
                cleaning: { ...config.cleaning, priority }
              });
            }}
          />
        </Section>

        {/* 건강 관련 */}
        <Section title="건강 관련">
          <Switch
            label="건강과 관련된 청소입니다"
            description="우선순위가 자동으로 높아집니다"
            value={config.cleaning.healthPriority}
            onValueChange={(value) => {
              setConfig({
                ...config,
                cleaning: { ...config.cleaning, healthPriority: value }
              });
            }}
          />
        </Section>

        {/* 저장 버튼 */}
        <Button
          title="저장"
          onPress={() => saveFeatureConfig(itemId, featureId, config)}
        />
      </ScrollView>
    );
  }

  // 재고 관리 설정
  if (feature.category === 'inventory') {
    return (
      <InventoryConfigView
        itemId={itemId}
        featureId={featureId}
        config={config}
        onSave={saveFeatureConfig}
      />
    );
  }

  // 유지보수 설정
  if (feature.category === 'maintenance') {
    return (
      <MaintenanceConfigView
        itemId={itemId}
        featureId={featureId}
        config={config}
        onSave={saveFeatureConfig}
      />
    );
  }

  return null;
};
```

---

## 🔧 서비스 레이어

`src/services/itemFeatureService.ts`:

```typescript
import { RoomItem, ItemFeature } from '@/types/home-layout.types';
import { ItemFeaturePreset } from '@/data/itemPresets';
import { Task } from '@/types/task.types';
import { generateTaskId } from '@/utils/idGenerator';

export class ItemFeatureService {
  /**
   * 프리셋으로부터 기능 활성화
   */
  static async activateFeature(
    itemId: string,
    featurePreset: ItemFeaturePreset
  ): Promise<void> {
    // 1. ItemFeature 생성
    const feature: ItemFeature = {
      id: `${itemId}_${featurePreset.name}_${Date.now()}`,
      category: featurePreset.category,
      name: featurePreset.name,
      enabled: true,
      config: featurePreset.config
    };

    // 2. Item에 추가
    await this.addFeatureToItem(itemId, feature);

    // 3. Task 자동 생성
    if (featurePreset.category === 'cleaning' || 
        featurePreset.category === 'maintenance') {
      await this.createTaskFromFeature(itemId, feature);
    }
  }

  /**
   * 기능으로부터 Task 생성
   */
  private static async createTaskFromFeature(
    itemId: string,
    feature: ItemFeature
  ): Promise<Task> {
    const config = feature.config;
    
    if (config.cleaning) {
      const task: Task = {
        id: generateTaskId(),
        userId: getCurrentUserId(),
        objectId: itemId,
        title: feature.name,
        description: '',
        type: 'cleaning',
        recurrence: {
          type: 'fixed',
          interval: config.cleaning.interval,
          unit: config.cleaning.unit,
          nextDue: calculateNextDue(config.cleaning.interval, config.cleaning.unit)
        },
        priority: config.cleaning.priority,
        estimatedMinutes: config.cleaning.estimatedMinutes,
        status: 'pending',
        notificationSettings: {
          enabled: true,
          timing: 'digest',
          advanceHours: [24]
        },
        completionHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await saveTask(task);
      return task;
    }

    // maintenance, reminder 등도 유사하게 처리
  }

  /**
   * 전체 프리셋 적용 (온보딩 시)
   */
  static async applyPresetToItem(
    itemId: string,
    preset: ItemPreset
  ): Promise<void> {
    // 기본 활성화된 기능만 자동 적용
    const defaultFeatures = preset.defaultFeatures.filter(f => f.enabled);

    for (const featurePreset of defaultFeatures) {
      await this.activateFeature(itemId, featurePreset);
    }
  }
}
```

---

## ✅ 테스트 체크리스트

- [ ] 아이템 상세 화면에서 기능 목록 표시
- [ ] 카테고리별 그룹핑 작동
- [ ] 기능 활성화/비활성화 토글
- [ ] 기능 설정 화면에서 주기 조정
- [ ] 설정 저장 시 Task 자동 생성
- [ ] 프리셋 적용 시 여러 기능 한번에 활성화
- [ ] 냉장고에 5개 이상 기능 표시
- [ ] 세탁기에 4개 이상 기능 표시

---

## 🚀 다음 단계

- **07-cleaning-v2.md**: 청소 모듈 (아이템 기반 재구성)
- **10-extension-guide.md**: 확장 가이드 (새 아이템/기능 추가법)

---

**아이템별 유연한 기능 시스템을 구축했습니다! 🔧✨**
