import logging
import sys
import traceback
from types import TracebackType
from typing import Tuple, Optional, Type, Union

import structlog
from structlog import BoundLoggerBase
from structlog.types import BindableLogger


def _traceback_to_string(trace: Optional[TracebackType]) -> str:
    return "".join(traceback.format_tb(trace))


def _get_exception_tuple_from_exc_info(
    exc_info: Optional[Union[bool, BaseException]]
) -> Tuple[Optional[Type[BaseException]], Optional[BaseException], Optional[TracebackType]]:
    if isinstance(exc_info, BaseException):
        return exc_info.__class__, exc_info, exc_info.__traceback__
    exception_class, exception_instance, exception_trace = sys.exc_info()
    return exception_class, exception_instance, exception_trace


def format_exc_info_for_datadog(_logger, _name, event_dict):
    """
    Replaces `exc_info` field with datadog standard exception attributes
    """
    exc_info = event_dict.pop("exc_info", None)
    if exc_info:
        exception_class, exception, trace = _get_exception_tuple_from_exc_info(
            exc_info)
        event_dict["error.kind"] = exception_class.__name__
        event_dict["error.message"] = str(exception)
        event_dict["error.stack"] = _traceback_to_string(trace)
        event_dict["message"] = _traceback_to_string(trace)
    return event_dict


WrapperClass = Union[BindableLogger, Type[BoundLoggerBase]]


def configure_logging(log_level: str = "INFO", wrapper_class: WrapperClass = structlog.stdlib.BoundLogger):
    """
    Configures structlog loggers.  Subsequent calls to this function result in a noop.
    """
    if not structlog.is_configured():
        numeric_log_level = getattr(logging, log_level.upper(), None)
        if not isinstance(numeric_log_level, int):
            raise ValueError(f"Invalid log level: {log_level}")

        # remove any default handlers added by Lambda
        root_logger = logging.getLogger()
        if root_logger.handlers:
            for handler in root_logger.handlers:
                root_logger.removeHandler(handler)

        # configure python logger to only emit the JSON message from structlog
        logging.basicConfig(format="%(message)s", level=numeric_log_level)

        # configure structlog
        structlog.configure_once(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.processors.TimeStamper(fmt="iso", utc=True),
                structlog.dev.set_exc_info,
                structlog.processors.StackInfoRenderer(),
                format_exc_info_for_datadog,
                structlog.processors.UnicodeDecoder(),
                structlog.processors.JSONRenderer(),
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=wrapper_class,  # type: ignore
            cache_logger_on_first_use=True,
        )
