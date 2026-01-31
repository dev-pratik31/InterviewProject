"""
LLM Provider

Unified interface for OpenAI and Anthropic LLM providers.
Supports both chat completion and structured output.
"""

from typing import Any, Optional, Type
from abc import ABC, abstractmethod

from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings


class LLMProvider(ABC):
    """Abstract base for LLM providers."""
    
    @abstractmethod
    async def generate(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Generate text completion."""
        pass
    
    @abstractmethod
    async def generate_structured(
        self,
        messages: list[dict],
        response_model: Type[BaseModel],
        temperature: float = 0.3,
    ) -> BaseModel:
        """Generate structured output matching Pydantic model."""
        pass


class OpenAIProvider(LLMProvider):
    """OpenAI LLM provider."""
    
    def __init__(self):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.llm_model
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def generate(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def generate_structured(
        self,
        messages: list[dict],
        response_model: Type[BaseModel],
        temperature: float = 0.3,
    ) -> BaseModel:
        """Generate structured output using function calling."""
        import json
        
        # Create function schema from Pydantic model
        schema = response_model.model_json_schema()
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            tools=[{
                "type": "function",
                "function": {
                    "name": "structured_output",
                    "description": f"Output structured data as {response_model.__name__}",
                    "parameters": schema
                }
            }],
            tool_choice={"type": "function", "function": {"name": "structured_output"}}
        )
        
        tool_call = response.choices[0].message.tool_calls[0]
        data = json.loads(tool_call.function.arguments)
        return response_model(**data)


class AnthropicProvider(LLMProvider):
    """Anthropic Claude LLM provider."""
    
    def __init__(self):
        from anthropic import AsyncAnthropic
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.llm_model if "claude" in settings.llm_model else "claude-3-sonnet-20240229"
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def generate(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        # Convert OpenAI format to Anthropic format
        system_msg = None
        chat_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_msg = msg["content"]
            else:
                chat_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system_msg or "",
            messages=chat_messages,
        )
        return response.content[0].text
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def generate_structured(
        self,
        messages: list[dict],
        response_model: Type[BaseModel],
        temperature: float = 0.3,
    ) -> BaseModel:
        """Generate structured output using Claude's tool use."""
        import json
        
        system_msg = None
        chat_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_msg = msg["content"]
            else:
                chat_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        schema = response_model.model_json_schema()
        
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            system=system_msg or "",
            messages=chat_messages,
            tools=[{
                "name": "structured_output",
                "description": f"Output structured data as {response_model.__name__}",
                "input_schema": schema
            }],
            tool_choice={"type": "tool", "name": "structured_output"}
        )
        
        # Extract tool use result
        for block in response.content:
            if block.type == "tool_use":
                return response_model(**block.input)
        
        raise ValueError("No structured output returned")


def get_llm_provider() -> LLMProvider:
    """Factory function to get configured LLM provider."""
    if settings.llm_provider == "openai":
        return OpenAIProvider()
    elif settings.llm_provider == "anthropic":
        return AnthropicProvider()
    else:
        raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")


# Singleton instance
_provider: Optional[LLMProvider] = None


def get_provider() -> LLMProvider:
    """Get or create singleton LLM provider."""
    global _provider
    if _provider is None:
        _provider = get_llm_provider()
    return _provider
