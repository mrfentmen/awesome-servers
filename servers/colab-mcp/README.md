# colab-mcp

Drive Google Colab GPUs from any MCP client. Create runtimes, open sessions,
execute training code — no browser.

Tools: `subscription`, `list_runtimes`, `list_runtime_specs`,
`create_runtime`, `create_session`, `execute_code` (pass execution_id to
reattach to long jobs).

Env: `COLAB_TOKEN` (Google OAuth access token with colaboratory scope —
`gcloud auth login`, then `gcloud auth print-access-token`).
