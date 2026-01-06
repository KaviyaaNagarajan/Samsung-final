# 🧠 Digital Twin Crew  
**AI-Powered Competitor Intelligence System**

A multi-agent AI system that builds **live Digital Twins of competitor companies** using real-time web data and reasoning models.  
It predicts **roadmaps, pricing strategies, and product launch timelines** for any company.

---

## 🚀 What This Project Does

Given one or more company names, the system creates a **Digital Twin** for each and predicts:

| Intelligence Layer | What it predicts |
|-------------------|-----------------|
| 🧠 Behavior Modeler | How the company reacts to competition |
| 🧭 Roadmap Predictor | Upcoming products & features |
| 💰 Pricing Predictor | Price cuts, hikes, discount windows |
| 🚀 Launch Engine | Product launch timelines & probabilities |

All predictions are grounded in **live Google search data** via **Serper** and reasoned using **Groq LLMs**.

---

## 🧩 Architecture

User Input (Companies)
↓
Serper (Google Search API)
↓
Behavior Modeler
↓
Roadmap Predictor
↓
Pricing Predictor
↓
Launch Probability Engine
↓
📊 Digital Twin Output



Each company gets its own **independent AI twin**.





## 🔑 Setup

### Add API Keys

Create a `.env` file inside the `twin/` folder:

```env
GROQ_API_KEY=your_groq_key_here
SERPER_API_KEY=your_serper_key_here

GROQ_API_BASE=https://api.groq.com/openai/v1
GROQ_MODEL_NAME=llama-3.1-8b-instant

Install Dependencies
From inside the twin/ directory:
crewai install


▶️ Run the Digital Twin
crewai run



You will be prompted:

Enter company names (comma separated):
Example:

Samsung, Apple, Xiaomi, Google

The system will generate a Digital Twin for each company with roadmap, pricing, and launch predictions.

