import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "glimmer-js",
  "displayName": "Glimmer JS",
  "version": "1.0.0",
  "extensions": [
    ".gjs"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*(?:export\\s+default\\s+)?class\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.gjs",
      "content": "import Component from '@glimmer/component';\nexport default class Demo extends Component {}\n"
    },
    {
      "path": "tests/run.gjs",
      "content": "import Component from '@glimmer/component';\nexport default class Demo extends Component {}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "import Component from '@glimmer/component';\nexport default class Demo extends Component {}\n"
    }
  },
  "reference": "Glimmer JS syntax reference\n- Example: import Component from '@glimmer/component';\n- Comment: //\n- Run: gjs {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
