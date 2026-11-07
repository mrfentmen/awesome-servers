"""Drive a real local Jupyter kernel: start, run code, interrupt, restart, stop."""

from __future__ import annotations

import atexit
import json
import os
import queue
import shutil
import sys
import tempfile
import threading
import time
from pathlib import Path
from typing import Any

from jupyter_client import KernelManager

MAX_CODE = 200_000
MAX_OUTPUT = 100_000
MAX_TIMEOUT = 600


class EngineError(RuntimeError):
    """A problem the caller can fix: kernel not running, bad path, bad input."""


class KernelSession:
    """One Python kernel, shared across tool calls."""

    def __init__(self) -> None:
        self._km: KernelManager | None = None
        self._kc: Any = None
        self._lock = threading.Lock()
        self._spec_dir: Path | None = None
        self._old_jupyter_path: str | None = None
        self._cwd: str | None = None
        self._started_at: float | None = None
        atexit.register(self.stop)

    # -- setup ---------------------------------------------------------

    def _python(self) -> str:
        candidate = os.environ.get("JUPYTER_MCP_PYTHON", "").strip() or sys.executable
        path = Path(candidate).expanduser()
        if not path.is_file():
            raise EngineError(f"JUPYTER_MCP_PYTHON is not a file: {path}")
        return str(path)

    def _install_spec(self) -> None:
        if self._spec_dir is not None:
            return
        directory = Path(tempfile.mkdtemp(prefix="jupyter-mcp-kernels-"))
        kernel_dir = directory / "kernels" / "jupyter-mcp-python"
        kernel_dir.mkdir(parents=True)
        spec = {
            "argv": [self._python(), "-m", "ipykernel_launcher", "-f", "{connection_file}"],
            "display_name": "Python 3 (jupyter-mcp)",
            "language": "python",
        }
        (kernel_dir / "kernel.json").write_text(json.dumps(spec), encoding="utf-8")
        self._old_jupyter_path = os.environ.get("JUPYTER_PATH")
        parts = [str(directory)]
        if self._old_jupyter_path:
            parts.append(self._old_jupyter_path)
        os.environ["JUPYTER_PATH"] = os.pathsep.join(parts)
        self._spec_dir = directory

    def _remove_spec(self) -> None:
        if self._spec_dir is None:
            return
        if self._old_jupyter_path is None:
            os.environ.pop("JUPYTER_PATH", None)
        else:
            os.environ["JUPYTER_PATH"] = self._old_jupyter_path
        shutil.rmtree(self._spec_dir, ignore_errors=True)
        self._spec_dir = None

    def _workdir(self, cwd: str | None) -> str:
        raw = (cwd or os.environ.get("JUPYTER_MCP_WORKDIR") or os.getcwd()).strip()
        path = Path(raw).expanduser().resolve()
        if not path.is_dir():
            raise EngineError(f"working directory does not exist: {path}")
        return str(path)

    # -- lifecycle -----------------------------------------------------

    def start(self, cwd: str | None = None) -> dict[str, Any]:
        with self._lock:
            if self._km is not None and self._km.is_alive():
                return self._status_locked()
            self._shutdown_locked()
            self._install_spec()
            workdir = self._workdir(cwd)
            manager = KernelManager(kernel_name="jupyter-mcp-python")
            client = None
            try:
                manager.start_kernel(cwd=workdir)
                client = manager.client()
                client.start_channels()
                client.wait_for_ready(timeout=30)
            except Exception as exc:  # noqa: BLE001 - surface a clean message
                if client is not None:
                    try:
                        client.stop_channels()
                    except Exception:  # noqa: BLE001 - best effort cleanup
                        pass
                try:
                    manager.shutdown_kernel(now=True)
                except Exception:  # noqa: BLE001 - best effort cleanup
                    pass
                raise EngineError(
                    f"could not start the Python kernel: {exc}. "
                    "Check that ipykernel is installed for JUPYTER_MCP_PYTHON."
                ) from exc
            self._km = manager
            self._kc = client
            self._cwd = workdir
            self._started_at = time.monotonic()
            return self._status_locked()

    def _shutdown_locked(self) -> None:
        if self._kc is not None:
            try:
                self._kc.stop_channels()
            except Exception:  # noqa: BLE001 - best effort cleanup
                pass
        if self._km is not None:
            try:
                if self._km.is_alive():
                    self._km.shutdown_kernel(now=True)
            except Exception:  # noqa: BLE001 - best effort cleanup
                pass
        self._km = None
        self._kc = None
        self._cwd = None
        self._started_at = None

    def stop(self) -> dict[str, Any]:
        with self._lock:
            self._shutdown_locked()
            self._remove_spec()
            return {"running": False, "pid": None, "cwd": None, "uptime_seconds": 0}

    def restart(self) -> dict[str, Any]:
        with self._lock:
            self._require_running()
            try:
                self._km.restart_kernel(now=False)
                self._kc.wait_for_ready(timeout=30)
            except Exception as exc:  # noqa: BLE001 - clean message
                raise EngineError(f"could not restart the kernel: {exc}") from exc
            self._started_at = time.monotonic()
            return self._status_locked()

    def interrupt(self) -> dict[str, Any]:
        self._require_running()
        try:
            self._km.interrupt_kernel()
        except Exception as exc:  # noqa: BLE001 - clean message
            raise EngineError(f"could not interrupt the kernel: {exc}") from exc
        return {"interrupted": True, **self.status()}

    def status(self) -> dict[str, Any]:
        return self._status_locked()

    def _require_running(self) -> None:
        if self._km is None or not self._km.is_alive():
            raise EngineError("the kernel is not running; call kernel_start first")

    def _status_locked(self) -> dict[str, Any]:
        running = self._km is not None and self._km.is_alive()
        pid = None
        if running and self._km is not None:
            provisioner = getattr(self._km, "provisioner", None)
            pid = getattr(provisioner, "pid", None)
        uptime = 0.0
        if running and self._started_at is not None:
            uptime = round(time.monotonic() - self._started_at, 1)
        return {
            "running": running,
            "pid": pid,
            "cwd": self._cwd,
            "kernel": "jupyter-mcp-python",
            "uptime_seconds": uptime,
        }

    # -- execution -----------------------------------------------------

    def execute(self, code: str, timeout: int = 60) -> dict[str, Any]:
        if not code.strip():
            raise EngineError("code is required")
        if len(code) > MAX_CODE:
            raise EngineError(f"code is longer than {MAX_CODE} characters")
        if not 1 <= timeout <= MAX_TIMEOUT:
            raise EngineError(f"timeout must be between 1 and {MAX_TIMEOUT} seconds")

        acquired = self._lock.acquire(timeout=timeout + 10)
        if not acquired:
            raise EngineError("another cell is still running; interrupt it or wait")
        try:
            self._require_running()
            started = time.monotonic()
            msg_id = self._kc.execute(code)
            stdout: list[str] = []
            stderr: list[str] = []
            displays: list[str] = []
            result: str | None = None
            error: dict[str, Any] | None = None
            execution_count: int | None = None
            timed_out = False
            deadline = started + timeout

            while True:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    timed_out = True
                    break
                try:
                    message = self._kc.get_iopub_msg(timeout=remaining)
                except queue.Empty:
                    timed_out = True
                    break
                if message.get("parent_header", {}).get("msg_id") != msg_id:
                    continue
                kind = message.get("msg_type")
                content = message.get("content", {})
                if kind == "execute_input":
                    execution_count = content.get("execution_count")
                elif kind == "stream":
                    text = content.get("text", "")
                    if content.get("name") == "stderr":
                        stderr.append(text)
                    else:
                        stdout.append(text)
                elif kind == "execute_result":
                    execution_count = content.get("execution_count", execution_count)
                    data = content.get("data", {})
                    if isinstance(data, dict):
                        value = data.get("text/plain")
                        if isinstance(value, str):
                            result = value
                elif kind == "display_data":
                    data = content.get("data", {})
                    if isinstance(data, dict):
                        value = data.get("text/plain")
                        if isinstance(value, str):
                            displays.append(value)
                elif kind == "error":
                    error = {
                        "ename": content.get("ename"),
                        "evalue": content.get("evalue"),
                        "traceback": content.get("traceback", []),
                    }
                elif kind == "status" and content.get("execution_state") == "idle":
                    break

            if timed_out:
                try:
                    self._km.interrupt_kernel()
                except Exception:  # noqa: BLE001 - the timeout result is still useful
                    pass
                self._drain_locked(msg_id, 3.0)
            else:
                error = self._shell_reply_locked(msg_id, error)

            out_text, out_cut = self._cap(stdout)
            err_text, err_cut = self._cap(stderr)
            duration = round((time.monotonic() - started) * 1000)
            status = "timeout" if timed_out else ("error" if error else "ok")
            return {
                "status": status,
                "execution_count": execution_count,
                "stdout": out_text,
                "stderr": err_text,
                "result": result,
                "displays": displays[:20],
                "error": error,
                "duration_ms": duration,
                "timed_out": timed_out,
                "truncated": out_cut or err_cut,
            }
        finally:
            self._lock.release()

    @staticmethod
    def _cap(parts: list[str]) -> tuple[str, bool]:
        joined = "".join(parts)
        return joined[:MAX_OUTPUT], len(joined) > MAX_OUTPUT

    def _drain_locked(self, msg_id: str, seconds: float) -> None:
        deadline = time.monotonic() + seconds
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                return
            try:
                message = self._kc.get_iopub_msg(timeout=remaining)
            except queue.Empty:
                return
            if message.get("parent_header", {}).get("msg_id") != msg_id:
                continue
            if message.get("msg_type") == "status":
                if message.get("content", {}).get("execution_state") == "idle":
                    return

    def _shell_reply_locked(self, msg_id: str, error: dict[str, Any] | None) -> dict[str, Any] | None:
        try:
            reply = self._kc.get_shell_msg(timeout=5)
            while reply.get("parent_header", {}).get("msg_id") != msg_id:
                reply = self._kc.get_shell_msg(timeout=1)
            content = reply.get("content", {})
            if content.get("status") == "error" and error is None:
                return {
                    "ename": content.get("ename"),
                    "evalue": content.get("evalue"),
                    "traceback": content.get("traceback", []),
                }
            return error
        except queue.Empty:
            return error
        except Exception:  # noqa: BLE001 - iopub already carries the error
            return error
