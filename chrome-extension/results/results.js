// Crew configurations
const CREW_CONFIGS = {
  comp_analysis: {
    name: 'Competitor Intelligence Crew',
    hasRecommendations: true,
    agents: [
      'Web Recon Agent',
      'Social Spy Agent',
      'Hiring & Talent Agent',
      'Patent & R&D Agent',
      'Pricing Tracker Agent'
    ]
  },
  digital_twin: {
    name: 'Digital Twin Crew',
    hasRecommendations: false,
    agents: [
      'Behavior Modeler',
      'Roadmap Predictor',
      'Pricing Predictor',
      'Launch Probability Engine'
    ]
  },
  one_last_time: {
    name: 'War Simulation Crew',
    hasRecommendations: true,
    agents: [
      'Game Theory Agent',
      'Market Impact Agent',
      'Risk Analyzer'
    ]
  }
};

// Global state
let currentData = null;
let currentCrew = null;
let currentSection = null;

// DOM Elements
const backBtn = document.getElementById('backBtn');
const exportBtn = document.getElementById('exportBtn');
const crewNameEl = document.getElementById('crewName');
const timestampEl = document.getElementById('timestamp');
const sidebarNav = document.getElementById('sidebarNav');
const contentArea = document.getElementById('contentArea');

// Initialize
init();

// Event Listeners
backBtn.addEventListener('click', () => window.close());
exportBtn.addEventListener('click', exportResults);

// ==================== INITIALIZATION ====================

async function init() {
  try {
    // Configure marked.js for better markdown parsing
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false,
        sanitize: false // We'll use DOMPurify for sanitization
      });
    }
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentCrew = urlParams.get('crew');
    currentSection = urlParams.get('section');
    
    if (!currentCrew) {
      showError('No crew specified');
      return;
    }
    
    // Load data from storage
    const data = await loadResultData();
    if (!data) {
      showError('No result data found');
      return;
    }
    
    currentData = data;
    
    // Update header
    updateHeader();
    
    // Build sidebar navigation
    buildSidebar();
    
    // Display initial section
    const initialSection = currentSection || 
      (CREW_CONFIGS[currentCrew].hasRecommendations ? 'recommendations' : CREW_CONFIGS[currentCrew].agents[0]);
    displaySection(initialSection);
    
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to load results: ' + error.message);
  }
}

async function loadResultData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['currentResult'], (data) => {
      resolve(data.currentResult || null);
    });
  });
}

// ==================== HEADER ====================

function updateHeader() {
  const config = CREW_CONFIGS[currentCrew];
  crewNameEl.textContent = config.name;
  
  const timestamp = currentData.result.metadata?.timestamp || currentData.timestamp || Date.now();
  const date = new Date(timestamp);
  timestampEl.textContent = date.toLocaleString();
}

// ==================== SIDEBAR ====================

function buildSidebar() {
  const config = CREW_CONFIGS[currentCrew];
  sidebarNav.innerHTML = '';
  
  // Add Recommendations button (if applicable)
  if (config.hasRecommendations) {
    const recommendationsBtn = createNavButton('💡', 'Recommendations', 'recommendations', true);
    sidebarNav.appendChild(recommendationsBtn);
  }
  
  // Add agent buttons
  config.agents.forEach((agentName, index) => {
    const icon = getAgentIcon(index);
    const btn = createNavButton(icon, agentName, agentName, false);
    sidebarNav.appendChild(btn);
  });
}

function createNavButton(icon, label, section, isRecommendations) {
  const btn = document.createElement('button');
  btn.className = `nav-btn ${isRecommendations ? 'recommendations' : ''}`;
  btn.innerHTML = `
    <span class="nav-icon">${icon}</span>
    <span>${label}</span>
  `;
  
  btn.addEventListener('click', () => {
    displaySection(section);
  });
  
  return btn;
}

function getAgentIcon(index) {
  const icons = ['🌐', '👁️', '👔', '🔬', '💰', '🎭', '🗺️', '💵', '🚀', '🎲', '📊', '⚠️'];
  return icons[index] || '🤖';
}

// ==================== CONTENT DISPLAY ====================

function displaySection(section) {
  currentSection = section;
  
  // Update active nav button
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => {
    const text = btn.textContent.trim();
    return text === section || (text === 'Recommendations' && section === 'recommendations');
  });
  
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Display content
  if (section === 'recommendations') {
    displayRecommendations();
  } else {
    displayAgentOutput(section);
  }
}

// ==================== RECOMMENDATIONS ====================

function displayRecommendations() {
  const result = currentData.result;
  
  // Priority 1: Use extracted recommendations from crew output
  let recommendations = result.recommendations;
  
  // Priority 2: Use executive summary as fallback
  if (!recommendations || recommendations.length === 0) {
    if (result.executiveSummary && result.executiveSummary.length > 0) {
      console.log('Using executive summary as recommendations');
      recommendations = result.executiveSummary.map((point, idx) => ({
        number: (idx + 1).toString(),
        title: point,
        details: []
      }));
    } else {
      // Priority 3: Try to extract from summary text
      console.log('Attempting to extract recommendations from summary');
      recommendations = extractRecommendations(result.summary);
    }
  }
  
  const hasRecommendations = recommendations && recommendations.length > 0;
  const displayTitle = hasRecommendations ? 'Strategic Recommendations' : 'Analysis Summary';
  const displaySubtitle = hasRecommendations ? 
    'Actionable insights for competitive advantage' : 
    'Key findings from the analysis';
  
  contentArea.innerHTML = `
    <div class="content-section">
      <div class="section-header">
        <h2 class="section-title">
          <span>💡</span>
          <span>${displayTitle}</span>
        </h2>
        <p class="section-subtitle">${displaySubtitle}</p>
      </div>
      
      <div class="recommendations-grid">
        ${hasRecommendations ? 
          recommendations.slice(0, 6).map((rec, index) => createRecommendationCard(rec, index + 1)).join('') :
          `<div class="empty-state">
            <div class="empty-icon">📋</div>
            <p>No structured recommendations found in the output.</p>
            <p class="empty-hint">Agent outputs contain detailed analysis.</p>
          </div>`
        }
      </div>
    </div>
  `;
}

function extractRecommendations(text) {
  if (!text) return [];
  
  // Try to find "Top 5 Actionable Strategic Recommendations" section
  const patterns = [
    /Top \d+ (?:Actionable )?Strategic Recommendations?[:\n]+([\s\S]*?)(?:\n\n#|\n---|\n\*\*[A-Z]|$)/i,
    /##?\s*Recommendations?[:\n]+([\s\S]*?)(?:\n\n#|\n---|\n\*\*[A-Z]|$)/i,
    /##?\s*Strategic Actions?[:\n]+([\s\S]*?)(?:\n\n#|\n---|\n\*\*[A-Z]|$)/i,
    /##?\s*Key Takeaways?[:\n]+([\s\S]*?)(?:\n\n#|\n---|\n\*\*[A-Z]|$)/i
  ];
  
  for (const pattern of patterns) {
    const recSection = text.match(pattern);
    
    if (recSection) {
      const recText = recSection[1];
      
      // Extract numbered recommendations
      const recommendations = [];
      const lines = recText.split('\n');
      let currentRec = null;
      
      lines.forEach(line => {
        const match = line.match(/^[\s]*[\*]*(\d+)[\.\)\:][\*]?\s*(.*)/);
        if (match) {
          if (currentRec) {
            recommendations.push(currentRec);
          }
          currentRec = {
            number: match[1],
            title: match[2].replace(/^\*\*|\*\*$/g, '').trim(),
            details: []
          };
        } else if (currentRec && line.trim() && !line.match(/^#/)) {
          const cleaned = line.trim().replace(/^[-*•]\s*/, '').replace(/^\*\*|\*\*$/g, '');
          if (cleaned.length > 0) {
            currentRec.details.push(cleaned);
          }
        }
      });
      
      if (currentRec) {
        recommendations.push(currentRec);
      }
      
      return recommendations.slice(0, 6);
    }
  }
  
  return [];
}

function createRecommendationCard(rec, number) {
  const priorities = ['high', 'high', 'medium', 'medium', 'low', 'low'];
  const priority = priorities[number - 1] || 'medium';
  
  const detailsHtml = rec.details && rec.details.length > 0 ? 
    rec.details.map(d => `<p>${escapeHtml(d)}</p>`).join('') : 
    '';
  
  return `
    <div class="recommendation-card">
      <div class="recommendation-header">
        <div class="recommendation-number">#${number}</div>
        <div class="recommendation-priority priority-${priority}">${priority}</div>
      </div>
      <div class="recommendation-content">
        <h3 class="recommendation-title">${escapeHtml(rec.title)}</h3>
        ${detailsHtml ? `<div class="recommendation-text">${detailsHtml}</div>` : ''}
        <div class="recommendation-details">
          <div class="detail-item">
            <span class="detail-label">Impact:</span>
            <span>${priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Low'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Timeline:</span>
            <span>${priority === 'high' ? 'Short-term' : priority === 'medium' ? 'Medium-term' : 'Long-term'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==================== AGENT OUTPUT ====================

function displayAgentOutput(agentName) {
  const agents = currentData.result.agents || {};
  let agentData = agents[agentName];
  
  if (!agentData) {
    // Try to find a matching agent key (case / formatting differences between backend and UI)
    const keys = Object.keys(agents || {});
    const normalizedRequested = agentName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const altKey = keys.find(k => {
      const normalizedK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedK === normalizedRequested || normalizedK.includes(normalizedRequested) || normalizedRequested.includes(normalizedK);
    });
    if (altKey) {
      agentData = agents[altKey];
      console.warn(`Agent name mismatch: requested "${agentName}", using "${altKey}" instead.`);
    } else {
      showError(`No data found for ${agentName}`);
      return;
    }
  }
  
  // Normalize agent output - support strings and various agent object shapes
  let output = 'No output available';
  if (typeof agentData === 'string') {
    output = agentData;
  } else if (typeof agentData === 'object' && agentData !== null) {
    // Common fields returned by different backends: output, raw, result, text
    if (typeof agentData.output === 'string' && agentData.output.trim().length > 0) {
      output = agentData.output;
    } else if (typeof agentData.raw === 'string' && agentData.raw.trim().length > 0) {
      output = agentData.raw;
    } else if (typeof agentData.result === 'string' && agentData.result.trim().length > 0) {
      output = agentData.result;
    } else if (typeof agentData.text === 'string' && agentData.text.trim().length > 0) {
      output = agentData.text;
    } else {
      // Fallback: stringify the object for display
      try {
        output = JSON.stringify(agentData, null, 2);
      } catch (err) {
        output = String(agentData);
      }
    }
  }
  
  // Convert markdown to HTML using marked.js
  let htmlContent = '';
  
  if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
    try {
      // Parse markdown
      const parsedHtml = marked.parse(output);
      
      // Sanitize HTML
      htmlContent = DOMPurify.sanitize(parsedHtml, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 
                        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'table', 
                        'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'del', 'ins', 'mark'],
        ALLOWED_ATTR: ['href', 'class', 'id']
      });
    } catch (error) {
      console.error('Error parsing markdown:', error);
      htmlContent = formatAgentOutputFallback(output);
    }
  } else {
    // Fallback to basic formatting if libraries not loaded
    htmlContent = formatAgentOutputFallback(output);
  }
  
  contentArea.innerHTML = `
    <div class="content-section">
      <div class="section-header">
        <h2 class="section-title">
          <span>${getAgentIconByName(agentName)}</span>
          <span>${agentName}</span>
        </h2>
        <div class="header-actions">
          <button class="copy-btn" onclick="copyAgentOutput()">
            <span>📋</span>
            <span>Copy</span>
          </button>
        </div>
      </div>
      
      <div class="agent-content">
        <div class="agent-output-rendered" id="agentOutputContent">
          ${htmlContent}
        </div>
      </div>
    </div>
  `;
}

function getAgentIconByName(name) {
  const iconMap = {
    'Web Recon Agent': '🌐',
    'Social Spy Agent': '👁️',
    'Hiring & Talent Agent': '👔',
    'Patent & R&D Agent': '🔬',
    'Pricing Tracker Agent': '💰',
    'Behavior Modeler': '🎭',
    'Roadmap Predictor': '🗺️',
    'Pricing Predictor': '💵',
    'Launch Probability Engine': '🚀',
    'Game Theory Agent': '🎲',
    'Market Impact Agent': '📊',
    'Risk Analyzer': '⚠️',
    'Ad Spy': '📺',
    'Landing Page Scanner': '🔍',
    'Funnel Optimizer': '⚡'
  };
  return iconMap[name] || '🤖';
}

// Fallback formatting function if marked.js is not available
function formatAgentOutputFallback(text) {
  let formatted = escapeHtml(text);
  
  // Headers
  formatted = formatted.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  formatted = formatted.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  formatted = formatted.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code blocks
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Inline code
  formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Lists - Unordered
  const lines = formatted.split('\n');
  let inList = false;
  let result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.match(/^[\s]*[-*•]\s+/)) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      const content = line.replace(/^[\s]*[-*•]\s+/, '');
      result.push(`<li>${content}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (line.trim()) {
        // Don't wrap headers and pre tags
        if (!line.match(/^<(h[1-6]|pre|ul|ol)/)) {
          result.push(`<p>${line}</p>`);
        } else {
          result.push(line);
        }
      }
    }
  }
  
  if (inList) {
    result.push('</ul>');
  }
  
  return result.join('\n');
}

// Copy agent output to clipboard
window.copyAgentOutput = function() {
  const content = document.getElementById('agentOutputContent');
  if (!content) return;
  
  const text = content.innerText;
  
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.copy-btn span:last-child');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.color = 'var(--accent-green)';
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.color = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy to clipboard');
  });
};

// ==================== EXPORT ====================

function exportResults() {
  const exportData = {
    crew: currentCrew,
    crewName: CREW_CONFIGS[currentCrew].name,
    timestamp: new Date().toISOString(),
    summary: currentData.result.summary,
    executiveSummary: currentData.result.executiveSummary || [],
    recommendations: currentData.result.recommendations || [],
    agents: currentData.result.agents,
    metadata: currentData.result.metadata
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentCrew}_results_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== UTILITIES ====================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  contentArea.innerHTML = `
    <div class="loading-spinner">
      <div style="font-size: 48px">⚠️</div>
      <p style="color: #f5576c; font-size: 16px; font-weight: 600;">${escapeHtml(message)}</p>
    </div>
  `;
}