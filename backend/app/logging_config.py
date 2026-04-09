import json
import logging
import time
import uuid
from datetime import datetime, timezone

from flask import g, request


class JSONFormatter(logging.Formatter):
    """Emit every log record as a single-line JSON object."""

    def format(self, record: logging.LogRecord) -> str:
        log: dict = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Inject request_id from Flask's g when available (inside a request context)
        try:
            if g:
                request_id = getattr(g, "request_id", None)
                if request_id:
                    log["request_id"] = request_id
        except RuntimeError:
            pass  # outside request context — no g available

        # Any extra fields passed via extra={} in logger calls
        skip = {
            "name", "msg", "args", "levelname", "levelno", "pathname",
            "filename", "module", "exc_info", "exc_text", "stack_info",
            "lineno", "funcName", "created", "msecs", "relativeCreated",
            "thread", "threadName", "processName", "process", "message",
            "taskName",
        }
        for key, val in record.__dict__.items():
            if key not in skip:
                log[key] = val

        if record.exc_info:
            log["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(log, default=str)


def setup_logging(app) -> None:
    """Attach JSON handler to the root logger and wire up request middleware."""
    formatter = JSONFormatter()

    # Replace all handlers on the root logger so third-party libs also go JSON
    root = logging.getLogger()
    root.handlers.clear()
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    root.addHandler(handler)
    root.setLevel(logging.INFO)

    # Flask's own logger inherits from root — clear any duplicates
    app.logger.handlers.clear()
    app.logger.propagate = True

    # ── Request lifecycle hooks ───────────────────────────────────────────────

    @app.before_request
    def _before():
        g.request_id = str(uuid.uuid4())
        g.request_start = time.perf_counter()

    @app.after_request
    def _after(response):
        duration_ms = round((time.perf_counter() - g.request_start) * 1000, 2)
        app.logger.info(
            "request",
            extra={
                "request_id": g.request_id,
                "method": request.method,
                "path": request.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response
