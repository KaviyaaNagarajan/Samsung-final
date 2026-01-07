from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from twin.crew import build_twin_crew
import concurrent.futures
import os

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
def run_company(company, api_key=None):
    # Temporarily set GROQ_API_KEY for this company run if provided
    old_key = os.environ.get("GROQ_API_KEY")
    try:
        if api_key:
            os.environ["GROQ_API_KEY"] = api_key

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
    finally:
        if old_key is None:
            os.environ.pop("GROQ_API_KEY", None)
        else:
            os.environ["GROQ_API_KEY"] = old_key

@app.post("/run", response_model=TwinResponse)
def run_twin(req: TwinRequest, x_groq_api_key: str | None = Header(None, alias="X-Groq-Api-Key")):
    results = {}

    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [executor.submit(run_company, c, x_groq_api_key) for c in req.companies]

        for future in concurrent.futures.as_completed(futures):
            company, output = future.result()
            results[company] = output

    return {"results": results}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("twin.backend.api:app", host="0.0.0.0", port=8002)
