"""
ENTRY POINT FOR SAMSUNG WAR SIMULATION ENGINE

This file is the ONLY file that CrewAI executes when you run:
    crewai run

It runs the Unified War Simulation Crew
"""

from war_simulation_agent.orchestrator import get_orchestrator


def crew():
    """
    This function is automatically called by CrewAI.
    It MUST return the result of a crew execution.

    This implementation expects the following environment variables to be set
    when run non-interactively (e.g., via `crewai run`):
      - WARSIM_COMPANY (e.g. Samsung)
      - WARSIM_COMPETITORS (comma-separated list of exactly 3 competitors)

    If those variables are not set, this function will raise a helpful error so
    the user can run the simulation with explicit inputs via `main.py`.
    """

    import os

    orchestrator = get_orchestrator(verbose=True)

    company = os.environ.get("WARSIM_COMPANY")
    competitors_raw = os.environ.get("WARSIM_COMPETITORS")

    if not company or not competitors_raw:
        raise RuntimeError(
            "WARSIM_COMPANY and WARSIM_COMPETITORS must be set to run non-interactively. "
            "Example: set WARSIM_COMPANY=AcmeCorp and WARSIM_COMPETITORS=Alpha,Beta,Gamma or run `python -m war_simulation_agent.main` to provide inputs interactively."
        )

    competitors = [c.strip() for c in competitors_raw.split(",") if c.strip()]
    if len(competitors) != 3:
        raise RuntimeError("WARSIM_COMPETITORS must contain exactly 3 competitor names, comma-separated.")

    competitive_scenario = (
        "A key competitor announces an 8% price cut in the market. "
        f"Simulate {company}'s optimal competitive response across pricing, product strategy, and go-to-market execution."
    )

    return orchestrator.run(
        competitive_scenario=competitive_scenario,
        competitors=competitors,
        market_segment="india",
        company=company,
    )
