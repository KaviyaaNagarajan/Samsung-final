from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
from customer.crew import build_customer_crew
import concurrent.futures

app = FastAPI(title="Customer Intelligence API", version="1.0")


# ---------- Request Schema ----------
class CustomerRequest(BaseModel):
    company: str
    competitors: List[str]


# ---------- Response Schema ----------
class AgentResults(BaseModel):
    final_decision: str
    agents: Dict[str, str]


class CustomerResponse(BaseModel):
    results: Dict[str, AgentResults]


@app.get("/")
def health():
    return {"status": "Customer Intelligence API running"}


# ---------- Run one competitor ----------
def run_competitor(company, competitor):
    crew = build_customer_crew(company, competitor)
    output = crew.kickoff()

    agent_outputs = {}

    # Extract per-agent results
    if hasattr(output, "tasks_output"):
        for task in output.tasks_output:
            agent_outputs[task.agent] = task.raw

    return competitor, {
        "final_decision": output.raw,
        "agents": agent_outputs
    }


# ---------- Parallel Execution ----------
@app.post("/run", response_model=CustomerResponse)
def run_customer_intelligence(req: CustomerRequest):
    results = {}

    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(run_competitor, req.company, c)
            for c in req.competitors
        ]

        for future in concurrent.futures.as_completed(futures):
            competitor, output = future.result()
            results[competitor] = output

    return {"results": results}
