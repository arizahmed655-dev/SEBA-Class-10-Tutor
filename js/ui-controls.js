/* ========== UI CONTROL FUNCTIONS ========== */

// Sidebar Functions
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

function setActive(element) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  element.classList.add('active');
  
  if (window.innerWidth <= 768) {
    toggleSidebar();
  }
  
  return false;
}

// Notification Function
function showNotification(message) {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) existingNotification.remove();
  
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Close sidebar when clicking outside (mobile)
document.addEventListener('click', function(event) {
  const sidebar = document.getElementById('sidebar');
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  
  if (window.innerWidth <= 768 && 
      sidebar.classList.contains('open') &&
      !sidebar.contains(event.target) &&
      !mobileMenuToggle.contains(event.target)) {
    sidebar.classList.remove('open');
  }
});

// Input event listeners
function initializeInputListeners() {
  if (!questionInput) return;
  
  questionInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter" && !e.shiftKey && !isStreaming) {
      e.preventDefault();
      sendQuestion();
    }
  });
  
  questionInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && e.shiftKey) {
      return;
    }
  });
  
  questionInput.focus();
}

// Export for use in other files
window.toggleSidebar = toggleSidebar;
window.setActive = setActive;
window.showNotification = showNotification;
window.initializeInputListeners = initializeInputListeners;
