#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import warnings
import io

# Set UTF-8 encoding for Windows console compatibility
if sys.platform == "win32":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except (AttributeError, ValueError):
        pass

from war_simulation_agent.orchestrator import get_orchestrator

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

"""
MAIN ENTRY POINT FOR THE WAR SIMULATION ENGINE

Runs the Unified War Simulation Crew (combines War Simulation and GTM Hijacker)
"""

import argparse


def run():
    parser = argparse.ArgumentParser(description="Run the war simulation crew")
    parser.add_argument("--company", type=str, help="Focal company name (e.g. Samsung)")
    parser.add_argument(
        "--competitors",
        type=str,
        help="Comma-separated list of exactly 3 competitors (e.g. Apple,Xiaomi,OnePlus)",
    )
    parser.add_argument("--market", type=str, default="india", help="Market segment")

    args = parser.parse_args()

    # Interactive prompts if arguments missing
    company = args.company
    if not company:
        company = input("Enter the focal company name: ").strip()

    competitors = []
    if args.competitors:
        competitors = [c.strip() for c in args.competitors.split(",") if c.strip()]

    while len(competitors) != 3:
        print("Please provide exactly 3 competitors (comma-separated). Example: Apple,Xiaomi,OnePlus")
        raw = input("Enter 3 competitors: ").strip()
        competitors = [c.strip() for c in raw.split(",") if c.strip()]

    competitive_scenario = (
        f"A key competitor announces an 8% price cut in the market. Simulate {company}'s optimal response "
        "across pricing, product strategy, and go-to-market execution."
    )

    orchestrator = get_orchestrator(verbose=True)

    orchestrator.run(
        competitive_scenario=competitive_scenario,
        competitors=competitors,
        market_segment=args.market,
        company=company,
    )

    # ✅ IMPORTANT: Explicit clean exit
    sys.exit(0)

