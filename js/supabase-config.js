/* ========== SUPABASE CONFIGURATION ========== */
const SUPABASE_CONFIG = {
  url: 'https://rddcbsmreyrxewkqnixp.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZGNic21yZXlyeGV3a3FuaXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MDYzODksImV4cCI6MjA1MDI4MjM4OX0.Y7GmS5z0h7J8lM2zB8u7XjWqW8tK4gP3p8qM4V4w5Y8'
};

// Database Tables
const SUPABASE_TABLES = {
  subjects: 'subjects',
  chapters: 'chapters',
  questions: 'questions',
  answer_cache: 'answer_cache'
};

// Initialize Supabase
let supabaseClient = null;

function initializeSupabase() {
  if (window.supabase && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        persistSession: false
      }
    });
    console.log("Supabase initialized");
  } else {
    console.warn("Supabase not configured or not loaded");
  }
  return supabaseClient;
}

// Export for use in other files
window.supabaseClient = supabaseClient;
window.SUPABASE_TABLES = SUPABASE_TABLES;
window.initializeSupabase = initializeSupabase;
