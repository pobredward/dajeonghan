import { TemplateCategory } from '@/types/template.types';

export interface TemplateCategoryInfo {
  id: TemplateCategory;
  name: string;
  icon: string;
  description: string;
}

export const TEMPLATE_CATEGORIES: readonly TemplateCategoryInfo[] = [
  {
    id: 'student_living_alone',
    name: '학생 자취',
    icon: '🎓',
    description: '혼자 사는 대학생을 위한 템플릿'
  },
  {
    id: 'worker_single',
    name: '직장인 1인',
    icon: '💼',
    description: '바쁜 직장인의 효율적인 루틴'
  },
  {
    id: 'worker_roommate',
    name: '룸메이트',
    icon: '👥',
    description: '함께 사는 룸메이트와 분담'
  },
  {
    id: 'newlywed',
    name: '신혼',
    icon: '💑',
    description: '신혼부부의 새로운 시작'
  },
  {
    id: 'family_with_kids',
    name: '아이 있는 가족',
    icon: '👨‍👩‍👧',
    description: '아이와 함께하는 가족 루틴'
  },
  {
    id: 'pet_owner',
    name: '반려동물',
    icon: '🐕',
    description: '반려동물과 함께하는 생활'
  },
  {
    id: 'minimalist',
    name: '미니멀리스트',
    icon: '✨',
    description: '최소한의 관리로 깔끔하게'
  },
  {
    id: 'weekend_warrior',
    name: '주말 집중형',
    icon: '⚡',
    description: '주말에 몰아서 하는 루틴'
  },
  {
    id: 'custom',
    name: '커스텀',
    icon: '🎨',
    description: '나만의 특별한 루틴'
  }
] as const;

export function getCategoryInfo(categoryId: TemplateCategory): TemplateCategoryInfo | undefined {
  return TEMPLATE_CATEGORIES.find(cat => cat.id === categoryId);
}

export function getCategoryName(categoryId: TemplateCategory): string {
  return getCategoryInfo(categoryId)?.name || '커스텀';
}

export function getCategoryIcon(categoryId: TemplateCategory): string {
  return getCategoryInfo(categoryId)?.icon || '🎨';
}
