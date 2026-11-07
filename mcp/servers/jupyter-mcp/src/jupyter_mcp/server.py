"""MCP tools for a persistent local Jupyter kernel."""

from mcp.server.fastmcp import FastMCP

from .engine import KernelSession

mcp = FastMCP("jupyter")
_kernel = KernelSession()


@mcp.tool()
def kernel_start(cwd: str | None = None) -> dict:
    """Start a Python kernel, or return the one already running.

    cwd is the folder the kernel works in. It defaults to JUPYTER_MCP_WORKDIR,
    then the server's current directory. State (variables, imports) survives
    across calls until restart or stop.
    """
    return _kernel.start(cwd)


@mcp.tool()
def run_code(code: str, timeout: int = 60) -> dict:
    """Run Python code in the live kernel and return stdout, stderr, result and errors.

    The kernel keeps its state, so variables defined in one call are still there
    in the next. timeout is 1 to 600 seconds; on timeout the kernel is
    interrupted and partial output is returned.
    """
    return _kernel.execute(code, timeout)


@mcp.tool()
def kernel_status() -> dict:
    """Show whether the kernel is running, its PID, working directory and uptime."""
    return _kernel.status()


@mcp.tool()
def kernel_interrupt() -> dict:
    """Send Ctrl-C to the kernel. Useful when a cell is stuck in a loop."""
    return _kernel.interrupt()


@mcp.tool()
def kernel_restart() -> dict:
    """Restart the kernel and clear all variables, imports and state."""
    return _kernel.restart()


@mcp.tool()
def kernel_stop() -> dict:
    """Shut the kernel down. Call kernel_start to get a fresh one."""
    return _kernel.stop()


def main() -> None:
    try:
        mcp.run()
    finally:
        _kernel.stop()


if __name__ == "__main__":
    main()
