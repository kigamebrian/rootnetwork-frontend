// frontend/src/utils/tracking.js
import axios from 'axios';

class Tracking {
  constructor() {
    this.sessionId = null;
  }

  async trackPageView(pageType, postId = null) {
    try {
      await axios.post('/api/track/page-view', {
        url: window.location.pathname,
        page_type: pageType,
        post_id: postId,
        referrer: document.referrer
      });
      console.log(`📊 Tracked page view: ${pageType}`);
    } catch (error) {
      console.error('Tracking error:', error);
    }
  }

  async trackAction(actionType, details = null, targetId = null, targetType = null) {
    try {
      await axios.post('/api/track/action', {
        action_type: actionType,
        action_details: details,
        target_id: targetId,
        target_type: targetType
      });
      console.log(`📊 Tracked action: ${actionType}`);
    } catch (error) {
      console.error('Tracking error:', error);
    }
  }
}

export default new Tracking();