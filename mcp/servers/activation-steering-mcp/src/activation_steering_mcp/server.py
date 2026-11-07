"""MCP tools for extracting and applying activation steering vectors."""

import os

from mcp.server.fastmcp import FastMCP

from . import store
from .engine import ACCUMULATE, METHODS, Engine, EngineError, default_layers

mcp = FastMCP("activation-steering")
_engine = Engine()

MAX_PAIRS = 256
MAX_PROMPTS = 16
MAX_TEXT = 4000


def _check_model(model: str) -> str:
    model = model.strip()
    if not model:
        raise EngineError("model must be a Hugging Face repo id or a local checkpoint path")
    return model


@mcp.tool()
def extract_steering_vector(
    model: str,
    positive: list[str],
    negative: list[str],
    name: str = "",
    method: str = "pca_pairwise",
    accumulate: str = "all",
    chat_template: bool | None = None,
) -> dict:
    """Extract a steering vector from contrastive prompt pairs and save it.

    positive and negative must have the same length. Each pair is one concept
    example, e.g. positive "I love this" against negative "I hate this".
    method: pca_pairwise (recommended), pca_center or pca_diff.
    accumulate: all tokens or last-token only.
    chat_template: null auto-detects; false forces raw text; true requires a template.
    """
    model = _check_model(model)
    if len(positive) != len(negative):
        raise EngineError("positive and negative must have the same number of items")
    if not positive:
        raise EngineError("at least one contrastive pair is required")
    if len(positive) > MAX_PAIRS:
        raise EngineError(f"at most {MAX_PAIRS} pairs are allowed per vector")
    pairs: list[tuple[str, str]] = []
    for index, (pos, neg) in enumerate(zip(positive, negative), start=1):
        pos, neg = pos.strip(), neg.strip()
        if not pos or not neg:
            raise EngineError(f"pair {index} has an empty side")
        if len(pos) > MAX_TEXT or len(neg) > MAX_TEXT:
            raise EngineError(f"pair {index} is longer than {MAX_TEXT} characters")
        pairs.append((pos, neg))
    if method not in METHODS:
        raise EngineError(f"method must be one of {', '.join(METHODS)}")
    if accumulate not in ACCUMULATE:
        raise EngineError(f"accumulate must be one of {', '.join(ACCUMULATE)}")
    vector_name = store.validate_name(name) if name else store.build_name(model)
    if store.exists(vector_name):
        raise EngineError(f"a vector named {vector_name!r} already exists; choose another name")
    _engine.load(model)
    vector = _engine.extract(pairs, method, accumulate, chat_template)
    meta = store.save(vector, vector_name, model, method, len(pairs))
    return meta


@mcp.tool()
def steer_generate(
    model: str,
    vector: str,
    prompts: list[str],
    layers: list[int] | None = None,
    strength: float = 1.5,
    max_new_tokens: int = 64,
    baseline: bool = False,
    chat_template: bool | None = None,
) -> dict:
    """Generate text with a saved steering vector applied to the model.

    layers defaults to the middle band of the model. strength scales the vector;
    start near 1.0-2.0 and raise it until the behaviour changes without breaking
    the text. baseline adds the unsteered answer for comparison.
    chat_template: null auto-detects; false forces raw text; true requires a template.
    """
    model = _check_model(model)
    if not prompts:
        raise EngineError("at least one prompt is required")
    if len(prompts) > MAX_PROMPTS:
        raise EngineError(f"at most {MAX_PROMPTS} prompts are allowed per call")
    cleaned = []
    for index, prompt in enumerate(prompts, start=1):
        prompt = prompt.strip()
        if not prompt:
            raise EngineError(f"prompt {index} is empty")
        if len(prompt) > MAX_TEXT:
            raise EngineError(f"prompt {index} is longer than {MAX_TEXT} characters")
        cleaned.append(prompt)
    if not 0.1 <= strength <= 10:
        raise EngineError("strength must be between 0.1 and 10")
    if not 1 <= max_new_tokens <= 512:
        raise EngineError("max_new_tokens must be between 1 and 512")
    _engine.load(model)
    saved = store.load(vector)
    if saved.model_type != _engine.model_type:
        raise EngineError(
            f"vector {vector!r} was built for {saved.model_type}, but {model} is {_engine.model_type}"
        )
    layer_ids = layers if layers is not None else default_layers(_engine.num_layers)
    outputs = _engine.generate(saved, layer_ids, strength, cleaned, max_new_tokens, baseline, chat_template)
    return {
        "model": model,
        "vector": vector,
        "layers": layer_ids,
        "strength": strength,
        "results": outputs,
    }


@mcp.tool()
def list_vectors() -> dict:
    """List saved steering vectors with model, method and layer count."""
    items = store.list_vectors()
    return {"count": len(items), "vectors": items}


@mcp.tool()
def vector_info(name: str) -> dict:
    """Show one saved vector, including per-layer explained variance."""
    return store.info(name)


def main() -> None:
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    mcp.run()


if __name__ == "__main__":
    main()
