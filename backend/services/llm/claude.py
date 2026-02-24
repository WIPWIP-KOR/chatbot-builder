import anthropic
from typing import List, Dict
from .base import BaseLLMProvider


class ClaudeProvider(BaseLLMProvider):
    def __init__(self, model: str, api_key: str = None):
        self.model = model
        self.client = anthropic.Anthropic(api_key=api_key)

    async def chat(self, messages: List[Dict], system_prompt: str) -> str:
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=system_prompt,
                messages=messages,
            )
            return response.content[0].text
        except Exception as e:
            raise Exception(f"Claude API error: {str(e)}")

    def get_model_list(self) -> List[str]:
        return ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"]
