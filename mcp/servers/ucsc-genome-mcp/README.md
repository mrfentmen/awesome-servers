# UCSC Genome Browser

UCSC Genome Browser API: list genomes and chromosomes, fetch DNA sequence ranges and search genes - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ucsc-genome-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ucsc-genome-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ucsc-genome-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_genomes` | Genomes hosted by UCSC, optionally filtered by name, organism or description. |
| `list_chromosomes` | Chromosomes and scaffolds of one assembly, with sizes and the largest shown. |
| `get_sequence` | DNA sequence for a coordinate range, with length, GC content and N count. |
| `search_genome` | Search an assembly by gene or feature name and list the position matches with coordinates. |

## Data source

UCSC Genome Browser REST API (api.genome.ucsc.edu), no key required
