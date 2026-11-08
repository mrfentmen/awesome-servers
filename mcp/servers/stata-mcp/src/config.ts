import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "stata",
  "displayName": "Stata",
  "version": "1.0.0",
  "extensions": [
    ".do",
    ".ado",
    ".doh"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "program",
      "pattern": "^\\s*program\\s+(?:define\\s+)?([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:gen|generate|egen)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "local",
      "pattern": "^\\s*local\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "global",
      "pattern": "^\\s*global\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "do",
      "pattern": "^\\s*do\\s+[\"']?([^\"'\\s]+)"
    },
    {
      "kind": "run",
      "pattern": "^\\s*run\\s+[\"']?([^\"'\\s]+)"
    }
  ],
  "scaffold": [
    {
      "path": "do/demo.do",
      "content": "program define demo\n    display 2 + 2\nend\n\ndemo\n"
    },
    {
      "path": "tests/run.do",
      "content": "if 2 + 2 != 4 {\n    display as error \"math failed\"\n    exit 1\n}\ndisplay \"ok\"\n"
    }
  ],
  "snippets": {
    "program": {
      "description": "program",
      "body": "program define name\n    display 1\nend"
    },
    "loop": {
      "description": "foreach",
      "body": "foreach item in a b c {\n    display \"`item'\"\n}"
    },
    "import": {
      "description": "use dataset",
      "body": "use \"data.dta\", clear"
    }
  },
  "reference": "Stata syntax reference\n- Program: program define name ... end\n- Variable: gen name = value\n- Local: local name value; display \"`name'\"\n- Global: global name value; display \"$name\"\n- Conditional: if condition { ... }\n- Loop: foreach item in a b c { ... }\n- Use data: use \"data.dta\", clear\n- Do file: do \"file.do\"\n- Comment: // line\n- Run: stata -b do file.do"
}
