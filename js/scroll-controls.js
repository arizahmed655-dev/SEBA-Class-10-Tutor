/* ========== SCROLLING CONTROL FUNCTIONS ========== */
let isAutoScrolling = true;
let scrollPaused = false;
let scrollPauseTimeout = null;
let hoverStartTime = 0;
let isHovering = false;

function initializeScrollControls() {
  const chatArea = document.getElementById('chat');
  if (!chatArea) return;
  
  chatArea.addEventListener('mouseenter', function() {
    isHovering = true;
    hoverStartTime = Date.now();
    scrollPaused = true;
    console.log("Scroll paused - mouse entered chat area");
  });
  
  chatArea.addEventListener('mouseleave', function() {
    isHovering = false;
    
    if (Date.now() - hoverStartTime > 100) {
      clearTimeout(scrollPauseTimeout);
      
      scrollPauseTimeout = setTimeout(() => {
        scrollPaused = false;
        console.log("Scroll will resume in 2 seconds");
        
        setTimeout(() => {
          if (!isHovering) {
            console.log("Auto-scrolling resumed");
            chatArea.scrollTop = chatArea.scrollHeight;
          }
        }, 2000);
        
      }, 100);
    } else {
      scrollPaused = false;
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  });
  
  chatArea.addEventListener('touchstart', function() {
    isHovering = true;
    scrollPaused = true;
    console.log("Scroll paused - touch started");
  });
  
  chatArea.addEventListener('touchend', function() {
    isHovering = false;
    setTimeout(() => {
      scrollPaused = false;
      console.log("Scroll resumed after touch");
    }, 2000);
  });
  
  // Auto-scroll on send button hover
  const sendButton = document.getElementById('send-btn');
  if (sendButton) {
    sendButton.addEventListener('mouseenter', forceScrollToBottom);
    sendButton.addEventListener('touchstart', forceScrollToBottom);
    sendButton.addEventListener('click', forceScrollToBottom);
  }
}

function forceScrollToBottom() {
  const chatArea = document.getElementById('chat');
  if (!chatArea) return;
  
  const attemptScroll = (attempt = 0) => {
    if (attempt > 3) return;
    
    chatArea.scrollTop = chatArea.scrollHeight;
    
    const isAtBottom = Math.abs(
      chatArea.scrollHeight - chatArea.clientHeight - chatArea.scrollTop
    ) <= 2;
    
    if (!isAtBottom) {
      setTimeout(() => {
        chatArea.scrollTop = chatArea.scrollHeight;
        attemptScroll(attempt + 1);
      }, 20 * (attempt + 1));
    }
  };
  
  attemptScroll();
}

// Export for use in other files
window.initializeScrollControls = initializeScrollControls;
window.forceScrollToBottom = forceScrollToBottom;
window.scrollPaused = scrollPaused;
window.isAutoScrolling = isAutoScrolling;
