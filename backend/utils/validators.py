ALLOWED_EXTENSIONS = {".txt", ".pdf", ".md", ".csv", ".json", ".py", ".js", ".tsx", ".ts", ".html", ".css", ".yaml", ".yml", ".xml", ".docx"}
MAX_FILE_SIZE_MB = 50


def is_allowed_file(filename: str) -> bool:
    import os
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def validate_file_size(file_size_bytes: int) -> bool:
    return file_size_bytes <= MAX_FILE_SIZE_MB * 1024 * 1024


def get_file_type(filename: str) -> str:
    import os
    ext = os.path.splitext(filename)[1].lower()
    return ext.lstrip(".") if ext else "unknown"
