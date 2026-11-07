# jupyter-mcp

A real local Jupyter Python kernel that stays alive between MCP calls. Define a variable in one
call, use it in the next. No API key, no Jupyter server, nothing uploaded.

## Requirements

- Python 3.10 - 3.13
- `ipykernel` (installed with this package)

## Install

```bash
git clone https://github.com/mrfentmen/awesome-servers.git
cd awesome-servers/mcp/servers/jupyter-mcp
uv venv --python 3.12
source .venv/bin/activate
uv pip install -e .
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "jupyter": {
      "command": "/absolute/path/to/.venv/bin/jupyter-mcp",
      "env": {
        "JUPYTER_MCP_WORKDIR": "/Users/you/projects/analysis"
      }
    }
  }
}
```

## Tools

| Tool | What it does |
| --- | --- |
| `kernel_start` | Start a Python kernel (or reuse the running one) |
| `run_code` | Run code and return stdout, stderr, result and traceback |
| `kernel_status` | Running state, PID, working directory, uptime |
| `kernel_interrupt` | Send Ctrl-C to a stuck cell |
| `kernel_restart` | Restart and clear all state |
| `kernel_stop` | Shut the kernel down |

### kernel_start

- `cwd` — folder the kernel runs in; defaults to `JUPYTER_MCP_WORKDIR`, then the server's cwd

### run_code

- `code` — Python source, up to 200,000 characters
- `timeout` — 1 to 600 seconds, default 60

Returns:

```json
{
  "status": "ok",
  "execution_count": 1,
  "stdout": "hello\n",
  "stderr": "",
  "result": "42",
  "displays": [],
  "error": null,
  "duration_ms": 12,
  "timed_out": false,
  "truncated": false
}
```

`status` is `ok`, `error` or `timeout`. On timeout the kernel gets an interrupt and you receive
whatever output arrived before the deadline.

## Example

```python
# call 1
import math
values = [math.sqrt(n) for n in range(5)]

# call 2 — values is still here
sum(values)
```

## Security

This server runs Python code with your user permissions. That is the feature. Only connect it to
clients and models you trust, and do not expose it over a network. It speaks stdio only.

## Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `JUPYTER_MCP_WORKDIR` | current directory | Default kernel working directory |
| `JUPYTER_MCP_PYTHON` | the server's Python | Interpreter used for the kernel; must have `ipykernel` |

## Limits

- One kernel per server process. One cell runs at a time.
- A second `run_code` while a cell is running waits, then errors if the first is still busy.
- Output is capped at 100,000 characters per stream.
- `kernel_restart` clears every variable, import and open file handle.
- If a cell ignores Ctrl-C, it can keep running after a timeout; restart to be sure.

## Troubleshooting

**`could not start the Python kernel`** — the interpreter does not have `ipykernel`. Install it,
or point `JUPYTER_MCP_PYTHON` at a Python that does.

**`the kernel is not running`** — call `kernel_start` first. A server restart also loses the
kernel.

## License

MIT.
