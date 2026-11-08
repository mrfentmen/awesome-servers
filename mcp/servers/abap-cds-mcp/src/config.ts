import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "abap-cds",
  "displayName": "ABAP CDS",
  "version": "1.0.0",
  "extensions": [
    ".asddls"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "'"
  ],
  "symbols": [
    {
      "kind": "entity",
      "pattern": "^\\s*define\\s+view\\s+entity\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "view",
      "pattern": "^\\s*define\\s+view\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "association",
      "pattern": "^\\s*association\\s+\\[[^\\]]+\\]\\s+to\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "annotation",
      "pattern": "^\\s*@([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "imports": [
    {
      "kind": "using",
      "pattern": "^\\s*using\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/ZDemo.asddls",
      "content": "define view entity ZDemo\n  as select from ztable\n{\n  key id,\n  name\n}\n"
    }
  ],
  "snippets": {
    "entity": {
      "description": "view entity",
      "body": "define view entity ZName\n  as select from ztable\n{\n  key id,\n  name\n}"
    },
    "association": {
      "description": "association",
      "body": "association [0..1] to ZOther as _other on $projection.id = _other.id"
    },
    "annotation": {
      "description": "annotation",
      "body": "@AbapCatalog.sqlViewName: 'ZNAME'"
    }
  },
  "reference": "ABAP CDS syntax reference\n- Entity: define view entity ZName as select from ztable { ... }\n- View: define view ZName as select from ztable { ... }\n- Field: key id, name\n- Association: association [0..1] to ZOther as _other on ...\n- Annotation: @AbapCatalog.sqlViewName: 'ZNAME'\n- Select: as select from ztable\n- Join: left outer join zother on ...\n- Comment: // line"
}
