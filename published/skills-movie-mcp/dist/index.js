#!/usr/bin/env node
// src/index.ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

// src/skills.ts
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
var REPO_URL = "https://github.com/mrfentmen/skills-2.git";
var CACHE_ROOT = process.env.SKILLS_CACHE_DIR || join(process.cwd(), ".cache");
var REPO_DIR = process.env.SKILLS_REPO_DIR || join(CACHE_ROOT, "skills-2");
var DIRECTOR_IDS = /* @__PURE__ */ new Set([
  // original + first batch
  "james-cameron",
  "walt-disney",
  "john-woo",
  "wong-kar-wai",
  "tarantino",
  "kubrick",
  "nolan",
  // directors batch
  "hitchcock",
  "fincher",
  "kurosawa",
  "spielberg",
  "orson-welles",
  "george-miller",
  "jordan-peele",
  "ang-lee",
  "david-lynch"
]);
var ACTOR_IDS = /* @__PURE__ */ new Set([
  "jackie-chan",
  "daniel-day-lewis",
  "meryl-streep",
  "denzel-washington",
  "al-pacino",
  "brad-pitt",
  "angelina-jolie",
  "tom-hanks",
  "anthony-hopkins"
]);
function categorize(id) {
  if (DIRECTOR_IDS.has(id)) return "director";
  if (ACTOR_IDS.has(id)) return "actor";
  return "other";
}
function ensureRepo() {
  const forceClone = process.env.SKILLS_FORCE_CLONE === "1";
  if (!existsSync(REPO_DIR)) {
    mkdirSync(CACHE_ROOT, { recursive: true });
    log(`cloning ${REPO_URL} -> ${REPO_DIR}`);
    execSync(`git clone --depth 1 ${REPO_URL} "${REPO_DIR}"`, { stdio: "pipe" });
  } else if (forceClone) {
    log("SKILLS_FORCE_CLONE=1, refreshing repo");
    try {
      execSync(`git -C "${REPO_DIR}" pull --ff-only`, { stdio: "pipe" });
    } catch (err) {
      log(`pull failed, leaving existing checkout: ${err.message}`);
    }
  }
  return REPO_DIR;
}
function log(msg) {
  console.error(`[skills-movie-mcp] ${msg}`);
}
function extractTitle(raw, fallback) {
  const m = raw.match(/^#\s+(.+)$/m);
  if (!m) return fallback;
  return m[1].replace(/\s+Skill\s*$/i, "").trim();
}
function extractIdentity(raw) {
  const m = raw.match(/You are ([^\n]+)/);
  return m ? m[1].trim() : "";
}
function extractFrontmatterDescription(raw) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return "";
  const dm = fm[1].match(/description:\s*>?-?\s*([\s\S]*?)(?:\nname:|\ntriggers:|$)/);
  if (!dm) return "";
  return dm[1].replace(/\s+/g, " ").trim();
}
function parseSkill(filePath, id) {
  const raw = readFileSync(filePath, "utf8");
  const category = categorize(id);
  return {
    id,
    title: extractTitle(raw, id),
    identity: extractIdentity(raw),
    raw,
    description: extractFrontmatterDescription(raw),
    path: filePath,
    category,
    isFilmmaker: category !== "other"
  };
}
var cachedSkills = null;
function loadSkills() {
  if (cachedSkills) return cachedSkills;
  const repoDir = ensureRepo();
  const skills = /* @__PURE__ */ new Map();
  for (const entry of readdirSync(repoDir)) {
    if (entry.startsWith(".")) continue;
    const dir = join(repoDir, entry);
    if (!statSync(dir).isDirectory()) continue;
    const skillFile = join(dir, "SKILL.md");
    if (!existsSync(skillFile)) continue;
    try {
      skills.set(entry, parseSkill(skillFile, entry));
    } catch (err) {
      log(`failed to parse ${skillFile}: ${err.message}`);
    }
  }
  cachedSkills = skills;
  const directors = [...skills.values()].filter((s) => s.category === "director").length;
  const actors = [...skills.values()].filter((s) => s.category === "actor").length;
  log(`loaded ${skills.size} skills (${directors} directors, ${actors} actors)`);
  return skills;
}
function getSkill(id) {
  return loadSkills().get(id);
}
function listSkills(category) {
  const all = [...loadSkills().values()];
  const filtered = category ? all.filter((s) => s.category === category) : all.filter((s) => s.isFilmmaker);
  return filtered.sort((a, b) => a.title.localeCompare(b.title));
}
function listAllSkills() {
  return [...loadSkills().values()].sort((a, b) => a.title.localeCompare(b.title));
}

// src/screenplay.ts
import { writeFileSync, mkdirSync as mkdirSync2 } from "node:fs";
import { join as join2 } from "node:path";
var current = null;
function estimatePages(body) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(0.1, Math.round(words / 190 * 10) / 10);
}
function newScreenplay(opts) {
  current = {
    title: opts.title,
    logline: opts.logline ?? "",
    director: opts.director,
    blendedDirectors: opts.blendedDirectors ?? [],
    targetPages: opts.targetPages ?? 100,
    scenes: [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return current;
}
function addScene(input) {
  if (!current) {
    current = newScreenplay({ title: "Untitled Screenplay" });
  }
  const scene = {
    number: current.scenes.length + 1,
    slug: input.slug,
    director: input.director ?? current.director,
    body: input.body,
    pages: input.pages ?? estimatePages(input.body)
  };
  current.scenes.push(scene);
  return scene;
}
function status() {
  if (!current) {
    return {
      title: "(none)",
      blendedDirectors: [],
      sceneCount: 0,
      pagesSoFar: 0,
      targetPages: 100,
      percentComplete: 0,
      remainingPages: 100,
      scenes: []
    };
  }
  const pagesSoFar = Math.round(current.scenes.reduce((sum, s) => sum + s.pages, 0) * 10) / 10;
  const percentComplete = Math.min(100, Math.round(pagesSoFar / current.targetPages * 100));
  return {
    title: current.title,
    director: current.director,
    blendedDirectors: current.blendedDirectors,
    sceneCount: current.scenes.length,
    pagesSoFar,
    targetPages: current.targetPages,
    percentComplete,
    remainingPages: Math.max(0, Math.round((current.targetPages - pagesSoFar) * 10) / 10),
    scenes: current.scenes.map((s) => ({
      number: s.number,
      slug: s.slug,
      pages: s.pages,
      director: s.director
    }))
  };
}
function toFountain(sp = current) {
  const lines = [];
  lines.push(`Title: ${sp.title}`);
  if (sp.logline) lines.push(`Credit: ${sp.logline}`);
  lines.push("");
  for (const scene of sp.scenes) {
    lines.push(scene.slug);
    lines.push("");
    lines.push(scene.body.trim());
    lines.push("");
  }
  return lines.join("\n");
}
function exportScript(outputDir = join2(process.cwd(), "screenplays")) {
  if (!current) throw new Error("No screenplay in progress. Call new_screenplay first.");
  mkdirSync2(outputDir, { recursive: true });
  const safeTitle = current.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "screenplay";
  const filePath = join2(outputDir, `${safeTitle}.fountain`);
  writeFileSync(filePath, toFountain(current), "utf8");
  return filePath;
}
function getCurrent() {
  return current;
}

// src/index.ts
function findDashViolation(text) {
  if (text.includes("\u2014")) return "an em dash";
  if (text.includes("\u2013")) return "an en dash";
  if (/(?<=\S) - (?=\S)/.test(text)) return "a hyphen used as a separator";
  return null;
}
function createServer() {
  const server = new McpServer(
    {
      name: "skills-movie-mcp",
      title: "Skills Movie Studio",
      version: "1.0.0"
    },
    {
      instructions: "This server exposes the mrfentmen/skills-2 filmmaker + actor personas and a screenplay toolkit for writing long-form (up to ~100 page) movie scripts. Workflow: (1) call list_directors or list_actors to pick a style, (2) read the persona resource skill://<id> to absorb it, (3) call new_screenplay to start, (4) write the script scene-by-scene with add_scene, checking screenplay_status as you go, and (5) call export_script to save the Fountain file. Directors shape the whole approach; actors shape how a single part is inhabited. The host model does all the actual writing \u2014 these tools provide the personas and the assembly scaffold."
    }
  );
  server.registerResource(
    "skill",
    new ResourceTemplate("skill://{id}", {
      list: async () => ({
        resources: listSkills().map((s) => ({
          uri: `skill://${s.id}`,
          name: s.title,
          description: `${s.category}: ${s.identity.slice(0, 160)}`,
          mimeType: "text/markdown"
        }))
      })
    }),
    { mimeType: "text/markdown", title: "A skills-2 persona" },
    async (uri, { id }) => {
      const skill = getSkill(String(id));
      if (!skill) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `No skill named "${id}". Call list_directors or list_skills to see valid ids.`
            }
          ]
        };
      }
      return {
        contents: [{ uri: uri.href, mimeType: "text/markdown", text: skill.raw }]
      };
    }
  );
  server.registerTool(
    "list_directors",
    {
      title: "List director personas",
      description: "List the available filmmaker/director personas (john-woo, wong-kar-wai, tarantino, kubrick, nolan, james-cameron, walt-disney, hitchcock, fincher, kurosawa, spielberg, and more). Returns id, title, and the one-line essence of each. Read skill://<id> for the full persona before writing.",
      inputSchema: z.object({})
    },
    async () => {
      const directors = listSkills("director");
      const lines = directors.map(
        (s) => `- ${s.id} \u2014 ${s.title}: ${s.identity.slice(0, 150)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Available director personas (${directors.length}):

` + (lines.join("\n") || "(none found \u2014 is the skills-2 repo reachable?)\n\nRead any with skill://<id>.") + `

Tip: call list_actors for performer personas, or blend_directors to fuse several.`
          }
        ]
      };
    }
  );
  server.registerTool(
    "list_actors",
    {
      title: "List actor personas",
      description: "List the available actor/performance personas (jackie-chan, daniel-day-lewis, meryl-streep, denzel-washington, al-pacino, brad-pitt, angelina-jolie, tom-hanks, anthony-hopkins). Each is a performance discipline mapped to engineering. Read skill://<id> for the full persona.",
      inputSchema: z.object({})
    },
    async () => {
      const actors = listSkills("actor");
      const lines = actors.map(
        (s) => `- ${s.id} \u2014 ${s.title}: ${s.identity.slice(0, 150)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Available actor personas (${actors.length}):

` + (lines.join("\n") || "(none found \u2014 is the skills-2 repo reachable?)\n\nRead any with skill://<id>.")
          }
        ]
      };
    }
  );
  server.registerTool(
    "list_skills",
    {
      title: "List all persona skills",
      description: "List every persona skill in the skills-2 catalog (all ~180, not only directors). Useful when you want a non-film discipline to shape part of the work.",
      inputSchema: z.object({
        filter: z.string().optional().describe("Case-insensitive substring to filter names/titles by.")
      })
    },
    async ({ filter }) => {
      let skills = listAllSkills();
      if (filter) {
        const f = filter.toLowerCase();
        skills = skills.filter(
          (s) => s.id.includes(f) || s.title.toLowerCase().includes(f) || s.identity.toLowerCase().includes(f)
        );
      }
      const lines = skills.map((s) => `- ${s.id}${s.isFilmmaker ? ` (${s.category})` : ""} \u2014 ${s.title}`);
      return {
        content: [
          { type: "text", text: `Matched ${skills.length} skill(s):

${lines.join("\n") || "(no matches)"}` }
        ]
      };
    }
  );
  server.registerTool(
    "blend_directors",
    {
      title: "Blend director personas",
      description: "Given several director ids, return each persona's core principles stacked together, so the model can write a single film that fuses their techniques (e.g. the parallelism of john-woo with the pacing of sergio-leone). Validates the ids and reports any misses.",
      inputSchema: z.object({
        directorIds: z.array(z.string()).min(1).describe('Director ids to blend, e.g. ["john-woo","nolan"].')
      })
    },
    async ({ directorIds }) => {
      const found = [];
      const missing = [];
      for (const id of directorIds) {
        if (getSkill(id)) found.push(id);
        else missing.push(id);
      }
      const sections = found.map((id) => {
        const s = getSkill(id);
        return `### ${s.title} (skill://${id})
${s.identity}`;
      });
      const parts = [];
      if (sections.length) {
        parts.push(
          `Blend of ${found.length} director(s). Write the film so every scene honors ALL of these at once \u2014 where they conflict, pick the tension deliberately:

` + sections.join("\n\n")
        );
      }
      if (missing.length) {
        parts.push(`
Not found (check list_directors): ${missing.join(", ")}`);
      }
      return { content: [{ type: "text", text: parts.join("\n") || "No valid directors given." }] };
    }
  );
  server.registerTool(
    "new_screenplay",
    {
      title: "Start a new screenplay",
      description: "Begin a new screenplay. Sets the title, logline, the lead director persona, any blended directors, and the target page count (default 100). Resets any script in progress.",
      inputSchema: z.object({
        title: z.string().describe("The film title."),
        logline: z.string().optional().describe("One-sentence premise."),
        director: z.string().optional().describe('Lead director persona id, e.g. "nolan".'),
        blendedDirectors: z.array(z.string()).optional().describe("Additional director ids to fuse in."),
        targetPages: z.number().int().positive().optional().describe("Target page count; default 100.")
      })
    },
    async (args) => {
      const sp = newScreenplay({
        title: args.title,
        logline: args.logline,
        director: args.director,
        blendedDirectors: args.blendedDirectors,
        targetPages: args.targetPages
      });
      return {
        content: [
          {
            type: "text",
            text: `Started screenplay "${sp.title}" targeting ${sp.targetPages} pages.` + (sp.director ? ` Lead director: ${sp.director}.` : "") + (sp.blendedDirectors.length ? ` Blended: ${sp.blendedDirectors.join(", ")}.` : "") + `
Now write it scene by scene with add_scene; check progress with screenplay_status.`
          }
        ]
      };
    }
  );
  server.registerTool(
    "add_scene",
    {
      title: "Add a scene",
      description: 'Append one scene to the screenplay. Provide a Fountain-style slug line (e.g. "INT. WAREHOUSE, NIGHT"), the prose/action/dialogue you wrote, and optionally the director persona guiding the scene. Page count is estimated from length unless you set it. Enforces the absolute no-dashes rule: the body is rejected if it contains an em dash, en dash, or a separator hyphen (compound-word hyphens are fine).',
      inputSchema: z.object({
        slug: z.string().describe('Scene heading, e.g. "EXT. CITY STREET, DAWN".'),
        body: z.string().describe("The scene prose: action and dialogue. No dashes."),
        director: z.string().optional().describe("Director persona id guiding this scene."),
        pages: z.number().optional().describe("Override the estimated page length.")
      })
    },
    async (args) => {
      const violation = findDashViolation(args.body);
      if (violation) {
        return {
          content: [
            {
              type: "text",
              text: `Rejected: the scene body contains ${violation}. The no-dashes rule is absolute: rewrite using a comma, period, semicolon, colon, or parentheses. Compound-word hyphens (hard-boiled) are fine; em dashes, en dashes, and separator hyphens are not.`
            }
          ],
          isError: true
        };
      }
      const scene = addScene({
        slug: args.slug,
        body: args.body,
        director: args.director,
        pages: args.pages
      });
      const st = status();
      return {
        content: [
          {
            type: "text",
            text: `Added scene ${scene.number}: "${scene.slug}" (~${scene.pages} pg). Total: ${st.pagesSoFar}/${st.targetPages} pages (${st.percentComplete}%), ${st.sceneCount} scenes.` + (st.remainingPages > 0 ? ` ~${st.remainingPages} pages to go.` : " Target reached!")
          }
        ]
      };
    }
  );
  server.registerTool(
    "screenplay_status",
    {
      title: "Screenplay status",
      description: "Report the current screenplay: title, director(s), scene count, pages written vs target, percent complete, and a scene-by-scene outline. Call this periodically while writing.",
      inputSchema: z.object({})
    },
    async () => {
      const st = status();
      const outline = st.scenes.map((s) => `${s.number}. ${s.slug} (~${s.pages} pg)`).join("\n");
      const text = `"${st.title}" \u2014 ${st.sceneCount} scenes, ${st.pagesSoFar}/${st.targetPages} pages (${st.percentComplete}%).` + (st.director ? ` Director: ${st.director}.` : "") + (st.blendedDirectors.length ? ` Blended: ${st.blendedDirectors.join(", ")}.` : "") + (outline ? `

Outline:
${outline}` : "\n\n(no scenes yet)");
      return { content: [{ type: "text", text }] };
    }
  );
  server.registerTool(
    "export_script",
    {
      title: "Export screenplay",
      description: "Export the current screenplay to a .fountain file (standard screenplay plain-text) under ./screenplays/. Returns the absolute path written.",
      inputSchema: z.object({
        outputDir: z.string().optional().describe("Directory to write into; defaults to ./screenplays.")
      })
    },
    async ({ outputDir }) => {
      try {
        const path = exportScript(outputDir);
        const sp = getCurrent();
        return {
          content: [
            {
              type: "text",
              text: `Exported "${sp.title}" (${status().pagesSoFar} pages, ${status().sceneCount} scenes) to ${path}`
            }
          ]
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Export failed: ${err.message}` }], isError: true };
      }
    }
  );
  return server;
}
void serveStdio(createServer);
console.error("[skills-movie-mcp] server running on stdio");
