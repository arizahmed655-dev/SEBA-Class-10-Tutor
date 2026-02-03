/* ========== SUBJECT DATA MANAGEMENT ========== */
const API_URL = "https://sazid2-seba-deepseek-backend.hf.space/ask";
const STREAMING_API_URL = "https://sazid2-seba-deepseek-backend.hf.space/stream";

let subjectsData = [];
let chaptersData = [];
let questionsData = [];

// DOM Elements
const subjectSelect = document.getElementById("subject");
const chapterSelect = document.getElementById("chapter");
const chatArea = document.getElementById("chat");
const questionInput = document.getElementById("question");
const sendButton = document.getElementById("send-btn");

// Load Data from Supabase
async function loadDataFromSupabase() {
  try {
    if (!supabaseClient) {
      throw new Error("Supabase client not initialized");
    }

    console.log("Loading data from Supabase...");
    
    const { data: subjects, error: subjectsError } = await supabaseClient
      .from(SUPABASE_TABLES.subjects)
      .select('*')
      .order('id', { ascending: true });
    
    if (subjectsError) {
      console.error("Error loading subjects:", subjectsError);
      throw subjectsError;
    }
    
    const { data: chapters, error: chaptersError } = await supabaseClient
      .from(SUPABASE_TABLES.chapters)
      .select('*')
      .order('id', { ascending: true });
    
    if (chaptersError) {
      console.error("Error loading chapters:", chaptersError);
      throw chaptersError;
    }
    
    const { data: questions, error: questionsError } = await supabaseClient
      .from(SUPABASE_TABLES.questions)
      .select('*')
      .order('id', { ascending: true });
    
    if (questionsError) {
      console.error("Error loading questions:", questionsError);
      throw questionsError;
    }
    
    subjectsData = subjects || [];
    chaptersData = chapters || [];
    questionsData = questions || [];
    
    console.log("Data loaded from Supabase:", {
      subjects: subjectsData.length,
      chapters: chaptersData.length,
      questions: questionsData.length
    });
    
    if (subjectsData.length === 0) {
      console.warn("No subjects found in database, using fallback data");
      loadFallbackData();
      return;
    }
    
    populateSubjects();
    
  } catch (error) {
    console.error("Error loading data from Supabase:", error);
    showNotification("⚠️ ডাটাবেচৰ সমস্যা। ফলবেক ডাটা ল'ড কৰা হৈছে।");
    loadFallbackData();
  }
}

// Fallback Data
function loadFallbackData() {
  console.log("Loading fallback data...");
  
  subjectsData = [
    {id: "math", name: "math", display_name: "📐 গণিত (Mathematics)"},
    {id: "science", name: "science", display_name: "🔬 সাধাৰণ বিজ্ঞান (General Science)"},
    {id: "social", name: "social", display_name: "🌍 সমাজ বিজ্ঞান (Social Science)"},
    {id: "english", name: "english", display_name: "📘 ইংৰাজী (English)"},
    {id: "assamese", name: "assamese", display_name: "📕 অসমীয়া (Assamese)"},
    {id: "hindi", name: "hindi", display_name: "📗 হিন্দী (Hindi)"}
  ];
  
  chaptersData = [
    {id: "math_1", subject_id: "math", name: "real_numbers", display_name: "বাস্তৱ সংখ্যা (Real Numbers)"},
    {id: "math_2", subject_id: "math", name: "polynomials", display_name: "বহুপদ (Polynomials)"}
  ];
  
  questionsData = [
    {id: "1", chapter_id: "math_1", question: "ইউক্লিডৰ বিভাজন প্ৰমেয়িকাৰ দ্বাৰা 135 আৰু 225 ৰ গঃসাঃউঃ নিৰ্ণয় কৰা।"},
    {id: "2", chapter_id: "math_1", question: "প্রমাণ কৰা যে $\sqrt{2}$ এটা অমূলদ সংখ্যা।"},
    {id: "3", chapter_id: "math_2", question: "যদি বহুপদ $p(x) = 2x^2 - 3x + 1$ হয়, তেন্তে $p(2)$ ৰ মান নিৰ্ণয় কৰা।"}
  ];
  
  populateSubjects();
}

// Populate Subjects Dropdown
function populateSubjects() {
  if (!subjectSelect) return;
  
  subjectSelect.innerHTML = '<option value="">📚 বিষয় বাছনি কৰক</option>';
  
  subjectsData.forEach(subject => {
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.display_name;
    subjectSelect.appendChild(option);
  });
}

// Event Listeners for Subject/Chapter
function initializeSubjectListeners() {
  if (!subjectSelect || !chapterSelect) return;
  
  subjectSelect.addEventListener("change", async function() {
    const subjectId = this.value;
    chapterSelect.innerHTML = '<option value="">📖 অধ্যায় বাছনি কৰক</option>';
    
    if (!subjectId) return;
    
    const existingExercise = chatArea.querySelector('.exercise-msg');
    if (existingExercise) {
      existingExercise.remove();
    }
    
    let filteredChapters = chaptersData.filter(ch => ch.subject_id === subjectId);
    
    if (filteredChapters.length === 0) {
      try {
        const { data: chapters, error } = await supabaseClient
          .from(SUPABASE_TABLES.chapters)
          .select('*')
          .eq('subject_id', subjectId)
          .order('id', { ascending: true });
        
        if (!error && chapters && chapters.length > 0) {
          chaptersData = chaptersData.filter(ch => ch.subject_id !== subjectId).concat(chapters);
          filteredChapters = chapters;
        }
      } catch (error) {
        console.error("Error loading chapters from Supabase:", error);
      }
    }
    
    filteredChapters.forEach(chapter => {
      const option = document.createElement("option");
      option.value = chapter.id;
      option.textContent = chapter.display_name;
      chapterSelect.appendChild(option);
    });
  });

  chapterSelect.addEventListener("change", async function() {
    const chapterId = this.value;
    const subjectId = subjectSelect.value;
    
    if (!subjectId || !chapterId) return;
    
    const existingExercise = chatArea.querySelector('.exercise-msg');
    if (existingExercise) {
      existingExercise.remove();
    }
    
    let filteredQuestions = questionsData.filter(q => q.chapter_id === chapterId);
    
    if (filteredQuestions.length === 0) {
      try {
        const { data: questions, error } = await supabaseClient
          .from(SUPABASE_TABLES.questions)
          .select('*')
          .eq('chapter_id', chapterId)
          .order('id', { ascending: true });
        
        if (!error && questions && questions.length > 0) {
          questionsData = questionsData.filter(q => q.chapter_id !== chapterId).concat(questions);
          filteredQuestions = questions;
        }
      } catch (error) {
        console.error("Error loading questions from Supabase:", error);
      }
    }
    
    if (filteredQuestions.length > 0) {
      showExerciseQuestions(subjectId, chapterId, filteredQuestions);
    }
  });
}

// Show Exercise Questions
function showExerciseQuestions(subjectId, chapterId, questions) {
  const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;
  const chapterName = chapterSelect.options[chapterSelect.selectedIndex].text;
  
  const exerciseDiv = document.createElement("div");
  exerciseDiv.className = "exercise-msg";
  
  let questionsHTML = '<div class="exercise-questions-list">';
  questions.forEach((questionObj, index) => {
    const question = questionObj.question;
    
    questionsHTML += `
      <div class="exercise-question-item" data-question="${encodeURIComponent(question)}">
        <div class="question-number">${index + 1}</div>
        <div class="question-text">${question}</div>
      </div>
    `;
  });
  questionsHTML += '</div>';
  
  exerciseDiv.innerHTML = `
    <h4><i class="fas fa-book-open"></i> অনুশীলনী প্ৰশ্নসমূহ (${questions.length}টা প্ৰশ্ন)</h4>
    <p><strong>বিষয়:</strong> ${subjectName}</p>
    <p><strong>অধ্যায়:</strong> ${chapterName}</p>
    ${questionsHTML}
    <p style="margin-top: 12px; font-size: 0.95rem; opacity: 0.9; text-align: center;">
      <i class="fas fa-mouse-pointer"></i> যিকোনো প্ৰশ্নত ক্লিক কৰিলে ইনপুট বাকছত সেয়া লিখা হ'ব
    </p>
  `;
  
  const welcomeMsg = chatArea.querySelector('.welcome-msg');
  if (welcomeMsg) {
    welcomeMsg.insertAdjacentElement('afterend', exerciseDiv);
  } else {
    chatArea.insertBefore(exerciseDiv, chatArea.firstChild);
  }
  
  setTimeout(() => {
    const questionItems = exerciseDiv.querySelectorAll('.exercise-question-item');
    questionItems.forEach(item => {
      item.addEventListener('click', function() {
        const question = decodeURIComponent(this.getAttribute('data-question'));
        fillQuestionFromList(question);
      });
    });
  }, 100);
  
  exerciseDiv.scrollIntoView({ behavior: 'smooth' });
}

// Fill Question from List
function fillQuestionFromList(question) {
  if (isStreaming) return;
  questionInput.value = question;
  questionInput.focus();
  questionInput.select();
  showNotification("📝 প্ৰশ্নটো ইনপুট বাকছত লিখা হ'ল!");
}

// Export for use in other files
window.loadDataFromSupabase = loadDataFromSupabase;
window.showExerciseQuestions = showExerciseQuestions;
window.fillQuestionFromList = fillQuestionFromList;
window.subjectSelect = subjectSelect;
window.chapterSelect = chapterSelect;
window.chatArea = chatArea;
window.questionInput = questionInput;
window.sendButton = sendButton;
window.API_URL = API_URL;
window.STREAMING_API_URL = STREAMING_API_URL;
