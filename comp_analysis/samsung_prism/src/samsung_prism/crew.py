from crewai import Agent, Crew, Task, Process, LLM
from crewai.project import CrewBase, agent, task, crew
import yaml
from pathlib import Path
import os

# --------------------------------------------------
# PATH SETUP
# --------------------------------------------------
BASE_DIR = Path(__file__).parent
CONFIG_DIR = BASE_DIR / "config"

# --------------------------------------------------
# GROQ API KEY (NO DOTENV)
# --------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError(
        "❌ GROQ_API_KEY not found. Set it using:\n"
        "Windows: setx GROQ_API_KEY \"your_key\"\n"
        "Linux/Mac: export GROQ_API_KEY=\"your_key\""
    )

# --------------------------------------------------
# HARD MODEL OVERRIDE (PREVENT 70B EVER BEING USED)
# --------------------------------------------------
for k in [
    "LITELLM_MODEL",
    "OPENAI_MODEL",
    "DEFAULT_LLM_MODEL",
    "CREWAI_LLM_MODEL",
]:
    os.environ.pop(k, None)

os.environ["LITELLM_MODEL"] = "groq/llama-3.1-8b-instant"

# --------------------------------------------------
# SHARED SAFE LLM CONFIG
# --------------------------------------------------
SAFE_LLM = LLM(
    model="groq/llama-3.1-8b-instant",
    temperature=0.3,
    max_tokens=300
)

# --------------------------------------------------
# CREW
# --------------------------------------------------
@CrewBase
class SamsungCompetitorIntelligenceCrew:
    """Competitor Intelligence Crew (All Products, Low Tokens)"""

    def __init__(self):
        with open(CONFIG_DIR / "agents.yaml", "r") as f:
            self.agents_config = yaml.safe_load(f)

        with open(CONFIG_DIR / "tasks.yaml", "r") as f:
            self.tasks_config = yaml.safe_load(f)

    # ------------------ AGENTS ------------------

    @agent
    def web_recon_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["web_recon_agent"],
            llm=SAFE_LLM,
            reasoning=False,
            max_iter=1,
            allow_delegation=False,
        )

    @agent
    def social_spy_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["social_spy_agent"],
            llm=SAFE_LLM,
            reasoning=False,
            max_iter=1,
            allow_delegation=False,
        )

    @agent
    def hiring_talent_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["hiring_talent_agent"],
            llm=SAFE_LLM,
            reasoning=False,
            max_iter=1,
            allow_delegation=False,
        )

    @agent
    def patent_rd_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["patent_rd_agent"],
            llm=SAFE_LLM,
            reasoning=False,
            max_iter=1,
            allow_delegation=False,
        )

    @agent
    def pricing_tracker_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["pricing_tracker_agent"],
            llm=SAFE_LLM,
            reasoning=False,
            max_iter=1,
            allow_delegation=False,
        )

    @agent
    def synthesis_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["synthesis_agent"],
            llm=LLM(
                model="groq/llama-3.1-8b-instant",
                temperature=0.2,
                max_tokens=500,
            ),
            reasoning=False,
            max_iter=1,
            allow_delegation=False,
        )

    # ------------------ TASKS ------------------

    @task
    def web_recon_task(self) -> Task:
        return Task(
            config=self.tasks_config["web_recon_task"],
            agent=self.web_recon_agent(),
            max_tokens=300,
            retries=0
        )

    @task
    def social_spy_task(self) -> Task:
        return Task(
            config=self.tasks_config["social_spy_task"],
            agent=self.social_spy_agent(),
            max_tokens=300,
            retries=0
        )

    @task
    def hiring_talent_task(self) -> Task:
        return Task(
            config=self.tasks_config["hiring_talent_task"],
            agent=self.hiring_talent_agent(),
            max_tokens=300,
            retries=0
        )

    @task
    def patent_rd_task(self) -> Task:
        return Task(
            config=self.tasks_config["patent_rd_task"],
            agent=self.patent_rd_agent(),
            max_tokens=300,
            retries=0
        )

    @task
    def pricing_tracker_task(self) -> Task:
        return Task(
            config=self.tasks_config["pricing_tracker_task"],
            agent=self.pricing_tracker_agent(),
            max_tokens=300,
            retries=0
        )

    @task
    def final_synthesis_task(self) -> Task:
        return Task(
            config=self.tasks_config["final_synthesis_task"],
            agent=self.synthesis_agent(),
            max_tokens=500,
            retries=0
        )

    # ------------------ CREW ------------------

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
            memory=False,        # 🔥 prevents context explosion
            max_rpm=5            # 🔥 slows calls safely
        )
