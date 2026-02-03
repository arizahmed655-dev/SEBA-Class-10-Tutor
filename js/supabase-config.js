/* ========== SUPABASE CONFIGURATION ========== */
const SUPABASE_CONFIG = {
  url: 'https://rddcbsmreyrxewkqnixp.supabase.co',
  anonKey: 'sb_publishable_vNPXlACJvutoeCg59dYnbw_3zAWOtqV'
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
