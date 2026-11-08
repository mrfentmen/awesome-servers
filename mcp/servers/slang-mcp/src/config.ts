import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "slang",
  "displayName": "Slang",
  "version": "1.0.0",
  "extensions": [
    ".slang"
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
      "pattern": "^\\s*(?:void|float[234]?|int|half)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "extension",
      "pattern": "^\\s*extension\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "scaffold": [
    {
      "path": "shaders/hello.slang",
      "content": "struct VSInput {\n  float3 position;\n};\n\n[shader(\"vertex\")]\nfloat4 vertexMain(VSInput input) : SV_Position {\n  return float4(input.position, 1.0);\n}\n"
    },
    {
      "path": "shaders/pixel.slang",
      "content": "[shader(\"fragment\")]\nfloat4 fragmentMain() : SV_Target {\n  return float4(1.0, 0.0, 0.0, 1.0);\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "float4 name(float4 value) : SV_Target {\n  return value;\n}"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name {\n  float3 value;\n};"
    },
    "shader": {
      "description": "shader entry",
      "body": "[shader(\"fragment\")]\nfloat4 main() : SV_Target {\n  return float4(1.0);\n}"
    }
  },
  "reference": "Slang syntax reference\n- Function: float4 main() : SV_Target { ... }\n- Struct: struct Name { float3 value; };\n- Shader: [shader(\"fragment\")]\n- Interface: interface IName { float4 get(); }\n- Extension: extension Name { ... }\n- Import: import module_name;\n- Comment: // line; /* block */\n- Compile: slangc file.slang"
}
