# AlphaFold MCP

Keyless MCP server for AlphaFold: protein structure predictions by UniProt accession, confidence scores, model file links.

Pairs well with `uniprot-mcp` (find the accession), `rcsb-pdb-mcp`, and `reactome-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_prediction`: Confidence scores, pipeline, dates for an accession.
- `model_files`: Direct mmCIF/PDB/PAE links plus entry page.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

## Tools

* `get_prediction`  Get prediction.
* `model_files`  Model files.
* `format_prediction`  Format prediction.
* `proteinIdentity`  Protein identity.
* `confidence_profile`  Confidence profile.
* `model_versions`  Model versions.
* `pae_summary`  PAE summary.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
