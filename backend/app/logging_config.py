# logging_config.py
import logging

class HealthFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        # DROP health endpoint logs
        return "/health" not in msg
