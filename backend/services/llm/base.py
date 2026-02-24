from abc import ABC, abstractmethod
from typing import List, Dict


class BaseLLMProvider(ABC):
    @abstractmethod
    async def chat(self, messages: List[Dict], system_prompt: str) -> str:
        """Send messages and return response text."""
        pass

    @abstractmethod
    def get_model_list(self) -> List[str]:
        """Return list of available models for this provider."""
        pass
