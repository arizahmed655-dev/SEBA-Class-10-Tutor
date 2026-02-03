/* ========== KATEX RENDERER ========== */
class KatexRenderer {
  constructor() {
    this.inlineRegex = /\$([^\$]+?)\$/g;
    this.displayRegex = /\$\$([^\$]+?)\$\$/g;
  }

  renderText(text) {
    if (!text || !window.katex) return text;
    
    text = text.replace(this.displayRegex, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: true });
      } catch (e) {
        console.error("KaTeX display error:", e);
        return `<span class="math-placeholder">$$${math}$$</span>`;
      }
    });
    
    text = text.replace(this.inlineRegex, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: false });
      } catch (e) {
        console.error("KaTeX inline error:", e);
        return `<span class="math-placeholder">$${math}$</span>`;
      }
    });
    
    text = text.replace(/\\\[([^\]]+?)\\\]/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: true });
      } catch (e) {
        console.error("KaTeX display error:", e);
        return `<span class="math-placeholder">\\[${math}\\]</span>`;
      }
    });
    
    text = text.replace(/\\\(([^)]+?)\\\)/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: false });
      } catch (e) {
        console.error("KaTeX inline error:", e);
        return `<span class="math-placeholder">\\(${math}\\)</span>`;
      }
    });
    
    return text;
  }

  hasMath(text) {
    return this.inlineRegex.test(text) || 
           this.displayRegex.test(text) ||
           /\\\[([^\]]+?)\\\]/.test(text) ||
           /\\\(([^)]+?)\\\)/.test(text);
  }
}

// Markdown to HTML converter
function markdownToHtml(text) {
  if (!text) return text;
  
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/^([১২৩৪৫৬৭৮৯০]+\.|\d+\.) (.*$)/gm, '<li style="margin: 5px 0 5px 20px;">$1 $2</li>');
  text = text.replace(/^[\-\*\+] (.*$)/gm, '<li style="margin: 5px 0 5px 20px; list-style-type: disc;">$1</li>');
  
  const lines = text.split('\n');
  let inList = false;
  let html = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('<li>')) {
      if (!inList) {
        html += '<ul style="padding-left: 20px; margin: 10px 0;">';
        inList = true;
      }
      html += line;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += line;
      
      if (i < lines.length - 1 && !lines[i + 1].includes('<li>')) {
        html += '<br>';
      }
    }
  }
  
  if (inList) {
    html += '</ul>';
  }
  
  html = html.replace(/\n/g, '<br>');
  
  if (window.katexRenderer && window.katexRenderer.hasMath(html)) {
    html = window.katexRenderer.renderText(html);
  }
  
  return html;
}

// Create global instance
const katexRenderer = new KatexRenderer();

// Export for use in other files
window.katexRenderer = katexRenderer;
window.markdownToHtml = markdownToHtml;
