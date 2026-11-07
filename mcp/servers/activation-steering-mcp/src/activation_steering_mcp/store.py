"""Vector storage: one .svec plus a .json sidecar per steering vector."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

from activation_steering import SteeringVector

from .engine import EngineError

NAME_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")


def vectors_dir() -> Path:
    raw = os.environ.get("STEERING_MCP_VECTORS_DIR", "").strip()
    base = Path(raw).expanduser() if raw else Path.home() / ".local" / "share" / "activation-steering-mcp" / "vectors"
    base.mkdir(parents=True, exist_ok=True)
    return base


def validate_name(name: str) -> str:
    if not NAME_RE.match(name):
        raise EngineError("name must be 1-64 chars of lowercase letters, digits, '_' or '-', starting with a letter or digit")
    return name


def build_name(model_id: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", model_id.lower()).strip("-") or "vector"
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return validate_name(f"{slug[-40:]}-{stamp}")


def exists(name: str) -> bool:
    return (vectors_dir() / f"{name}.svec").exists()


def save(vector: SteeringVector, name: str, model_id: str, method: str, pairs: int) -> dict:
    name = validate_name(name)
    if exists(name):
        raise EngineError(f"a vector named {name!r} already exists; choose another name")
    directory = vectors_dir()
    vector.save(str(directory / name))
    layers = sorted(vector.directions)
    meta = {
        "name": name,
        "model": model_id,
        "model_type": vector.model_type,
        "method": method,
        "pairs": pairs,
        "layers": layers,
        "dimension": int(next(iter(vector.directions.values())).shape[0]),
        "mean_explained_variance": round(
            sum(vector.explained_variances.values()) / len(vector.explained_variances), 6
        ),
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    (directory / f"{name}.json").write_text(json.dumps(meta, indent=2) + "\n")
    return meta


def load(name: str) -> SteeringVector:
    name = validate_name(name)
    path = vectors_dir() / f"{name}.svec"
    if not path.exists():
        known = ", ".join(item["name"] for item in list_vectors()) or "none"
        raise EngineError(f"no vector named {name!r}; known vectors: {known}")
    return SteeringVector.load(str(path))


def list_vectors() -> list[dict]:
    items: list[dict] = []
    for sidecar in sorted(vectors_dir().glob("*.json")):
        try:
            items.append(json.loads(sidecar.read_text()))
        except (OSError, ValueError):
            continue
    return sorted(items, key=lambda item: item.get("created_at", ""), reverse=True)


def info(name: str) -> dict:
    name = validate_name(name)
    sidecar = vectors_dir() / f"{name}.json"
    if not sidecar.exists():
        raise EngineError(f"no vector named {name!r}")
    meta = json.loads(sidecar.read_text())
    vector = SteeringVector.load(str(vectors_dir() / name))
    meta["explained_variance"] = {
        str(layer): round(float(value), 6) for layer, value in sorted(vector.explained_variances.items())
    }
    return meta
