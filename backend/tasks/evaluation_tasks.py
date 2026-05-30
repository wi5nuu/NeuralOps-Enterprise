from celery_app import celery_app
from celery import chain, group
import asyncio


@celery_app.task(bind=True, max_retries=3)
def run_batch_evaluation_task(self, evaluation_ids: list, eval_type: str, model_outputs: list, contexts: list = None, ground_truths: list = None):
    try:
        from services.evaluation_service import run_evaluation

        results = []
        for i, output in enumerate(model_outputs):
            ctx = contexts[i] if contexts else None
            gt = ground_truths[i] if ground_truths else None
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(
                run_evaluation(eval_type, output, context=ctx, ground_truth=gt)
            )
            loop.close()
            results.append(result)

        return {"status": "success", "results": results}
    except Exception as exc:
        raise self.retry(exc=exc)
