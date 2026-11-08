import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "hlsl",
  "displayName": "HLSL",
  "version": "1.0.0",
  "extensions": [
    ".hlsl",
    ".fx",
    ".fxh",
    ".hlsli"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*(?:float[234]?|int|void|half)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "cbuffer",
      "pattern": "^\\s*cbuffer\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "texture",
      "pattern": "^\\s*Texture2D\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s*[<\"]([^>\"]+)[>\"]"
    }
  ],
  "scaffold": [
    {
      "path": "shaders/hello.hlsl",
      "content": "struct VSInput {\n  float3 position : POSITION;\n};\n\nfloat4 main(VSInput input) : SV_POSITION {\n  return float4(input.position, 1.0);\n}\n"
    },
    {
      "path": "shaders/pixel.hlsl",
      "content": "float4 main() : SV_Target {\n  return float4(1.0, 0.0, 0.0, 1.0);\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "float4 name(float4 value) : SV_Target {\n  return value;\n}"
    },
    "cbuffer": {
      "description": "cbuffer",
      "body": "cbuffer Constants : register(b0) {\n  float4x4 transform;\n}"
    },
    "texture": {
      "description": "texture",
      "body": "Texture2D colorTexture : register(t0);"
    }
  },
  "reference": "HLSL syntax reference\n- Function: float4 main() : SV_Target { ... }\n- Struct: struct VSInput { float3 position : POSITION; };\n- Cbuffer: cbuffer Constants : register(b0) { ... }\n- Texture: Texture2D colorTexture : register(t0);\n- Sampler: SamplerState linearSampler : register(s0);\n- Include: #include \"file.hlsl\"\n- Comment: // line; /* block */\n- Compile: dxc -T ps_6_0 file.hlsl"
}
