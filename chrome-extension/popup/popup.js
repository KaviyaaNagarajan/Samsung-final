// DOM Elements
const focalCompanyInput = document.getElementById('focalCompany');
const competitor1Input = document.getElementById('competitor1');
const competitor2Input = document.getElementById('competitor2');
const competitor3Input = document.getElementById('competitor3');
const resultsSection = document.getElementById('resultsSection');

const btnCrew1 = document.getElementById('btn-crew1');
const btnCrew2 = document.getElementById('btn-crew2');
const btnCrew3 = document.getElementById('btn-crew3');

// Load saved inputs
loadSavedInputs();

// Button click handlers
btnCrew1.addEventListener('click', () => runCrew('comp_analysis'));
btnCrew2.addEventListener('click', () => runCrew('digital_twin'));
btnCrew3.addEventListener('click', () => runCrew('one_last_time'));

// Save inputs on change
[focalCompanyInput, competitor1Input, competitor2Input, competitor3Input].forEach(input => {
  input.addEventListener('input', saveInputs);
});

// Main function to run a crew
async function runCrew(crewName) {
  const button = document.querySelector(`[data-crew="${crewName}"]`);
  const btnText = button.querySelector('.btn-text');
  const btnLoader = button.querySelector('.btn-loader');
  
  // Get inputs
  const focalCompany = focalCompanyInput.value.trim();
  const competitors = [
    competitor1Input.value.trim(),
    competitor2Input.value.trim(),
    competitor3Input.value.trim()
  ].filter(c => c !== '');

  // Validate inputs
  const config = window.API.API_CONFIG[crewName];
  if (config.needsFocalCompany && !focalCompany) {
    alert('Please enter a focal company name');
    return;
  }

  if (competitors.length === 0) {
    alert('Please enter at least one competitor company');
    return;
  }

  // Set button to loading state
  button.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';

  try {
    // Call API
    const result = await window.API.callCrewAPI(crewName, focalCompany, competitors);
    
    // Display results
    displayResults(result);
    
    // Show success animation
    btnLoader.textContent = '✓';
    setTimeout(() => {
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      btnLoader.textContent = '⏳';
      button.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Error running crew:', error);
    alert(`Error: ${error.message}`);
    
    // Reset button
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
    button.disabled = false;
  }
}

// Display results in the UI
function displayResults(result) {
  resultsSection.style.display = 'block';
  
  const resultCard = document.createElement('div');
  resultCard.className = 'result-card';
  
  // Card Header
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';
  cardHeader.innerHTML = `
    <div class="card-title">${result.crewName}</div>
    <div class="card-status ${result.success ? 'success' : 'error'}">
      ${result.success ? 'Success' : 'Error'}
    </div>
  `;
  
  // Summary Section
  const summarySection = document.createElement('div');
  summarySection.className = 'summary-section';
  summarySection.innerHTML = `
    <div class="summary-label">
      📌 High-level Summary
    </div>
    <div class="summary-text">${result.summary}</div>
  `;
  
  // Agent Tabs
  const agentTabs = document.createElement('div');
  agentTabs.className = 'agent-tabs';
  
  const agentOutputs = document.createElement('div');
  agentOutputs.className = 'agent-outputs';
  
  let firstAgent = true;
  Object.keys(result.agents).forEach(agentName => {
    // Create tab button
    const tab = document.createElement('button');
    tab.className = `agent-tab ${firstAgent ? 'active' : ''}`;
    tab.textContent = agentName;
    tab.dataset.agent = agentName;
    
    // Create output panel
    const output = document.createElement('div');
    output.className = `agent-output ${firstAgent ? 'active' : ''}`;
    output.dataset.agent = agentName;
    output.innerHTML = `<pre>${result.agents[agentName].output}</pre>`;
    
    // Tab click handler
    tab.addEventListener('click', () => {
      // Remove active from all tabs and outputs
      agentTabs.querySelectorAll('.agent-tab').forEach(t => t.classList.remove('active'));
      agentOutputs.querySelectorAll('.agent-output').forEach(o => o.classList.remove('active'));
      
      // Add active to clicked tab and its output
      tab.classList.add('active');
      output.classList.add('active');
    });
    
    agentTabs.appendChild(tab);
    agentOutputs.appendChild(output);
    
    firstAgent = false;
  });
  
  // Assemble card
  resultCard.appendChild(cardHeader);
  resultCard.appendChild(summarySection);
  resultCard.appendChild(agentTabs);
  resultCard.appendChild(agentOutputs);
  
  // Add to results section (prepend to show newest first)
  resultsSection.insertBefore(resultCard, resultsSection.firstChild);
}

// Save inputs to chrome storage
function saveInputs() {
  chrome.storage.local.set({
    focalCompany: focalCompanyInput.value,
    competitor1: competitor1Input.value,
    competitor2: competitor2Input.value,
    competitor3: competitor3Input.value
  });
}

// Load saved inputs
function loadSavedInputs() {
  chrome.storage.local.get(['focalCompany', 'competitor1', 'competitor2', 'competitor3'], (data) => {
    if (data.focalCompany) focalCompanyInput.value = data.focalCompany;
    if (data.competitor1) competitor1Input.value = data.competitor1;
    if (data.competitor2) competitor2Input.value = data.competitor2;
    if (data.competitor3) competitor3Input.value = data.competitor3;
  });
}