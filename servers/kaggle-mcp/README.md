# kaggle-mcp

Drive Kaggle free-GPU kernels from any MCP client. Built for training loops:
push a kernel, poll status, read the failure log, fix, repush — no browser.

Tools: `kernel_status`, `kernel_list`, `kernel_log` (exception-first tail),
`kernel_push`, `dataset_list`, `dataset_status`.

Env: `KAGGLE_USERNAME` + `KAGGLE_KEY` (kaggle.com/settings, API section),
`KAGGLE_BIN` (path to kaggle CLI, default `kaggle`),
`KAGGLE_CONFIG_DIR` (default `~/.kaggle`).
