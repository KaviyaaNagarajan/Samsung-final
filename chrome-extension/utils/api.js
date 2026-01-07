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
    port: 8001,
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

// Groq API Configuration
const GROQ_CONFIG = {
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  competitorModel: 'llama-3.3-70b-versatile',
  summaryModel: 'llama-3.3-70b-versatile',
  competitorMaxTokens: 50,
  summaryMaxTokens: 500,
  competitorTemperature: 0.3,
  summaryTemperature: 0.5,
  competitorSystemPrompt: 'You are a business analyst. Provide only competitor company names, nothing else. No explanations, no formatting, no numbering.',
  summarySystemPrompt: 'You are an executive business analyst specializing in competitive intelligence. Your task is to extract the most critical, actionable insights from reports and present them as concise bullet points.'
};

// ==================== GROQ API - COMPETITOR DISCOVERY ====================

async function getCompetitorSuggestions(focalCompany, category, apiKey) {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  const userPrompt = `List exactly 3 top competitors of ${focalCompany} in the ${category} industry. Return only company names separated by newlines.`;
  
  const payload = {
    model: GROQ_CONFIG.competitorModel,
    messages: [
      {
        role: 'system',
        content: GROQ_CONFIG.competitorSystemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    max_tokens: GROQ_CONFIG.competitorMaxTokens,
    temperature: GROQ_CONFIG.competitorTemperature,
    stop: ['\n\n']
  };
  
  console.log('Calling Groq API for competitor suggestions...');
  
  try {
    const response = await fetch(GROQ_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(handleGroqError(response.status, errorText));
    }
    
    const data = await response.json();
    
    if (data.usage) {
      console.log('Token usage:', data.usage);
    }
    
    const competitors = parseGroqResponse(data);
    
    console.log('Competitors found:', competitors);
    
    return competitors;
    
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
}

function parseGroqResponse(response) {
  try {
    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('Empty response from AI');
    }
    
    console.log('Raw AI response:', content);
    
    let lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    lines = lines.map(line => line.replace(/^\d+\.\s*/, '').trim());
    lines = lines.map(line => line.replace(/\*\*/g, '').replace(/\*/g, '').trim());
    lines = lines.map(line => line.replace(/^[-•]\s*/, '').trim());
    lines = lines.filter(line => line.length > 0);
    
    if (lines.length < 3) {
      throw new Error(`Expected 3 competitors, got ${lines.length}. Response: ${content}`);
    }
    
    const competitors = lines.slice(0, 3);
    
    competitors.forEach(name => {
      if (name.length < 2 || name.length > 50) {
        throw new Error(`Invalid competitor name: ${name}`);
      }
    });
    
    return competitors;
    
  } catch (error) {
    console.error('Error parsing Groq response:', error);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

// ==================== GROQ API - EXECUTIVE SUMMARY GENERATION ====================

async function generateExecutiveSummary(fullText, apiKey) {
  if (!apiKey) {
    console.warn('No API key provided for executive summary generation');
    return [];
  }
  
  if (!fullText || fullText.trim().length < 100) {
    console.warn('Text too short for executive summary');
    return [];
  }
  
  // Truncate text if too long (keep first 4000 chars for context)
  const textToAnalyze = fullText.length > 4000 ? fullText.substring(0, 4000) + '...' : fullText;
  
  const userPrompt = `Analyze the following competitive intelligence report and generate EXACTLY 6 key takeaways.

Requirements:
- Each point must be 10-15 words maximum
- Focus on actionable insights and strategic implications
- Use clear, concise business language
- Start each point with a strong action verb or key finding
- Number each point 1-6
- NO additional commentary or explanations

Report:
${textToAnalyze}

Provide ONLY the 6 numbered bullet points, nothing else.`;
  
  const payload = {
    model: GROQ_CONFIG.summaryModel,
    messages: [
      {
        role: 'system',
        content: GROQ_CONFIG.summarySystemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    max_tokens: GROQ_CONFIG.summaryMaxTokens,
    temperature: GROQ_CONFIG.summaryTemperature
  };
  
  console.log('Calling Groq API for executive summary...');
  
  try {
    const response = await fetch(GROQ_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      return [];
    }
    
    const data = await response.json();
    
    if (data.usage) {
      console.log('Summary token usage:', data.usage);
    }
    
    const summary = parseExecutiveSummary(data);
    
    console.log('Executive summary generated:', summary);
    
    return summary;
    
  } catch (error) {
    console.error('Error generating executive summary:', error);
    return [];
  }
}

function parseExecutiveSummary(response) {
  try {
    const content = response.choices[0].message.content;
    
    if (!content) {
      return [];
    }
    
    console.log('Raw summary response:', content);
    
    // Split by newlines and clean
    let lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Remove numbering and formatting
    const bullets = lines.map(line => {
      // Remove: "1.", "1)", "(1)", "**1.**", etc.
      let cleaned = line.replace(/^[\s]*[\*\(]?\d+[\.\)\*\:]\s*[\*]?/, '');
      // Remove markdown bold
      cleaned = cleaned.replace(/^\*\*/, '').replace(/\*\*$/, '');
      // Remove bullet symbols
      cleaned = cleaned.replace(/^[-•*]\s*/, '');
      return cleaned.trim();
    }).filter(line => line.length > 5); // Filter out very short lines
    
    // Take exactly 6 points (or pad if less)
    const finalBullets = bullets.slice(0, 6);
    
    // If we got less than 6, that's okay - return what we have
    return finalBullets;
    
  } catch (error) {
    console.error('Error parsing executive summary:', error);
    return [];
  }
}

function handleGroqError(status, errorText) {
  switch (status) {
    case 401:
      return 'Invalid API key. Please check your settings.';
    case 429:
      return 'Rate limit exceeded. Please try again in a few minutes.';
    case 500:
    case 502:
    case 503:
      return 'AI service temporarily unavailable. Please try again.';
    default:
      try {
        const errorData = JSON.parse(errorText);
        return errorData.error?.message || `API Error: ${status}`;
      } catch {
        return `API Error: ${status} - ${errorText}`;
      }
  }
}

// ==================== CREW API CALLS ====================

async function callCrewAPI(crewName, focalCompany, competitors, apiKey = null) {
  const config = API_CONFIG[crewName];
  if (!config) {
    throw new Error(`Unknown crew: ${crewName}`);
  }

  const url = `http://localhost:${config.port}${config.endpoint}`;
  
  let payload;

  if (crewName === 'comp_analysis') {
    if (!focalCompany || focalCompany.trim() === '') {
      throw new Error('Focal company is required for Competitor Intelligence');
    }
    payload = {
      our_company: focalCompany,
      competitors: competitors.filter(c => c && c.trim() !== '')
    };
  } 
  else if (crewName === 'digital_twin') {
    const allCompanies = competitors.filter(c => c && c.trim() !== '');
    if (allCompanies.length === 0) {
      throw new Error('At least one competitor is required for Digital Twin');
    }
    payload = {
      companies: allCompanies
    };
  } 
  else if (crewName === 'one_last_time') {
    if (!focalCompany || focalCompany.trim() === '') {
      throw new Error('Focal company is required for War Simulation');
    }
    
    const validCompetitors = competitors.filter(c => c && c.trim() !== '');
    
    payload = {
      our_company: focalCompany,
      competitors: validCompetitors,
      market_segment: "India"
    };
  }

  console.log(`Calling ${crewName} API:`, url, payload, apiKey ? '[Groq key provided]' : '[no Groq key]');

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['X-Groq-Api-Key'] = apiKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return parseCrewResponse(crewName, data, config);
    
  } catch (error) {
    console.error(`Error calling ${crewName}:`, error);
    throw error;
  }
}

function parseCrewResponse(crewName, data, config) {
  let summary = '';
  let agents = {};

  if (crewName === 'comp_analysis') {
    summary = data.final_output || 'Analysis completed';
    agents = parseAgentOutputs(data.agent_outputs, config.agents);
    
  } else if (crewName === 'digital_twin') {
    const results = data.results || {};
    const firstCompany = Object.keys(results)[0];
    
    if (firstCompany) {
      summary = results[firstCompany].final_decision || 'Twin analysis completed';
      agents = parseAgentOutputs(results[firstCompany].agents, config.agents);
    } else {
      summary = 'No results returned';
    }
    
  } else if (crewName === 'one_last_time') {
    summary = data.final_output || data.result || 'Simulation completed';
    
    if (data.agent_outputs && Object.keys(data.agent_outputs).length > 0) {
      agents = parseAgentOutputs(data.agent_outputs, config.agents);
    } else {
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

function parseAgentOutputs(agentData, agentNames) {
  const agents = {};
  
  if (!agentData) {
    agentNames.forEach(agentName => {
      agents[agentName] = {
        output: 'Agent output not available in API response',
        status: 'completed'
      };
    });
    return agents;
  }

  if (typeof agentData === 'object') {
    Object.keys(agentData).forEach(agentKey => {
      const output = agentData[agentKey];
      agents[agentKey] = {
        output: typeof output === 'string' ? output : JSON.stringify(output, null, 2),
        status: 'completed'
      };
    });
  } else if (Array.isArray(agentData)) {
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
  getCompetitorSuggestions,
  generateExecutiveSummary,
  API_CONFIG,
  GROQ_CONFIG
};