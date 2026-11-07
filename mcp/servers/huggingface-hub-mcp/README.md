# huggingface-hub-mcp

Search and inspect Hugging Face models and datasets: downloads, likes, tags, parameters, file
lists and model cards. Keyless by default.

## Install

```bash
git clone https://github.com/mrfentmen/awesome-servers.git
cd awesome-servers/mcp/servers/huggingface-hub-mcp
npm install
npm run build
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "huggingface-hub": {
      "command": "node",
      "args": ["/absolute/path/to/huggingface-hub-mcp/dist/index.js"]
    }
  }
}
```

No key is needed. For private or gated repos, add an `HF_TOKEN` to the environment.

## Tools

| Tool | What it does |
| --- | --- |
| `search_models` | Find models by name, author or task |
| `search_datasets` | Find datasets by name or author |
| `model_info` | Stats, tags, parameters, config and files for one model |
| `dataset_info` | Stats, tags, description and files for one dataset |
| `list_files` | Every file in a repo at a revision, with sizes |
| `read_card` | The model or dataset README as text |

### search_models

- `query` — words in the name or description
- `author` — owner, e.g. `meta-llama`
- `task` — pipeline tag, e.g. `text-generation`
- `sort` — `downloads` (default), `likes`, `lastModified`, `createdAt`
- `limit` — 1 to 100, default 20

### search_datasets

Same as `search_models`, without `task`.

### model_info / dataset_info

```json
{ "repo": "bert-base-uncased" }
```

Returns `id`, `author`, `downloads`, `likes`, `tags`, `created_at`, `last_modified`, `gated`,
`file_count`, up to 300 files, and the card metadata. Models also include `pipeline_tag`,
`library_name`, `parameters` and `config`.

### list_files

- `repo`, `kind` (`model` or `dataset`), `revision` (default `main`)
- `path` — folder inside the repo; empty means the root
- `limit` — 1 to 2000, default 500

Follows Hugging Face pagination for up to 5 pages.

### read_card

- `repo`, `kind`, `revision`
- `max_chars` — 1,000 to 50,000, default 20,000

## Examples

```text
search_models(query="whisper", task="automatic-speech-recognition", sort="downloads")
model_info(repo="openai/whisper-large-v3")
list_files(repo="openai/whisper-large-v3", revision="main")
read_card(repo="openai/whisper-large-v3", max_chars=8000)
```

## Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `HF_TOKEN` | unset | Optional token for higher rate limits and gated/private repos |

The token is sent only to `huggingface.co` and is never printed or logged.

## Safety

- Every URL is checked to stay on `huggingface.co`; redirects to other hosts are not followed by
  this code.
- Repo ids, revisions and paths are validated. `..` is rejected.
- Responses are capped: 300 files in `model_info`, 2,000 entries in `list_files`, 50,000
  characters in `read_card`.
- No downloads. Only JSON metadata and README text are fetched.

## Limits

- Unauthenticated requests share a small rate limit. Set `HF_TOKEN` if you hit 429.
- Private repos need a token with access.
- `list_files` reads at most 5 pages of 1,000 entries.
- Model cards are truncated at `max_chars`.

## License

MIT.
