/* ========== ADVERTISEMENT MANAGER ========== */
class SEBAAdManager {
  constructor() {
    this.state = {
      questionCount: 0,
      subjectChanges: 0,
      chapterChanges: 0,
      lastInterstitialTime: 0,
      lastRewardedTime: 0,
      interstitialShownCount: 0,
      rewardedShownCount: 0,
      interstitialHourlyCount: 0,
      lastHourResetTime: Date.now(),
      isAndroid: false,
      hooksAttached: false
    };

    this.config = {
      interstitial: {
        questionsBetweenAds: 2,
        minTimeBetween: 30000,
        maxPerHour: 10,
        enable: true
      },
      rewarded: {
        firstChangeFree: true,
        cooldown: 300000,
        maxPerSession: 5,
        enable: true
      },
      debugging: false
    };

    this.log("✅ SEBA Ad Manager Initialized");
    this.detectEnvironment();
    this.setupHourlyReset();
    this.initializeHooks();
  }

  /* ================= ENVIRONMENT DETECTION ================= */
  detectEnvironment() {
    this.state.isAndroid = typeof AndroidInterface !== 'undefined';
    this.log(`Environment: ${this.state.isAndroid ? 'Android App' : 'Web Browser'}`);
    
    if (this.state.isAndroid) {
      this.log("🎯 Android Interface detected");
      this.testAndroidMethods();
    }
  }

  testAndroidMethods() {
    if (!this.state.isAndroid) return;
    
    const methods = ['showInterstitial', 'showRewarded'];
    let allMethodsAvailable = true;
    
    methods.forEach(method => {
      if (typeof AndroidInterface[method] !== 'function') {
        this.log(`❌ Method ${method}() not available`, "error");
        allMethodsAvailable = false;
      }
    });
    
    if (allMethodsAvailable) {
      this.log("✅ All Android methods are available");
    }
  }

  /* ================= IMPROVED HOOK SYSTEM ================= */
  initializeHooks() {
    this.attachHooks();
    
    if (!this.state.hooksAttached) {
      this.log("Hooks not attached, retrying in 2 seconds...", "warn");
      setTimeout(() => this.attachHooks(), 2000);
    }
    
    this.setupMutationObserver();
  }

  attachHooks() {
    let hooksCount = 0;
    
    // 1. Hook into sendQuestion
    if (typeof window.sendQuestion === 'function') {
      this.hookSendQuestion();
      hooksCount++;
    }
    
    // 2. Hook into subject and chapter selects
    hooksCount += this.hookSelectElements();
    
    // 3. Set up global event listeners as fallback
    this.setupGlobalEventListeners();
    
    if (hooksCount > 0) {
      this.state.hooksAttached = true;
      this.log(`✅ ${hooksCount} hook(s) attached successfully`);
    } else {
      this.log("⚠️ No hooks could be attached. Using global listeners.", "warn");
    }
  }

  hookSendQuestion() {
    try {
      const originalSend = window.sendQuestion;
      window.sendQuestion = (...args) => {
        const result = originalSend.apply(this, args);
        this.onQuestionAnswered();
        return result;
      };
      this.log("Hooked into sendQuestion()");
    } catch (error) {
      this.log(`Failed to hook sendQuestion: ${error}`, "error");
    }
  }

  hookSelectElements() {
    let hooksCount = 0;
    
    const selectConfigs = [
      { name: 'subjectSelect', eventName: 'subject-change' },
      { name: 'chapterSelect', eventName: 'chapter-change' }
    ];
    
    selectConfigs.forEach(config => {
      let element = document.getElementById(config.name);
      
      if (!element) {
        element = document.querySelector(`[name="${config.name}"]`);
      }
      
      if (!element) {
        element = document.querySelector(`[class*="${config.name}"]`);
      }
      
      if (!element && window[config.name]) {
        element = window[config.name];
      }
      
      if (element && element.tagName === 'SELECT') {
        this.attachSelectListener(element, config.name, config.eventName);
        hooksCount++;
      } else {
        this.log(`Select element '${config.name}' not found`, "warn");
      }
    });
    
    return hooksCount;
  }

  attachSelectListener(selectElement, elementName, eventName) {
    try {
      const newElement = selectElement.cloneNode(true);
      selectElement.parentNode.replaceChild(newElement, selectElement);
      
      newElement.addEventListener('change', (event) => {
        const value = event.target.value;
        this.log(`${elementName} changed to: ${value}`);
        
        document.dispatchEvent(new CustomEvent(eventName, { 
          detail: { value: value, element: elementName }
        }));
        
        if (elementName === 'subjectSelect') {
          this.onSubjectChange(value);
        } else if (elementName === 'chapterSelect') {
          this.onChapterChange(value);
        }
      });
      
      this.log(`✅ Listener attached to ${elementName}`);
    } catch (error) {
      this.log(`Failed to attach listener to ${elementName}: ${error}`, "error");
    }
  }

  setupGlobalEventListeners() {
    document.addEventListener('subject-change', (event) => {
      this.onSubjectChange(event.detail.value);
    });
    
    document.addEventListener('chapter-change', (event) => {
      this.onChapterChange(event.detail.value);
    });
    
    document.addEventListener('change', (event) => {
      const element = event.target;
      if (element.tagName === 'SELECT') {
        const id = element.id || element.name || element.className;
        
        if (id && id.includes('subject')) {
          this.log("Detected subject change via global listener");
          this.onSubjectChange(element.value);
        }
        
        if (id && id.includes('chapter')) {
          this.log("Detected chapter change via global listener");
          this.onChapterChange(element.value);
        }
      }
    });
    
    this.log("Global event listeners set up");
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              if (node.tagName === 'SELECT') {
                const id = node.id || node.name || '';
                if (id.includes('subject') || id.includes('chapter')) {
                  this.log(`Dynamic select element detected: ${id}`);
                  this.attachSelectListener(node, id, `${id}-change`);
                }
              }
              
              const selects = node.querySelectorAll ? node.querySelectorAll('select') : [];
              selects.forEach(select => {
                const id = select.id || select.name || '';
                if (id.includes('subject') || id.includes('chapter')) {
                  this.log(`Dynamic select element found in children: ${id}`);
                  this.attachSelectListener(select, id, `${id}-change`);
                }
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.log("MutationObserver set up for dynamic elements");
  }

  /* ================= TRACKING ================= */
  onQuestionAnswered() {
    this.state.questionCount++;
    this.log(`Question answered! Total: ${this.state.questionCount}`);
    
    this.checkHourlyReset();
    if (this.shouldShowInterstitial()) {
      this.showInterstitial();
    }
  }

  onSubjectChange(value) {
    if (!value || value.trim() === "" || value === "0" || value === "none") {
      this.log("Subject change ignored (empty/invalid value)");
      return;
    }
    
    this.state.subjectChanges++;
    this.log(`Subject changed to: ${value}. Total changes: ${this.state.subjectChanges}`);
    
    if (this.config.rewarded.firstChangeFree && this.state.subjectChanges === 1) {
      this.log("🔓 First subject change free (no ad)");
      return;
    }
    
    if (this.shouldShowRewarded()) {
      this.log("Triggering rewarded ad for subject change");
      setTimeout(() => this.showRewarded(), 500);
    } else {
      this.showRewardedUnavailableMessage();
    }
  }

  onChapterChange(value) {
    if (!value || value.trim() === "" || value === "0" || value === "none") {
      this.log("Chapter change ignored (empty/invalid value)");
      return;
    }
    
    this.state.chapterChanges++;
    this.log(`Chapter changed to: ${value}. Total changes: ${this.state.chapterChanges}`);
    
    if (this.config.rewarded.firstChangeFree && this.state.chapterChanges === 1) {
      this.log("🔓 First chapter change free (no ad)");
      return;
    }
    
    if (this.shouldShowRewarded()) {
      this.log("Triggering rewarded ad for chapter change");
      setTimeout(() => this.showRewarded(), 500);
    } else {
      this.showRewardedUnavailableMessage();
    }
  }

  /* ================= AD CONDITIONS ================= */
  checkHourlyReset() {
    const now = Date.now();
    const hourInMs = 3600000;
    
    if (now - this.state.lastHourResetTime >= hourInMs) {
      this.log("🔄 Resetting hourly interstitial counter");
      this.state.interstitialHourlyCount = 0;
      this.state.lastHourResetTime = now;
    }
  }

  shouldShowInterstitial() {
    if (!this.config.interstitial.enable) return false;
    if (this.state.questionCount % this.config.interstitial.questionsBetweenAds !== 0) {
      return false;
    }
    
    const now = Date.now();
    
    if (now - this.state.lastInterstitialTime < this.config.interstitial.minTimeBetween) {
      const remaining = Math.round((this.config.interstitial.minTimeBetween - (now - this.state.lastInterstitialTime)) / 1000);
      this.log(`Interstitial cooldown: ${remaining}s remaining`);
      return false;
    }
    
    if (this.state.interstitialHourlyCount >= this.config.interstitial.maxPerHour) {
      this.log(`Hourly interstitial limit reached (${this.config.interstitial.maxPerHour})`);
      return false;
    }
    
    return true;
  }

  shouldShowRewarded() {
    if (!this.config.rewarded.enable) return false;
    if (this.state.rewardedShownCount >= this.config.rewarded.maxPerSession) {
      this.log(`Rewarded session limit reached (${this.config.rewarded.maxPerSession})`);
      return false;
    }
    
    const now = Date.now();
    
    if (now - this.state.lastRewardedTime < this.config.rewarded.cooldown) {
      const remaining = Math.round((this.config.rewarded.cooldown - (now - this.state.lastRewardedTime)) / 60000);
      this.log(`Rewarded cooldown: ${remaining}min remaining`);
      return false;
    }
    
    return true;
  }

  /* ================= AD DISPLAY ================= */
  showInterstitial() {
    this.log("📺 Showing interstitial...");
    
    if (this.state.isAndroid && typeof AndroidInterface.showInterstitial === 'function') {
      try {
        this.state.lastInterstitialTime = Date.now();
        this.state.interstitialShownCount++;
        this.state.interstitialHourlyCount++;
        
        this.showToast("Loading ad...");
        AndroidInterface.showInterstitial();
        
      } catch (error) {
        this.log(`Android interstitial error: ${error}`, "error");
        this.showToast("Ad failed to load");
        this.showMockAd('interstitial');
      }
    } else {
      this.log("Using mock interstitial (web mode)");
      this.showMockAd('interstitial');
    }
  }

  showRewarded() {
    this.log("🎁 Showing rewarded ad...");
    
    if (this.state.isAndroid && typeof AndroidInterface.showRewarded === 'function') {
      try {
        this.state.lastRewardedTime = Date.now();
        this.state.rewardedShownCount++;
        
        this.showToast("Loading rewarded ad...");
        AndroidInterface.showRewarded();
        
      } catch (error) {
        this.log(`Android rewarded error: ${error}`, "error");
        this.showToast("Rewarded ad failed");
        this.showMockAd('rewarded');
      }
    } else {
      this.log("Using mock rewarded (web mode)");
      this.showMockAd('rewarded');
    }
  }

  /* ================= UTILITIES ================= */
  log(message, type = "info") {
    const prefix = type === "error" ? "❌" : type === "warn" ? "⚠️" : "✅";
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${prefix} SEBA: ${message}`;
    
    console.log(logMessage);
  }

  showToast(message, duration = 3000) {
    const existingToast = document.getElementById('seba-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.id = 'seba-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      animation: toastSlideIn 0.3s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  showRewardedUnavailableMessage() {
    const now = Date.now();
    const timeSinceLast = now - this.state.lastRewardedTime;
    
    if (timeSinceLast < this.config.rewarded.cooldown) {
      const remaining = Math.ceil((this.config.rewarded.cooldown - timeSinceLast) / 60000);
      this.showToast(`Rewarded ad available in ${remaining} minute${remaining > 1 ? 's' : ''}`);
    } else if (this.state.rewardedShownCount >= this.config.rewarded.maxPerSession) {
      this.showToast("Daily reward limit reached");
    }
  }

  /* ================= MOCK ADS (for web) ================= */
  showMockAd(type) {
    if (type === 'interstitial') {
      alert("📺 Mock Interstitial Ad\n\n(In the app, this would show a real ad)");
    } else if (type === 'rewarded') {
      alert("🎁 Mock Rewarded Ad\n\nWatch the ad to continue to the next section!");
    }
  }

  /* ================= INITIALIZATION ================= */
  setupHourlyReset() {
    setInterval(() => {
      this.state.interstitialHourlyCount = 0;
      this.state.lastHourResetTime = Date.now();
      this.log("🔄 Hourly counter reset");
    }, 3600000);
  }
}

/* ================= ENHANCED INITIALIZATION ================= */
function initializeSEBAAdManager() {
  if (window.adManager) {
    console.log("SEBA Ad Manager already initialized");
    return window.adManager;
  }
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastSlideIn {
      from { opacity: 0; transform: translate(-50%, -20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes toastSlideOut {
      from { opacity: 1; transform: translate(-50%, 0); }
      to { opacity: 0; transform: translate(-50%, -20px); }
    }
  `;
  document.head.appendChild(style);
  
  window.adManager = new SEBAAdManager();
  console.log("🚀 SEBA Ad Manager Initialized Successfully");
  return window.adManager;
}

// Multiple initialization strategies
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSEBAAdManager);
} else {
  setTimeout(initializeSEBAAdManager, 1000);
}

window.addEventListener('load', () => {
  if (!window.adManager) {
    setTimeout(initializeSEBAAdManager, 500);
  }
});

// Export for use in other files
window.initializeSEBAAdManager = initializeSEBAAdManager;
