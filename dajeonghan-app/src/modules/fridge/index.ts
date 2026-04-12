/**
 * 냉장고 모듈 (Fridge Module)
 * 
 * 다정한의 식재료 유통기한 관리 기능을 제공합니다.
 * - 보관 조건별 수명 자동 계산
 * - 임박 알림 시스템
 * - 300+ 식재료 데이터베이스
 * - 한국 소비기한 표시제 반영
 */

// 타입
export * from './types';

// 서비스
export { FridgeService } from './FridgeService';

// 데이터베이스
export * from './data/foodDatabase';

// 컴포넌트
export { FoodItemCard } from './components/FoodItemCard';

// 화면
export { FridgeHomeScreen } from './screens/FridgeHomeScreen';
