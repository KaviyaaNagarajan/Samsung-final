from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from twin.crew import build_twin_crew
import concurrent.futures

app = FastAPI(title="Digital Twin API", version="1.0")

# Enable CORS for extension integration (development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TwinRequest(BaseModel):
    companies: List[str]

class AgentResults(BaseModel):
    final_decision: str
    agents: Dict[str, str]

class TwinResponse(BaseModel):
    results: Dict[str, AgentResults]

@app.get("/")
def health():
    return {"status": "Digital Twin API running"}

# ---- Run one company ----
def run_company(company):
    crew = build_twin_crew(company)
    output = crew.kickoff()

    agent_outputs = {}

    # Extract each agent’s final answer
    if hasattr(output, "tasks_output"):
        for task in output.tasks_output:
            agent_outputs[task.agent] = task.raw

    return company, {
        "final_decision": output.raw,
        "agents": agent_outputs
    }

@app.post("/run", response_model=TwinResponse)
def run_twin(req: TwinRequest):
    results = {}

    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [executor.submit(run_company, c) for c in req.companies]

        for future in concurrent.futures.as_completed(futures):
            company, output = future.result()
            results[company] = output

    return {"results": results}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("twin.backend.api:app", host="0.0.0.0", port=8002)
