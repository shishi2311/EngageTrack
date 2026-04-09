from flask import jsonify


class AppError(Exception):
    """Base application error."""
    status_code = 500
    code = "INTERNAL_ERROR"

    def __init__(self, message, details=None):
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


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(err):
        return jsonify({"error": {"code": err.code, "message": err.message, "details": err.details}}), err.status_code

    @app.errorhandler(404)
    def handle_404(err):
        return jsonify({"error": {"code": "NOT_FOUND", "message": "Resource not found", "details": {}}}), 404

    @app.errorhandler(405)
    def handle_405(err):
        return jsonify({"error": {"code": "METHOD_NOT_ALLOWED", "message": "Method not allowed", "details": {}}}), 405

    @app.errorhandler(500)
    def handle_500(err):
        return jsonify({"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred", "details": {}}}), 500
