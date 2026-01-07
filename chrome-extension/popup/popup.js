// DOM Elements
const focalCompanyInput = document.getElementById('focalCompany');
const categoryInput = document.getElementById('categoryInput');
const competitor1Input = document.getElementById('competitor1');
const competitor2Input = document.getElementById('competitor2');
const competitor3Input = document.getElementById('competitor3');
const resultsSection = document.getElementById('resultsSection');

// Mode selector
const aiModeRadio = document.getElementById('aiMode');
const manualModeRadio = document.getElementById('manualMode');
const aiModeSection = document.getElementById('aiModeSection');
const manualModeSection = document.getElementById('manualModeSection');

// AI mode elements
const btnFindCompetitors = document.getElementById('btnFindCompetitors');
const competitorsContainer = document.getElementById('competitorsContainer');
const competitorsCheckboxList = document.getElementById('competitorsCheckboxList');
const retryBtn = document.getElementById('retryBtn');

// Crew buttons
const btnCrew1 = document.getElementById('btn-crew1');
const btnCrew2 = document.getElementById('btn-crew2');
const btnCrew3 = document.getElementById('btn-crew3');

// Settings modal
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModal = document.getElementById('closeModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const testApiKeyBtn = document.getElementById('testApiKeyBtn');
const statusMessage = document.getElementById('statusMessage');

// State
let currentMode = 'ai';
let aiSuggestions = [];

// Crew configurations with agent names
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

// Initialize
loadSavedInputs();

// Event Listeners - Mode Switching
aiModeRadio.addEventListener('change', () => toggleMode('ai'));
manualModeRadio.addEventListener('change', () => toggleMode('manual'));

// Event Listeners - AI Mode
btnFindCompetitors.addEventListener('click', findCompetitors);
retryBtn.addEventListener('click', findCompetitors);

// Event Listeners - Crew Buttons
btnCrew1.addEventListener('click', () => runCrew('comp_analysis'));
btnCrew2.addEventListener('click', () => runCrew('digital_twin'));
btnCrew3.addEventListener('click', () => runCrew('one_last_time'));

// Event Listeners - Settings
settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
closeModal.addEventListener('click', () => settingsModal.style.display = 'none');
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) settingsModal.style.display = 'none';
});
saveApiKeyBtn.addEventListener('click', saveApiKey);
testApiKeyBtn.addEventListener('click', testApiKey);

// Save inputs on change
[focalCompanyInput, categoryInput, competitor1Input, competitor2Input, competitor3Input].forEach(input => {
  input.addEventListener('input', saveInputs);
});

// ==================== MODE MANAGEMENT ====================

function toggleMode(mode) {
  currentMode = mode;
  
  if (mode === 'ai') {
    aiModeSection.style.display = 'block';
    manualModeSection.style.display = 'none';
  } else {
    aiModeSection.style.display = 'none';
    manualModeSection.style.display = 'block';
    competitorsContainer.style.display = 'none';
  }
  
  saveInputs();
}

// ==================== AI COMPETITOR DISCOVERY ====================

async function findCompetitors() {
  const focalCompany = focalCompanyInput.value.trim();
  const category = categoryInput.value.trim();
  
  if (!focalCompany) {
    alert('Please enter a focal company name');
    focalCompanyInput.focus();
    return;
  }
  
  if (!category) {
    alert('Please enter an industry or category');
    categoryInput.focus();
    return;
  }
  
  const apiKey = await loadApiKey();
  if (!apiKey) {
    alert('Please set your Groq API key in Settings');
    settingsModal.style.display = 'flex';
    return;
  }
  
  const btnText = btnFindCompetitors.querySelector('.btn-text');
  const btnLoader = btnFindCompetitors.querySelector('.btn-loader');
  btnFindCompetitors.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'flex';
  
  try {
    const competitors = await window.API.getCompetitorSuggestions(focalCompany, category, apiKey);
    aiSuggestions = competitors.map(name => ({ name, selected: true }));
    displayCompetitorCheckboxes();
    competitorsContainer.style.display = 'block';
    
    btnLoader.innerHTML = '<span style="font-size: 20px;">✓</span>';
    setTimeout(() => {
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      btnLoader.innerHTML = '<span class="loader-spinner"></span>';
      btnFindCompetitors.disabled = false;
    }, 1500);
    
    saveInputs();
    
  } catch (error) {
    console.error('Error finding competitors:', error);
    alert(`Error: ${error.message}`);
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
    btnFindCompetitors.disabled = false;
  }
}

function displayCompetitorCheckboxes() {
  competitorsCheckboxList.innerHTML = '';
  
  aiSuggestions.forEach((competitor, index) => {
    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'competitor-checkbox';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `competitor-${index}`;
    checkbox.checked = competitor.selected;
    checkbox.addEventListener('change', (e) => {
      aiSuggestions[index].selected = e.target.checked;
      saveInputs();
    });
    
    const label = document.createElement('label');
    label.htmlFor = `competitor-${index}`;
    label.textContent = competitor.name;
    
    checkboxDiv.appendChild(checkbox);
    checkboxDiv.appendChild(label);
    competitorsCheckboxList.appendChild(checkboxDiv);
  });
}

function getSelectedCompetitors() {
  return aiSuggestions.filter(c => c.selected).map(c => c.name);
}

// ==================== CREW EXECUTION ====================

async function runCrew(crewName) {
  const button = document.querySelector(`[data-crew="${crewName}"]`);
  const btnContent = button.querySelector('.btn-content');
  const btnLoader = button.querySelector('.btn-loader');
  
  const focalCompany = focalCompanyInput.value.trim();
  let competitors = [];
  
  if (currentMode === 'ai') {
    competitors = getSelectedCompetitors();
    if (competitors.length === 0) {
      alert('Please find and select competitors first, or switch to Manual Entry mode');
      return;
    }
  } else {
    competitors = [
      competitor1Input.value.trim(),
      competitor2Input.value.trim(),
      competitor3Input.value.trim()
    ].filter(c => c !== '');
    
    if (competitors.length === 0) {
      alert('Please enter at least one competitor company');
      return;
    }
  }
  
  const config = window.API.API_CONFIG[crewName];
  if (config.needsFocalCompany && !focalCompany) {
    alert('Please enter a focal company name');
    return;
  }
  
  button.disabled = true;
  btnContent.style.opacity = '0.3';
  btnLoader.style.display = 'flex';
  
  try {
    if (crewName === 'one_last_time' && competitors.length < 3) {
      const proceed = confirm(`War Simulation usually expects 3 competitors. You selected ${competitors.length}. Continue with ${competitors.length} competitor(s)?`);
      if (!proceed) {
        btnContent.style.opacity = '1';
        btnLoader.style.display = 'none';
        button.disabled = false;
        return;
      }
      showStatus(`Proceeding with ${competitors.length} competitor(s).`, 'warning');
    }

    const apiKey = await loadApiKey();
    const result = await window.API.callCrewAPI(crewName, focalCompany, competitors, apiKey);
    
    // Generate executive summary using Groq
    if (apiKey && result.summary) {
      try {
        console.log('Generating executive summary...');
        const executiveSummary = await window.API.generateExecutiveSummary(result.summary, apiKey);
        result.executiveSummary = executiveSummary;
        console.log('Executive summary generated:', executiveSummary);
      } catch (summaryError) {
        console.warn('Failed to generate executive summary:', summaryError);
        result.executiveSummary = [];
      }
    } else {
      result.executiveSummary = [];
    }
    
    // Extract recommendations from final output
    result.recommendations = extractRecommendationsFromOutput(result.summary);
    
    // Display execution summary card
    displayExecutionSummary(crewName, result);
    
    btnLoader.innerHTML = '<span style="font-size: 20px;">✓</span>';
    setTimeout(() => {
      btnContent.style.opacity = '1';
      btnLoader.style.display = 'none';
      btnLoader.innerHTML = '<span class="loader-spinner"></span>';
      button.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Error running crew:', error);
    const msg = error && error.message ? error.message : String(error);

    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.toLowerCase().includes('network')) {
      const port = (window.API && window.API.API_CONFIG && window.API.API_CONFIG[crewName]) ? window.API.API_CONFIG[crewName].port : 'the service port';
      const helpMsg = `Could not reach the backend at http://localhost:${port}.\nMake sure the ${crewName} service is running (start its uvicorn server) and that CORS/network settings allow the request.`;
      alert(helpMsg);
      showStatus(`Backend unreachable on port ${port}. Start the service and retry.`, 'error');

    } else if (msg.includes('Invalid Groq API key') || msg.includes('invalid_api_key') || msg.includes('401')) {
      alert('Invalid Groq API key. Please open Settings and update your Groq key.');
      settingsModal.style.display = 'flex';
      showStatus('Invalid Groq API key. Update in Settings.', 'error');

    } else {
      alert(`Error: ${msg}`);
    }

    btnContent.style.opacity = '1';
    btnLoader.style.display = 'none';
    button.disabled = false;
  }
}

// ==================== RECOMMENDATIONS EXTRACTION ====================

function extractRecommendationsFromOutput(finalOutput) {
  if (!finalOutput) return null;
  
  const patterns = [
    /Top \d+ (?:Actionable )?Strategic Recommendations?[:\n]+([\s\S]*?)(?:\n\n#|\n---|\n\*\*[A-Z]|$)/i,
    /##?\s*Recommendations?[:\n]+([\s\S]*?)(?:\n\n#|\n---|\n\*\*[A-Z]|$)/i,
    /##?\s*Strategic Actions?[:\n]+([\s\S]*?)(?:\n\n#|\n---|\n\*\*[A-Z]|$)/i,
    /##?\s*Key Takeaways?[:\n]+([\s\S]*?)(?:\n\n#|\n---|\n\*\*[A-Z]|$)/i,
    /##?\s*Action Items?[:\n]+([\s\S]*?)(?:\n\n#|\n---|\n\*\*[A-Z]|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = finalOutput.match(pattern);
    if (match) {
      const recommendations = parseRecommendationsList(match[1]);
      if (recommendations && recommendations.length > 0) {
        console.log('Extracted recommendations:', recommendations);
        return recommendations;
      }
    }
  }
  
  console.log('No recommendations section found in output');
  return null;
}

function parseRecommendationsList(text) {
  const recommendations = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  let currentRec = null;
  
  for (const line of lines) {
    // Match numbered items: "1.", "1)", "(1)", "**1.**"
    const numberMatch = line.match(/^[\s]*[\*]*[\(\[]?(\d+)[\.\)\]]?[\*]*\s*(.+)/);
    
    if (numberMatch) {
      if (currentRec) recommendations.push(currentRec);
      
      const title = numberMatch[2].replace(/^\*\*|\*\*$/g, '').trim();
      
      currentRec = {
        number: numberMatch[1],
        title: title,
        details: []
      };
    } 
    // Match bullet points: "-", "*", "•"
    else if (line.match(/^[\s]*[-*•]\s*(.+)/) && currentRec) {
      const detail = line.replace(/^[\s]*[-*•]\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (detail.length > 0) {
        currentRec.details.push(detail);
      }
    }
    // Continuation text (not starting with number or bullet)
    else if (currentRec && line.trim() && !line.match(/^[\s]*\d+[\.]/)) {
      const cleanLine = line.trim().replace(/^\*\*|\*\*$/g, '');
      if (cleanLine.length > 0 && !cleanLine.match(/^#/)) {
        currentRec.details.push(cleanLine);
      }
    }
  }
  
  if (currentRec) recommendations.push(currentRec);
  
  return recommendations.length > 0 ? recommendations : null;
}

// ==================== EXECUTION SUMMARY DISPLAY ====================

function displayExecutionSummary(crewName, result) {
  resultsSection.style.display = 'block';
  
  const crewConfig = CREW_CONFIGS[crewName];
  const executionCard = document.createElement('div');
  executionCard.className = 'execution-card';
  
  // Card Header
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';
  cardHeader.innerHTML = `
    <div class="card-title">📊 ${crewConfig.name}</div>
    <div class="card-status">
      <span>✓ Success</span>
      <span style="color: var(--text-muted)">|</span>
      <span>${result.metadata?.duration || 'N/A'}</span>
    </div>
  `;
  
  executionCard.appendChild(cardHeader);
  executionCard.appendChild(createDivider());
  
  // Executive Summary Section (if available)
  if (result.executiveSummary && result.executiveSummary.length > 0) {
    const summarySection = document.createElement('div');
    summarySection.className = 'executive-summary-section';
    summarySection.innerHTML = `
      <div class="summary-header">
        <span class="summary-icon">⚡</span>
        <span class="summary-title">Executive Summary</span>
      </div>
      <div class="summary-points">
        ${result.executiveSummary.map((point, idx) => `
          <div class="summary-point">
            <span class="point-number">${idx + 1}</span>
            <span class="point-text">${escapeHtml(point)}</span>
          </div>
        `).join('')}
      </div>
    `;
    
    executionCard.appendChild(summarySection);
    executionCard.appendChild(createDivider());
  }
  
  // Action Buttons
  const cardActions = document.createElement('div');
  cardActions.className = 'card-actions';
  
  // Add Recommendations button (if applicable)
  if (crewConfig.hasRecommendations) {
    const recommendationsBtn = document.createElement('button');
    recommendationsBtn.className = 'action-btn recommendations-btn';
    recommendationsBtn.textContent = '💡 Recommendations';
    recommendationsBtn.addEventListener('click', () => {
      navigateToResults(crewName, result, 'recommendations');
    });
    cardActions.appendChild(recommendationsBtn);
  }
  
  // Add agent buttons
  crewConfig.agents.forEach(agentName => {
    const agentBtn = document.createElement('button');
    agentBtn.className = 'action-btn';
    agentBtn.textContent = agentName;
    agentBtn.addEventListener('click', () => {
      navigateToResults(crewName, result, agentName);
    });
    cardActions.appendChild(agentBtn);
  });
  
  executionCard.appendChild(cardActions);
  
  // Add to results section (prepend to show newest first)
  resultsSection.insertBefore(executionCard, resultsSection.firstChild);
}

function createDivider() {
  const div = document.createElement('div');
  div.className = 'card-divider';
  return div;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== NAVIGATION TO RESULTS PAGE ====================

async function navigateToResults(crewName, result, section) {
  const resultData = {
    crewName,
    result,
    section,
    timestamp: Date.now()
  };
  
  await chrome.storage.local.set({ currentResult: resultData });
  
  const url = chrome.runtime.getURL(`results/results.html?crew=${crewName}&section=${encodeURIComponent(section)}`);
  window.open(url, '_blank', 'width=1200,height=800');
}

// ==================== API KEY MANAGEMENT ====================

async function saveApiKey() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }
  
  if (!apiKey.startsWith('gsk_')) {
    showStatus('Invalid API key format. Groq keys start with "gsk_"', 'error');
    return;
  }
  
  try {
    await chrome.storage.local.set({ groqApiKey: apiKey });
    showStatus('API key saved successfully! ✓', 'success');
    
    setTimeout(() => {
      apiKeyInput.value = '';
      statusMessage.style.display = 'none';
    }, 2000);
  } catch (error) {
    showStatus('Error saving API key', 'error');
  }
}

async function loadApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['groqApiKey'], (data) => {
      resolve(data.groqApiKey || null);
    });
  });
}

async function testApiKey() {
  const apiKey = await loadApiKey();
  
  if (!apiKey) {
    showStatus('No API key found. Please save one first.', 'error');
    return;
  }
  
  showStatus('Testing connection...', 'success');
  
  try {
    const competitors = await window.API.getCompetitorSuggestions('Apple', 'Technology', apiKey);
    showStatus(`Connection successful! ✓ Found ${competitors.length} competitors.`, 'success');
  } catch (error) {
    showStatus(`Connection failed: ${error.message}`, 'error');
  }
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = 'block';
}

// ==================== STORAGE ====================

function saveInputs() {
  chrome.storage.local.set({
    focalCompany: focalCompanyInput.value,
    category: categoryInput.value,
    competitor1: competitor1Input.value,
    competitor2: competitor2Input.value,
    competitor3: competitor3Input.value,
    mode: currentMode,
    aiSuggestions: JSON.stringify(aiSuggestions)
  });
}

function loadSavedInputs() {
  chrome.storage.local.get([
    'focalCompany', 
    'category', 
    'competitor1', 
    'competitor2', 
    'competitor3',
    'mode',
    'aiSuggestions'
  ], (data) => {
    if (data.focalCompany) focalCompanyInput.value = data.focalCompany;
    if (data.category) categoryInput.value = data.category;
    if (data.competitor1) competitor1Input.value = data.competitor1;
    if (data.competitor2) competitor2Input.value = data.competitor2;
    if (data.competitor3) competitor3Input.value = data.competitor3;
    
    if (data.mode) {
      currentMode = data.mode;
      if (data.mode === 'ai') {
        aiModeRadio.checked = true;
        toggleMode('ai');
      } else {
        manualModeRadio.checked = true;
        toggleMode('manual');
      }
    }
    
    if (data.aiSuggestions) {
      try {
        aiSuggestions = JSON.parse(data.aiSuggestions);
        if (aiSuggestions.length > 0 && currentMode === 'ai') {
          displayCompetitorCheckboxes();
          competitorsContainer.style.display = 'block';
        }
      } catch (e) {
        aiSuggestions = [];
      }
    }
  });
}