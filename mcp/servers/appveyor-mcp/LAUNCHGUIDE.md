# Appveyor MCP

## Tagline
CI pipeline monitoring for GitLab and GitHub - no API key.

## Description
Watch your builds from your AI assistant: list recent CI pipelines, inspect one pipeline status and timings, see every job grouped by stage with its failure reason, measure success rate per branch, and follow GitHub Actions runs down to the failing step. No account or key. An independent MCP server. Not affiliated with or endorsed by AppVeyor.

## Setup Requirements
No setup for public projects. Setting GITLAB_TOKEN or GITHUB_TOKEN raises rate limits, but nothing here requires them.

## Category
Developer Tools

## Features

- List CI pipelines: List the most recent GitLab CI pipelines for a project, newest first, with status, branch, trigger, age and duration. No API key needed.
- Pipeline details: Fetch one CI pipeline by id: status, branch, commit, trigger source, timings and URL.
- Pipeline jobs by stage: Show every job in a pipeline grouped by stage, with status, duration and the failure reason, plus the first job you should look at when a build is red.
- CI success statistics: Measure a project's pipeline health over its recent runs: success rate, average duration, the flakiest branches and a plain verdict.
- Latest status for many projects: Check the newest pipeline of up to 10 projects at once and report a compact green or red build board with age and duration.
- GitHub Actions runs: List recent GitHub Actions workflow runs for a public repository with conclusion, branch, trigger event and attempt number.
- GitHub Actions jobs and failed steps: Show the jobs of a GitHub Actions run and name the exact step that failed, so you can go straight to the cause.

## Getting Started

- Ask your assistant about appveyor using this server once installed
- Tool: project_pipelines — List the most recent GitLab CI pipelines for a project, newest first, with status, branch, trigger, age and duration. No API key needed.
- Tool: pipeline_detail — Fetch one CI pipeline by id: status, branch, commit, trigger source, timings and URL.
- Tool: pipeline_jobs — Show every job in a pipeline grouped by stage, with status, duration and the failure reason, plus the first job you should look at when a build is red.
- Tool: ci_stats — Measure a project's pipeline health over its recent runs: success rate, average duration, the flakiest branches and a plain verdict.
- Tool: latest_ci_status — Check the newest pipeline of up to 10 projects at once and report a compact green or red build board with age and duration.
- Tool: github_workflow_runs — List recent GitHub Actions workflow runs for a public repository with conclusion, branch, trigger event and attempt number.
- Tool: github_jobs — Show the jobs of a GitHub Actions run and name the exact step that failed, so you can go straight to the cause.

## Tags
ci, builds, pipelines, gitlab, github, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/appveyor-mcp
