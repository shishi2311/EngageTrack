import traceback
from flask import jsonify, g, current_app


# ── Custom exception hierarchy ────────────────────────────────────────────────

class AppError(Exception):
    """Base class for all application errors."""
    status_code = 500
    code = "INTERNAL_ERROR"

    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"


class ValidationError(AppError):
    status_code = 422
    code = "VALIDATION_ERROR"


class BusinessRuleError(AppError):
    status_code = 422
    code = "BUSINESS_RULE_VIOLATION"


# ── Response builder ──────────────────────────────────────────────────────────

def _error_response(code: str, message: str, details: dict, status: int):
    """Build the standard error envelope, injecting request_id when available."""
    body = {"code": code, "message": message, "details": details}
    request_id = getattr(g, "request_id", None)
    if request_id:
        body["request_id"] = request_id
    return jsonify({"error": body}), status


# ── Handler registration ──────────────────────────────────────────────────────

def register_error_handlers(app):

    @app.errorhandler(AppError)
    def handle_app_error(err: AppError):
        # Business-rule and validation violations are expected — log at WARNING
        level = "warning" if err.status_code == 422 else "error"
        getattr(current_app.logger, level)(
            "app_error",
            extra={
                "error_code": err.code,
                "error_message": err.message,   # "message" is reserved by LogRecord
                "details": err.details,
                "http_status": err.status_code,
            },
        )
        return _error_response(err.code, err.message, err.details, err.status_code)

    @app.errorhandler(404)
    def handle_404(err):
        return _error_response("NOT_FOUND", "Resource not found", {}, 404)

    @app.errorhandler(405)
    def handle_405(err):
        return _error_response("METHOD_NOT_ALLOWED", "Method not allowed", {}, 405)

    @app.errorhandler(Exception)
    def handle_unexpected(err: Exception):
        # Log full traceback server-side, return a safe generic message to client
        current_app.logger.error(
            "unhandled_exception",
            extra={
                "exc_type": type(err).__name__,
                "exc_message": str(err),
                "traceback": traceback.format_exc(),
            },
        )
        return _error_response(
            "INTERNAL_ERROR",
            "An unexpected error occurred. Please try again later.",
            {},
            500,
        )
