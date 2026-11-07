"""Thin engine around IBM activation-steering.

One model is kept in memory at a time. All library calls are wrapped so the
library's rich console output does not reach stdout, which carries the MCP
protocol.
"""

from __future__ import annotations

import contextlib
import io
import math
import os
import sys
import threading
from typing import TYPE_CHECKING, Iterable, Sequence

import torch
from rich.console import Console
from transformers import AutoModelForCausalLM, AutoTokenizer

from activation_steering import MalleableModel, SteeringDataset, SteeringVector
from activation_steering.config import GlobalConfig

# The library logs chat-templated text such as [INST] through rich markup, which
# raises MarkupError, and it logs to stdout, which is the MCP transport. Send its
# console to stderr with markup disabled.
GlobalConfig.console = Console(file=sys.stderr, markup=False, highlight=False, soft_wrap=True)

if TYPE_CHECKING:
    from activation_steering import SteeringVector as SteeringVectorType

METHODS = ("pca_pairwise", "pca_center", "pca_diff")
ACCUMULATE = ("all", "last-token")
FIRE_WHEN = ("below", "above")
COMPARISON_MODES = ("mean", "last")


class EngineError(RuntimeError):
    """An error the tool layer can show to the caller as-is."""


@contextlib.contextmanager
def _quiet():
    """Keep library prints off stdout, which is the MCP transport."""
    with contextlib.redirect_stdout(io.StringIO()):
        yield


def resolve_device(preference: str) -> str:
    """Pick a device, honouring an explicit request when it is available."""
    preference = (preference or "auto").strip().lower()
    if preference == "auto":
        if torch.cuda.is_available():
            return "cuda"
        if torch.backends.mps.is_available():
            return "mps"
        return "cpu"
    if preference == "cuda" and not torch.cuda.is_available():
        raise EngineError("CUDA was requested but is not available on this machine")
    if preference == "mps" and not torch.backends.mps.is_available():
        raise EngineError("MPS was requested but is not available on this machine")
    if preference not in ("cpu", "cuda", "mps"):
        raise EngineError(f"unknown device {preference!r}; use auto, cpu, cuda or mps")
    return preference


def default_layers(num_layers: int) -> list[int]:
    """Middle band of layers, where behaviour directions usually steer best."""
    if num_layers <= 1:
        return [0]
    start = max(1, int(num_layers * 0.45))
    end = min(num_layers - 1, int(num_layers * 0.72))
    if end < start:
        start = end = num_layers - 1
    return list(range(start, end + 1))


def _clean(text: str) -> str:
    return text.strip()


class Engine:
    """Owns the loaded model, its tokenizer and the steering wrapper."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._model_id: str | None = None
        self._model: AutoModelForCausalLM | None = None
        self._tokenizer = None
        self._malleable: MalleableModel | None = None
        self._chat_template = False

    @property
    def model_id(self) -> str | None:
        return self._model_id

    @property
    def num_layers(self) -> int:
        if self._model is None:
            raise EngineError("no model is loaded")
        return int(self._model.config.num_hidden_layers)

    @property
    def model_type(self) -> str:
        if self._model is None:
            raise EngineError("no model is loaded")
        return str(self._model.config.model_type)

    def load(self, model_id: str) -> None:
        """Load a local checkpoint or Hugging Face repo id, replacing any current model."""
        if self._model_id == model_id:
            return
        device = resolve_device(os.environ.get("STEERING_MCP_DEVICE", "auto"))
        dtype = os.environ.get("STEERING_MCP_DTYPE", "float32").strip().lower()
        if dtype not in ("float32", "float16"):
            raise EngineError("STEERING_MCP_DTYPE must be float32 or float16")
        torch_dtype = torch.float16 if dtype == "float16" else torch.float32
        with self._lock, _quiet():
            try:
                model = AutoModelForCausalLM.from_pretrained(model_id, torch_dtype=torch_dtype)
                tokenizer = AutoTokenizer.from_pretrained(model_id)
            except Exception as exc:  # network, missing files, bad architecture
                raise EngineError(f"could not load model {model_id!r}: {exc}") from exc
            model.to(device)
            model.eval()
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            model.generation_config.pad_token_id = tokenizer.pad_token_id
            self._model = model
            self._tokenizer = tokenizer
            self._malleable = None
            self._chat_template = self._probe_chat_template(tokenizer)
            self._model_id = model_id

    @staticmethod
    def _probe_chat_template(tokenizer) -> bool:
        """Some checkpoints ship a template that cannot render one user turn."""
        if tokenizer.chat_template is None:
            return False
        try:
            tokenizer.apply_chat_template([{"role": "user", "content": "ping"}], tokenize=False)
        except Exception:
            return False
        return True

    @property
    def chat_template_available(self) -> bool:
        return self._chat_template

    def _check_layers(self, layers: Iterable[int], label: str) -> list[int]:
        layer_ids = list(layers)
        if not layer_ids:
            raise EngineError(f"{label} must contain at least one layer")
        if min(layer_ids) < 0 or max(layer_ids) >= self.num_layers:
            raise EngineError(f"{label} must be between 0 and {self.num_layers - 1}")
        return layer_ids

    @staticmethod
    def _check_vector_layers(vector: "SteeringVectorType", layers: Iterable[int], label: str) -> None:
        missing = [layer for layer in layers if layer not in vector.directions]
        if missing:
            raise EngineError(f"the vector has no direction for {label} {missing}")

    def _generation_settings(self, max_new_tokens: int) -> dict:
        if self._tokenizer is None:
            raise EngineError("no model is loaded")
        return {
            "pad_token_id": self._tokenizer.pad_token_id or self._tokenizer.eos_token_id,
            "do_sample": False,
            "max_new_tokens": max_new_tokens,
            "repetition_penalty": 1.1,
        }

    def _ensure_unwrapped(self) -> None:
        if self._malleable is not None:
            self._malleable.unwrap()
            self._malleable = None

    def extract(
        self,
        pairs: Sequence[tuple[str, str]],
        method: str,
        accumulate: str,
        chat_template: bool | None = None,
    ) -> "SteeringVectorType":
        """Train a steering vector from contrastive prompt pairs."""
        if method not in METHODS:
            raise EngineError(f"method must be one of {', '.join(METHODS)}")
        if accumulate not in ACCUMULATE:
            raise EngineError("accumulate must be 'all' or 'last-token'")
        use_chat = self.chat_template_available if chat_template is None else chat_template
        if use_chat and not self.chat_template_available:
            raise EngineError("this tokenizer has no usable chat template; pass chat_template=false")
        with self._lock, _quiet():
            self._ensure_unwrapped()
            if self._model is None or self._tokenizer is None:
                raise EngineError("no model is loaded")
            dataset = SteeringDataset(
                tokenizer=self._tokenizer,
                examples=list(pairs),
                suffixes=None,
                disable_suffixes=True,
                use_chat_template=use_chat,
            )
            vector = SteeringVector.train(
                model=self._model,
                tokenizer=self._tokenizer,
                steering_dataset=dataset,
                method=method,
                accumulate_last_x_tokens="all" if accumulate == "all" else 1,
            )
            # The library stores numpy float32 values, which json.dump rejects.
            vector.explained_variances = {
                int(layer): float(value) for layer, value in vector.explained_variances.items()
            }
            return vector

    def generate(
        self,
        vector: "SteeringVectorType",
        layers: Iterable[int],
        strength: float,
        prompts: Sequence[str],
        max_new_tokens: int,
        baseline: bool,
        chat_template: bool | None = None,
    ) -> list[dict[str, str | None]]:
        """Generate with the vector applied, optionally next to an unsteered baseline."""
        use_chat = self.chat_template_available if chat_template is None else chat_template
        if use_chat and not self.chat_template_available:
            raise EngineError("this tokenizer has no usable chat template; pass chat_template=false")
        if self._model is None or self._tokenizer is None:
            raise EngineError("no model is loaded")
        layer_ids = self._check_layers(layers, "layers")
        self._check_vector_layers(vector, layer_ids, "layers")
        settings = self._generation_settings(max_new_tokens)
        results: list[dict[str, str | None]] = []
        with self._lock, _quiet():
            malleable = self._malleable or MalleableModel(model=self._model, tokenizer=self._tokenizer)
            self._malleable = malleable
            for prompt in prompts:
                plain: str | None = None
                if baseline:
                    malleable.steer(behavior_vector=None)
                    plain = _clean(
                        malleable.respond(
                            prompt,
                            settings=settings,
                            use_chat_template=use_chat,
                        )
                    )
                malleable.steer(
                    behavior_vector=vector,
                    behavior_layer_ids=layer_ids,
                    behavior_vector_strength=strength,
                )
                steered = _clean(
                    malleable.respond(
                        prompt,
                        settings=settings,
                        use_chat_template=use_chat,
                    )
                )
                results.append({"prompt": prompt, "steered": steered, "baseline": plain})
        return results

    def generate_conditional(
        self,
        vector: "SteeringVectorType",
        condition_vector: "SteeringVectorType",
        layers: Iterable[int],
        condition_layers: Iterable[int],
        strength: float,
        threshold: float,
        fire_when: str,
        comparison_mode: str,
        prompts: Sequence[str],
        max_new_tokens: int,
        baseline: bool,
        chat_template: bool | None = None,
    ) -> list[dict[str, str | None]]:
        """Generate with the behaviour applied only when the condition fires.

        Upstream names its comparator backwards: its "larger" fires when the
        similarity is below the threshold and its "smaller" fires above it.
        """
        use_chat = self.chat_template_available if chat_template is None else chat_template
        if use_chat and not self.chat_template_available:
            raise EngineError("this tokenizer has no usable chat template; pass chat_template=false")
        if fire_when not in FIRE_WHEN:
            raise EngineError("fire_when must be 'below' or 'above'")
        if comparison_mode not in COMPARISON_MODES:
            raise EngineError("comparison_mode must be 'mean' or 'last'")
        if not math.isfinite(threshold):
            raise EngineError("condition_threshold must be a finite number")
        if self._model is None or self._tokenizer is None:
            raise EngineError("no model is loaded")
        layer_ids = self._check_layers(layers, "layers")
        condition_layer_ids = self._check_layers(condition_layers, "condition_layers")
        self._check_vector_layers(vector, layer_ids, "layers")
        self._check_vector_layers(condition_vector, condition_layer_ids, "condition_layers")
        comparator = "smaller" if fire_when == "above" else "larger"
        settings = self._generation_settings(max_new_tokens)
        results: list[dict[str, str | None]] = []
        with self._lock, _quiet():
            malleable = self._malleable or MalleableModel(model=self._model, tokenizer=self._tokenizer)
            self._malleable = malleable
            for prompt in prompts:
                plain: str | None = None
                if baseline:
                    malleable.steer(behavior_vector=None)
                    plain = _clean(
                        malleable.respond(
                            prompt,
                            settings=settings,
                            use_chat_template=use_chat,
                        )
                    )
                malleable.steer(
                    behavior_vector=vector,
                    behavior_layer_ids=layer_ids,
                    behavior_vector_strength=strength,
                    condition_vector=condition_vector,
                    condition_layer_ids=condition_layer_ids,
                    condition_vector_threshold=threshold,
                    condition_comparator_threshold_is=comparator,
                    condition_threshold_comparison_mode=comparison_mode,
                )
                steered = _clean(
                    malleable.respond(
                        prompt,
                        settings=settings,
                        use_chat_template=use_chat,
                    )
                )
                results.append({"prompt": prompt, "steered": steered, "baseline": plain})
        return results
