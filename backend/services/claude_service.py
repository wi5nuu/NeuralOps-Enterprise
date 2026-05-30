import os
import json
from typing import Optional, AsyncGenerator
from anthropic import AsyncAnthropic
from config import settings

client: Optional[AsyncAnthropic] = None

if settings.anthropic_api_key:
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)


async def stream_chat(
    model_id: str,
    messages: list,
    system_prompt: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> AsyncGenerator[str, None]:
    if not client:
        yield json.dumps({"type": "error", "content": "Anthropic API key not configured"})
        return

    kwargs = {
        "model": model_id,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": True,
    }
    if system_prompt:
        kwargs["system"] = system_prompt

    try:
        async with client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield json.dumps({"type": "chunk", "content": text})
    except Exception as e:
        yield json.dumps({"type": "error", "content": str(e)})


async def chat_sync(
    model_id: str,
    messages: list,
    system_prompt: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> dict:
    if not client:
        return {"content": "", "tokens": 0}

    kwargs = {
        "model": model_id,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if system_prompt:
        kwargs["system"] = system_prompt

    try:
        response = await client.messages.create(**kwargs)
        input_tokens = response.usage.input_tokens if response.usage else 0
        output_tokens = response.usage.output_tokens if response.usage else 0
        content = ""
        for block in response.content:
            if hasattr(block, "text"):
                content += block.text
        return {"content": content, "input_tokens": input_tokens, "output_tokens": output_tokens}
    except Exception as e:
        return {"content": f"Error: {str(e)}", "input_tokens": 0, "output_tokens": 0}


def estimate_cost(input_tokens: int, output_tokens: int, model_id: str) -> float:
    rates = {
        "claude-3-opus-20240229": {"input": 15.0, "output": 75.0},
        "claude-3-sonnet-20240229": {"input": 3.0, "output": 15.0},
        "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25},
    }
    rate = rates.get(model_id, rates["claude-3-haiku-20240307"])
    return (input_tokens / 1_000_000 * rate["input"]) + (output_tokens / 1_000_000 * rate["output"])
