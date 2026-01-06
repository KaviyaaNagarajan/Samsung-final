"""
API Key Manager for Multi-Key Support

Allows different crews to use different Groq API keys.
"""
import os
from contextlib import contextmanager
from typing import Optional


def get_api_key_for_crew(crew_name: str = "DEFAULT") -> Optional[str]:
    """
    Get API key for the crew.

    Priority:
    1. Crew-specific env var (GROQ_API_KEY_CREW4, GROQ_API_KEY_CREW5, etc.)
    2. Default GROQ_API_KEY
    3. None
    """
    # Try crew-specific key first
    crew_key = os.environ.get(f"GROQ_API_KEY_{crew_name.upper()}")
    if crew_key:
        return crew_key

    # Fall back to default
    return os.environ.get("GROQ_API_KEY")


@contextmanager
def set_groq_api_key(api_key: Optional[str]):
    """
    Context manager to temporarily set GROQ_API_KEY environment variable.
    
    Usage:
        with set_groq_api_key("your-key"):
            # Code that uses GROQ_API_KEY
            pass
    """
    old_key = os.environ.get("GROQ_API_KEY")
    old_model = os.environ.get("MODEL")
    
    try:
        if api_key:
            os.environ["GROQ_API_KEY"] = api_key
        yield
    finally:
        # Restore original values
        if old_key is not None:
            os.environ["GROQ_API_KEY"] = old_key
        elif "GROQ_API_KEY" in os.environ:
            del os.environ["GROQ_API_KEY"]
        
        if old_model is not None:
            os.environ["MODEL"] = old_model
        elif "MODEL" in os.environ:
            del os.environ["MODEL"]

