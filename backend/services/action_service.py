import json
from typing import Optional, Dict, List
from models.database import Action


def build_action_prompt(actions: List[Action]) -> str:
    """Build action detection instructions for the system prompt."""
    if not actions:
        return ""

    active_actions = [a for a in actions if a.is_active]
    if not active_actions:
        return ""

    action_descriptions = []
    for action in active_actions:
        keywords = action.trigger_keywords.split(",") if action.trigger_keywords else []
        keywords_str = ", ".join([k.strip() for k in keywords if k.strip()])
        action_descriptions.append(
            f"- Action '{action.name}' (type: {action.action_type}, id: {action.id}): "
            f"trigger keywords: [{keywords_str}]. {action.description}"
        )

    actions_text = "\n".join(action_descriptions)

    return f"""

You have the following actions available:
{actions_text}

IMPORTANT: When the user's intent matches any action's trigger keywords or description,
you MUST include an action JSON block at the END of your response in this exact format:

[ACTION]{{"action_type": "ACTION_TYPE", "action_id": ACTION_ID, "action_name": "ACTION_NAME", "data": {{}}}}[/ACTION]

For SHOW_FORM actions, include any pre-filled data the user mentioned.
For SHOW_GUIDE actions, include the guide content in data.
For REDIRECT actions, include the URL in data.
For NOTIFY actions, include the notification message in data.

Only trigger an action when the user's intent clearly matches. Always provide a helpful text response before the action block.
"""


def parse_action_from_response(response: str) -> tuple:
    """Parse action data from LLM response. Returns (clean_text, action_data)."""
    action_data = None
    clean_text = response

    if "[ACTION]" in response and "[/ACTION]" in response:
        start = response.index("[ACTION]")
        end = response.index("[/ACTION]") + len("[/ACTION]")
        action_str = response[start + len("[ACTION]"):response.index("[/ACTION]")]

        try:
            action_data = json.loads(action_str.strip())
        except json.JSONDecodeError:
            pass

        clean_text = response[:start].strip()
        remaining = response[end:].strip()
        if remaining:
            clean_text += "\n" + remaining

    return clean_text, action_data
