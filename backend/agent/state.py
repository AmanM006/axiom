"""
AXIOM Agent State — dataclass holding all agent loop state.
"""

from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass
class AgentState:
    incident_id: str = ""
    service: str = ""
    observations: list[dict[str, Any]] = field(default_factory=list)
    hypotheses: list[dict[str, Any]] = field(default_factory=list)
    actions_taken: list[dict[str, Any]] = field(default_factory=list)
    current_hypothesis: dict[str, Any] = field(default_factory=dict)
    verify_attempts: int = 0
    resolved: bool = False
    resolution_summary: str = ""
    total_reward: float = 0.0
    step: int = 0
    stream_callback: Callable[..., Any] | None = None
    initial_metrics: dict[str, Any] = field(default_factory=dict)
    original_file_content: str = ""
    fixed_file_content: str = ""
    branch_name: str = ""
    config: dict[str, Any] = field(default_factory=dict)
    use_fallback: bool = False  # Set True when LLM is stuck; forces deterministic plan
    report: dict[str, Any] = field(default_factory=dict)
