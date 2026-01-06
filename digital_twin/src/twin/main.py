from twin.crew import build_twin_crew


def run():
    print("🧠 Digital Twin Crew Started")

    companies_input = input("Enter competitor names (comma separated): ")

    companies = [c.strip() for c in companies_input.split(",") if c.strip()]

    all_results = {}

    for company in companies:
        print(f"\n🚀 Running Digital Twin for: {company}")
        crew = build_twin_crew(company)
        result = crew.kickoff()
        all_results[company] = result

    print("\n================ MULTI-COMPANY DIGITAL TWIN OUTPUT ================\n")

    for company, result in all_results.items():
        print(f"\n{'='*50}")
        print(f"🏢 {company.upper()} DIGITAL TWIN")
        print(f"{'='*50}\n")
        print(result)


# Allows: python src/twin/main.py Samsung Apple Xiaomi
if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        companies = sys.argv[1:]
        for company in companies:
            print(f"\n🚀 Running Digital Twin for: {company}")
            crew = build_twin_crew(company)
            print(crew.kickoff())
    else:
        run()
