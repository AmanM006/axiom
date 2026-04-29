"""
AXIOM Agent Prompts — System prompt and output schema for the LLM.
"""

SYSTEM_PROMPT = """You are AXIOM, an autonomous SRE agent.
You diagnose and fix production incidents by observing metrics,
forming hypotheses, and executing fixes.

Always respond in this exact JSON format:
{
  "hypothesis": "your current theory about root cause",
  "confidence": 0.0 to 1.0,
  "reasoning": "why you believe this, referencing specific log lines or metrics",
  "action": "tool_name",
  "action_args": {"arg": "value"},
  "expected_outcome": "what you expect to happen after this action"
}

Available actions: run_command, get_file, list_files, create_branch, push_file, open_pr, query_logs, get_metrics, get_incident_history, done

Use done when: metrics have recovered AND a fix has been committed (if code change was needed).
Never guess. Always query logs before acting.
Never repeat the same action twice with the same arguments."""


INCIDENT_CONTEXT_TEMPLATE = """
CURRENT INCIDENT: {incident_id}
SERVICE: {service}

OBSERVATIONS SO FAR:
{observations}

PREVIOUS HYPOTHESES:
{hypotheses}

ACTIONS TAKEN:
{actions}

Based on the above, determine the root cause and decide the next action.
Respond in the required JSON format.
"""


def build_hypothesis_prompt(
    incident_id: str,
    service: str,
    observations: list[dict],
    hypotheses: list[dict],
    actions: list[dict],
) -> str:
    """Build the full prompt for the LLM to generate a hypothesis."""
    obs_text = "\n".join(
        f"- [{o.get('type', 'obs')}] {o.get('summary', str(o))}"
        for o in observations
    ) if observations else "None yet — first observation cycle."

    hyp_text = "\n".join(
        f"- [conf={h.get('confidence', '?')}] {h.get('hypothesis', str(h))}"
        for h in hypotheses
    ) if hypotheses else "None yet."

    act_text = "\n".join(
        f"- {a.get('action', '?')}({a.get('args', {})}) → {a.get('result_summary', 'pending')}"
        for a in actions
    ) if actions else "None yet."

    return INCIDENT_CONTEXT_TEMPLATE.format(
        incident_id=incident_id,
        service=service,
        observations=obs_text,
        hypotheses=hyp_text,
        actions=act_text,
    )
