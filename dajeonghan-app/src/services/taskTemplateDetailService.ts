/**
 * Task 템플릿 상세 정보 서비스
 *
 * TASK_TEMPLATE_MAP 을 통해 O(1) 로 로컬 데이터를 조회한다.
 * 네트워크 없이 동기적으로 동작한다.
 */

import { TASK_TEMPLATE_MAP } from '@/data/furnitureTaskTemplates';
import { TaskTemplateDetail } from '@/types/furnitureTaskTemplate.types';

/**
 * templateItemId 에 해당하는 상세 정보를 반환한다.
 * whyNeeded / howTo 중 하나라도 없으면 null 을 반환한다.
 */
export function fetchTaskTemplateDetail(
  templateItemId: string
): TaskTemplateDetail | null {
  const item = TASK_TEMPLATE_MAP.get(templateItemId);
  if (!item || (!item.whyNeeded && !item.howTo)) return null;
  return {
    templateItemId,
    whyNeeded: item.whyNeeded,
    howTo: item.howTo,
    imageUrls: item.imageUrls,
    referenceLinks: item.referenceLinks,
    updatedAt: 0,
  };
}
