import { Platform } from 'react-native';

const PRODUCT_IDS = {
  ios: ['dajeonghan_premium_monthly', 'dajeonghan_premium_yearly'],
  android: ['dajeonghan_premium_monthly', 'dajeonghan_premium_yearly']
};

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
}

export interface Purchase {
  productId: string;
  transactionId: string;
  transactionReceipt: string;
  purchaseToken?: string;
}

export class PurchaseService {
  private static isInitialized = false;

  /**
   * IAP 초기화 (실제 react-native-iap 사용 시 활성화)
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('Purchase service initialized');
      this.isInitialized = true;
    } catch (error) {
      console.error('Purchase initialization error:', error);
      throw error;
    }
  }

  /**
   * 상품 조회 (Mock)
   */
  static async getProducts(): Promise<Product[]> {
    try {
      const mockProducts: Product[] = [
        {
          productId: 'dajeonghan_premium_monthly',
          title: '다정한 프리미엄 (월간)',
          description: '모든 프리미엄 기능 이용',
          price: '4,900원',
          currency: 'KRW'
        },
        {
          productId: 'dajeonghan_premium_yearly',
          title: '다정한 프리미엄 (연간)',
          description: '모든 프리미엄 기능 이용 (2개월 무료)',
          price: '49,000원',
          currency: 'KRW'
        }
      ];
      
      return mockProducts;
    } catch (error) {
      console.error('Get products error:', error);
      return [];
    }
  }

  /**
   * 구매 (Mock)
   */
  static async purchase(productId: string): Promise<boolean> {
    try {
      console.log('Starting purchase:', productId);
      
      await this.simulateDelay(2000);
      
      const mockPurchase: Purchase = {
        productId,
        transactionId: `mock_${Date.now()}`,
        transactionReceipt: 'mock_receipt',
        purchaseToken: 'mock_token'
      };
      
      const verified = await this.verifyPurchase(mockPurchase);
      
      if (verified) {
        console.log('Purchase successful:', productId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Purchase error:', error);
      return false;
    }
  }

  /**
   * 영수증 검증 (Mock)
   */
  private static async verifyPurchase(purchase: Purchase): Promise<boolean> {
    try {
      console.log('Verifying purchase:', purchase.productId);
      
      await this.simulateDelay(1000);
      
      return true;
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  }

  /**
   * 구매 복원 (Mock)
   */
  static async restorePurchases(): Promise<boolean> {
    try {
      console.log('Restoring purchases');
      
      await this.simulateDelay(1500);
      
      return false;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  }

  /**
   * 연결 종료
   */
  static async endConnection(): Promise<void> {
    try {
      console.log('Purchase service disconnected');
      this.isInitialized = false;
    } catch (error) {
      console.error('End connection error:', error);
    }
  }

  /**
   * 구독 상태 확인 (Mock)
   */
  static async checkSubscriptionStatus(userId: string): Promise<{
    isPremium: boolean;
    expiryDate?: Date;
  }> {
    try {
      return {
        isPremium: false,
        expiryDate: undefined
      };
    } catch (error) {
      console.error('Check subscription error:', error);
      return {
        isPremium: false
      };
    }
  }

  /**
   * 지연 시뮬레이션
   */
  private static simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
