from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from war_simulation_agent.crews.unified_crew import UnifiedWarSimulationCrew
from war_simulation_agent.retry_utils import run_with_rate_limit_retry, DailyRateLimitError
from war_simulation_agent.api_key_manager import set_groq_api_key, get_api_key_for_crew


# ==========================================================
# LOAD COMPANY CONTEXT
# ==========================================================

def load_company_context(company: str) -> str:
    """Loads strategic context from:
    src/war_simulation_agent/data/<company>_content.md

    If a company-specific context file doesn't exist, this returns an
    empty string so the caller can provide context or proceed without it.
    """
    base_path = Path(__file__).resolve().parent
    data_path = base_path / "data" / f"{company.lower()}_content.md"

    if data_path.exists():
        return data_path.read_text(encoding="utf-8")

    # No company-specific file found — return empty context (caller may warn)
    return ""


# ==========================================================
# CREW ORCHESTRATOR
# ==========================================================
class CrewOrchestrator:
    """
    Orchestrates the Unified War Simulation Crew
    Combines War Simulation and GTM Hijacker capabilities
    """

    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self.results: Dict[str, Any] = {}
        self.execution_time: Dict[str, Any] = {}

    def run(
        self,
        competitive_scenario: str,
        competitors: list,
        market_segment: Optional[str] = None,
        company: Optional[str] = None,
        company_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run the unified war simulation crew
        """

        company = (company or "Company").strip()

        if self.verbose:
            print("\n" + "=" * 80)
            print(f"{company.upper()} WAR SIMULATION ENGINE")
            print("=" * 80)

        start_time = datetime.now()

        # Load company context if not provided
        if company_context is None:
            company_context = load_company_context(company)

        inputs = {
            "company": company,
            "market": "India Smartphone Market",
            "company_context": company_context,
            "competitive_scenario": competitive_scenario,
            "competitors": competitors,
            "market_segment": market_segment or "india",
        }

        crew = UnifiedWarSimulationCrew()
        
        # Use API key (default GROQ_API_KEY)
        api_key = get_api_key_for_crew()

        try:
            with set_groq_api_key(api_key):
                result = run_with_rate_limit_retry(
                    lambda: crew.crew().kickoff(inputs=inputs),
                    max_retries=10,
                    base_wait=15.0,
                )

            self.execution_time = datetime.now() - start_time
            self.results = result

            if self.verbose:
                print(f"[OK] War Simulation completed in {self.execution_time}")

            return result
        except DailyRateLimitError as e:
            if self.verbose:
                print(str(e))
            raise


# ==========================================================
# SINGLETON ACCESSOR
# ==========================================================
_orchestrator: Optional[CrewOrchestrator] = None


def get_orchestrator(verbose: bool = True) -> CrewOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = CrewOrchestrator(verbose=verbose)
    return _orchestrator
