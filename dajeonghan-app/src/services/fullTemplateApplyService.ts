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
  getHouseLayout,
  saveHouseLayout,
  removeFurniture,
  removeRoom,
} from '@/services/houseService';
import { hardDeleteTask, getTasks } from '@/services/firestoreService';
import { FurnitureTaskService } from '@/services/furnitureTaskService';
import { TemplateMarketplaceService } from '@/services/templateMarketplaceService';

export type ApplyMode = 'merge' | 'replace';

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
function buildFurniture(sf: SharedFurniture, roomSize: { width: number; height: number }, idx: number): Furniture {
  return {
    id: `furniture_${Date.now()}_${idx}`,
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
   * 템플릿 적용 (병합 또는 교체)
   */
  static async applyFullTemplate(
    templateId: string,
    userId: string,
    mode: ApplyMode
  ): Promise<void> {
    const template = await TemplateMarketplaceService.getTemplateById(templateId);
    if (!template) throw new Error('템플릿을 찾을 수 없습니다.');

    if (mode === 'replace') {
      await this.replaceLayout(userId, template);
    } else {
      await this.mergeLayout(userId, template);
    }

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

  /** 교체 모드 */
  private static async replaceLayout(userId: string, template: SharedTemplate): Promise<void> {
    if (!template.houseLayout) return;

    // 기존 레이아웃의 모든 Task 삭제 후 레이아웃 덮어쓰기
    const existing = await getHouseLayout(userId);
    if (existing) {
      const allTasks = await getTasks(userId);
      const allTaskIds = allTasks.map(t => t.id);
      await Promise.all(allTaskIds.map(id => hardDeleteTask(userId, id)));
    }

    const rooms: Room[] = template.houseLayout.rooms.map((sr, rIdx) => buildRoom(sr, rIdx));

    const newLayout: HouseLayout = {
      id: existing?.id ?? `layout_${Date.now()}`,
      userId,
      layoutType: template.houseLayout.layoutType,
      canvasSize: template.houseLayout.canvasSize,
      rooms,
      character: template.houseLayout.character,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    await saveHouseLayout(newLayout);

    // Task 생성 (저장 후 실행)
    await this.createTasksForRooms(userId, template.houseLayout.rooms, rooms);
  }

  /** 병합 모드 */
  private static async mergeLayout(userId: string, template: SharedTemplate): Promise<void> {
    if (!template.houseLayout) return;

    const existing = await getHouseLayout(userId);
    if (!existing) {
      // 기존 레이아웃 없으면 교체와 동일하게 처리
      await this.replaceLayout(userId, template);
      return;
    }

    const newRooms: Room[] = template.houseLayout.rooms.map((sr, rIdx) => buildRoom(sr, rIdx));
    existing.rooms = [...existing.rooms, ...newRooms];
    existing.updatedAt = new Date();
    await saveHouseLayout(existing);

    await this.createTasksForRooms(userId, template.houseLayout.rooms, newRooms);
  }

  /** 방 목록에 대한 Task 일괄 생성 */
  private static async createTasksForRooms(
    userId: string,
    sharedRooms: SharedRoom[],
    createdRooms: Room[]
  ): Promise<void> {
    for (let rIdx = 0; rIdx < sharedRooms.length; rIdx++) {
      const sr = sharedRooms[rIdx];
      const room = createdRooms[rIdx];

      for (let fIdx = 0; fIdx < sr.furnitures.length; fIdx++) {
        const sf = sr.furnitures[fIdx];
        const furniture = buildFurniture(sf, room.size, fIdx);

        // 레이아웃에 가구 추가
        const existingLayout = await getHouseLayout(userId);
        if (!existingLayout) continue;

        const targetRoom = existingLayout.rooms.find(r => r.id === room.id);
        if (!targetRoom) continue;

        targetRoom.furnitures.push(furniture);
        existingLayout.updatedAt = new Date();
        await saveHouseLayout(existingLayout);

        // Task 생성
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
