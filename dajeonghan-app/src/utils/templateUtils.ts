import { SharedTemplate } from '@/types/template.types';

/**
 * 태그에서 자동 추출
 */
export function extractTags(description: string): string[] {
  const words = description.toLowerCase().split(/\s+/);
  
  const keywords = [
    '미니멀', '주말', '빠른', '청소', '정리',
    '대학생', '직장인', '가족', '1인', '룸메'
  ];
  
  return keywords.filter(keyword => 
    words.some(word => word.includes(keyword))
  );
}

/**
 * 템플릿 유사도 계산 (추천용)
 */
export function calculateTemplateSimilarity(
  template1: SharedTemplate,
  template2: SharedTemplate
): number {
  let score = 0;
  
  if (template1.category === template2.category) {
    score += 3;
  }
  
  const commonTags = template1.tags.filter(tag => 
    template2.tags.includes(tag)
  );
  score += commonTags.length;
  
  return score;
}

/**
 * 템플릿 검색 점수 계산
 */
export function calculateSearchScore(
  template: SharedTemplate,
  query: string
): number {
  const lowerQuery = query.toLowerCase();
  let score = 0;
  
  if (template.name.toLowerCase().includes(lowerQuery)) {
    score += 10;
  }
  
  if (template.description.toLowerCase().includes(lowerQuery)) {
    score += 5;
  }
  
  if (template.tags.some(tag => tag.includes(lowerQuery))) {
    score += 3;
  }
  
  score += Math.log10(template.usageCount + 1);
  
  return score;
}

/**
 * 템플릿 유효성 검증
 */
export function validateTemplate(template: Partial<SharedTemplate>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!template.name || template.name.trim().length === 0) {
    errors.push('템플릿 이름을 입력해주세요');
  }
  
  if (!template.description || template.description.trim().length === 0) {
    errors.push('템플릿 설명을 입력해주세요');
  }
  
  if (!template.tasks || template.tasks.length === 0) {
    if (!template.lifeObjects || template.lifeObjects.length === 0) {
      errors.push('최소 1개 이상의 테스크 또는 객체를 선택해주세요');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 템플릿 통계 계산
 */
export function calculateTemplateStats(template: SharedTemplate): {
  totalItems: number;
  estimatedTime: number;
  popularityScore: number;
} {
  const totalItems = template.tasks.length + template.lifeObjects.length;
  
  const estimatedTime = template.tasks.reduce((sum, task) => {
    return sum + (task.estimatedMinutes || 0);
  }, 0);
  
  const popularityScore = 
    template.usageCount * 3 + 
    template.likeCount * 2 + 
    template.reviewCount * 1 +
    template.averageRating * 10;
  
  return {
    totalItems,
    estimatedTime,
    popularityScore
  };
}
