"""Run the films A2A server.

    python3 servers/films/server.py --port 8877
"""

from __future__ import annotations

import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from a2a_kit import run_agent_server  # noqa: E402  (path setup must come first)

from agent import FilmsAgent  # noqa: E402

AGENT_VERSION = "1.0.0"
DEFAULT_PORT = 8877


def main(argv=None) -> int:
    return run_agent_server(
        FilmsAgent(),
        AGENT_VERSION,
        db_path=str(Path(__file__).resolve().parent / "data" / "tasks.db"),
        default_port=DEFAULT_PORT,
        argv=argv,
    )


if __name__ == "__main__":
    raise SystemExit(main())
