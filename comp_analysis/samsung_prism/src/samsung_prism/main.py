from samsung_prism.crew import SamsungCompetitorIntelligenceCrew


def run():
    print("\n=== COMPETITOR INTELLIGENCE SYSTEM ===\n")

    our_company = input("Enter YOUR company name: ").strip()

    competitors_input = input(
        "Enter competitor names (comma separated): "
    ).strip()

    competitors = [c.strip() for c in competitors_input.split(",") if c.strip()]

    if not our_company or not competitors:
        raise ValueError("Company name and competitors are required")

    inputs = {
        "our_company": our_company,
        "competitors": competitors
    }

    crew = SamsungCompetitorIntelligenceCrew()
    result = crew.crew().kickoff(inputs=inputs)

    print("\n=== FINAL OUTPUT ===\n")
    print(result)


if __name__ == "__main__":
    run()
