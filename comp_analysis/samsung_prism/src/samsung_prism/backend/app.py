from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
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
def analyze(payload: IntelligenceRequest, x_groq_api_key: str | None = Header(None, alias="X-Groq-Api-Key")):
    if not payload.our_company or not payload.competitors:
        raise HTTPException(
            status_code=400,
            detail="our_company and competitors are required"
        )

    old_key = os.environ.get("GROQ_API_KEY")
    try:
        # Temporarily set GROQ_API_KEY if provided by client
        if x_groq_api_key:
            os.environ["GROQ_API_KEY"] = x_groq_api_key

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
        msg = str(e)
        if "Invalid API key" in msg or "Invalid API Key" in msg or "invalid_api_key" in msg:
            raise HTTPException(status_code=401, detail="Invalid Groq API key provided")
        raise HTTPException(
            status_code=500,
            detail=msg
        )
    finally:
        # Restore previous env var
        if old_key is None:
            os.environ.pop("GROQ_API_KEY", None)
        else:
            os.environ["GROQ_API_KEY"] = old_key
