import httpx
import os
from typing import List, Dict
from .base import BaseLLMProvider


class OllamaProvider(BaseLLMProvider):
    def __init__(self, model: str, api_key: str = None):
        self.model = model
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    async def chat(self, messages: List[Dict], system_prompt: str) -> str:
        try:
            formatted_messages = [{"role": "system", "content": system_prompt}]
            for msg in messages:
                formatted_messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": formatted_messages,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data["message"]["content"]
        except httpx.ConnectError:
            raise Exception(
                f"Ollama 서버({self.base_url})에 연결할 수 없습니다. "
                "Ollama가 실행 중인지 확인해주세요."
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise Exception(
                    f"Ollama 모델 '{self.model}'을 찾을 수 없습니다. "
                    f"터미널에서 'ollama pull {self.model}'을 실행해주세요."
                )
            raise Exception(f"Ollama API 오류 (HTTP {e.response.status_code}): {e.response.text}")
        except Exception as e:
            raise Exception(f"Ollama API error: {str(e)}")

    def get_model_list(self) -> List[str]:
        return ["llama3", "mistral", "gemma3"]
