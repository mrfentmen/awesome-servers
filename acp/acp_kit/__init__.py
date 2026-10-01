"""acp_kit — a stdlib-only Agent Client Protocol (ACP v1) toolkit.

Write the agent, and the kit speaks ACP: initialize, sessions, prompt turns that
stream session/update notifications, cancellation, permission requests, and the
newline-delimited JSON-RPC stdio transport an editor launches it with.
"""

from .agent import (
    PROTOCOL_VERSION,
    STOP_CANCELLED,
    STOP_END_TURN,
    STOP_MAX_TOKENS,
    STOP_MAX_TURN_REQUESTS,
    STOP_REFUSAL,
    AcpAgent,
    Cancelled,
    Session,
    SessionContext,
    prompt_text,
    text_of,
)
from .client import AcpClient
from .gateway import (
    DENIED,
    DEFAULT_GATEWAY_URL,
    MISSING_KEY,
    PROTOCOL_ERROR,
    TOOL_ERROR,
    UNREACHABLE,
    GatewayClient,
    GatewayError,
    empty_premium_answer,
    premium_call,
)
from .rpc import DEFERRED, Connection, JsonRpcError

__all__ = [
    "AcpAgent",
    "AcpClient",
    "Cancelled",
    "Connection",
    "DEFERRED",
    "DENIED",
    "DEFAULT_GATEWAY_URL",
    "GatewayClient",
    "GatewayError",
    "JsonRpcError",
    "MISSING_KEY",
    "PROTOCOL_ERROR",
    "TOOL_ERROR",
    "UNREACHABLE",
    "empty_premium_answer",
    "premium_call",
    "PROTOCOL_VERSION",
    "STOP_CANCELLED",
    "STOP_END_TURN",
    "STOP_MAX_TOKENS",
    "STOP_MAX_TURN_REQUESTS",
    "STOP_REFUSAL",
    "Session",
    "SessionContext",
    "prompt_text",
    "text_of",
]

__version__ = "1.0.0"
