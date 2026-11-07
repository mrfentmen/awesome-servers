"""Smoke test: launch the server over stdio and use every tool for real."""

from __future__ import annotations

import asyncio
import json
import os
import sys
import tempfile

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

MODEL = os.environ.get("STEERING_TEST_MODEL", "hf-internal-testing/tiny-random-LlamaForCausalLM")
PAIRS = [
    ("I love this", "I hate this"),
    ("This is great", "This is awful"),
    ("What a nice day", "What a bad day"),
    ("I feel happy", "I feel sad"),
]


def payload(result) -> dict:
    if result.isError:
        raise AssertionError(f"tool failed: {result.content[0].text}")
    return json.loads(result.content[0].text)


async def main() -> None:
    vectors_dir = tempfile.mkdtemp(prefix="steering-vectors-")
    env = dict(os.environ)
    env["STEERING_MCP_VECTORS_DIR"] = vectors_dir
    env.setdefault("TOKENIZERS_PARALLELISM", "false")
    params = StdioServerParameters(
        command=sys.executable,
        args=["-m", "activation_steering_mcp"],
        env=env,
    )
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = sorted(tool.name for tool in (await session.list_tools()).tools)
            expected = ["extract_steering_vector", "list_vectors", "steer_generate", "vector_info"]
            assert tools == expected, f"tools mismatch: {tools}"
            print(f"PASS tools={tools}")

            created = payload(
                await session.call_tool(
                    "extract_steering_vector",
                    {
                        "model": MODEL,
                        "positive": [p for p, _ in PAIRS],
                        "negative": [n for _, n in PAIRS],
                        "name": "smoke-vector",
                        "method": "pca_diff",
                    },
                )
            )
            assert created["name"] == "smoke-vector", created
            assert created["dimension"] > 0 and created["layers"], created
            print(f"PASS extract layers={created['layers']} dim={created['dimension']}")

            listed = payload(await session.call_tool("list_vectors", {}))
            assert listed["count"] == 1 and listed["vectors"][0]["name"] == "smoke-vector", listed
            print(f"PASS list count={listed['count']}")

            detail = payload(await session.call_tool("vector_info", {"name": "smoke-vector"}))
            assert detail["model"] == MODEL and detail["explained_variance"], detail
            print(f"PASS info layers={len(detail['explained_variance'])}")

            steered = payload(
                await session.call_tool(
                    "steer_generate",
                    {
                        "model": MODEL,
                        "vector": "smoke-vector",
                        "prompts": ["Hello there"],
                        "layers": [created["layers"][-1]],
                        "strength": 2.0,
                        "max_new_tokens": 8,
                        "baseline": True,
                    },
                )
            )
            row = steered["results"][0]
            assert isinstance(row["steered"], str) and row["steered"], row
            assert isinstance(row["baseline"], str), row
            print(f"PASS steer steered={row['steered'][:40]!r}")
            print(f"PASS baseline={row['baseline'][:40]!r}")

            missing = await session.call_tool("steer_generate", {"model": MODEL, "vector": "nope", "prompts": ["x"]})
            assert missing.isError, "missing vector should be an error"
            print("PASS missing vector returns an error")


if __name__ == "__main__":
    asyncio.run(main())
