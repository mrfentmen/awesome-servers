# appveyor-mcp

CI pipeline monitoring for GitLab and GitHub - no API key.

## Tools

- `project_pipelines` — List the most recent GitLab CI pipelines for a project, newest first, with status, branch, trigger, age and duration. No API key needed.
- `pipeline_detail` — Fetch one CI pipeline by id: status, branch, commit, trigger source, timings and URL.
- `pipeline_jobs` — Show every job in a pipeline grouped by stage, with status, duration and the failure reason, plus the first job you should look at when a build is red.
- `ci_stats` — Measure a project's pipeline health over its recent runs: success rate, average duration, the flakiest branches and a plain verdict.
- `latest_ci_status` — Check the newest pipeline of up to 10 projects at once and report a compact green or red build board with age and duration.
- `github_workflow_runs` — List recent GitHub Actions workflow runs for a public repository with conclusion, branch, trigger event and attempt number.
- `github_jobs` — Show the jobs of a GitHub Actions run and name the exact step that failed, so you can go straight to the cause.
- `project_releases` — List a GitLab project's published releases newest first: tag, release date, author, commit, changelog headline and how many archives and binary links ship with it.
- `repo_languages` — Show which languages a public GitHub repository is written in, with the size and share of each, so you can see the stack a project is built on.

## Setup

No setup for public projects. Setting GITLAB_TOKEN or GITHUB_TOKEN raises rate limits, but nothing here requires them.

Every tool on this server is free. Nothing needs a license key.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
