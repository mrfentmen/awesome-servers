"""Smoke test: launch the server over stdio and drive a real Python kernel."""

from __future__ import annotations

import asyncio
import json
import os
import sys
import tempfile
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


def payload(result) -> dict:
    if result.isError:
        raise AssertionError(f"tool failed: {result.content[0].text}")
    return json.loads(result.content[0].text)


async def main() -> None:
    workdir = tempfile.mkdtemp(prefix="jupyter-mcp-test-")
    env = dict(os.environ)
    env["JUPYTER_MCP_WORKDIR"] = workdir
    env["PYTHONUNBUFFERED"] = "1"
    params = StdioServerParameters(
        command=sys.executable,
        args=["-m", "jupyter_mcp"],
        env=env,
    )
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = sorted(tool.name for tool in (await session.list_tools()).tools)
            expected = [
                "kernel_interrupt",
                "kernel_restart",
                "kernel_start",
                "kernel_status",
                "kernel_stop",
                "run_code",
            ]
            assert tools == expected, f"tools mismatch: {tools}"
            print(f"PASS tools={tools}")

            before = payload(await session.call_tool("kernel_status", {}))
            assert before["running"] is False, before
            print("PASS status starts stopped")

            started = payload(await session.call_tool("kernel_start", {"cwd": workdir}))
            assert started["running"] is True, started
            assert started["cwd"] == str(Path(workdir).resolve()), started
            print(f"PASS start pid={started['pid']} cwd={started['cwd']}")

            first = payload(await session.call_tool("run_code", {"code": "x = 41\nprint('hello')"}))
            assert first["status"] == "ok", first
            assert "hello" in first["stdout"], first
            print(f"PASS run stdout={first['stdout'].strip()!r}")

            second = payload(await session.call_tool("run_code", {"code": "x + 1"}))
            assert second["result"] == "42", second
            print(f"PASS state survives result={second['result']}")

            failed = payload(await session.call_tool("run_code", {"code": "1 / 0"}))
            assert failed["status"] == "error", failed
            assert failed["error"]["ename"] == "ZeroDivisionError", failed
            print(f"PASS error captured {failed['error']['ename']}")

            timed = payload(await session.call_tool("run_code", {"code": "import time; time.sleep(10)", "timeout": 1}))
            assert timed["timed_out"] is True and timed["status"] == "timeout", timed
            print("PASS timeout interrupts the cell")

            recovered = payload(await session.call_tool("run_code", {"code": "print('after')"}))
            assert recovered["status"] == "ok" and "after" in recovered["stdout"], recovered
            print("PASS kernel usable after timeout")

            restarted = payload(await session.call_tool("kernel_restart", {}))
            assert restarted["running"] is True, restarted
            cleared = payload(await session.call_tool("run_code", {"code": "print(x)"}))
            assert cleared["status"] == "error" and cleared["error"]["ename"] == "NameError", cleared
            print("PASS restart clears state")

            interrupted = payload(await session.call_tool("kernel_interrupt", {}))
            assert interrupted["interrupted"] is True and interrupted["running"] is True, interrupted
            print("PASS interrupt is accepted")

            stopped = payload(await session.call_tool("kernel_stop", {}))
            assert stopped["running"] is False, stopped
            print("PASS stop")

            missing = await session.call_tool("run_code", {"code": "1"})
            assert missing.isError, "running without a kernel should be an error"
            print("PASS run without kernel returns an error")


if __name__ == "__main__":
    asyncio.run(main())
