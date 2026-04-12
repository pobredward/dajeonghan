/**
 * 청소 모듈 (Cleaning Module)
 * 
 * 다정한의 청소 관리 기능을 제공합니다.
 * - 방/공간 기반 청소 태스크 관리
 * - 더러움 점수 자동 계산
 * - 10분 코스 & 여유 코스 추천
 * - 환경별 맞춤 조정 (세탁기 유무 등)
 */

// 타입
export * from './types';

// 서비스
export { CleaningService } from './CleaningService';

// 컴포넌트
export { CleaningCard } from './components/CleaningCard';

// 화면
export { CleaningHomeScreen } from './screens/CleaningHomeScreen';

// 템플릿 데이터
export { default as cleaningTemplates } from './templates/cleaningTemplates.json';
