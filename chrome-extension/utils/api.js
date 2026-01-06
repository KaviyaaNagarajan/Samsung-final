// API Configuration
const API_CONFIG = {
  comp_analysis: {
    port: 8000,
    endpoint: '/analyze',
    name: 'Competitor Intelligence Crew',
    needsFocalCompany: true,
    agents: [
      'Web Recon Agent',
      'Social Spy Agent',
      'Hiring & Talent Agent',
      'Patent & R&D Agent',
      'Pricing Tracker Agent'
    ]
  },
  digital_twin: {
    port: 8002,
    endpoint: '/run',
    name: 'Digital Twin Crew',
    needsFocalCompany: false,
    agents: [
      'Behavior Modeler',
      'Roadmap Predictor',
      'Pricing Predictor',
      'Launch Probability Engine'
    ]
  },
  one_last_time: {
    port: 8003,
    endpoint: '/simulate',
    name: 'War Simulation Crew',
    needsFocalCompany: true,
    agents: [
      'Game Theory Agent',
      'Market Impact Agent',
      'Risk Analyzer',
      'Ad Spy',
      'Landing Page Scanner',
      'Funnel Optimizer'
    ]
  }
};

// API Call Function
async function callCrewAPI(crewName, focalCompany, competitors) {
  const config = API_CONFIG[crewName];
  if (!config) {
    throw new Error(`Unknown crew: ${crewName}`);
  }

  const url = `http://localhost:${config.port}${config.endpoint}`;
  
  let payload;

  // ✅ BUILD CORRECT PAYLOAD FOR EACH CREW
  if (crewName === 'comp_analysis') {
    // Comp Analysis expects: our_company + competitors
    if (!focalCompany || focalCompany.trim() === '') {
      throw new Error('Focal company is required for Competitor Intelligence');
    }
    payload = {
      our_company: focalCompany,
      competitors: competitors.filter(c => c && c.trim() !== '')
    };
  } 
  else if (crewName === 'digital_twin') {
    // Digital Twin expects: companies (list)
    const allCompanies = competitors.filter(c => c && c.trim() !== '');
    if (allCompanies.length === 0) {
      throw new Error('At least one competitor is required for Digital Twin');
    }
    payload = {
      companies: allCompanies
    };
  } 
  else if (crewName === 'one_last_time') {
    // ✅ NEW: War Simulation expects: our_company, competitors (exactly 3), market_segment
    if (!focalCompany || focalCompany.trim() === '') {
      throw new Error('Focal company is required for War Simulation');
    }
    
    const validCompetitors = competitors.filter(c => c && c.trim() !== '');
    
    // ✅ Validate exactly 3 competitors
    if (validCompetitors.length !== 3) {
      throw new Error('War Simulation requires exactly 3 competitors. Please fill all 3 competitor fields.');
    }
    
    payload = {
      our_company: focalCompany,  // ✅ Changed from competitive_scenario
      competitors: validCompetitors,
      market_segment: "India"
    };
  }

  console.log(`Calling ${crewName} API:`, url, payload);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Parse the response based on crew type
    return parseCrewResponse(crewName, data, config);
    
  } catch (error) {
    console.error(`Error calling ${crewName}:`, error);
    throw error;
  }
}

// ✅ PARSE RESPONSE BASED ON CREW TYPE
function parseCrewResponse(crewName, data, config) {
  let summary = '';
  let agents = {};

  if (crewName === 'comp_analysis') {
    // Response: { agent_outputs: {}, final_output: "" }
    summary = data.final_output || 'Analysis completed';
    agents = parseAgentOutputs(data.agent_outputs, config.agents);
    
  } else if (crewName === 'digital_twin') {
    // Response: { results: { "CompanyName": { final_decision: "", agents: {} } } }
    const results = data.results || {};
    const firstCompany = Object.keys(results)[0];
    
    if (firstCompany) {
      summary = results[firstCompany].final_decision || 'Twin analysis completed';
      agents = parseAgentOutputs(results[firstCompany].agents, config.agents);
    } else {
      summary = 'No results returned';
    }
    
  } else if (crewName === 'one_last_time') {
    // ✅ NEW: Response now has { status, execution_time, final_output, agent_outputs }
    // This matches the comp_analysis format
    summary = data.final_output || data.result || 'Simulation completed';
    
    // ✅ NEW: Parse real agent outputs instead of placeholders
    if (data.agent_outputs && Object.keys(data.agent_outputs).length > 0) {
      agents = parseAgentOutputs(data.agent_outputs, config.agents);
    } else {
      // Fallback to placeholders only if no agent_outputs received
      config.agents.forEach(agentName => {
        agents[agentName] = {
          output: 'Agent output not available in API response',
          status: 'completed'
        };
      });
    }
  }

  return {
    success: true,
    crewName: config.name,
    summary: summary,
    agents: agents,
    metadata: {
      timestamp: new Date().toISOString(),
      duration: data.execution_time || 'N/A'
    }
  };
}

// Parse agent outputs from various formats
function parseAgentOutputs(agentData, agentNames) {
  const agents = {};
  
  if (!agentData) {
    // No agent data - create placeholders
    agentNames.forEach(agentName => {
      agents[agentName] = {
        output: 'Agent output not available in API response',
        status: 'completed'
      };
    });
    return agents;
  }

  if (typeof agentData === 'object') {
    // If it's already an object with agent names as keys
    Object.keys(agentData).forEach(agentKey => {
      const output = agentData[agentKey];
      agents[agentKey] = {
        output: typeof output === 'string' ? output : JSON.stringify(output, null, 2),
        status: 'completed'
      };
    });
  } else if (Array.isArray(agentData)) {
    // If it's an array of task outputs
    agentData.forEach((task, index) => {
      const agentName = agentNames[index] || `Agent ${index + 1}`;
      agents[agentName] = {
        output: task.output || task.raw || task.result || 'No output',
        status: 'completed'
      };
    });
  }
  
  return agents;
}

// Export functions
window.API = {
  callCrewAPI,
  API_CONFIG
};