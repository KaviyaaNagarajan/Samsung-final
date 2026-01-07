import os
import yaml
from crewai import Crew, Agent, Task, LLM
from customer.tools.serper_tool import search

BASE_DIR = os.path.dirname(__file__)
CONFIG_DIR = os.path.join(BASE_DIR, "config")

with open(os.path.join(CONFIG_DIR, "agents.yaml")) as f:
    agent_cfg = yaml.safe_load(f)

with open(os.path.join(CONFIG_DIR, "tasks.yaml")) as f:
    task_cfg = yaml.safe_load(f)

llm = LLM(
    api_key=os.getenv("GROQ_API_KEY"),
    model=os.getenv("MODEL")
)

agents = {
    name: Agent(**cfg, llm=llm)
    for name, cfg in agent_cfg.items()
}

def build_customer_crew(company: str, competitors: str):

    # 🔍 Fetch live customer data
    market_data = search(f"{competitors} customer reviews complaints reddit trustpilot g2")

    context = f"""
    Live customer feedback for competitors {competitors}:
    {market_data}
    """

    tasks = [
        Task(
            description=task_cfg["collect_reviews"]["description"].format(competitors=competitors) + context,
            expected_output=task_cfg["collect_reviews"]["expected_output"],
            agent=agents["review_miner"],
        ),
        Task(
            description=task_cfg["detect_churn"]["description"].format(competitors=competitors) + context,
            expected_output=task_cfg["detect_churn"]["expected_output"],
            agent=agents["churn_detector"],
        ),
        Task(
            description=task_cfg["find_feature_gaps"]["description"].format(competitors=competitors) + context,
            expected_output=task_cfg["find_feature_gaps"]["expected_output"],
            agent=agents["feature_gap_miner"],
        ),
        Task(
            description=task_cfg["analyze_sentiment"]["description"].format(competitors=competitors) + context,
            expected_output=task_cfg["analyze_sentiment"]["expected_output"],
            agent=agents["sentiment_analyzer"],
        ),
    ]

    return Crew(
        agents=list(agents.values()),
        tasks=tasks,
        verbose=True
    )
