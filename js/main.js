/* ========== MAIN INITIALIZATION ========== */

// Global variables
let isStreaming = false;
let currentStreamController = null;
let currentUser = null;
let supabaseClient = null;
let currentThinkingAnimation = null;

// Main initialization function
async function initializeMainApp() {
  console.log("Initializing SEBA AI Teacher with Supabase integration...");
  
  // Initialize Supabase if not already done
  if (!supabaseClient) {
    supabaseClient = initializeSupabase();
  }
  
  // Initialize scroll controls
  initializeScrollControls();
  
  // Load data from Supabase
  await loadDataFromSupabase();
  
  // Initialize subject listeners
  initializeSubjectListeners();
  
  // Initialize input listeners
  initializeInputListeners();
  
  // Initialize ad manager
  initializeSEBAAdManager();
  
  console.log("Main app initialized successfully with Supabase!");
}

// Show login form on load
window.addEventListener('load', () => {
  showLoginForm();
});

// Export global functions
window.initializeMainApp = initializeMainApp;

// Make sure DOM elements are available
document.addEventListener('DOMContentLoaded', () => {
  // Initialize auth event listeners (already done in auth.js)
  // Add any additional initialization here
  
  console.log("SEBA AI Teacher application loaded");
});
