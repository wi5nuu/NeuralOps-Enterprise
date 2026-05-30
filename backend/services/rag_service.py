from typing import List, Optional, Tuple
from services.embedding_service import embed_text, embed_batch
from services.vector_store import VectorStore
from services import claude_service
from utils.text_splitter import RecursiveTextSplitter
import numpy as np

_rag_collections: dict = {}


class RAGService:
    def __init__(self):
        self.text_splitter = RecursiveTextSplitter(chunk_size=500, chunk_overlap=50)

    async def process_document(
        self,
        collection_id: str,
        document_id: str,
        content: str,
        filename: str,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
    ) -> Tuple[List[dict], List[List[float]]]:
        if chunk_size != 500 or chunk_overlap != 50:
            self.text_splitter = RecursiveTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)

        chunks = self.text_splitter.split_text(content)
        chunk_texts = [c["text"] for c in chunks]
        embeddings = embed_batch(chunk_texts)

        vector_store = _rag_collections.get(collection_id)
        if not vector_store:
            vector_store = VectorStore(collection_id)
            _rag_collections[collection_id] = vector_store

        chunk_records = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            record = {
                "id": f"{document_id}_{i}",
                "document_id": document_id,
                "filename": filename,
                "content": chunk["text"],
                "chunk_index": i,
                "embedding": embedding,
                "token_count": chunk["token_count"],
            }
            chunk_records.append(record)

        vector_store.add_embeddings([r["embedding"] for r in chunk_records], chunk_records)
        return chunk_records, embeddings

    def _get_vector_store(self, collection_id: str) -> VectorStore:
        if collection_id not in _rag_collections:
            _rag_collections[collection_id] = VectorStore(collection_id)
        return _rag_collections[collection_id]

    async def search(self, collection_id: str, query: str, top_k: int = 5, threshold: float = 0.0) -> List[dict]:
        vector_store = _rag_collections.get(collection_id)
        if not vector_store:
            return []

        query_embedding = embed_text(query)
        results = vector_store.search(query_embedding, top_k=top_k)

        filtered = []
        for r in results:
            score = float(np.dot(query_embedding, r["embedding"]))
            r["score"] = round(float(score), 4)
            if score >= threshold:
                filtered.append(r)

        return filtered[:top_k]

    async def generate_answer(self, query: str, context_chunks: List[dict], model_id: str = "claude-3-haiku-20240307") -> str:
        context = "\n\n".join([c["content"] for c in context_chunks])

        system_prompt = "You are a helpful assistant. Answer the user's question based solely on the provided context. If the context does not contain enough information, say so."

        messages = [
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
        ]

        result = await claude_service.chat_sync(model_id, messages, system_prompt=system_prompt, max_tokens=512)
        return result.get("content", "I couldn't generate an answer.")

    def clear_collection(self, collection_id: str):
        if collection_id in _rag_collections:
            del _rag_collections[collection_id]


rag_service = RAGService()
