import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "spir-v",
  "displayName": "SPIR-V",
  "version": "1.0.0",
  "extensions": [
    ".spv",
    ".spvasm"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "entry-point",
      "pattern": "^\\s*OpEntryPoint\\s+\\w+\\s+%([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*%([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*OpFunction"
    },
    {
      "kind": "type",
      "pattern": "^\\s*%([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*OpType"
    }
  ],
  "imports": [
    {
      "kind": "ext-inst",
      "pattern": "^\\s*%([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*OpExtInstImport\\s+\"([^\"]+)\""
    }
  ],
  "scaffold": [
    {
      "path": "shaders/hello.spvasm",
      "content": "OpCapability Shader\nOpMemoryModel Logical GLSL450\nOpEntryPoint GLCompute %main \"main\"\n%void = OpTypeVoid\n%main = OpFunction %void None %label\n%label = OpLabel\nOpReturn\nOpFunctionEnd\n"
    },
    {
      "path": "tests/run.spvasm",
      "content": "OpCapability Shader\nOpMemoryModel Logical GLSL450\nOpEntryPoint GLCompute %main \"main\"\n"
    }
  ],
  "snippets": {
    "entry": {
      "description": "entry point",
      "body": "OpEntryPoint GLCompute %main \"main\""
    },
    "function": {
      "description": "function",
      "body": "%main = OpFunction %void None %label\n%label = OpLabel\nOpReturn\nOpFunctionEnd"
    },
    "type": {
      "description": "type",
      "body": "%uint = OpTypeInt 32 0"
    }
  },
  "reference": "SPIR-V syntax reference\n- Capability: OpCapability Shader\n- Memory model: OpMemoryModel Logical GLSL450\n- Entry point: OpEntryPoint GLCompute %main \"main\"\n- Function: %main = OpFunction %void None %label\n- Label: %label = OpLabel\n- Return: OpReturn; end: OpFunctionEnd\n- Type: %uint = OpTypeInt 32 0\n- Import: %ext = OpExtInstImport \"GLSL.std.450\"\n- Comment: ; line"
}
