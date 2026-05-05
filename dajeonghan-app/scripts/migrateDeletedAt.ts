/**
 * 다정한 - deletedAt 필드 마이그레이션 스크립트
 *
 * 목적:
 *   Firestore의 `where('deletedAt', '==', null)` 서버 필터링을 활성화하기 위해
 *   기존에 deletedAt 필드가 없는 태스크 문서에 `deletedAt: null`을 일괄 세팅합니다.
 *
 * 배경:
 *   Firestore의 `where('deletedAt', '==', null)`은 필드가 null로 명시 저장된 문서만 매칭합니다.
 *   필드 자체가 없는 문서(optional 필드 미저장)는 매칭되지 않으므로 마이그레이션이 필요합니다.
 *
 * 실행 방법:
 *   1. Firebase Admin SDK 서비스 계정 키를 준비합니다.
 *      Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성
 *   2. 키 파일을 안전한 경로에 저장합니다 (절대 git에 커밋하지 마세요).
 *   3. 환경변수를 설정합니다:
 *      export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
 *   4. 스크립트를 실행합니다:
 *      npx ts-node --project tsconfig.json scripts/migrateDeletedAt.ts
 *
 * 주의사항:
 *   - 실행 전 반드시 Firestore 백업을 진행하세요.
 *   - 이미 deletedAt 필드가 있는 문서(null 또는 Timestamp)는 건드리지 않습니다.
 *   - Firestore 쓰기 비용이 발생합니다 (업데이트 문서 수만큼).
 */

import * as admin from 'firebase-admin';

// GOOGLE_APPLICATION_CREDENTIALS 환경변수를 사용하거나, 아래 주석을 해제하여 직접 경로 지정
// admin.initializeApp({
//   credential: admin.credential.cert('/path/to/serviceAccountKey.json'),
// });
admin.initializeApp();

const db = admin.firestore();

async function migrateDeletedAt(): Promise<void> {
  console.log('=== deletedAt 마이그레이션 시작 ===\n');

  let totalUsers = 0;
  let totalTasksScanned = 0;
  let totalTasksUpdated = 0;
  let totalErrors = 0;

  const usersSnap = await db.collection('users').get();
  totalUsers = usersSnap.size;
  console.log(`전체 유저 수: ${totalUsers}`);

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    console.log(`\n처리 중: userId=${userId}`);

    try {
      const tasksSnap = await db.collection(`users/${userId}/tasks`).get();
      totalTasksScanned += tasksSnap.size;

      // deletedAt 필드가 없는 문서만 추출
      const docsToUpdate = tasksSnap.docs.filter(taskDoc => !('deletedAt' in taskDoc.data()));

      if (docsToUpdate.length === 0) {
        console.log(`  → 업데이트 대상 없음 (${tasksSnap.size}개 문서 모두 정상)`);
        continue;
      }

      console.log(`  → ${tasksSnap.size}개 중 ${docsToUpdate.length}개 업데이트 대상`);

      // Firestore 배치는 최대 500개 제한이므로 500개 단위로 나눔
      const BATCH_SIZE = 500;
      for (let i = 0; i < docsToUpdate.length; i += BATCH_SIZE) {
        const chunk = docsToUpdate.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        for (const taskDoc of chunk) {
          batch.update(taskDoc.ref, { deletedAt: null });
        }
        await batch.commit();
        console.log(`  배치 커밋 완료: ${i + chunk.length}/${docsToUpdate.length}`);
      }

      totalTasksUpdated += docsToUpdate.length;
    } catch (err) {
      console.error(`  [오류] userId=${userId}:`, err);
      totalErrors++;
    }
  }

  console.log('\n=== 마이그레이션 완료 ===');
  console.log(`유저 수:           ${totalUsers}`);
  console.log(`스캔한 태스크 수:  ${totalTasksScanned}`);
  console.log(`업데이트한 문서:   ${totalTasksUpdated}`);
  console.log(`오류 발생 유저:    ${totalErrors}`);
}

migrateDeletedAt().catch(err => {
  console.error('마이그레이션 실패:', err);
  process.exit(1);
});
