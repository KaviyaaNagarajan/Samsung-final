from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from samsung_prism.crew import SamsungCompetitorIntelligenceCrew

app = FastAPI(
    title="Samsung PRISM – Competitor Intelligence API",
    version="1.1.0"
)

# Enable CORS for extension integration (development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Schemas
# -----------------------------
class IntelligenceRequest(BaseModel):
    our_company: str
    competitors: list[str]


class IntelligenceResponse(BaseModel):
    agent_outputs: dict
    final_output: str


# -----------------------------
# Health Check
# -----------------------------
@app.get("/")
def health_check():
    return {"status": "✅ Samsung PRISM API running"}


# -----------------------------
# Run Intelligence Analysis
# -----------------------------
@app.post("/analyze", response_model=IntelligenceResponse)
def analyze(payload: IntelligenceRequest):
    if not payload.our_company or not payload.competitors:
        raise HTTPException(
            status_code=400,
            detail="our_company and competitors are required"
        )

    try:
        crew_instance = SamsungCompetitorIntelligenceCrew()
        crew = crew_instance.crew()

        # Kickoff
        final_result = crew.kickoff(
            inputs={
                "our_company": payload.our_company,
                "competitors": payload.competitors
            }
        )

        # 🔥 COLLECT ALL TASK OUTPUTS
        agent_outputs = {}

        for task in crew.tasks:
            agent_name = task.agent.role
            agent_outputs[agent_name] = str(task.output)

        return IntelligenceResponse(
            agent_outputs=agent_outputs,
            final_output=str(final_result)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
