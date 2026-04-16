/**
 * 관리자 정의 가구별 Task 템플릿 데이터
 */

import { FurnitureTaskTemplate } from '@/types/furnitureTaskTemplate.types';

export const FURNITURE_TASK_TEMPLATES: FurnitureTaskTemplate[] = [
  // 침대
  {
    id: 'bed_template',
    furnitureType: 'bed',
    furnitureName: '침대',
    description: '침구 관리 및 청소',
    tasks: [
      {
        id: 'bed_sheet_wash',
        title: '침대 시트 빨기',
        description: '침대 시트를 세탁하여 위생적으로 관리합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 15,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'pillow_cover_wash',
        title: '베개커버 빨기',
        description: '베개커버를 세탁하여 청결하게 유지합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 10,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'duvet_wash',
        title: '이불 빨기',
        description: '이불을 세탁하여 쾌적한 수면 환경을 만듭니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 20,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'mattress_clean',
        title: '매트리스 청소',
        description: '매트리스를 청소하고 진드기를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 3 },
        estimatedMinutes: 30,
        priority: 'low',
        category: '관리',
      },
    ],
  },

  // 냉장고
  {
    id: 'fridge_template',
    furnitureType: 'fridge',
    furnitureName: '냉장고',
    description: '식재료 관리 및 냉장고 청소',
    tasks: [
      {
        id: 'fridge_expiry_check',
        title: '유통기한 확인',
        description: '냉장고 내 식재료의 유통기한을 확인합니다.',
        type: 'food',
        defaultRecurrence: { type: 'daily' },
        estimatedMinutes: 5,
        priority: 'high',
        category: '점검',
      },
      {
        id: 'fridge_organize',
        title: '냉장고 정리',
        description: '냉장고를 정리하고 오래된 식재료를 처리합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 15,
        priority: 'medium',
        category: '정리',
      },
      {
        id: 'fridge_deep_clean',
        title: '냉장고 청소',
        description: '냉장고 내부를 깨끗이 청소합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 1 },
        estimatedMinutes: 30,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'freezer_clean',
        title: '냉동실 정리',
        description: '냉동실을 정리하고 서리를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 2 },
        estimatedMinutes: 20,
        priority: 'low',
        category: '정리',
      },
    ],
  },

  // 싱크대
  {
    id: 'sink_template',
    furnitureType: 'sink',
    furnitureName: '싱크대',
    description: '싱크대 및 배수구 관리',
    tasks: [
      {
        id: 'sink_daily_clean',
        title: '싱크대 청소',
        description: '싱크대를 닦고 물때를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'daily' },
        estimatedMinutes: 5,
        priority: 'high',
        category: '청소',
      },
      {
        id: 'drain_clean',
        title: '배수구 청소',
        description: '배수구를 청소하고 막힘을 방지합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 10,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'sink_deep_clean',
        title: '싱크대 세척',
        description: '싱크대를 세제로 깨끗이 세척합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 15,
        priority: 'medium',
        category: '청소',
      },
    ],
  },

  // 변기
  {
    id: 'toilet_template',
    furnitureType: 'toilet',
    furnitureName: '변기',
    description: '화장실 위생 관리',
    tasks: [
      {
        id: 'toilet_clean',
        title: '변기 청소',
        description: '변기를 깨끗이 청소합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'daily' },
        estimatedMinutes: 10,
        priority: 'high',
        category: '청소',
      },
      {
        id: 'toilet_deep_clean',
        title: '변기 세척',
        description: '변기를 세제로 꼼꼼히 세척합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 20,
        priority: 'high',
        category: '청소',
      },
    ],
  },

  // 세탁기
  {
    id: 'washing_machine_template',
    furnitureType: 'washing_machine',
    furnitureName: '세탁기',
    description: '세탁기 관리 및 청소',
    tasks: [
      {
        id: 'washing_machine_drum_clean',
        title: '세탁조 청소',
        description: '세탁조를 청소하여 곰팡이를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 1 },
        estimatedMinutes: 15,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'washing_machine_filter_clean',
        title: '필터 청소',
        description: '세탁기 필터를 청소합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 10,
        priority: 'medium',
        category: '관리',
      },
      {
        id: 'washing_machine_rubber_clean',
        title: '고무패킹 청소',
        description: '세탁기 문 고무패킹을 닦아냅니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 5,
        priority: 'low',
        category: '청소',
      },
    ],
  },

  // 옷장
  {
    id: 'closet_template',
    furnitureType: 'closet',
    furnitureName: '옷장',
    description: '옷장 정리 및 관리',
    tasks: [
      {
        id: 'closet_organize',
        title: '옷장 정리',
        description: '옷을 정리하고 계절별로 분류합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 30,
        priority: 'low',
        category: '정리',
      },
      {
        id: 'closet_seasonal_change',
        title: '계절 옷 교체',
        description: '계절에 맞춰 옷을 교체합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 3 },
        estimatedMinutes: 60,
        priority: 'low',
        category: '정리',
      },
      {
        id: 'closet_moth_prevention',
        title: '좀약 교체',
        description: '옷장 좀약을 교체합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 2 },
        estimatedMinutes: 5,
        priority: 'low',
        category: '관리',
      },
    ],
  },

  // 욕조
  {
    id: 'bathtub_template',
    furnitureType: 'bathtub',
    furnitureName: '욕조',
    description: '욕조 청소 및 관리',
    tasks: [
      {
        id: 'bathtub_clean',
        title: '욕조 청소',
        description: '욕조를 깨끗이 청소합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 20,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'bathtub_mold_prevention',
        title: '욕조 곰팡이 제거',
        description: '욕조의 곰팡이를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 15,
        priority: 'medium',
        category: '청소',
      },
    ],
  },

  // 책상
  {
    id: 'desk_template',
    furnitureType: 'desk',
    furnitureName: '책상',
    description: '책상 정리 및 청소',
    tasks: [
      {
        id: 'desk_organize',
        title: '책상 정리',
        description: '책상을 정리하고 불필요한 물건을 치웁니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'daily' },
        estimatedMinutes: 10,
        priority: 'medium',
        category: '정리',
      },
      {
        id: 'desk_clean',
        title: '책상 청소',
        description: '책상을 닦고 먼지를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 10,
        priority: 'low',
        category: '청소',
      },
    ],
  },

  // 소파
  {
    id: 'sofa_template',
    furnitureType: 'sofa',
    furnitureName: '소파',
    description: '소파 청소 및 관리',
    tasks: [
      {
        id: 'sofa_vacuum',
        title: '소파 청소기 돌리기',
        description: '소파에 청소기를 돌려 먼지를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 15,
        priority: 'low',
        category: '청소',
      },
      {
        id: 'sofa_cover_wash',
        title: '소파 커버 빨기',
        description: '소파 커버를 세탁합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 1 },
        estimatedMinutes: 20,
        priority: 'low',
        category: '청소',
      },
    ],
  },

  // 거울
  {
    id: 'mirror_template',
    furnitureType: 'mirror',
    furnitureName: '거울',
    description: '거울 청소',
    tasks: [
      {
        id: 'mirror_clean',
        title: '거울 닦기',
        description: '거울을 깨끗이 닦습니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 5,
        priority: 'low',
        category: '청소',
      },
    ],
  },

  // 화장대
  {
    id: 'dresser_template',
    furnitureType: 'dresser',
    furnitureName: '화장대',
    description: '화장대 정리 및 청소',
    tasks: [
      {
        id: 'dresser_organize',
        title: '화장대 정리',
        description: '화장품을 정리하고 유통기한을 확인합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 15,
        priority: 'low',
        category: '정리',
      },
      {
        id: 'dresser_clean',
        title: '화장대 청소',
        description: '화장대를 닦고 먼지를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 10,
        priority: 'low',
        category: '청소',
      },
    ],
  },

  // 식물
  {
    id: 'plant_template',
    furnitureType: 'plant',
    furnitureName: '식물',
    description: '식물 관리',
    tasks: [
      {
        id: 'plant_water',
        title: '물 주기',
        description: '식물에 물을 줍니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 5,
        priority: 'medium',
        category: '관리',
      },
      {
        id: 'plant_fertilize',
        title: '영양제 주기',
        description: '식물 영양제를 줍니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 1 },
        estimatedMinutes: 5,
        priority: 'low',
        category: '관리',
      },
      {
        id: 'plant_trim',
        title: '가지치기',
        description: '시든 잎을 제거하고 가지를 다듬습니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 1 },
        estimatedMinutes: 10,
        priority: 'low',
        category: '관리',
      },
    ],
  },
];

/**
 * 가구 타입으로 템플릿 찾기
 */
export function getTemplateByFurnitureType(furnitureType: string): FurnitureTaskTemplate | undefined {
  return FURNITURE_TASK_TEMPLATES.find(t => t.furnitureType === furnitureType);
}
