from typing import List
from models.conversation import Conversation, Message
from datetime import datetime, timezone
import json


def export_conversation_markdown(conversation: Conversation, messages: List[Message]) -> str:
    lines = []
    lines.append(f"# {conversation.title}")
    lines.append(f"Exported: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    lines.append(f"Model: {conversation.model_id}")
    lines.append("")
    lines.append("---")
    lines.append("")

    for msg in messages:
        role_icon = "👤" if msg.role == "user" else "🤖"
        lines.append(f"### {role_icon} {msg.role.title()}")
        lines.append("")
        lines.append(msg.content)
        lines.append("")

    return "\n".join(lines)


def export_conversation_json(conversation: Conversation, messages: List[Message]) -> str:
    data = {
        "title": conversation.title,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "model_id": conversation.model_id,
        "system_prompt": conversation.system_prompt,
        "temperature": conversation.temperature,
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            }
            for msg in messages
        ],
    }
    return json.dumps(data, indent=2, default=str)
