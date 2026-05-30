import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from config import settings
from dependencies import hash_password
from database import Base
from models.user import User, UserRoleEnum
from models.organization import Organization
from models.project import Project
from models.prompt_template import PromptTemplate
from models.conversation import Conversation
from models.message import Message
from models.rag_collection import RAGCollection
from models.document import Document, DocumentStatusEnum
from models.chunk import Chunk
from models.experiment import Experiment
from models.run import Run, RunStatusEnum
from models.metric import Metric
from models.ai_service import AIService, ServiceTypeEnum, ServiceEnvironmentEnum, ServiceCloudEnum
from models.service_log import ServiceLog
from models.task import Task, TaskPriorityEnum, TaskStatusEnum
from models.dataset import Dataset, DatasetFormatEnum, SplitTypeEnum
from models.dataset_version import DatasetVersion
from models.model_registry import ModelRegistry
from models.evaluation import Evaluation, EvalTypeEnum
from models.api_key import APIKey, APIKeyProviderEnum
from models.notification import Notification, NotificationTypeEnum
import random

engine = create_async_engine(settings.database_url, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

TABLES = [
    "messages", "chunks", "documents", "rag_collections",
    "metrics", "runs", "experiments",
    "service_logs", "ai_services",
    "tasks", "dataset_versions", "datasets",
    "evaluations", "notifications", "api_keys",
    "model_registry", "conversations", "prompt_templates",
    "projects", "users", "organizations",
]


async def truncate_all(db: AsyncSession):
    for table in TABLES:
        await db.execute(text(f"DELETE FROM {table}"))


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session_maker() as db:
        await truncate_all(db)

        org1 = Organization(id=str(uuid.uuid4()), name="Acme Corp", plan="enterprise", is_active=True, created_at=datetime.now(timezone.utc))
        org2 = Organization(id=str(uuid.uuid4()), name="Startup Inc", plan="pro", is_active=True, created_at=datetime.now(timezone.utc))
        org3 = Organization(id=str(uuid.uuid4()), name="Dev Team", plan="free", is_active=True, created_at=datetime.now(timezone.utc))
        db.add_all([org1, org2, org3])
        await db.flush()

        users = [
            User(id=str(uuid.uuid4()), org_id=org1.id, email="admin@acme.com", name="Alice Admin", hashed_password=hash_password("password123"), role=UserRoleEnum.ADMIN, is_active=True, created_at=datetime.now(timezone.utc)),
            User(id=str(uuid.uuid4()), org_id=org1.id, email="dev@acme.com", name="Bob Developer", hashed_password=hash_password("password123"), role=UserRoleEnum.ENGINEER, is_active=True, created_at=datetime.now(timezone.utc)),
            User(id=str(uuid.uuid4()), org_id=org2.id, email="admin@startup.com", name="Carol Founder", hashed_password=hash_password("password123"), role=UserRoleEnum.ADMIN, is_active=True, created_at=datetime.now(timezone.utc)),
            User(id=str(uuid.uuid4()), org_id=org2.id, email="engineer@startup.com", name="Dave Engineer", hashed_password=hash_password("password123"), role=UserRoleEnum.ENGINEER, is_active=True, created_at=datetime.now(timezone.utc)),
            User(id=str(uuid.uuid4()), org_id=org3.id, email="lead@devteam.com", name="Eve Lead", hashed_password=hash_password("password123"), role=UserRoleEnum.ADMIN, is_active=True, created_at=datetime.now(timezone.utc)),
            User(id=str(uuid.uuid4()), org_id=org3.id, email="member@devteam.com", name="Frank Member", hashed_password=hash_password("password123"), role=UserRoleEnum.VIEWER, is_active=True, created_at=datetime.now(timezone.utc)),
        ]
        db.add_all(users)
        await db.flush()

        project_data = [
            (org1.id, "Customer Support AI", "AI-powered customer support system", "customer-support,ai"),
            (org1.id, "Code Assistant", "Develop an internal code assistant", "code,llm"),
            (org2.id, "Content Generator", "Automated content generation pipeline", "content,llm"),
            (org2.id, "Data Analysis Platform", "ML-powered data analysis", "data,ml"),
            (org3.id, "Chatbot MVP", "Minimal viable chatbot product", "chatbot,mvp"),
            (org3.id, "NLP Pipeline", "Natural language processing pipeline", "nlp,pipeline"),
            (org1.id, "Search Enhancement", "Enterprise search with RAG", "search,rag"),
            (org2.id, "Model Evaluation Suite", "Automated model evaluation framework", "evaluation,ml"),
        ]
        projects = []
        for org_id, name, desc, tags in project_data:
            p = Project(id=str(uuid.uuid4()), org_id=org_id, name=name, description=desc, tags=tags, created_at=datetime.now(timezone.utc))
            projects.append(p)
        db.add_all(projects)
        await db.flush()

        prompts = [
            (org1.id, "General Assistant", "You are a helpful AI assistant. Answer the user's question concisely and accurately.", "claude-3-sonnet-20240229", 0.7, 1024, "general"),
            (org1.id, "Code Reviewer", "You are an expert code reviewer. Analyze the provided code for bugs, performance issues, and best practices.", "claude-3-opus-20240229", 0.3, 2048, "code"),
            (org1.id, "Customer Support", "You are a customer support agent. Be polite, helpful, and solve the customer's issue.", "claude-3-haiku-20240307", 0.5, 512, "support"),
            (org2.id, "Creative Writer", "You are a creative writing assistant. Generate engaging and original content.", "claude-3-sonnet-20240229", 0.9, 2048, "creative"),
            (org2.id, "Data Analyst", "You are a data analysis expert. Interpret data and provide insights.", "claude-3-sonnet-20240229", 0.3, 1024, "data"),
            (org3.id, "Simple Chat", "You are a friendly chatbot. Keep responses short and engaging.", "claude-3-haiku-20240307", 0.8, 256, "chat"),
            (org1.id, "Technical Writer", "You are a technical documentation expert. Write clear, structured documentation.", "claude-3-opus-20240229", 0.4, 2048, "docs"),
            (org2.id, "Translator", "You are a professional translator. Translate text accurately while preserving tone and context.", "claude-3-sonnet-20240229", 0.3, 1024, "translation"),
            (org3.id, "Debug Assistant", "You are a debugging expert. Help identify and fix issues in code.", "claude-3-haiku-20240307", 0.5, 1024, "debug"),
            (org1.id, "Summarizer", "You are a summarization expert. Create concise summaries of long text.", "claude-3-sonnet-20240229", 0.4, 512, "summary"),
        ]
        for org_id, name, content, model_id, temp, max_tok, tags in prompts:
            pt = PromptTemplate(id=str(uuid.uuid4()), org_id=org_id, name=name, content=content, model_id=model_id, temperature=temp, max_tokens=max_tok, tags=tags, version=1, is_active=True, created_at=datetime.now(timezone.utc))
            db.add(pt)
        await db.flush()

        for org_id in [org1.id, org2.id, org3.id]:
            conv = Conversation(id=str(uuid.uuid4()), org_id=org_id, user_id=users[0].id if org_id == org1.id else (users[2].id if org_id == org2.id else users[4].id), title=f"Sample Conversation {org_id[:8]}", model="claude-3-haiku-20240307", temperature=0.7, max_tokens=1024, created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
            db.add(conv)
            await db.flush()

            msg1 = Message(id=str(uuid.uuid4()), conversation_id=conv.id, role="user", content="Hello! Can you help me understand how AI works?", created_at=datetime.now(timezone.utc))
            msg2 = Message(id=str(uuid.uuid4()), conversation_id=conv.id, role="assistant", content="Of course! AI, or Artificial Intelligence, refers to systems that can perform tasks that typically require human intelligence. This includes learning, reasoning, problem-solving, and understanding language. Would you like me to explain any specific aspect?", total_tokens=42, latency_ms=320, created_at=datetime.now(timezone.utc))
            db.add_all([msg1, msg2])
        await db.flush()

        rag_collections = [
            RAGCollection(id=str(uuid.uuid4()), org_id=org1.id, name="Company Knowledge Base", description="Internal documentation and knowledge", chunk_size=500, chunk_overlap=50, document_count=0, chunk_count=0, created_at=datetime.now(timezone.utc)),
            RAGCollection(id=str(uuid.uuid4()), org_id=org2.id, name="Product Docs", description="Product documentation for reference", chunk_size=500, chunk_overlap=50, document_count=0, chunk_count=0, created_at=datetime.now(timezone.utc)),
            RAGCollection(id=str(uuid.uuid4()), org_id=org3.id, name="Research Papers", description="Collection of AI research papers", chunk_size=500, chunk_overlap=50, document_count=0, chunk_count=0, created_at=datetime.now(timezone.utc)),
        ]
        db.add_all(rag_collections)
        await db.flush()

        for coll in rag_collections:
            doc = Document(id=str(uuid.uuid4()), org_id=coll.org_id, collection_id=coll.id, filename="getting_started.md", file_type="md", file_size=2048, status=DocumentStatusEnum.READY, chunk_count=3, created_at=datetime.now(timezone.utc))
            db.add(doc)
            for i in range(3):
                chunk = Chunk(id=str(uuid.uuid4()), collection_id=coll.id, document_id=doc.id, content=f"Sample content chunk {i+1} for {coll.name}. This contains relevant information about AI and ML operations.", chunk_index=i, token_count=25, created_at=datetime.now(timezone.utc))
                db.add(chunk)
        await db.flush()

        experiment_records = [
            Experiment(id=str(uuid.uuid4()), org_id=org1.id, project_id=projects[0].id, name="GPT vs Claude Comparison", description="Comparing LLM performance on customer support", status="completed", tags="llm,comparison", created_at=datetime.now(timezone.utc)),
            Experiment(id=str(uuid.uuid4()), org_id=org2.id, project_id=projects[3].id, name="Classification Model Tuning", description="Hyperparameter tuning for classification", status="running", tags="classification,hpo", created_at=datetime.now(timezone.utc)),
            Experiment(id=str(uuid.uuid4()), org_id=org3.id, project_id=projects[5].id, name="Sentiment Analysis Benchmark", description="Benchmarking sentiment analysis models", status="completed", tags="sentiment,benchmark", created_at=datetime.now(timezone.utc)),
        ]
        db.add_all(experiment_records)
        await db.flush()

        for exp in experiment_records:
            for m in ["claude-3-haiku", "claude-3-sonnet", "gpt-3.5-turbo", "gpt-4"]:
                run = Run(id=str(uuid.uuid4()), experiment_id=exp.id, model_name=m, framework="pytorch", hyperparameters={"lr": 0.001, "batch_size": 32, "epochs": 10}, status=RunStatusEnum.COMPLETED, duration_seconds=random.uniform(100, 500), created_at=datetime.now(timezone.utc))
                db.add(run)
                await db.flush()

                for epoch in range(1, 6):
                    metric = Metric(id=str(uuid.uuid4()), run_id=run.id, epoch=epoch, train_loss=round(random.uniform(0.1, 1.5), 4), val_loss=round(random.uniform(0.2, 1.8), 4), accuracy=round(random.uniform(0.7, 0.98), 4), f1_score=round(random.uniform(0.65, 0.96), 4), created_at=datetime.now(timezone.utc))
                    db.add(metric)
        await db.flush()

        service_configs = [
            (org1.id, "Claude Support Bot", ServiceTypeEnum.LLM, ServiceEnvironmentEnum.PRODUCTION, ServiceCloudEnum.AZURE, 500),
            (org1.id, "RAG Search Engine", ServiceTypeEnum.RAG, ServiceEnvironmentEnum.PRODUCTION, ServiceCloudEnum.AZURE, 300),
            (org2.id, "Content Generator API", ServiceTypeEnum.LLM, ServiceEnvironmentEnum.PRODUCTION, ServiceCloudEnum.AWS, 800),
            (org2.id, "Classifier Service", ServiceTypeEnum.CLASSIFIER, ServiceEnvironmentEnum.STAGING, ServiceCloudEnum.GCP, 200),
            (org3.id, "ML Prediction API", ServiceTypeEnum.ML_MODEL, ServiceEnvironmentEnum.DEVELOPMENT, ServiceCloudEnum.ON_PREMISE, 400),
            (org1.id, "Spam Detector", ServiceTypeEnum.CLASSIFIER, ServiceEnvironmentEnum.STAGING, ServiceCloudEnum.AWS, 350),
        ]
        for org_id, name, stype, env, cloud, sla in service_configs:
            service = AIService(id=str(uuid.uuid4()), org_id=org_id, name=name, service_type=stype, environment=env, cloud=cloud, is_active=True, is_healthy=True, avg_latency_ms=round(random.uniform(100, 500), 2), error_rate=round(random.uniform(0, 5), 2), health_score=round(random.uniform(85, 99), 1), uptime=round(random.uniform(99.0, 99.99), 2), sla_target_ms=sla, created_at=datetime.now(timezone.utc))
            db.add(service)
            await db.flush()

            for _ in range(50):
                log = ServiceLog(id=str(uuid.uuid4()), service_id=service.id, endpoint=f"/api/{stype.value}/predict", latency_ms=round(random.uniform(50, 1000), 2), status_code=random.choices([200, 200, 200, 200, 500, 429], weights=[0.85, 0.05, 0.05, 0.02, 0.02, 0.01])[0], input_tokens=random.randint(100, 2000), output_tokens=random.randint(50, 1000), is_error=random.random() < 0.05, timestamp=datetime.now(timezone.utc) - timedelta(minutes=random.randint(0, 10080)))
                db.add(log)
        await db.flush()

        tasks_data = [
            (org1.id, projects[0].id, "Set up Claude API integration", "Configure and test the Anthropic Claude API for customer support", TaskPriorityEnum.CRITICAL, TaskStatusEnum.DONE, "api,integration"),
            (org1.id, projects[1].id, "Implement code review prompt", "Design and test the code review prompt template", TaskPriorityEnum.HIGH, TaskStatusEnum.IN_PROGRESS, "prompts,code-review"),
            (org1.id, projects[0].id, "Create evaluation dataset", "Build a test dataset for evaluating response quality", TaskPriorityEnum.MEDIUM, TaskStatusEnum.TODO, "dataset,evaluation"),
            (org2.id, projects[2].id, "Deploy content generator to production", "Migrate content generator service to production", TaskPriorityEnum.CRITICAL, TaskStatusEnum.IN_REVIEW, "deployment,production"),
            (org2.id, projects[3].id, "Optimize classification model", "Improve classification accuracy above 95%", TaskPriorityEnum.HIGH, TaskStatusEnum.IN_PROGRESS, "ml,optimization"),
            (org2.id, projects[2].id, "Write API documentation", "Document all content generator API endpoints", TaskPriorityEnum.LOW, TaskStatusEnum.BACKLOG, "docs,api"),
            (org3.id, projects[4].id, "Implement basic chat flow", "Build the core chat message flow with SSE streaming", TaskPriorityEnum.HIGH, TaskStatusEnum.IN_PROGRESS, "chat,sse"),
            (org3.id, projects[5].id, "Set up NLP pipeline", "Configure the NLP preprocessing pipeline", TaskPriorityEnum.MEDIUM, TaskStatusEnum.TODO, "nlp,pipeline"),
            (org1.id, projects[6].id, "Index company documents", "Upload and index all company documents for RAG", TaskPriorityEnum.HIGH, TaskStatusEnum.TODO, "rag,indexing"),
            (org2.id, projects[7].id, "Build evaluation framework", "Create automated evaluation pipeline for model testing", TaskPriorityEnum.MEDIUM, TaskStatusEnum.BACKLOG, "evaluation,testing"),
            (org1.id, None, "Update dependencies", "Update all package dependencies to latest versions", TaskPriorityEnum.LOW, TaskStatusEnum.BACKLOG, "maintenance"),
            (org2.id, projects[3].id, "A/B test new features", "Run A/B test comparing old vs new classification approach", TaskPriorityEnum.MEDIUM, TaskStatusEnum.TODO, "testing,ab"),
            (org3.id, projects[4].id, "Add message history", "Implement conversation history and persistence", TaskPriorityEnum.HIGH, TaskStatusEnum.IN_REVIEW, "chat,persistence"),
            (org1.id, projects[6].id, "Optimize search relevance", "Tune search parameters for better result relevance", TaskPriorityEnum.MEDIUM, TaskStatusEnum.BACKLOG, "search,optimization"),
            (org3.id, None, "Set up monitoring", "Configure service monitoring and alerting", TaskPriorityEnum.LOW, TaskStatusEnum.BACKLOG, "monitoring,devops"),
        ]
        for org_id, proj_id, title, desc, priority, status_val, tags in tasks_data:
            task = Task(id=str(uuid.uuid4()), org_id=org_id, project_id=proj_id, title=title, description=desc, priority=priority, status=status_val, tags=tags, sort_order=0, due_date=datetime.now(timezone.utc) + timedelta(days=random.randint(1, 30)), estimated_hours=random.choice([2, 4, 8, 16, 24]), created_at=datetime.now(timezone.utc))
            db.add(task)
        await db.flush()

        dataset_configs = [
            (org1.id, projects[0].id, "Customer Support Q&A", "Customer support conversations dataset", DatasetFormatEnum.JSON, 10000, 3, "support,qa", SplitTypeEnum.RAW),
            (org1.id, projects[6].id, "Document Corpus", "Internal document corpus for RAG", DatasetFormatEnum.CSV, 5000, 5, "docs,rag", SplitTypeEnum.PROCESSED),
            (org2.id, projects[2].id, "Training Articles", "Training data for content generation", DatasetFormatEnum.JSON, 25000, 4, "content,training", SplitTypeEnum.TRAIN),
            (org2.id, projects[3].id, "Classification Labels", "Labeled data for classification", DatasetFormatEnum.CSV, 15000, 8, "classification,labels", SplitTypeEnum.TRAIN),
            (org3.id, projects[4].id, "Chat Logs", "Anonymized chat conversation logs", DatasetFormatEnum.JSON, 8000, 2, "chat,logs", SplitTypeEnum.RAW),
            (org3.id, projects[5].id, "Sentiment Data", "Sentiment-labeled text data", DatasetFormatEnum.PARQUET, 50000, 6, "sentiment,labels", SplitTypeEnum.PROCESSED),
            (org1.id, projects[7].id, "Evaluation Set", "Curated evaluation dataset", DatasetFormatEnum.JSON, 3000, 4, "evaluation,test", SplitTypeEnum.TEST),
            (org2.id, None, "Corpora Collection", "Mixed corpora for language model training", DatasetFormatEnum.PARQUET, 100000, 10, "corpora,training", SplitTypeEnum.RAW),
        ]
        for org_id, proj_id, name, desc, fmt, rows, cols, tags, split in dataset_configs:
            ds = Dataset(id=str(uuid.uuid4()), org_id=org_id, project_id=proj_id, name=name, description=desc, format=fmt, row_count=rows, column_count=cols, size_mb=round(rows * cols * 0.001, 2), version=1, tags=tags, split_type=split, preview_data={"columns": ["col1", "col2", "col3"][:cols], "rows": [{"col1": "example"}], "created_at": datetime.now(timezone.utc).isoformat()}, column_schema={"columns": [{"name": f"col{i}", "type": "text"} for i in range(cols)]}, created_at=datetime.now(timezone.utc))
            db.add(ds)
            await db.flush()

            dv = DatasetVersion(id=str(uuid.uuid4()), dataset_id=ds.id, version=1, changelog="Initial dataset version", row_count=rows, created_at=datetime.now(timezone.utc))
            db.add(dv)
        await db.flush()

        models_data = [
            (org1.id, None, "Claude 3 Sonnet", "anthropic", "claude-3-sonnet-20240229", "1.0", {"max_tokens": 4096, "context_window": 200000}, "production-llm"),
            (org1.id, projects[0].id, "Claude 3 Haiku", "anthropic", "claude-3-haiku-20240307", "1.0", {"max_tokens": 2048, "context_window": 200000}, "support-bot"),
            (org2.id, None, "GPT-4 Turbo", "openai", "gpt-4-turbo", "1.0", {"max_tokens": 4096, "context_window": 128000}, "content-gen"),
            (org2.id, projects[3].id, "Fine-tuned Classifier", "azure", "custom-classifier-v2", "2.1", {"framework": "pytorch", "precision": "fp16"}, "classification"),
            (org3.id, None, "GPT-3.5 Turbo", "openai", "gpt-3.5-turbo", "1.0", {"max_tokens": 2048, "context_window": 16385}, "chatbot"),
            (org3.id, projects[5].id, "Sentiment Analyzer", "azure", "sentiment-v3", "3.0", {"language": "en", "opinion_mining": True}, "sentiment"),
        ]
        for org_id, proj_id, name, provider, model_id, version, params, tags in models_data:
            mr = ModelRegistry(id=str(uuid.uuid4()), org_id=org_id, project_id=proj_id, name=name, provider=provider, model_id=model_id, version=version, parameters=params, use_case=tags.replace("-", " ").title(), tags=tags, created_at=datetime.now(timezone.utc))
            db.add(mr)
        await db.flush()

        evaluation_data = [
            (org1.id, "Support Response Eval", EvalTypeEnum.RELEVANCE, "I can help you with your account issue. Let me check your details.", "The customer is having an account issue and needs help resolving it.", "Account support", 85.0, True, {"items": ["Minor improvement: Could ask for specific account details"]}),
            (org1.id, "Hallucination Check", EvalTypeEnum.HALLUCINATION, "Our system processed 1 million requests yesterday.", "The system processed 500,000 requests yesterday.", "System performance", 60.0, False, {"items": ["Hallucination: Claimed 1M but context says 500K"]}),
            (org2.id, "Content Safety", EvalTypeEnum.SAFETY, "Here are some tips to improve your writing.", "The user asked for writing improvement tips.", "Content safety", 95.0, True, {"items": []}),
            (org2.id, "Bias Assessment", EvalTypeEnum.BIAS, "The best candidate for the role should have strong technical skills and leadership experience.", "Job description for a technical lead position.", "Fair hiring", 90.0, True, {"items": ["Suggestion: Use gender-neutral language"]}),
            (org3.id, "Faithfulness Test", EvalTypeEnum.FAITHFULNESS, "The model achieved 94% accuracy on the test set.", "The model achieved 94% accuracy on the test set.", "Model evaluation", 100.0, True, {"items": []}),
        ]
        for org_id, name, etype, output, ctx, gt, score, passed, issues in evaluation_data:
            ev = Evaluation(id=str(uuid.uuid4()), org_id=org_id, eval_name=name, eval_type=etype, model_output=output, context=ctx, ground_truth=gt, score=score, passed=passed, threshold=70.0, issues=issues, explanation=f"Evaluation completed for {name}", created_at=datetime.now(timezone.utc))
            db.add(ev)
        await db.flush()

        api_keys_data = [
            (org1.id, "Production Anthropic Key", APIKeyProviderEnum.ANTHROPIC, "sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "sk-ant...xxxx"),
            (org2.id, "OpenAI API Key", APIKeyProviderEnum.OPENAI, "sk-openai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "sk-op...xxxx"),
            (org1.id, "Azure OpenAI Key", APIKeyProviderEnum.AZURE, "azure-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "azur...xxxx"),
        ]
        for org_id, name, provider, key_hash, masked in api_keys_data:
            ak = APIKey(id=str(uuid.uuid4()), org_id=org_id, name=name, provider=provider, key_hash=key_hash, masked_key=masked, created_at=datetime.now(timezone.utc))
            db.add(ak)
        await db.flush()

        notifications_data = [
            (org1.id, users[0].id, "Document Indexed", "Getting Started guide has been successfully indexed in Company Knowledge Base", NotificationTypeEnum.DOCUMENT_INDEXED, False),
            (org1.id, users[0].id, "Experiment Completed", "GPT vs Claude Comparison experiment has finished", NotificationTypeEnum.EXPERIMENT_COMPLETED, False),
            (org2.id, users[2].id, "Evaluation Done", "Content Safety evaluation has completed scoring", NotificationTypeEnum.EVALUATION_DONE, False),
            (org2.id, users[2].id, "Service Degraded", "Content Generator API latency is above SLA threshold", NotificationTypeEnum.SERVICE_DEGRADED, False),
            (org3.id, users[4].id, "Task Assigned", "Implement basic chat flow has been assigned to you", NotificationTypeEnum.TASK_ASSIGNED, False),
            (org1.id, users[0].id, "Export Ready", "Your conversation export is ready for download", NotificationTypeEnum.EXPORT_READY, True),
            (org2.id, users[3].id, "Task Assigned", "Write API documentation has been assigned to you", NotificationTypeEnum.TASK_ASSIGNED, False),
            (org3.id, users[4].id, "Document Indexed", "Research paper corpus has been indexed", NotificationTypeEnum.DOCUMENT_INDEXED, True),
        ]
        for org_id, user_id, title, message, ntype, is_read in notifications_data:
            n = Notification(id=str(uuid.uuid4()), org_id=org_id, user_id=user_id, title=title, message=message, notification_type=ntype, is_read=is_read, created_at=datetime.now(timezone.utc))
            db.add(n)

        await db.commit()
        print("Seed completed successfully!")
        print(f"  Organizations: 3")
        print(f"  Users: {len(users)}")
        print(f"  Projects: {len(projects)}")
        print(f"  Prompts: {len(prompts)}")
        print(f"  Experiments: {len(experiment_records)}")
        print(f"  Runs: {4 * len(experiment_records)}")
        print(f"  Metrics: {4 * len(experiment_records) * 5}")
        print(f"  AI Services: {len(service_configs)}")
        print(f"  Service Logs: {len(service_configs) * 50}")
        print(f"  Tasks: {len(tasks_data)}")
        print(f"  Datasets: {len(dataset_configs)}")


if __name__ == "__main__":
    asyncio.run(seed())
