# @mrfentmen/maven-central-mcp

Maven Central: artifact search, version history, group listings, class lookup, copy-paste dependency blocks.

Data source: https://search.maven.org (no key). No API key needed. Runs on stdio.

## Tools

| Tool | What it does |
|---|---|
| `search_artifacts` | Solr query search, plain words or g:/a:/fc: fields. |
| `artifact_versions` | Published versions with dates, newest first. |
| `latest_version` | Latest version and last update for one artifact. |
| `group_artifacts` | Every artifact under a groupId. |
| `search_by_class` | Find the artifact that ships a given Java class. |
| `dependency_snippet` | pom.xml and build.gradle blocks, latest version by default. |

## Install

```bash
npx -y @mrfentmen/maven-central-mcp
```

Claude Desktop / Cursor config:

```json
{
  "mcpServers": {
    "maven-central-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/maven-central-mcp"] }
  }
}
```

## Example prompts

- latest version of guava
- what artifact has org.slf4j.Logger

## Notes

Responses are plain text, trimmed to the fields that matter. Failures come back as a
readable message (bad name, upstream timeout, not found) instead of a stack trace.

MIT licensed.
