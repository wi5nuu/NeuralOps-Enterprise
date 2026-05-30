from typing import Optional
import tiktoken


def count_tokens(text: str, model: str = "claude-3-haiku-20240307") -> int:
    try:
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        return len(encoding.encode(text))
    except Exception:
        return int(len(text) / 4) + 1


def truncate_text(text: str, max_tokens: int, model: str = "claude-3-haiku-20240307") -> str:
    try:
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        tokens = encoding.encode(text)
        if len(tokens) <= max_tokens:
            return text
        return encoding.decode(tokens[:max_tokens])
    except Exception:
        words = text.split()
        max_words = max_tokens * 3
        if len(words) <= max_words:
            return text
        return " ".join(words[:max_words])
