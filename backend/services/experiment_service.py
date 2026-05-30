from typing import Optional
import mlflow
from config import settings


class ExperimentService:
    def __init__(self):
        self.tracking_uri = settings.mlflow_tracking_uri
        if self.tracking_uri:
            mlflow.set_tracking_uri(self.tracking_uri)

    def start_run(self, experiment_name: str, run_name: str, tags: Optional[dict] = None) -> Optional[str]:
        if not self.tracking_uri:
            return None

        try:
            experiment = mlflow.get_experiment_by_name(experiment_name)
            if not experiment:
                experiment_id = mlflow.create_experiment(experiment_name)
            else:
                experiment_id = experiment.experiment_id

            with mlflow.start_run(experiment_id=experiment_id, run_name=run_name, tags=tags) as run:
                return run.info.run_id
        except Exception:
            return None

    def log_params(self, params: dict):
        if self.tracking_uri:
            try:
                mlflow.log_params(params)
            except Exception:
                pass

    def log_metrics(self, metrics: dict, step: Optional[int] = None):
        if self.tracking_uri:
            try:
                mlflow.log_metrics(metrics, step=step)
            except Exception:
                pass

    def log_artifact(self, local_path: str):
        if self.tracking_uri:
            try:
                mlflow.log_artifact(local_path)
            except Exception:
                pass

    def set_tag(self, key: str, value: str):
        if self.tracking_uri:
            try:
                mlflow.set_tag(key, value)
            except Exception:
                pass


experiment_service = ExperimentService()
