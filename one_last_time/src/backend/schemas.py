from pydantic import BaseModel
from typing import List, Optional

class WarSimulationRequest(BaseModel):
    our_company: str
    competitors: List[str]
    market_segment: Optional[str] = "india"
