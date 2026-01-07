from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
import os
from .tools.serper_tool import SerperSearchTool

MODEL_NAME = os.getenv("CREW_MODEL", "groq/llama-3.1-8b-instant")

# Initialize Serper tool
serper_tool = SerperSearchTool()

@CrewBase
class OrganizationFeedbackCrew:
    """Crew to analyze organization feedback using REAL online data via Serper API"""

    @agent
    def feedback_collector(self) -> Agent:
        return Agent(
            config=self.agents_config["feedback_collector"],
            llm=LLM(
                model="llama-3.1-8b-instant",
                api_base="https://api.groq.com/openai/v1",
                api_key=os.getenv("OPENAI_API_KEY"),
                temperature=0.4
            ),
            tools=[serper_tool],
            max_iter=2,  # Reduced to prevent excessive searches
            max_execution_time=180,
            allow_delegation=False,
            verbose=True
        )


    @agent
    def industry_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config["industry_analyst"],
            llm=LLM(
                model="llama-3.1-8b-instant",
                api_base="https://api.groq.com/openai/v1",
                api_key=os.getenv("OPENAI_API_KEY"),
                temperature=0.4
            ),
            tools=[serper_tool],
            max_iter=2,  # Reduced to prevent excessive searches
            max_execution_time=180,
            allow_delegation=False,
            verbose=True
        )

    @agent
    def insight_synthesizer(self) -> Agent:
        return Agent(
            config=self.agents_config["insight_synthesizer"],
            llm=LLM(
                model="llama-3.1-8b-instant",
                api_base="https://api.groq.com/openai/v1",
                api_key=os.getenv("OPENAI_API_KEY"),
                temperature=0.5
            ),
            tools=[],  # No tools needed for synthesis
            max_iter=2,
            max_execution_time=180,  # 3 minutes max
            allow_delegation=False,
            verbose=True
        )

    @task
    def collect_user_feedback(self) -> Task:
        return Task(config=self.tasks_config["collect_user_feedback"])

    @task
    def analyze_industry_feedback(self) -> Task:
        return Task(config=self.tasks_config["analyze_industry_feedback"])

    @task
    def synthesize_final_insights(self) -> Task:
        return Task(config=self.tasks_config["synthesize_final_insights"])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True
        )
