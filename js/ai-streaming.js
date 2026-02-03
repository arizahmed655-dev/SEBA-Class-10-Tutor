/* ========== AI STREAMING FUNCTIONS ========== */
let isStreaming = false;
let currentStreamController = null;

// Set Streaming State
function setStreamingState(streaming) {
  isStreaming = streaming;
  
  if (streaming) {
    questionInput.disabled = true;
    subjectSelect.disabled = true;
    chapterSelect.disabled = true;
    sendButton.disabled = false;
    sendButton.innerHTML = '<i class="fas fa-stop"></i>';
    sendButton.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
    sendButton.setAttribute('onclick', 'stopStreaming()');
  } else {
    questionInput.disabled = false;
    subjectSelect.disabled = false;
    chapterSelect.disabled = false;
    sendButton.disabled = false;
    sendButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    sendButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';
    sendButton.setAttribute('onclick', 'sendQuestion()');
    questionInput.focus();
  }
}

// Stop Streaming
function stopStreaming() {
  if (currentStreamController) {
    currentStreamController.abort();
    currentStreamController = null;
  }
  setStreamingState(false);
}

// Build Prompt
function buildPrompt(subject, chapter, question) {
  return `
তুমি এজন কড়া আৰু নিৰ্ভৰযোগ্য SEBA দশম শ্ৰেণী (HSLC)ৰ শিক্ষক।

তোমাৰ কৰ্তব্য:
- অনুমান বা সাধাৰণ জ্ঞান ব্যৱহাৰ নকৰিবা
- উত্তৰবোৰ ধাপে ধাপে, পৰীক্ষামুখী হ'ব লাগিব

গণিতৰ সূত্ৰ আৰু সমীকৰণ সদায় LaTeX ফৰ্মেটত লিখিবা:
ইনলাইন মেথৰ বাবে: $ax^2 + bx + c = 0$
ডিছপ্লে মেথৰ বাবে: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

যদি প্ৰশ্নটো:
- পাঠ্যক্ৰমৰ বাহিৰত হয়
- SEBA পাঠ্যপুথিত নাথাকে

তেন্তে ঠিক এই বাক্যটো ব্যৱহাৰ কৰিবা (একেবাৰে সলনি নকৰিবা):
"❌ এই প্ৰশ্নটো SEBA দশম শ্ৰেণীৰ পাঠ্যক্ৰমৰ ভিতৰত নাই। অনুগ্ৰহ কৰি পাঠ্যপুথিৰ ভিতৰৰ প্ৰশ্ন সুধক।"

বিষয়: ${subject}
অধ্যায়: ${chapter}

উত্তৰ লেখাৰ নিয়ম:
- শুদ্ধ অসমীয়া ভাষা ব্যৱহাৰ কৰিবা (হিন্দী বিষয়ৰ বাবে হিন্দীত আৰু ইংৰাজী বিষয়ৰ বাবে ইংৰাজীত উত্তৰ দিবা লগতে অসমীয়া অনুবাদ দিবা)
- পৰীক্ষামুখী উত্তৰ দিবা
- ধাপে ধাপে ব্যাখ্যা কৰিবা
- অতিৰিক্ত তথ্য নিদিবা

ছাত্ৰৰ প্ৰশ্ন:
${question}
`;
}

// Out of Syllabus Detection
function isOutOfSyllabus(question) {
  const blockedKeywords = [
    "integration", "derivative", "calculus",
    "jee", "neet", "iit", "aiims", "engineering", "medical",
    "class 11", "bachelor", "degree",
    "quantum", "relativity", "astrophysics", "string theory",
    "python", "java", "programming", "coding", "algorithm",
    "history of ai", "who are you", "your name", "who created you",
    "integral", "differential", "vector", "matrix",
    "organic chemistry", "inorganic chemistry", "physical chemistry",
    "thermodynamics", "electrochemistry", "quantum chemistry",
    "microeconomics", "macroeconomics", "international relations",
    "literary theory", "postmodernism", "existentialism"
  ];

  const sebaMathTopics = [
    "বৃত্ত", "circle", "বৃত্তৰ", "circles",
    "চতুৰ্ভুজ", "quadrilateral", "cyclic quadrilateral", "চক্ৰীয় চতুৰ্ভুজ",
    "জ্যা", "chord", "স্পৰ্শক", "tangent", "tangents",
    "কেন্দ্ৰ", "center", "ব্যাস", "diameter", "ব্যাসাৰ্ধ", "radius",
    "বৃত্তচাপ", "arc", "বিপৰীত কোণ", "opposite angles",
    "স্পৰ্শবিন্দু", "point of contact", "স্পৰ্শকৰ দৈৰ্ঘ্য", "length of tangent",
    "বৃত্তস্থ কোণ", "angle in a circle", "কেন্দ্ৰস্থ কোণ", "angle at center",
    
    "বাস্তৱ সংখ্যা", "real numbers", "ইউক্লিড", "euclid", "গঃসাঃউঃ", "hcf", "লঃসাঃগুঃ", "lcm",
    "অমূলদ সংখ্যা", "irrational number", "পৰিমেয় সংখ্যা", "rational number",
    
    "বহুপদ", "polynomial", "শূন্য", "zero", "মূল", "root",
    
    "ৰৈখিক সমীকৰণ", "linear equation", "দুটা চলক", "two variables",
    
    "দ্বিঘাত সমীকৰণ", "quadratic equation", "দ্বিঘাত সূত্র", "quadratic formula",
    
    "সমান্তৰ প্ৰগতি", "arithmetic progression", "ap", "সাধাৰণ অন্তৰ", "common difference",
    
    "ত্ৰিভূজ", "triangle", "সদৃশ ত্ৰিভূজ", "similar triangles", "থেলছ", "thales",
    
    "স্থানাংক জ্যামিতি", "coordinate geometry", "দূৰত্ব সূত্র", "distance formula",
    
    "ত্ৰিকোণমিতি", "trigonometry", "sin", "cos", "tan", "cosec", "sec", "cot",
    
    "পৰিসংখ্যা", "statistics", "মধ্যক", "median", "গড়", "mean", " বহুলক", "mode",
    
    "সম্ভাৱিতা", "probability", "ঘটনা", "event"
  ];

  const q = question.toLowerCase();
  
  const isBlocked = blockedKeywords.some(word => q.includes(word));
  
  const isSebaTopic = sebaMathTopics.some(topic => {
    const topicLower = topic.toLowerCase();
    return q.includes(topicLower);
  });
  
  if (isSebaTopic) {
    console.log("Question is in SEBA syllabus:", question.substring(0, 50));
    return false;
  }
  
  if (isBlocked) {
    console.log("Question is out of syllabus (blocked keyword):", question.substring(0, 50));
    return true;
  }
  
  return false;
}

// Main AI Streaming Function
async function streamQuestionToAI(question, isAutoAnswer = false) {
  const subjectId = subjectSelect.value;
  const chapterId = chapterSelect.value;
  
  if (!subjectId || !chapterId) {
    alert("অনুগ্ৰহ কৰি প্ৰথমে বিষয় আৰু অধ্যায় বাছনি কৰক");
    return;
  }
  
  // Add user message
  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.textContent = question;
  chatArea.appendChild(userMsg);
  
  if (!isAutoAnswer) {
    questionInput.value = "";
  }
  
  // Disable inputs during streaming
  setStreamingState(true);
  
  // Create unique ID for this message
  const msgId = 'msg-' + Date.now();
  
  // Create bot message container for streaming
  const botMsg = document.createElement("div");
  botMsg.className = "msg bot bot-streaming";
  botMsg.id = msgId;
  
  const contentSpan = document.createElement("div");
  contentSpan.className = "streaming-content";
  contentSpan.id = msgId + '-content';
  
  // Add thinking animation as placeholder
  const thinkingDiv = showThinkingAnimationInMessage(msgId, false);
  contentSpan.appendChild(thinkingDiv);
  currentThinkingAnimation = thinkingDiv;
  
  const cursorSpan = document.createElement("span");
  cursorSpan.className = "streaming-cursor";
  cursorSpan.id = msgId + '-cursor';
  
  botMsg.appendChild(contentSpan);
  botMsg.appendChild(cursorSpan);
  chatArea.appendChild(botMsg);
  
  // Smart scroll
  if (!scrollPaused && isAutoScrolling) {
    chatArea.scrollTop = chatArea.scrollHeight;
  }
  
  // Check if out of syllabus
  if (isOutOfSyllabus(question)) {
    setTimeout(() => {
      contentSpan.innerHTML = "❌ এই প্ৰশ্নটো SEBA দশম শ্ৰেণীৰ পাঠ্যক্ৰমৰ ভিতৰত নাই।<br><br>অনুগ্ৰহ কৰি পাঠ্যপুথিৰ ভিতৰৰ প্ৰশ্ন সুধক।";
      botMsg.classList.remove("bot-streaming");
      botMsg.removeChild(cursorSpan);
      setStreamingState(false);
    }, 500);
    return;
  }
  
  // FIRST: CHECK CACHE FOR ANSWER
  const cachedAnswer = await getCachedAnswer(question, subjectId, chapterId);
  
  if (cachedAnswer) {
    // Wait 2 seconds for thinking animation (cache)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Hide thinking animation and start streaming from cache
    hideThinkingAnimation();
    simulateStreamingFromCache(cachedAnswer, contentSpan, botMsg, cursorSpan, isAutoAnswer);
    return;
  }
  
  // Wait 3 seconds for thinking animation (AI streaming)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Hide thinking animation
  hideThinkingAnimation();
  
  // Add AI streaming indicator
  const aiStreamingIndicator = document.createElement('span');
  aiStreamingIndicator.className = 'ai-streaming-indicator';
  aiStreamingIndicator.innerHTML = '<i class="fas fa-brain"></i> Answering by Jajabor AI';
  contentSpan.appendChild(aiStreamingIndicator);
  
  // Prepare prompt
  const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;
  const chapterName = chapterSelect.options[chapterSelect.selectedIndex].text;
  const prompt = buildPrompt(subjectName, chapterName, question);
  
  try {
    const abortController = new AbortController();
    currentStreamController = abortController;
    
    const response = await fetch(STREAMING_API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "text/event-stream" 
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }]
      }),
      signal: abortController.signal
    });
    
    if (!response.ok) throw new Error(`Streaming API Error: ${response.status}`);
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedText = "";
    let buffer = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.choices?.[0]?.delta?.content || "";
            
            if (chunk) {
              accumulatedText += chunk;
              
              const htmlContent = markdownToHtml(accumulatedText);
              contentSpan.innerHTML = htmlContent;
              contentSpan.appendChild(aiStreamingIndicator);
              
              // Smart scroll (respects hover pause)
              if (!scrollPaused && isAutoScrolling) {
                chatArea.scrollTop = chatArea.scrollHeight;
              }
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      }
      
      // Small delay to allow hover detection
      if (!scrollPaused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      } else {
        // Wait while scrolling is paused
        while (scrollPaused && isStreaming) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    // Remove AI streaming indicator when done
    if (aiStreamingIndicator.parentNode === contentSpan) {
      contentSpan.removeChild(aiStreamingIndicator);
    }
    
    // Streaming complete - SAVE TO CACHE
    if (accumulatedText.trim().length > 0 && 
        !accumulatedText.includes("এই প্ৰশ্নটো SEBA দশম শ্ৰেণীৰ পাঠ্যক্ৰমৰ ভিতৰত নাই")) {
      saveToCache(question, accumulatedText, subjectId, chapterId)
        .then(success => {
          if (success) {
            console.log("Answer saved to cache");
          }
        })
        .catch(err => console.error("Cache save error:", err));
    }
    
    botMsg.classList.remove("bot-streaming");
    if (cursorSpan.parentNode === botMsg) {
      botMsg.removeChild(cursorSpan);
    }
    
    if (isAutoAnswer) {
      showNotification("✅ অনুশীলনীৰ উত্তৰ দিয়া হ'ল!");
    }
    
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Streaming cancelled by user");
      contentSpan.innerHTML = "⏹️ উত্তৰ দিয়া বন্ধ কৰা হ'ল";
      botMsg.classList.remove("bot-streaming");
      if (cursorSpan.parentNode === botMsg) {
        botMsg.removeChild(cursorSpan);
      }
    } else {
      console.error("Streaming error:", error);
      contentSpan.innerHTML = "❌ নেটৱৰ্ক সমস্যা। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।";
      botMsg.classList.remove("bot-streaming");
      if (cursorSpan.parentNode === botMsg) {
        botMsg.removeChild(cursorSpan);
      }
    }
  } finally {
    setStreamingState(false);
    currentStreamController = null;
    if (!scrollPaused && isAutoScrolling) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }
}

// Send Question Function
function sendQuestion() {
  if (isStreaming) return;
  const q = questionInput.value.trim();
  if (q) {
    streamQuestionToAI(q, false);
  }
}

// Export for use in other files
window.setStreamingState = setStreamingState;
window.stopStreaming = stopStreaming;
window.streamQuestionToAI = streamQuestionToAI;
window.sendQuestion = sendQuestion;
window.isStreaming = isStreaming;
