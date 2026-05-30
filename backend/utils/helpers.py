import uuid
from typing import List


def generate_uuid() -> str:
    return str(uuid.uuid4())


def mask_api_key(key: str) -> str:
    if len(key) <= 8:
        return "***"
    return key[:4] + "..." + key[-4:]


def parse_tags(tags_str: str) -> List[str]:
    if not tags_str:
        return []
    return [t.strip() for t in tags_str.split(",") if t.strip()]


def tags_to_string(tags: List[str]) -> str:
    return ",".join(tags)
