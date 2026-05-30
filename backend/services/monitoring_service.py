from typing import List, Dict
import statistics


def calculate_latency_percentiles(latencies: List[float]) -> Dict[str, float]:
    if not latencies:
        return {"p50": 0.0, "p90": 0.0, "p95": 0.0, "p99": 0.0, "avg": 0.0}

    sorted_lat = sorted(latencies)
    n = len(sorted_lat)

    return {
        "p50": sorted_lat[int(n * 0.5)],
        "p90": sorted_lat[int(n * 0.9)],
        "p95": sorted_lat[int(n * 0.95)],
        "p99": sorted_lat[int(n * 0.99)],
        "avg": statistics.mean(sorted_lat),
    }


def calculate_error_rate(total_requests: int, error_count: int) -> float:
    if total_requests == 0:
        return 0.0
    return round((error_count / total_requests) * 100, 2)


def calculate_health_score(error_rate: float, avg_latency_ms: float, sla_target_ms: int = 1000) -> float:
    latency_score = max(0, 100 - (avg_latency_ms / sla_target_ms * 100))
    error_score = max(0, 100 - error_rate * 10)
    return round(latency_score * 0.4 + error_score * 0.6, 1)
