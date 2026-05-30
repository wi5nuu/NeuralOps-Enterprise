from celery_app import celery_app
from celery import chord
from typing import Optional
import json


@celery_app.task(bind=True, max_retries=3)
def export_conversation_task(self, conversation_id: str, format: str = "markdown"):
    try:
        from sqlalchemy import create_engine, select
        from sqlalchemy.orm import Session
        from models.conversation import Conversation, Message
        from services.export_service import export_conversation_markdown, export_conversation_json
        from config import settings

        engine = create_engine(settings.database_url.replace("+asyncpg", ""))
        with Session(engine) as session:
            conv = session.execute(select(Conversation).where(Conversation.id == conversation_id)).scalar_one_or_none()
            if not conv:
                return {"status": "error", "message": "Conversation not found"}

            msgs = session.execute(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)).scalars().all()

            if format == "markdown":
                content = export_conversation_markdown(conv, list(msgs))
                mime = "text/markdown"
            else:
                content = export_conversation_json(conv, list(msgs))
                mime = "application/json"

            return {"status": "success", "content": content, "mime_type": mime, "filename": f"{conv.title}.{'md' if format == 'markdown' else 'json'}"}
    except Exception as exc:
        raise self.retry(exc=exc)
