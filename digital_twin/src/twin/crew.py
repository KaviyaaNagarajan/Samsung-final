import os
import yaml
from dotenv import load_dotenv
from crewai import Crew, Agent, Task, LLM
from twin.tools.serper_tool import search

# Load environment variables
load_dotenv()

BASE_DIR = os.path.dirname(__file__)
CONFIG_DIR = os.path.join(BASE_DIR, "config")

# ---- Load YAML configs ----
with open(os.path.join(CONFIG_DIR, "agents.yaml"), "r") as f:
    agent_cfg = yaml.safe_load(f)

with open(os.path.join(CONFIG_DIR, "tasks.yaml"), "r") as f:
    task_cfg = yaml.safe_load(f)

# ---- Validate ENV ----
def get_llm():
    api_key = os.getenv("GROQ_API_KEY")
    base_url = os.getenv("GROQ_API_BASE")
    model = os.getenv("GROQ_MODEL_NAME")

    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set")
    if not model:
        raise RuntimeError("GROQ_MODEL_NAME is not set")

    return LLM(
        api_key=api_key,
        base_url=base_url,
        model=model,
    )

def build_twin_crew(company: str) -> Crew:
    llm = get_llm()

    # ---- Create agents ----
    agents = {
        name: Agent(**cfg, llm=llm)
        for name, cfg in agent_cfg.items()
    }

    # ---- Live market context ----
    market_data = search(
        f"{company} product roadmap pricing leaks future plans"
    )

    context = f"""
    Live market intelligence for {company}:
    {market_data}
    """

    tasks = [
        Task(
            description=task_cfg["behavior_task"]["description"].format(company=company) + context,
            expected_output=task_cfg["behavior_task"]["expected_output"],
            agent=agents["behavior_modeler"],
        ),
        Task(
            description=task_cfg["roadmap_task"]["description"].format(company=company) + context,
            expected_output=task_cfg["roadmap_task"]["expected_output"],
            agent=agents["roadmap_predictor"],
        ),
        Task(
            description=task_cfg["pricing_task"]["description"].format(company=company) + context,
            expected_output=task_cfg["pricing_task"]["expected_output"],
            agent=agents["pricing_predictor"],
        ),
        Task(
            description=task_cfg["launch_task"]["description"].format(company=company) + context,
            expected_output=task_cfg["launch_task"]["expected_output"],
            agent=agents["launch_engine"],
        ),
    ]

    return Crew(
        agents=list(agents.values()),
        tasks=tasks,
        verbose=True,
    )
