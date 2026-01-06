"""
UNIFIED WAR SIMULATION CREW

War Simulation Crew with core strategic analysis.
Agents:
- Game Theory Agent: Simulates moves & counter-moves
- Market Impact Agent: Revenue, churn, adoption
- Risk Analyzer: Finds worst-case scenarios
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List


@CrewBase
class UnifiedWarSimulationCrew:
    """Unified War Simulation Crew - Combines strategic simulation and GTM analysis"""

    agents_config = '../config/agents.yaml'
    tasks_config = '../config/tasks.yaml'

    agents: List[BaseAgent]
    tasks: List[Task]

    # War Simulation Agents
    @agent
    def game_theory_agent(self) -> Agent:
        """Simulates competitive moves and counter-moves using game theory"""
        return Agent(
            config=self.agents_config['game_theory_agent'],  # type: ignore[index]
            verbose=True
        )

    @agent
    def market_impact_agent(self) -> Agent:
        """Analyzes market impact: revenue, churn, adoption metrics"""
        return Agent(
            config=self.agents_config['market_impact_agent'],  # type: ignore[index]
            verbose=True
        )

    @agent
    def risk_analyzer(self) -> Agent:
        """Identifies worst-case scenarios and risk mitigation strategies"""
        return Agent(
            config=self.agents_config['risk_analyzer'],  # type: ignore[index]
            verbose=True
        )

    # War Simulation Tasks
    @task
    def simulate_competitive_moves_task(self) -> Task:
        """Simulate competitive scenarios using game theory"""
        return Task(
            config=self.tasks_config['simulate_competitive_moves'],  # type: ignore[index]
        )

    @task
    def analyze_market_impact_task(self) -> Task:
        """Analyze market impact of competitive moves"""
        return Task(
            config=self.tasks_config['analyze_market_impact'],  # type: ignore[index]
        )

    @task
    def risk_assessment_task(self) -> Task:
        """Assess risks and identify worst-case scenarios"""
        return Task(
            config=self.tasks_config['risk_assessment'],  # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Unified War Simulation Crew"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

