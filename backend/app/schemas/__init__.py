from marshmallow.exceptions import ValidationError as MarshmallowValidationError
from ..errors import ValidationError as AppValidationError


def load_or_raise(schema, data: dict) -> dict:
    """
    Run schema.load(data). On marshmallow ValidationError, re-raise as our
    AppValidationError so the error handler returns consistent JSON with
    field-level details:
        {"error": {"code": "VALIDATION_ERROR", "details": {"field": ["msg"]}}}
    """
    try:
        return schema.load(data or {})
    except MarshmallowValidationError as exc:
        raise AppValidationError("Validation failed.", details=exc.messages)


from .client_schema import (
    ClientCreateSchema,
    ClientUpdateSchema,
    ClientResponseSchema,
)
from .project_schema import (
    ProjectCreateSchema,
    ProjectUpdateSchema,
    ProjectResponseSchema,
)
from .milestone_schema import (
    MilestoneCreateSchema,
    MilestoneResponseSchema,
)
from .status_update_schema import (
    StatusUpdateCreateSchema,
    StatusUpdateResponseSchema,
)

__all__ = [
    "load_or_raise",
    "ClientCreateSchema",
    "ClientUpdateSchema",
    "ClientResponseSchema",
    "ProjectCreateSchema",
    "ProjectUpdateSchema",
    "ProjectResponseSchema",
    "MilestoneCreateSchema",
    "MilestoneResponseSchema",
    "StatusUpdateCreateSchema",
    "StatusUpdateResponseSchema",
]
