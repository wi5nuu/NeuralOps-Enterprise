from typing import List, Optional
import math


def embed_text(text: str) -> List[float]:
    # Simple hash-based embedding for demo purposes
    import hashlib
    h = hashlib.md5(text.encode()).hexdigest()
    return [int(h[i:i+2], 16) / 255.0 for i in range(0, 32, 2)]


def embed_batch(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    return [embed_text(t) for t in texts]


def cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x*y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x*x for x in a))
    norm_b = math.sqrt(sum(x*x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
