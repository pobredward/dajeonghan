/**
 * Analytics Service
 * 
 * React Native 환경을 위한 Analytics 로깅 서비스
 * 실제 프로덕션에서는 @react-native-firebase/analytics를 사용하거나
 * 다른 Analytics 솔루션(Amplitude, Mixpanel 등)을 통합하세요.
 */

interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
  timestamp: Date;
}

class AnalyticsLogger {
  private events: AnalyticsEvent[] = [];
  private userProperties: Record<string, any> = {};
  private userId?: string;

  logEvent(name: string, params?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name,
      params,
      timestamp: new Date()
    };
    this.events.push(event);
    
    if (__DEV__) {
      console.log('📊 Analytics Event:', name, params);
    }
  }

  setUserProperties(properties: Record<string, any>) {
    this.userProperties = { ...this.userProperties, ...properties };
    
    if (__DEV__) {
      console.log('👤 Analytics User Properties:', properties);
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    
    if (__DEV__) {
      console.log('👤 Analytics User ID:', userId);
    }
  }

  getEvents() {
    return this.events;
  }

  getUserProperties() {
    return this.userProperties;
  }

  getUserId() {
    return this.userId;
  }
}

const analyticsLogger = new AnalyticsLogger();

export class AnalyticsService {
  /**
   * 앱 시작
   */
  static async logAppOpen() {
    try {
      analyticsLogger.logEvent('app_open');
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 화면 뷰
   */
  static async logScreenView(screenName: string, screenClass?: string) {
    try {
      analyticsLogger.logEvent('screen_view', {
        screen_name: screenName,
        screen_class: screenClass || screenName
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 테스크 완료
   */
  static async logTaskComplete(
    taskType: 'cleaning' | 'fridge' | 'medicine',
    estimatedMinutes: number
  ) {
    try {
      analyticsLogger.logEvent('task_complete', {
        task_type: taskType,
        estimated_minutes: estimatedMinutes
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 스트릭 달성
   */
  static async logStreakAchieved(days: number) {
    try {
      analyticsLogger.logEvent('streak_achieved', {
        days
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 온보딩 완료
   */
  static async logOnboardingComplete(persona: string) {
    try {
      analyticsLogger.logEvent('onboarding_complete', {
        persona
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 프리미엄 화면 보기
   */
  static async logPremiumView(feature: string) {
    try {
      analyticsLogger.logEvent('premium_view', {
        feature
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 구매 시작
   */
  static async logPurchaseBegin(
    productId: string,
    price: number,
    currency: string = 'KRW'
  ) {
    try {
      analyticsLogger.logEvent('begin_checkout', {
        currency,
        value: price,
        items: [{
          item_id: productId,
          item_name: productId,
          price
        }]
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 구매 완료
   */
  static async logPurchaseComplete(
    productId: string,
    price: number,
    currency: string = 'KRW'
  ) {
    try {
      analyticsLogger.logEvent('purchase', {
        currency,
        value: price,
        items: [{
          item_id: productId,
          item_name: productId,
          price
        }]
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 사용자 ID 설정
   */
  static async setAnalyticsUserId(userId: string) {
    try {
      analyticsLogger.setUserId(userId);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 사용자 속성 설정
   */
  static async setUserProperties(properties: {
    persona?: string;
    isPremium?: boolean;
    installDate?: string;
  }) {
    try {
      const userProps: Record<string, string> = {};
      
      if (properties.persona) {
        userProps.persona = properties.persona;
      }
      if (properties.isPremium !== undefined) {
        userProps.is_premium = properties.isPremium ? 'true' : 'false';
      }
      if (properties.installDate) {
        userProps.install_date = properties.installDate;
      }

      analyticsLogger.setUserProperties(userProps);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 템플릿 공유
   */
  static async logTemplateShare(templateId: string) {
    try {
      analyticsLogger.logEvent('share', {
        content_type: 'template',
        content_id: templateId
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 주간 리포트 조회
   */
  static async logWeeklyReportView() {
    try {
      analyticsLogger.logEvent('weekly_report_view');
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * 디버깅용: 모든 이벤트 조회
   */
  static getEvents() {
    return analyticsLogger.getEvents();
  }

  /**
   * 디버깅용: 사용자 속성 조회
   */
  static getUserProperties() {
    return analyticsLogger.getUserProperties();
  }
}
