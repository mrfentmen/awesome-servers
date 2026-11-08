import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "shaderlab",
  "displayName": "ShaderLab",
  "version": "1.0.0",
  "extensions": [
    ".shader"
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
      "kind": "shader",
      "pattern": "^\\s*Shader\\s+\"([^\"]+)\""
    },
    {
      "kind": "subshader",
      "pattern": "^\\s*SubShader"
    },
    {
      "kind": "pass",
      "pattern": "^\\s*Pass"
    },
    {
      "kind": "property",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "shaders/demo.shader",
      "content": "Shader \"Demo/Simple\" {\n  SubShader {\n    Pass {\n      HLSLPROGRAM\n      ENDHLSL\n    }\n  }\n}\n"
    },
    {
      "path": "tests/run.shader",
      "content": "Shader \"Test/Simple\" {\n  SubShader {\n    Pass {\n    }\n  }\n}\n"
    }
  ],
  "snippets": {
    "shader": {
      "description": "shader",
      "body": "Shader \"Name/Shader\" {\n  SubShader {\n    Pass {\n    }\n  }\n}"
    },
    "property": {
      "description": "property",
      "body": "_Color (\"Color\", Color) = (1,1,1,1)"
    },
    "include": {
      "description": "include",
      "body": "#include \"UnityCG.cginc\""
    }
  },
  "reference": "ShaderLab syntax reference\n- Shader: Shader \"Name/Shader\" { ... }\n- Properties: Properties { _Color (\"Color\", Color) = (1,1,1,1) }\n- SubShader: SubShader { ... }\n- Pass: Pass { ... }\n- Program: HLSLPROGRAM ... ENDHLSL\n- Include: #include \"file.cginc\"\n- Comment: // line; /* block */\n- Use: Unity material shader"
}
