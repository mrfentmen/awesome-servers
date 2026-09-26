# Greenhouse MCP

Job postings from the public Greenhouse boards API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `jobs`  List open jobs on a company Greenhouse board, with location, departments and job ids.
* `job`  Get one job posting on a Greenhouse board, including the full description text.
* `search_jobs`  Search a company Greenhouse board by title, location, department or office.
* `departments`  List the teams hiring on a Greenhouse board, ranked by number of open roles.
* `offices`  List the office locations on a Greenhouse board.
* `board`  Show a company Greenhouse board: name, open job count and the company intro.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Greenhouse API.
