from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CacheMetrics(BaseModel):
    hit_rate: float
    memory_usage_mb: float


class DashboardStats(BaseModel):
    total_users: int
    total_projects: int
    total_experiments: int
    total_services: int
    total_datasets: int
    total_evaluations: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    model_performance: List[dict] = []
    dataset_growth: List[dict] = []
    recent_activity: List[dict] = []
    service_health: List[dict] = []
    model_pie: List[dict] = []
    cache_metrics: Optional[CacheMetrics] = None


class UsageMetrics(BaseModel):
    total_api_calls: int
    total_tokens: int
    avg_latency_ms: float
    error_rate: float
    cost_estimate: float
    costs_by_service: List[dict] = []
    usage_over_time: List[dict] = []
