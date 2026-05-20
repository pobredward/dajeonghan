import {
  collection,
  doc,
  setDoc,
  updateDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { SharedTemplate, SharedRoom, SharedFurniture } from '@/types/template.types';
import { HouseLayout, Room, Furniture } from '@/types/house.types';
import {
  saveHouseLayoutAsNew,
  getHouseLayout,
} from '@/services/houseService';
import { FurnitureTaskService } from '@/services/furnitureTaskService';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';

/** SharedRoom → Room (새 ID 발급) */
function buildRoom(sharedRoom: SharedRoom, idx: number): Room {
  return {
    id: `room_${Date.now()}_${idx}`,
    type: sharedRoom.type,
    name: sharedRoom.name,
    position: sharedRoom.position,
    size: sharedRoom.size,
    color: sharedRoom.color,
    furnitures: [],
  };
}

/** SharedFurniture → Furniture (새 ID 발급, Task 연결은 이후 단계) */
function buildFurniture(sf: SharedFurniture, _roomSize: { width: number; height: number }, rIdx: number, fIdx: number): Furniture {
  return {
    id: `furniture_${Date.now()}_${rIdx}_${fIdx}`,
    type: sf.type,
    name: sf.name,
    emoji: sf.emoji,
    position: sf.position,
    size: sf.size,
    rotation: sf.rotation,
    linkedTaskIds: [],
    dirtyScore: 0,
    ...(sf.furnitureMetadata && { furnitureMetadata: sf.furnitureMetadata }),
  };
}

export class FullTemplateApplyService {
  /**
   * 템플릿 적용 (교체 + 기존 레이아웃 보관)
   * - 배치도(houseLayout)가 없는 템플릿은 적용 불가
   * - 기존 활성 레이아웃은 isActive: false 로 보관 (Task 유지)
   * - 새 레이아웃을 isActive: true 로 저장
   */
  static async applyFullTemplate(
    templateId: string,
    userId: string
  ): Promise<void> {
    const template = await TemplateMarketplaceService.getTemplateById(templateId);
    if (!template) throw new Error('템플릿을 찾을 수 없습니다.');
    if (!template.houseLayout) throw new Error('배치도가 없는 템플릿은 적용할 수 없습니다.');

    await this.applyLayout(userId, template);

    // 사용 기록 + usageCount 증가
    const usageRef = doc(collection(db, 'templateUsages'));
    await setDoc(usageRef, {
      templateId,
      userId,
      appliedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await updateDoc(doc(db, 'sharedTemplates', templateId), {
      usageCount: increment(1),
    });
  }

  /**
   * 레이아웃 적용 (기존 active → 보관, 새 레이아웃 → active)
   * 기존 Task는 삭제하지 않음 (furnitureId 기준으로 자연 분리됨)
   */
  private static async applyLayout(userId: string, template: SharedTemplate): Promise<void> {
    if (!template.houseLayout) return;

    const rooms: Room[] = template.houseLayout.rooms.map((sr, rIdx) => buildRoom(sr, rIdx));

    const newLayout: Omit<HouseLayout, 'id'> = {
      userId,
      layoutType: template.houseLayout.layoutType,
      canvasSize: template.houseLayout.canvasSize,
      rooms,
      character: template.houseLayout.character,
      totalRooms: rooms.length,
      name: template.name,
      isActive: true,
      sourceTemplateId: template.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 새 문서로 저장 (기존 active 자동 해제)
    const newLayoutId = await saveHouseLayoutAsNew(newLayout, template.name, template.id);

    // Task 생성 (레이아웃 저장 후)
    await this.createTasksForRooms(userId, template.houseLayout.rooms, rooms, newLayoutId);
  }

  /** 방 목록에 대한 Task 일괄 생성 — 레이아웃 read/write를 1회로 통합 */
  private static async createTasksForRooms(
    userId: string,
    sharedRooms: SharedRoom[],
    createdRooms: Room[],
    layoutId: string
  ): Promise<void> {
    const layout = await getHouseLayout(userId);
    if (!layout) return;

    // 가구 전부 메모리에 추가
    for (let rIdx = 0; rIdx < sharedRooms.length; rIdx++) {
      const sr = sharedRooms[rIdx];
      const room = createdRooms[rIdx];
      const targetRoom = layout.rooms.find(r => r.id === room.id);
      if (!targetRoom) continue;

      for (let fIdx = 0; fIdx < sr.furnitures.length; fIdx++) {
        const sf = sr.furnitures[fIdx];
        const furniture = buildFurniture(sf, room.size, rIdx, fIdx);
        targetRoom.furnitures.push(furniture);
      }
    }

    // 레이아웃 1회 저장
    layout.updatedAt = new Date();
    const { saveHouseLayout } = await import('@/services/houseService');
    await saveHouseLayout(layout);

    // Task 생성 (Firestore write 분리)
    for (let rIdx = 0; rIdx < sharedRooms.length; rIdx++) {
      const sr = sharedRooms[rIdx];
      const room = createdRooms[rIdx];
      const targetRoom = layout.rooms.find(r => r.id === room.id);
      if (!targetRoom) continue;

      for (let fIdx = 0; fIdx < sr.furnitures.length; fIdx++) {
        const sf = sr.furnitures[fIdx];
        const furniture = targetRoom.furnitures[fIdx];
        if (!furniture) continue;

        for (const templateTask of sf.tasks) {
          await FurnitureTaskService.addCustomTask(
            userId,
            room.id,
            furniture.id,
            room.name,
            furniture.name,
            {
              title: templateTask.title,
              description: templateTask.description,
              domain: templateTask.domain,
              customization: {
                recurrenceType: templateTask.recurrence.unit === 'day'
                  ? 'daily'
                  : templateTask.recurrence.unit === 'month'
                  ? 'monthly'
                  : 'weekly',
                interval: templateTask.recurrence.interval,
                estimatedMinutes: templateTask.estimatedMinutes,
                priority: templateTask.priority,
                notificationEnabled: templateTask.notificationSettings?.enabled ?? true,
              },
            }
          );
        }
      }
    }
  }
}
