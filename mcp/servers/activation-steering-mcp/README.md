# activation-steering-mcp

MCP server for [IBM activation-steering](https://github.com/IBM/activation-steering): build a
steering vector from contrastive prompts, then steer a local Hugging Face model with it.

Runs entirely on your machine. No API keys, no accounts, no cloud calls except the one-time
model download from Hugging Face.

## Requirements

- Python 3.10 - 3.12
- 8 GB RAM for small models (7B needs ~14 GB in float32)
- `torch` 2.3+ on Linux and Apple Silicon. Intel macOS tops out at torch 2.2.2; see Troubleshooting.

## Install

```bash
git clone https://github.com/mrfentmen/awesome-servers.git
cd awesome-servers/mcp/servers/activation-steering-mcp
uv venv --python 3.12
source .venv/bin/activate
uv pip install -e .
```

The first tool call downloads the model you name (about 500 MB for `gpt2`).

## Use with an MCP client

```json
{
  "mcpServers": {
    "activation-steering": {
      "command": "/absolute/path/to/.venv/bin/activation-steering-mcp"
    }
  }
}
```

The server speaks stdio. All library output is kept off stdout.

## Tools

| Tool | What it does |
| --- | --- |
| `extract_steering_vector` | Build a vector from positive/negative prompt pairs, save it, return its layers and dimension |
| `steer_generate` | Generate with a saved vector applied, optionally next to an unsteered baseline |
| `steer_generate_conditional` | Generate, but apply the vector only when a condition vector fires |
| `list_vectors` | List saved vectors with model, method and layer count |
| `vector_info` | One vector's metadata plus per-layer explained variance |

### extract_steering_vector

- `model` — Hugging Face repo id or local checkpoint path
- `positive` / `negative` — equal-length lists of contrastive texts
- `name` — optional; lowercase letters, digits, `_` and `-`
- `method` — `pca_pairwise` (default), `pca_center`, `pca_diff`
- `accumulate` — `all` tokens (default) or `last-token`
- `chat_template` — `null` auto-detects, `false` uses raw text, `true` requires a template

### steer_generate

- `model`, `vector`, `prompts`
- `layers` — defaults to the middle band of the model
- `strength` — 0.1 to 10; start at 1.5
- `max_new_tokens` — 1 to 512
- `baseline` — add the unsteered answer for comparison
- `chat_template` — `null` auto-detects, `false` uses raw text, `true` requires a template

### steer_generate_conditional

- `model`, `vector`, `condition_vector`, `prompts`
- `condition_threshold` — cosine cutoff, -1 to 1; default 0.0
- `fire_when` — `below` (default) applies the vector when similarity is under the threshold, `above` when over
- `condition_layers` — layers used to score the condition; defaults to the middle band
- `condition_comparison` — `mean` over tokens (default) or `last` token
- `strength`, `max_new_tokens`, `baseline`, `chat_template` — same as `steer_generate`

Train the condition vector the same way as a behaviour vector: positive examples are the
prompts that should trigger it, negative examples are prompts that should not. Tune the
threshold on real prompts; the upstream `find_best_condition_point` helper does a grid search
if you need it.

## Example

```
extract_steering_vector(
  model="gpt2",
  positive=["I love this", "This is great", "What a nice day"],
  negative=["I hate this", "This is awful", "What a bad day"],
  name="positivity"
)

steer_generate(
  model="gpt2",
  vector="positivity",
  prompts=["The weather today is"],
  strength=2.0,
  baseline=true
)

steer_generate_conditional(
  model="gpt2",
  vector="positivity",
  condition_vector="weather",
  prompts=["The weather today is", "Two plus two is"],
  condition_threshold=0.05,
  fire_when="above",
  baseline=true
)
```

## Environment variables

Copy `.env.example` to `.env` if you want to change the defaults. All are optional.

| Variable | Default | Meaning |
| --- | --- | --- |
| `STEERING_MCP_VECTORS_DIR` | `~/.local/share/activation-steering-mcp/vectors` | Where `.svec` files and sidecars live |
| `STEERING_MCP_DEVICE` | `auto` | `cpu`, `cuda`, `mps` or `auto` |
| `STEERING_MCP_DTYPE` | `float32` | `float32` or `float16` (GPU only) |
| `HF_HOME` | Hugging Face default | Model cache location |

## How it works

1. Each positive/negative pair is run through the model and the hidden state at every layer is
   collected.
2. A one-component PCA per layer turns those states into a direction (the steering vector).
3. `steer_generate` wraps the model's layers and adds `strength * direction` to the residual
   stream while generating.

A vector is tied to a model family: it records `model_type` and the server refuses to apply it
to a different architecture.

## Limits

- CPU generation is slow. A GPU or Apple Silicon helps.
- Layer choice matters. If nothing changes, try another band of layers before raising strength.
- Very high strength degrades text quality; that is expected.
- The vector is only as good as the contrast pairs. Use matched pairs that differ in the one
  behaviour you want.

## Troubleshooting

**Intel macOS:** torch stops at 2.2.2, but the library metadata asks for 2.3.1. It works on
2.2.2; install it explicitly:

```bash
uv pip install "numpy<2" "torch==2.2.2" "transformers<4.50"
uv pip install --no-deps -e .
```

**`could not load model`:** check the repo id, or that the local path contains `config.json`
and weights. Gated models need `huggingface-cli login`.

**Vector refused for a model:** the vector was built for another architecture. Extract a new
one with the target model.

## License

MIT. The wrapped library is MIT too.
