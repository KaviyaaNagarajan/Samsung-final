# War Simulation Agent

This repository contains a small Crew AI-based war simulation agent.

## Prerequisites
- Python 3.10 or newer
- Git

## Quick start (Windows)

1. Clone the repository (if you haven't already):

```powershell
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

2. Create and activate a virtual environment:

```powershell
python -m venv venv
# PowerShell (recommended):
venv\Scripts\Activate.ps1
# Or classic cmd:
venv\Scripts\activate.bat
```

3. Install dependencies (from `pyproject.toml`):

Using pip (editable install):

```powershell
python -m pip install --upgrade pip
pip install -e .
```

Or with Poetry/Hatch if you prefer (optional):

```powershell
# If using hatch (project uses hatchling):
hatch env create
hatch run pip install -e .
```

4. Set up secrets / API keys

- Do NOT commit secrets. The repository includes a `setup_keys.ps1` helper — keep it local and add it to `.gitignore`.
- Example environment variables (PowerShell):

```powershell
$env:GROQ_API_KEY = "your-groq-key"
# Or store in a secure place (Windows Credential Manager, .env file excluded from VCS, or CI secrets)
```

5. Ensure sensitive files are ignored by git

Add the following to `.gitignore` (already included):

- `setup_keys.ps1`
- `uv.lock`
- `.env`

6. Run the agent

The repository exposes a small CLI / module. From the project root run:

```powershell
python -m src.war_simulation_agent.main
# or
python -m war_simulation_agent.main
```

Replace the module path above if your environment uses editable installs differently.

7. Tests / quick check

If there are no formal tests, run the main file or a simple script to confirm the environment:

```powershell
python -c "import war_simulation_agent; print('OK', war_simulation_agent.__version__ if hasattr(war_simulation_agent,'__version__') else '')"
```

## Removing accidentally committed secrets

If a secret was already pushed (GitHub push protection will block pushes), you must remove it from the repository history before pushing again. Two common options:

- BFG Repo-Cleaner (recommended for ease):

```powershell
# Download the BFG jar, then:
java -jar bfg.jar --delete-files setup_keys.ps1
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

- git filter-branch (built-in, more manual):

```powershell
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch setup_keys.ps1 uv.lock" --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

Notes:
- Rewriting history requires a forced push and will affect all collaborators — coordinate first.
- After removing the secret, rotate any exposed keys immediately.

## Additional notes
- The project depends on `crewai[tools]==1.7.1` and `litellm>=1.0.0` (see `pyproject.toml`).
- If GitHub push protection flags a secret, follow the unblock URL shown in the push output or remove the secret as described above.

---

If you want, I can:

- run the history-clean steps here to remove `setup_keys.ps1` from commits (will rewrite history), or
- produce a small `scripts/cleanup.sh` (or PowerShell) you can run locally. Which do you prefer?
# War Simulation Agent

Samsung War Simulation Engine - Unified Crew

## Overview

This project contains a unified war simulation crew that combines:

- **War Simulation** - Simulates competitive moves, market impacts, and risk scenarios
- **GTM Hijacker** - Analyzes competitor ads, landing pages, and conversion funnels

All agents work together in a single execution to provide comprehensive competitive intelligence.

## Quick Start

### 1. Setup API Keys

Run the setup script (recommended):
```powershell
.\setup_keys.ps1
```

Or set manually:
```powershell
$env:GROQ_API_KEY="your_key_here"
$env:MODEL="groq/llama-3.1-70b-versatile"
```

### 2. Run

**Run the unified crew:**
```powershell
crewai run
```

Or using Python directly:
```powershell
python -m war_simulation_agent.main run
```

## Configuration

### API Keys

Set the `GROQ_API_KEY` environment variable. The system uses a single API key for all operations.

### Rate Limits

The system includes automatic retry logic for rate limits:
- **TPM (Tokens Per Minute)** limits: Automatic retry with exponential backoff
- **TPD (Tokens Per Day)** limits: Fails fast with clear error message

## Project Structure

```
war_simulation_agent/
├── src/war_simulation_agent/
│   ├── crews/
│   │   └── unified_crew.py          # Unified crew (combines all agents)
│   ├── config/
│   │   ├── agents.yaml              # All agent configs
│   │   └── tasks.yaml               # All task configs
│   ├── main.py                      # Entry point
│   ├── orchestrator.py              # Orchestrates the crew
│   ├── retry_utils.py               # Rate limit handling
│   └── api_key_manager.py           # API key management
├── setup_keys.ps1                   # API key setup script
└── README.md
```

## Output

The unified crew produces structured results (returned by the crew) combining:
- Competitive game theory simulations
- Market impact analysis
- Risk assessment
- Ad intelligence
- Landing page analysis
- Conversion optimization recommendations

Note: File-based reports are not created by default; enable them explicitly if needed.
