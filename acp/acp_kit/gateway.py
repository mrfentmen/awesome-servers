"""Client for the Polar-gated MCP gateway.

A premium skill does not run here. It runs on the gateway, which checks a Polar
licence key before it does any work, so deleting a check from this repository
buys nothing: the answer only exists behind the gate. Every agent shares this
one thin client.

Two environment variables:

    MCP_LICENSE_KEY       the buyer's Polar key (the same name the MCP servers use)
    ACP_GATEWAY_URL       override the gateway endpoint (default below)
    ACP_USER_AGENT        override the User-Agent (Cloudflare 403s urllib's default)

The key travels in an Authorization header. A missing key, a rejected key and an
unreachable gateway each raise a GatewayError whose message is safe to show the
caller as-is, because telling someone to buy a key is the point of the gate.
"""

from __future__ import annotations

import json
import os
from urllib import error as urlerror
from urllib import request

#: The deployed gateway. It speaks MCP over Streamable HTTP, JSON mode only.
DEFAULT_GATEWAY_URL = "https://mcp-gateway.contactae2000.workers.dev/mcp"
DEFAULT_TIMEOUT = 25.0

#: Cloudflare's edge answers 403 to urllib's stock "Python-urllib/3.x", so the
#: caller has to look like a real client. Verified against the live gateway.
DEFAULT_USER_AGENT = "awesome-acps-kit/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: Reason codes callers can branch on without parsing the message.
MISSING_KEY = "missing_key"
DENIED = "denied"
UNREACHABLE = "unreachable"
PROTOCOL_ERROR = "protocol_error"
#: The gate let the call through and the tool itself failed (a bad argument, an
#: upstream outage). Deliberately not a licence verdict.
TOOL_ERROR = "tool_error"


class GatewayError(RuntimeError):
    """A premium call could not be completed. `reason` is one of the codes above."""

    def __init__(self, reason: str, message: str) -> None:
        super().__init__(message)
        self.reason = reason
        self.message = message


class GatewayClient:
    """Calls premium tools on the gateway with the caller's licence key.

    `fetch(url, payload, headers) -> dict` is injectable so tests never touch the
    network. The real one posts JSON and returns the parsed JSON-RPC response.
    """

    env_prefix = "ACP"

    def __init__(self, fetch=None, url: str | None = None, key: str | None = None,
                 timeout: float | None = None) -> None:
        env = os.environ
        self.url = (url or env.get(f"{self.env_prefix}_GATEWAY_URL") or DEFAULT_GATEWAY_URL).strip()
        self.key = (key if key is not None else env.get("MCP_LICENSE_KEY") or "").strip()
        self.timeout = float(timeout if timeout is not None else env.get(f"{self.env_prefix}_HTTP_TIMEOUT", DEFAULT_TIMEOUT))
        self.user_agent = env.get(f"{self.env_prefix}_USER_AGENT") or DEFAULT_USER_AGENT
        self._fetch = fetch or self._http_post

    # -- transport ---------------------------------------------------------

    def _http_post(self, url: str, payload: dict, headers: dict) -> dict:
        body = json.dumps(payload).encode("utf-8")
        req = request.Request(url, data=body, headers=headers, method="POST")
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urlerror.HTTPError as exc:
            raise GatewayError(UNREACHABLE, self._explain_http(exc)) from exc
        except Exception as exc:  # urllib raises many types; callers see one
            raise GatewayError(UNREACHABLE, f"the licence gateway could not be reached ({exc})") from exc

    @staticmethod
    def _explain_http(exc) -> str:
        detail = ""
        try:
            body = json.loads(exc.read().decode("utf-8"))
            if isinstance(body, dict):
                detail = str(body.get("error") or body.get("message") or "")
        except Exception:
            detail = ""
        suffix = f": {detail}" if detail else ""
        return f"the licence gateway answered HTTP {exc.code}{suffix}"

    # -- calls -------------------------------------------------------------

    def headers(self) -> dict:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": self.user_agent,
        }
        if self.key:
            headers["Authorization"] = f"Bearer {self.key}"
        return headers

    def call(self, tool: str, arguments: dict | None = None) -> object:
        """Run one premium tool. Raises GatewayError with a showable message."""
        if not self.key:
            raise GatewayError(
                MISSING_KEY,
                f"`{tool}` is a premium skill and no licence key is set. Put a Polar key in "
                f"MCP_LICENSE_KEY and ask again.",
            )
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {"name": tool, "arguments": arguments or {}},
        }
        try:
            response = self._fetch(self.url, payload, self.headers())
        except GatewayError:
            raise
        except Exception as exc:  # any transport failure looks the same to a caller
            raise GatewayError(UNREACHABLE, f"the licence gateway could not be reached ({exc})") from exc
        if not isinstance(response, dict):
            raise GatewayError(PROTOCOL_ERROR, f"`{tool}` got an unreadable answer from the licence gateway")
        if isinstance(response.get("error"), dict):
            message = str(response["error"].get("message") or "unknown error")
            raise GatewayError(PROTOCOL_ERROR, f"`{tool}` was refused by the licence gateway: {message}")

        result = response.get("result")
        if not isinstance(result, dict):
            raise GatewayError(PROTOCOL_ERROR, f"`{tool}` got an empty answer from the licence gateway")

        text = "\n".join(
            part.get("text", "") for part in (result.get("content") or []) if isinstance(part, dict)
        ).strip()
        if result.get("isError"):
            # The gateway marks a licence refusal structurally. Anything else that
            # failed did so after the gate had already let it through, so it is a
            # tool error and must not be dressed up as a licence problem.
            marker = result.get("structuredContent") or {}
            if marker.get("licenceRefusal"):
                reason = MISSING_KEY if marker.get("reason") == "missing" else DENIED
                # The gateway already words this well, including the buy link.
                raise GatewayError(reason, text or f"`{tool}` needs a valid licence key.")
            raise GatewayError(TOOL_ERROR, text or f"`{tool}` failed on the licence gateway")
        if not text:
            raise GatewayError(PROTOCOL_ERROR, f"`{tool}` returned no data")
        try:
            return json.loads(text)
        except ValueError:
            # Some tools answer with prose. Hand it back as it came.
            return text


def premium_call(gateway: GatewayClient, tool: str, arguments: dict,
                 context: dict | None = None) -> tuple[object | None, tuple[str, dict] | None]:
    """Run one premium tool, turning a licence refusal into a finished answer.

    Returns `(data, refused)`. When `refused` is set it is already a
    `(answer, artifact)` pair, which is exactly what a skill hands back, so the
    licence wording lives in one place instead of in every skill. A key that is
    missing or rejected is an answer the caller can act on.

    A gateway that cannot be reached, or a tool that failed after the gate let it
    through, is raised as GatewayError instead, so the agent's own error path
    reports it as a failed lookup.
    """
    try:
        return gateway.call(tool, arguments), None
    except GatewayError as exc:
        if exc.reason not in (MISSING_KEY, DENIED):
            raise
        message = str(exc)
        return None, (message, {
            "summary": message,
            "premium": True,
            "reason": exc.reason,
            **(context or {}),
        })


def empty_premium_answer(message: str, context: dict | None = None) -> tuple[str, dict]:
    """The answer for a premium call that came back without usable data."""
    return message, {"summary": message, "premium": True, "failed": True, **(context or {})}


__all__ = [
    "DEFAULT_GATEWAY_URL",
    "DEFAULT_TIMEOUT",
    "DEFAULT_USER_AGENT",
    "DENIED",
    "GatewayClient",
    "GatewayError",
    "MISSING_KEY",
    "PROTOCOL_ERROR",
    "TOOL_ERROR",
    "UNREACHABLE",
    "empty_premium_answer",
    "premium_call",
]
