from .crew import OrganizationFeedbackCrew
import os
from dotenv import load_dotenv


def run():
    # Load environment variables from .env file
    load_dotenv()

    # Set SERPER_API_KEY if not already set
    if not os.getenv("SERPER_API_KEY"):
        os.environ["SERPER_API_KEY"] = "68d789ab1509004b741f7b8aabd9cf82a8dbe0cc"

    print("=== Organization Feedback Intelligence Crew ===\n")
    print("✅ Using Serper API to fetch REAL online data (no hallucination)\n")

    # Validate required environment variables
    if not os.getenv("SERPER_API_KEY"):
        print("❌ SERPER_API_KEY not found.")
        print("👉 Please add SERPER_API_KEY to your .env file.")
        return

    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY not found.")
        print("👉 Please add your Groq/OpenAI-compatible key as OPENAI_API_KEY in .env.")
        return

    # Get company name from user
    company_name = input("Enter your company name: ").strip()

    if not company_name:
        print("❌ Company name cannot be empty.")
        return

    print(f"\n🔍 Analyzing feedback for company: {company_name}\n")

    # Initialize crew
    crew_instance = OrganizationFeedbackCrew()

    # Run the crew with dynamic inputs - CrewAI will replace {{ company_name }} in YAML files
    result = crew_instance.crew().kickoff(
        inputs={"company_name": company_name}
    )

    # Display final output
    print("\n=== FINAL ORGANIZATION FEEDBACK REPORT ===\n")
    print(result)


if __name__ == "__main__":
    run()
