import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "supercollider",
  "displayName": "SuperCollider",
  "version": "1.0.0",
  "extensions": [
    ".sc",
    ".scd"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "\\b(?:function|def|fn|fun|func|proc|procedure|sub|method|class|struct|enum|module|namespace|type|interface|trait|record|object)\\s+([A-Za-z_]\\w*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:[A-Za-z_][\\w<>\\[\\]]*\\s+)+([A-Za-z_]\\w*)\\s*\\("
    },
    {
      "kind": "value",
      "pattern": "^([A-Za-z_]\\w*)\\s*(?::=|=|:)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.sc",
      "content": "SynthDef(\\demo, { SinOsc.ar(440) }).add;\n"
    },
    {
      "path": "tests/run.sc",
      "content": "SynthDef(\\demo, { SinOsc.ar(440) }).add;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "SynthDef(\\demo, { SinOsc.ar(440) }).add;\n"
    }
  },
  "reference": "SuperCollider syntax reference\n- Example: SynthDef(\\demo, { SinOsc.ar(440) }).add;\n- Comment: //\n- No CLI runner configured"
}
