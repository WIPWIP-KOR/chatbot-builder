import openai
from typing import List, Dict
from .base import BaseLLMProvider


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, model: str, api_key: str = None):
        self.model = model
        self.client = openai.OpenAI(api_key=api_key)

    async def chat(self, messages: List[Dict], system_prompt: str) -> str:
        try:
            formatted_messages = [{"role": "system", "content": system_prompt}]
            for msg in messages:
                formatted_messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

            response = self.client.chat.completions.create(
                model=self.model,
                messages=formatted_messages,
                max_tokens=4096,
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    def get_model_list(self) -> List[str]:
        return ["gpt-4o", "gpt-4o-mini"]
