import re
import time
from typing import Callable, Any, Dict, Tuple


class DailyRateLimitError(Exception):
    """Exception raised when daily rate limit is exceeded."""
    
    def __init__(self, message: str, limit: int = None, used: int = None, reset_info: str = None):
        self.limit = limit
        self.used = used
        self.reset_info = reset_info
        super().__init__(message)


def _parse_retry_seconds(msg: str) -> float | None:
    # Look for phrases like 'Please try again in 13.8 seconds'
    m = re.search(r"try again in\s*([0-9]+(?:\.[0-9]+)?)\s*seconds", msg, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1))
        except Exception:
            return None
    return None


def _is_daily_limit(msg: str) -> Tuple[bool, Dict[str, Any]]:
    """Check if error is due to daily token limit (TPD - Tokens Per Day).
    
    Returns:
        (is_daily_limit, info_dict) where info_dict contains limit, used, reset_info if available
    """
    # Check for TPD (Tokens Per Day) indicators
    tpd_patterns = [
        r'tokens per day.*?\(TPD\)',
        r'TPD.*?Limit\s+(\d+)',
        r'Limit\s+(\d+).*?Used\s+(\d+)',
    ]
    
    info = {}
    
    # Check for TPD mention
    if re.search(r'TPD|tokens per day', msg, re.IGNORECASE):
        # Try to extract limit and used values
        limit_match = re.search(r'Limit\s+(\d+(?:,\d+)*)', msg, re.IGNORECASE)
        used_match = re.search(r'Used\s+(\d+(?:,\d+)*)', msg, re.IGNORECASE)
        
        if limit_match:
            try:
                info['limit'] = int(limit_match.group(1).replace(',', ''))
            except (ValueError, AttributeError):
                pass
        
        if used_match:
            try:
                info['used'] = int(used_match.group(1).replace(',', ''))
            except (ValueError, AttributeError):
                pass
        
        # Extract reset info if available
        reset_match = re.search(r'try again in.*?(\d+[ms]?)', msg, re.IGNORECASE)
        if reset_match:
            info['reset_info'] = reset_match.group(0)
        
        return True, info
    
    return False, info


def run_with_rate_limit_retry(func: Callable[..., Any], *args, max_retries: int = 5, base_wait: float = 5.0, **kwargs) -> Any:
    """Run `func(*args, **kwargs)` and retry on rate-limit errors (429 or messages containing TPM/Rate limit).

    Behavior:
    - Detects daily limits (TPD) and fails fast with clear error message
    - For temporary limits, retries with exponential backoff
    - If an exception message contains a suggested wait (e.g. 'Please try again in 13.8 seconds'), sleeps that long
    - Otherwise, uses exponential backoff: base_wait * (2 ** attempt)
    - Raises the last exception if retries exhausted
    
    Raises:
        DailyRateLimitError: If daily token limit is detected (does not retry)
        Original Exception: For non-rate-limit errors or after retries exhausted
    """
    attempt = 0
    while True:
        try:
            return func(*args, **kwargs)
        except Exception as e:
            msg = str(e)
            
            # Check if it's a rate limit error
            is_rate = False
            if '429' in msg or 'Rate limit' in msg or 'TPM limit' in msg or 'Too Many Requests' in msg or 'rate_limit_exceeded' in msg:
                is_rate = True

            if not is_rate:
                raise

            # Check for daily limit (TPD) - fail fast, don't retry
            is_daily, daily_info = _is_daily_limit(msg)
            if is_daily:
                limit = daily_info.get('limit')
                used = daily_info.get('used')
                reset_info = daily_info.get('reset_info', 'midnight UTC (check Groq console for exact time)')
                
                error_msg = (
                    f"\n{'='*80}\n"
                    f"DAILY TOKEN LIMIT EXCEEDED\n"
                    f"{'='*80}\n"
                    f"The Groq API daily token limit has been reached.\n"
                )
                if limit and used:
                    error_msg += f"Limit: {limit:,} tokens/day | Used: {used:,} tokens ({used/limit*100:.1f}%)\n"
                error_msg += (
                    f"\nThis is a DAILY limit that resets at {reset_info}.\n"
                    f"Retrying will not help until the limit resets.\n\n"
                    f"Solutions:\n"
                    f"  1. Wait for the daily limit to reset (usually midnight UTC)\n"
                    f"  2. Upgrade your Groq plan: https://console.groq.com/settings/billing\n"
                    f"  3. Use a different API key with available quota\n"
                    f"  4. Switch to a different LLM provider\n"
                    f"{'='*80}\n"
                )
                raise DailyRateLimitError(error_msg, limit=limit, used=used, reset_info=reset_info)

            # For temporary rate limits, retry with backoff
            attempt += 1
            if attempt > max_retries:
                raise

            # Try parse suggested wait first - respect API's suggested wait time
            parsed = _parse_retry_seconds(msg)
            if parsed and parsed > 0:
                # Use the API's suggested wait time + small buffer
                wait = max(parsed + 2.0, 10.0)  # At least 10 seconds, or API suggestion + 2s
                print(f"[RETRY] Rate limit hit (TPM). API suggests waiting {parsed:.1f}s. Waiting {wait:.1f}s before retry {attempt}/{max_retries}...")
            else:
                # Exponential backoff for TPM limits: 15s, 30s, 60s
                wait = min(15.0 * (2 ** (attempt - 1)), 60.0)
                print(f"[RETRY] Rate limit hit (TPM). Waiting {wait:.1f}s before retry {attempt}/{max_retries}...")

            time.sleep(wait)
