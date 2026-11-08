import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "glimmer-ts",
  "displayName": "Glimmer TS",
  "version": "1.0.0",
  "extensions": [
    ".gts"
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
      "path": "src/demo.gts",
      "content": "import Component from '@glimmer/component';\nexport default class Demo extends Component {}\n"
    },
    {
      "path": "tests/run.gts",
      "content": "import Component from '@glimmer/component';\nexport default class Demo extends Component {}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "import Component from '@glimmer/component';\nexport default class Demo extends Component {}\n"
    }
  },
  "reference": "Glimmer TS syntax reference\n- Example: import Component from '@glimmer/component';\n- Comment: //\n- No CLI runner configured"
}
