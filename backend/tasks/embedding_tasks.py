from celery import shared_task
from celery_app import celery_app


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def process_document_task(self, collection_id: str, document_id: str, content: str, filename: str):
    try:
        from services.rag_service import rag_service
        import asyncio

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        chunks, _ = loop.run_until_complete(
            rag_service.process_document(collection_id, document_id, content, filename)
        )
        loop.close()
        return {"status": "success", "chunk_count": len(chunks)}
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3)
def reindex_collection_task(self, collection_id: str):
    try:
        from services.rag_service import rag_service

        rag_service.clear_collection(collection_id)
        return {"status": "success", "collection_id": collection_id}
    except Exception as exc:
        raise self.retry(exc=exc)
