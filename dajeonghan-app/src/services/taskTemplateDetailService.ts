/**
 * Task 템플릿 상세 정보 서비스
 *
 * furnitureTaskTemplates.ts의 whyNeeded / howTo 필드를 로컬에서 조회합니다.
 * 외부 네트워크 의존 없이 동기적으로 동작합니다.
 */

import { FURNITURE_TASK_TEMPLATES } from '@/data/furnitureTaskTemplates';
import { TaskTemplateDetail } from '@/types/furnitureTaskTemplate.types';

/**
 * templateItemId에 해당하는 상세 정보를 로컬 템플릿 데이터에서 반환합니다.
 * whyNeeded / howTo 중 하나라도 있어야 non-null을 반환합니다.
 */
export function fetchTaskTemplateDetail(
  templateItemId: string
): TaskTemplateDetail | null {
  for (const tmpl of FURNITURE_TASK_TEMPLATES) {
    const item = tmpl.tasks.find((t) => t.id === templateItemId);
    if (item && (item.whyNeeded || item.howTo)) {
      return {
        templateItemId,
        whyNeeded: item.whyNeeded,
        howTo: item.howTo,
        imageUrls: item.imageUrls,
        referenceLinks: item.referenceLinks,
        updatedAt: 0,
      };
    }
  }
  return null;
}
