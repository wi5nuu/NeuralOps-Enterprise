import numpy as np
from typing import List, Optional
import json


class VectorStore:
    def __init__(self, collection_id: str):
        self.collection_id = collection_id
        self.embeddings: List[np.ndarray] = []
        self.metadata: List[dict] = []

    def add_embeddings(self, embeddings: List[List[float]], metadata: List[dict]):
        for emb, meta in zip(embeddings, metadata):
            self.embeddings.append(np.array(emb, dtype=np.float32))
            self.metadata.append(meta)

    def search(self, query_embedding: List[float], top_k: int = 5) -> List[dict]:
        if not self.embeddings:
            return []

        query_vec = np.array(query_embedding, dtype=np.float32)
        matrix = np.array(self.embeddings, dtype=np.float32)
        similarities = np.dot(matrix, query_vec)

        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            meta = self.metadata[idx].copy()
            meta["embedding"] = self.embeddings[idx].tolist()
            results.append(meta)

        return results

    def remove_document(self, document_id: str):
        indices_to_remove = [i for i, meta in enumerate(self.metadata) if meta.get("document_id") == document_id]
        for i in sorted(indices_to_remove, reverse=True):
            self.embeddings.pop(i)
            self.metadata.pop(i)

    def get_chunk_count(self) -> int:
        return len(self.embeddings)

    def clear(self):
        self.embeddings.clear()
        self.metadata.clear()
