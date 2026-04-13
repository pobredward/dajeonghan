import * as Linking from 'expo-linking';

export interface ShareLinkResult {
  url: string;
  text: string;
}

export class TemplateSharingService {
  /**
   * 공유 링크 생성
   */
  static async generateShareLink(templateId: string): Promise<ShareLinkResult> {
    const url = Linking.createURL(`template/${templateId}`);
    const text = this.generateShareText('템플릿');
    
    return {
      url,
      text
    };
  }

  /**
   * 딥링크 파싱
   */
  static parseDeepLink(url: string): { templateId?: string } {
    const { path, queryParams } = Linking.parse(url);
    
    if (path?.startsWith('template/')) {
      const templateId = path.replace('template/', '');
      return { templateId };
    }
    
    return {};
  }

  /**
   * 공유 텍스트 생성
   */
  static generateShareText(templateName: string): string {
    return `다정한에서 "${templateName}" 템플릿을 공유합니다! 생활 관리가 쉬워져요 ✨`;
  }

  /**
   * 딥링크 처리
   */
  static handleDeepLink(url: string, onTemplateFound: (templateId: string) => void) {
    const { templateId } = this.parseDeepLink(url);
    
    if (templateId) {
      onTemplateFound(templateId);
    }
  }

  /**
   * 초기 URL 확인 및 처리
   */
  static async checkInitialURL(onTemplateFound: (templateId: string) => void): Promise<void> {
    const initialURL = await Linking.getInitialURL();
    if (initialURL) {
      this.handleDeepLink(initialURL, onTemplateFound);
    }
  }

  /**
   * URL 리스너 등록
   */
  static addURLListener(onTemplateFound: (templateId: string) => void): () => void {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      this.handleDeepLink(url, onTemplateFound);
    });

    return () => {
      subscription.remove();
    };
  }
}
