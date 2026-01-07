from customer.crew import build_customer_crew

def run():
    print("\n🧠 CUSTOMER INTELLIGENCE CREW\n")

    company = input("Enter YOUR company name: ")
    competitors = input("Enter competitor names (comma separated): ")

    crew = build_customer_crew(company, competitors)
    result = crew.kickoff()

    print("\n📊 CUSTOMER PAIN & FEATURE GAP REPORT\n")
    print(result)

if __name__ == "__main__":
    run()
