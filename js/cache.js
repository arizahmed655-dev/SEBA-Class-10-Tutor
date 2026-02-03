/* ========== CACHE SYSTEM FUNCTIONS ========== */
let currentThinkingAnimation = null;

// Thinking Animation Functions
function showThinkingAnimationInMessage(msgId, isCache = false) {
  // Create thinking animation inside the bot message
  const thinkingDiv = document.createElement("div");
  thinkingDiv.className = "thinking-placeholder";
  thinkingDiv.id = `thinking-${msgId}`;
  
  thinkingDiv.innerHTML = `
    <div class="thinking-avatar">
      <i class="fas fa-brain"></i>
    </div>
    <div class="thinking-content">
      <div class="thinking-text">Jajabor thinking...</div>
      <div class="thinking-subtext">${isCache ? 'Searching cached answers...' : 'Analyzing your question...'}</div>
      <div class="thinking-dots">
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
      </div>
    </div>
  `;
  
  return thinkingDiv;
}

function hideThinkingAnimation() {
  if (currentThinkingAnimation) {
    currentThinkingAnimation.classList.add('hidden');
    setTimeout(() => {
      if (currentThinkingAnimation && currentThinkingAnimation.parentNode) {
        currentThinkingAnimation.remove();
      }
      currentThinkingAnimation = null;
    }, 300);
  }
}

// Cache Functions
async function getCachedAnswer(question, subjectId, chapterId) {
  if (!supabaseClient) {
    console.log("Supabase not available for cache lookup");
    return null;
  }

  try {
    const cacheKey = generateCacheKey(question, subjectId, chapterId);
    
    const { data, error } = await supabaseClient
      .from('answer_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .eq('subject_id', subjectId)
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log("Cache miss for:", cacheKey.substring(0, 50));
        return null;
      }
      console.error("Supabase cache lookup error:", error);
      return null;
    }

    if (data) {
      console.log("Cache hit for:", cacheKey.substring(0, 50));
      
      await supabaseClient
        .from('answer_cache')
        .update({
          access_count: data.access_count + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('id', data.id);
      
      return data.answer;
    }
    
    return null;
  } catch (error) {
    console.error("Cache lookup error:", error);
    return null;
  }
}

async function saveToCache(question, answer, subjectId, chapterId) {
  if (!supabaseClient) {
    console.log("Supabase not available for cache save");
    return false;
  }

  try {
    const cacheKey = generateCacheKey(question, subjectId, chapterId);
    
    const { data, error } = await supabaseClient
      .from('answer_cache')
      .upsert({
        cache_key: cacheKey,
        question: question,
        answer: answer,
        subject_id: subjectId,
        chapter_id: chapterId,
        access_count: 0,
        last_accessed: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'cache_key'
      });

    if (error) {
      console.error("Supabase cache save error:", error);
      return false;
    }

    console.log("Saved to cache:", cacheKey.substring(0, 50));
    return true;
  } catch (error) {
    console.error("Cache save error:", error);
    return false;
  }
}

function generateCacheKey(question, subjectId, chapterId) {
  const normalizedQuestion = question
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u0980-\u09FF]/g, '')
    .substring(0, 200);
  
  return `${subjectId}_${chapterId}_${normalizedQuestion}`;
}

// Cache Streaming
async function simulateStreamingFromCache(cachedAnswer, contentSpan, botMsg, cursorSpan, isAutoAnswer = false) {
  // First, show thinking animation for 2 seconds
  const thinkingDiv = showThinkingAnimationInMessage('cache-thinking', true);
  contentSpan.appendChild(thinkingDiv);
  currentThinkingAnimation = thinkingDiv;
  
  // Wait 2 seconds for thinking animation (cache)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Hide thinking animation and immediately start streaming
  hideThinkingAnimation();
  
  // Now start streaming from cache immediately
  const CHUNK_DELAY = 40;
  const TYPING_DELAY = 60;
  
  const cacheStreamingIndicator = document.createElement('span');
  cacheStreamingIndicator.className = 'cache-streaming-indicator';
  cacheStreamingIndicator.innerHTML = '<i class="fas fa-bolt"></i> Answering by Jajabor AI';
  contentSpan.appendChild(cacheStreamingIndicator);
  
  const paragraphs = cachedAnswer.split(/\n\s*\n/);
  let currentText = '';
  
  const scrollPauseIndicator = document.createElement('span');
  scrollPauseIndicator.className = 'scroll-pause-indicator';
  scrollPauseIndicator.innerHTML = '<i class="fas fa-pause"></i> Scroll paused on hover';
  scrollPauseIndicator.style.display = 'none';
  contentSpan.appendChild(scrollPauseIndicator);
  
  const smartScroll = () => {
    if (!scrollPaused && isAutoScrolling) {
      chatArea.scrollTop = chatArea.scrollHeight;
      scrollPauseIndicator.style.display = 'none';
    } else {
      scrollPauseIndicator.style.display = 'inline-flex';
    }
  };
  
  for (let p = 0; p < paragraphs.length; p++) {
    const paragraph = paragraphs[p];
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    
    for (let s = 0; s < sentences.length; s++) {
      const sentence = sentences[s];
      const words = sentence.split(' ');
      
      for (let w = 0; w < words.length; w++) {
        if (!isStreaming) break;
        
        currentText += words[w] + ' ';
        
        const htmlContent = markdownToHtml(currentText);
        contentSpan.innerHTML = htmlContent;
        
        contentSpan.appendChild(cacheStreamingIndicator);
        contentSpan.appendChild(scrollPauseIndicator);
        
        smartScroll();
        
        await new Promise(resolve => setTimeout(resolve, TYPING_DELAY * (words[w].length / 5)));
      }
      
      if (s < sentences.length - 1) {
        currentText = currentText.trim() + '. ';
      } else {
        currentText = currentText.trim() + (paragraph.endsWith('.') ? '' : '.');
      }
      
      const htmlContent = markdownToHtml(currentText);
      contentSpan.innerHTML = htmlContent;
      contentSpan.appendChild(cacheStreamingIndicator);
      contentSpan.appendChild(scrollPauseIndicator);
      smartScroll();
      
      if (isStreaming && !scrollPaused) {
        await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY * 2));
      } else if (scrollPaused) {
        while (scrollPaused && isStreaming) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    if (p < paragraphs.length - 1) {
      currentText += '\n\n';
      
      const htmlContent = markdownToHtml(currentText);
      contentSpan.innerHTML = htmlContent;
      contentSpan.appendChild(cacheStreamingIndicator);
      contentSpan.appendChild(scrollPauseIndicator);
      smartScroll();
      
      if (isStreaming && !scrollPaused) {
        await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY * 3));
      } else if (scrollPaused) {
        while (scrollPaused && isStreaming) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  }
  
  botMsg.classList.remove("bot-streaming");
  if (cursorSpan.parentNode === botMsg) {
    botMsg.removeChild(cursorSpan);
  }
  
  if (scrollPauseIndicator.parentNode === contentSpan) {
    contentSpan.removeChild(scrollPauseIndicator);
  }
  
  const cacheIndicator = document.createElement('span');
  cacheIndicator.className = 'cache-indicator';
  cacheIndicator.innerHTML = '<i class="fas fa-bolt"></i> Cached Response';
  contentSpan.removeChild(cacheStreamingIndicator);
  contentSpan.appendChild(cacheIndicator);
  
  if (isAutoAnswer) {
    showNotification("✅ অনুশীলনীৰ উত্তৰ দিয়া হ'ল!");
  }
  
  setStreamingState(false);
  smartScroll();
}

// Export for use in other files
window.showThinkingAnimationInMessage = showThinkingAnimationInMessage;
window.hideThinkingAnimation = hideThinkingAnimation;
window.getCachedAnswer = getCachedAnswer;
window.saveToCache = saveToCache;
window.simulateStreamingFromCache = simulateStreamingFromCache;
