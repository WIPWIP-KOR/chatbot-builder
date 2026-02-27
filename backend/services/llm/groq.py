import openai
from typing import List, Dict
from .base import BaseLLMProvider


class GroqProvider(BaseLLMProvider):
    def __init__(self, model: str, api_key: str = None):
        self.model = model
        self.client = openai.OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )

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
            raise Exception(f"Groq API error: {str(e)}")

    def get_model_list(self) -> List[str]:
        return ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"]
