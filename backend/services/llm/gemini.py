import google.generativeai as genai
from typing import List, Dict
from .base import BaseLLMProvider


class GeminiProvider(BaseLLMProvider):
    def __init__(self, model: str, api_key: str = None):
        self.model_name = model
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)

    async def chat(self, messages: List[Dict], system_prompt: str) -> str:
        try:
            history = []
            last_user_msg = ""

            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                if msg == messages[-1] and role == "user":
                    last_user_msg = msg["content"]
                else:
                    history.append({"role": role, "parts": [msg["content"]]})

            chat = self.model.start_chat(history=history)

            prompt = f"System instruction: {system_prompt}\n\nUser: {last_user_msg}"
            response = chat.send_message(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")

    def get_model_list(self) -> List[str]:
        return ["gemini-1.5-pro", "gemini-1.5-flash"]
