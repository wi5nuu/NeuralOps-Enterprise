from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.user import User
from models.rag_collection import RAGCollection
from models.document import Document, DocumentStatusEnum
from models.chunk import Chunk
from schemas.rag import RAGCollectionResponse, RAGCollectionCreateRequest, RAGCollectionUpdateRequest, DocumentResponse, QueryRequest, QueryResponse, ChunkResponse
from dependencies import get_current_user
from services.rag_service import rag_service
from utils.validators import is_allowed_file, validate_file_size, get_file_type
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.get("/collections", response_model=List[RAGCollectionResponse])
async def list_collections(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(RAGCollection).where(RAGCollection.org_id == current_user.org_id).order_by(RAGCollection.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collections", response_model=RAGCollectionResponse, status_code=201)
async def create_collection(req: RAGCollectionCreateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        collection = RAGCollection(
            id=str(uuid.uuid4()),
            org_id=current_user.org_id,
            name=req.name,
            description=req.description,
            chunk_size=req.chunk_size,
            chunk_overlap=req.chunk_overlap,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(collection)
        await db.commit()
        await db.refresh(collection)
        return collection
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collections/{collection_id}", response_model=RAGCollectionResponse)
async def get_collection(collection_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(RAGCollection).where(RAGCollection.id == collection_id, RAGCollection.org_id == current_user.org_id)
        result = await db.execute(stmt)
        collection = result.scalar_one_or_none()
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")

        doc_stmt = select(func.count(Document.id)).where(Document.collection_id == collection_id)
        doc_result = await db.execute(doc_stmt)
        collection.document_count = doc_result.scalar() or 0

        chunk_stmt = select(func.count(Chunk.id)).where(Chunk.collection_id == collection_id)
        chunk_result = await db.execute(chunk_stmt)
        collection.chunk_count = chunk_result.scalar() or 0

        return collection
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/collections/{collection_id}", response_model=RAGCollectionResponse)
async def update_collection(collection_id: str, req: RAGCollectionUpdateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(RAGCollection).where(RAGCollection.id == collection_id, RAGCollection.org_id == current_user.org_id)
        result = await db.execute(stmt)
        collection = result.scalar_one_or_none()
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")

        if req.name is not None:
            collection.name = req.name
        if req.description is not None:
            collection.description = req.description
        await db.commit()
        await db.refresh(collection)
        return collection
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/collections/{collection_id}", status_code=204)
async def delete_collection(collection_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(RAGCollection).where(RAGCollection.id == collection_id, RAGCollection.org_id == current_user.org_id)
        result = await db.execute(stmt)
        collection = result.scalar_one_or_none()
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")

        rag_service.clear_collection(collection_id)
        await db.delete(collection)
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collections/{collection_id}/documents", response_model=List[DocumentResponse])
async def list_documents(collection_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Document).where(Document.collection_id == collection_id).order_by(Document.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collections/{collection_id}/documents/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(collection_id: str, file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        if not is_allowed_file(file.filename):
            raise HTTPException(status_code=400, detail="File type not supported")

        content = await file.read()
        if not validate_file_size(len(content)):
            raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")

        text_content = content.decode("utf-8", errors="replace")

        document = Document(
            id=str(uuid.uuid4()),
            collection_id=collection_id,
            filename=file.filename,
            file_type=get_file_type(file.filename),
            file_size=len(content),
            status=DocumentStatusEnum.PROCESSING,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(document)
        await db.flush()

        try:
            chunks, _ = await rag_service.process_document(collection_id, document.id, text_content, file.filename)
            for chunk_data in chunks:
                chunk = Chunk(
                    id=str(uuid.uuid4()),
                    collection_id=collection_id,
                    document_id=document.id,
                    content=chunk_data["content"],
                    chunk_index=chunk_data["chunk_index"],
                    token_count=chunk_data["token_count"],
                    created_at=datetime.now(timezone.utc),
                )
                db.add(chunk)

            document.status = DocumentStatusEnum.COMPLETED
            document.chunk_count = len(chunks)
        except Exception as proc_error:
            document.status = DocumentStatusEnum.FAILED
            document.error_message = str(proc_error)

        await db.commit()
        await db.refresh(document)
        return document
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query", response_model=QueryResponse)
async def query_rag(req: QueryRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        sources = await rag_service.search(req.collection_id, req.query, top_k=req.top_k, threshold=req.threshold)
        answer = await rag_service.generate_answer(req.query, sources)

        return QueryResponse(
            answer=answer,
            sources=[ChunkResponse(id=s["id"], content=s["content"], chunk_index=s["chunk_index"], score=s.get("score")) for s in sources],
            tokens_used=0,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
