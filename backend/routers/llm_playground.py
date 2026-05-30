from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.conversation import Conversation
from models.message import Message
from models.prompt_template import PromptTemplate
from schemas.conversation import (
    ConversationResponse, ConversationCreateRequest, SendMessageRequest,
    MessageResponse, MessageStreamResponse
)
from schemas.prompt import PromptTemplateResponse
from dependencies import get_current_user
from services import claude_service
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json
import asyncio


router = APIRouter(prefix="/api/playground", tags=["playground"])


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Conversation).where(Conversation.org_id == current_user.org_id, Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(req: ConversationCreateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        conversation = Conversation(
            id=str(uuid.uuid4()),
            org_id=current_user.org_id,
            user_id=current_user.id,
            title=req.title,
            model_id=req.model_id,
            system_prompt=req.system_prompt,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
            prompt_template_id=req.prompt_template_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        return conversation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.org_id == current_user.org_id)
        result = await db.execute(stmt)
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        msg_stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
        msg_result = await db.execute(msg_stmt)
        conversation.messages = list(msg_result.scalars().all())
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.org_id == current_user.org_id)
        result = await db.execute(stmt)
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        await db.delete(conversation)
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(conversation_id: str, req: SendMessageRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.org_id == current_user.org_id)
        result = await db.execute(stmt)
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        user_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role="user",
            content=req.content,
            created_at=datetime.now(timezone.utc),
        )
        db.add(user_msg)
        await db.flush()

        msg_stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
        msg_result = await db.execute(msg_stmt)
        messages = list(msg_result.scalars().all())

        api_messages = [{"role": m.role, "content": m.content} for m in messages]

        system_prompt = req.system_prompt or conversation.system_prompt
        temperature = req.temperature if req.temperature is not None else conversation.temperature
        max_tokens = req.max_tokens if req.max_tokens is not None else conversation.max_tokens

        start_time = datetime.now(timezone.utc)
        result = await claude_service.chat_sync(
            model_id=conversation.model_id,
            messages=api_messages,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        latency = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000

        assistant_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role="assistant",
            content=result.get("content", ""),
            tokens=(result.get("input_tokens", 0) + result.get("output_tokens", 0)),
            latency_ms=latency,
            created_at=datetime.now(timezone.utc),
        )
        db.add(assistant_msg)
        conversation.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(assistant_msg)
        return assistant_msg
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/stream")
async def stream_message(conversation_id: str, content: str = Query(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from fastapi.responses import StreamingResponse

    try:
        stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.org_id == current_user.org_id)
        result = await db.execute(stmt)
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    async def event_generator():
        try:
            msg_stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
            msg_result = await db.execute(msg_stmt)
            messages = list(msg_result.scalars().all())
            api_messages = [{"role": m.role, "content": m.content} for m in messages]
            api_messages.append({"role": "user", "content": content})

            full_content = ""
            async for chunk in claude_service.stream_chat(
                model_id=conversation.model_id,
                messages=api_messages,
                system_prompt=conversation.system_prompt,
                temperature=conversation.temperature,
                max_tokens=conversation.max_tokens,
            ):
                data = json.loads(chunk)
                if data["type"] == "chunk":
                    full_content += data["content"]
                    yield f"data: {json.dumps({'type': 'chunk', 'content': data['content']})}\n\n"
                elif data["type"] == "error":
                    yield f"data: {json.dumps({'type': 'error', 'content': data['content']})}\n\n"
                    return

            yield f"data: {json.dumps({'type': 'done', 'content': full_content})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/prompts", response_model=List[PromptTemplateResponse])
async def list_prompts(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(PromptTemplate).where(PromptTemplate.org_id == current_user.org_id).order_by(PromptTemplate.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
