from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.schemas import WarSimulationRequest
from war_simulation_agent.orchestrator import get_orchestrator
import uvicorn

app = FastAPI(
    title="Samsung War Simulation API",
    description="Backend API for CrewAI-based War Simulation",
    version="1.0.0"
)

# Enable CORS for extension integration (development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/simulate")
def run_war_simulation(payload: WarSimulationRequest):
    # Validate required fields
    if not payload.our_company or not payload.competitors:
        raise HTTPException(status_code=400, detail="our_company and competitors are required")
    if len(payload.competitors) != 3:
        raise HTTPException(status_code=400, detail="competitors must contain exactly 3 names (comma-separated list)")

    try:
        orchestrator = get_orchestrator(verbose=False)

        # Auto-fill competitive_scenario using our_company
        competitive_scenario = f"{payload.our_company}'s competitor analysis"

        result = orchestrator.run(
            competitive_scenario=competitive_scenario,
            competitors=payload.competitors,
            market_segment=payload.market_segment,
            company=payload.our_company
        )

        # ✅ NEW: Extract text strings from CrewOutput object
        # Get the final summary (last agent's output)
        final_output = str(result.raw) if hasattr(result, 'raw') else str(result)
        
        # Extract individual agent outputs
        agent_outputs = {}
        if hasattr(result, 'tasks_output') and result.tasks_output:
            for task in result.tasks_output:
                # Get agent name (role) and their output
                agent_name = task.agent if isinstance(task.agent, str) else str(task.agent)
                agent_output = str(task.raw) if hasattr(task, 'raw') else str(task.output)
                agent_outputs[agent_name] = agent_output

        # Return structured response matching comp_analysis format
        return {
            "status": "success",
            "execution_time": str(orchestrator.execution_time),
            "final_output": final_output,        # ✅ Extracted text string
            "agent_outputs": agent_outputs       # ✅ Dictionary of agent outputs
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ✅ FIX PORT IN CODE
if __name__ == "__main__":
    uvicorn.run(
        "backend.app:app",
        host="127.0.0.1",
        port=8003,
        reload=True
    )
