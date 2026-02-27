import os
from .base import BaseLLMProvider
from .claude import ClaudeProvider
from .openai_provider import OpenAIProvider
from .gemini import GeminiProvider
from .ollama import OllamaProvider
from .groq import GroqProvider


def get_llm_provider(provider: str, model: str, api_key: str = None) -> BaseLLMProvider:
    """Create and return the appropriate LLM provider instance."""

    # Use environment variable as fallback if no api_key provided
    env_keys = {
        "claude": "ANTHROPIC_API_KEY",
        "openai": "OPENAI_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "groq": "GROQ_API_KEY",
    }

    if not api_key and provider in env_keys:
        api_key = os.getenv(env_keys[provider])

    providers = {
        "claude": ClaudeProvider,
        "openai": OpenAIProvider,
        "gemini": GeminiProvider,
        "ollama": OllamaProvider,
        "groq": GroqProvider,
    }

    if provider not in providers:
        raise ValueError(f"Unsupported provider: {provider}")

    return providers[provider](model=model, api_key=api_key)
