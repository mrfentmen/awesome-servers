import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  LookupError,
  ToolchainMissingError,
  checkToolchain,
  formatResult,
  formatStatus,
  formatSyntaxResult,
  introspect,
  runRubyFile,
} from "./ruby.js";
import type {
  ClassInfo,
  ClassSearch,
  ConstantInfo,
  MethodList,
  MethodRecord,
  MethodSearch,
  RunResult,
  VersionComparison,
  VersionInfo,
} from "./ruby.js";
import { findSample, formatOperatorTable, keywords, meta, samples } from "./data.js";

function text(body: string): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: body }] };
}

function fail(message: string): { content: { type: "text"; text: string }[]; isError: boolean } {
  return { content: [{ type: "text", text: message }], isError: true };
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return `Error: ${e.message}`;
  return `Error: ${String(e)}`;
}

/** A failed lookup is an answer, not a crash; anything else is an error. */
function report(e: unknown, hint?: string): ReturnType<typeof text> | ReturnType<typeof fail> {
  if (e instanceof LookupError) return text(hint ? `${e.message}\n${hint}` : e.message);
  if (e instanceof ToolchainMissingError) return fail(e.message);
  return fail(errorMessage(e));
}

function describeParams(record: MethodRecord): string {
  if (record.parameters.length === 0) return "(none)";
  return record.parameters
    .map((p) => (p.name === null ? p.kind : `${p.kind} ${p.name}`))
    .join(", ");
}

function formatMethodRecord(record: MethodRecord): string {
  const lines = [
    record.signature,
    `  defined in: ${record.owner}`,
    `  kind: ${record.kind} method, visibility: ${record.visibility}`,
    `  implementation: ${record.implementation}${
      record.source_location ? ` (${record.source_location[0]}:${record.source_location[1]})` : ""
    }`,
    `  arity: ${record.arity}${
      record.arity < 0 ? ` (${-record.arity - 1} required argument(s), extras allowed)` : ""
    }`,
    `  parameters: ${describeParams(record)}`,
  ];
  if (record.docs_url !== null) lines.push(`  docs: ${record.docs_url}`);
  return lines.join("\n");
}

function formatClassSummary(entry: { name: string; kind: string; superclass: string | null; instance_methods: number }): string {
  const parent = entry.superclass === null ? "" : ` < ${entry.superclass}`;
  return `  ${entry.kind.padEnd(6)} ${entry.name}${parent}  (${entry.instance_methods} own instance methods)`;
}

function formatVersion(info: VersionInfo): string {
  return [
    `Ruby ${info.ruby_version} (patchlevel ${info.patchlevel})`,
    `  description: ${info.description}`,
    `  engine: ${info.engine} ${info.engine_version}`,
    `  platform: ${info.platform}`,
    `  encodings: external ${info.default_encoding}, internal ${info.internal_encoding}`,
    `  rubylibdir: ${info.rubylibdir}`,
    `  archdir: ${info.archdir}`,
    `  ruby binaries: ${info.bindir}`,
    info.gem_dir === null ? "  rubygems: not available" : `  gem dir: ${info.gem_dir}`,
    info.rubygems === null ? "  rubygems version: unknown" : `  rubygems version: ${info.rubygems}`,
    `  $LOAD_PATH entries: ${info.load_path_entries}`,
    `  core + stdlib modules discoverable: ${info.stdlib_modules_visible}`,
  ].join("\n");
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "ruby-mcp", version: "1.0.0" });

  server.tool(
    "overview",
    "What this server bundles: verified keyword list, operator precedence table, sample programs, and which tools read live data from your installed Ruby.",
    {},
    async () => {
      try {
        const m = meta();
        const status = checkToolchain();
        return text(
          [
            "ruby-mcp - Ruby language reference plus live introspection of your interpreter.",
            "",
            `Bundled data (built with ${m.generated_with}):`,
            `  keywords: ${m.keywords} (verified with Ripper)`,
            `  operator precedence: ${m.precedence_levels} levels, ${m.operator_checks} arithmetic checks`,
            `  sample programs: ${m.samples}`,
            "",
            `Live data (from "${status.bin}", ${status.found ? "available" : "NOT FOUND"}):`,
            "  classes, modules, ancestry, constants and method signatures are read from the",
            "  interpreter at request time, so answers always match the Ruby you actually run.",
            "",
            "Tools: overview, ruby_version, toolchain_status, search_classes, get_class_info,",
            "list_methods, get_method_info, search_methods, get_constant, list_keywords,",
            "get_operator_precedence, list_samples, get_sample, compare_versions, check_syntax, run_code.",
            "",
            `Also bundled: 12-language style docs are not; the canonical docs live at ${m.docs}`,
          ].join("\n"),
        );
      } catch (e) {
        return report(e);
      }
    },
  );

  server.tool(
    "ruby_version",
    "Version, engine, platform, encodings, load-path size and how many stdlib modules the installed interpreter exposes.",
    {},
    async () => {
      try {
        return text(formatVersion(await introspect<VersionInfo>({ op: "version" })));
      } catch (e) {
        return report(e);
      }
    },
  );

  server.tool(
    "toolchain_status",
    "Check whether a Ruby interpreter is reachable. Reports the binary that would be used (RUBY_BIN or `ruby` on PATH) and its version.",
    {},
    async () => {
      try {
        return text(formatStatus(checkToolchain()));
      } catch (e) {
        return report(e);
      }
    },
  );

  server.tool(
    "search_classes",
    "Find core and standard-library classes and modules by (partial) name, with their superclass and method count.",
    {
      query: z.string().describe("Name or fragment, e.g. String, Enumer, Net::HTTP"),
      limit: z.number().int().min(1).max(100).optional().describe("Max results (default 20)."),
      include_gems: z
        .boolean()
        .optional()
        .describe("Include installed gems, not just core and stdlib (default false)."),
    },
    async ({ query, limit, include_gems }) => {
      try {
        const result = await introspect<ClassSearch>({
          op: "search_classes",
          query,
          limit: limit ?? 20,
          include_gems: include_gems ?? false,
        });
        if (result.classes.length === 0) {
          const namespaced = query.includes("::");
          return text(
            `No core or stdlib class or module matches "${query}".` +
              (namespaced
                ? ` Namespaced stdlib only appears once loaded - ask for the exact name instead` +
                  ` (get_class_info with "${query}" tries require for you).`
                : "") +
              (include_gems === true ? "" : " Try include_gems: true to search installed gems."),
          );
        }
        const shown = result.classes.map(formatClassSummary).join("\n");
        return text(
          `${result.total_matches} match(es) for "${query}", showing ${result.classes.length}:\n${shown}`,
        );
      } catch (e) {
        return report(e, "Use search_classes to find a valid name.");
      }
    },
  );

  server.tool(
    "get_class_info",
    "Full picture of one class or module: superclass chain, ancestors, included modules, own method counts and constants.",
    { name: z.string().describe("Exact constant path, e.g. String, Enumerable, Net::HTTP") },
    async ({ name }) => {
      try {
        const info = await introspect<ClassInfo>({ op: "class_info", name });
        const ancestors = info.ancestors.filter((a) => a !== null).join(" < ");
        const counts = Object.entries(info.instance_method_counts)
          .map(([visibility, count]) => `${visibility} ${count}`)
          .join(", ");
        const singleton = Object.entries(info.singleton_method_counts)
          .map(([visibility, count]) => `${visibility} ${count}`)
          .join(", ");
        return text(
          [
            `${info.kind} ${info.name}${info.superclass === null ? "" : ` < ${info.superclass}`}`,
            `  ancestors: ${ancestors}`,
            `  included modules: ${info.included_modules.length === 0 ? "(none)" : info.included_modules.join(", ")}`,
            `  own instance methods: ${counts === "" ? "(none)" : counts}`,
            `  own singleton methods: ${singleton === "" ? "(none)" : singleton}`,
            `  instance methods reachable: ${info.instance_methods_total}`,
            `  constants: ${info.constants.length === 0 ? "(none)" : info.constants.join(", ")}`,
            `  implemented in: ${info.implementation}`,
            `  part of core/stdlib: ${info.stdlib ? "yes" : "no (loaded from a gem or your app)"}`,
            `  docs: ${info.docs_url}`,
            ...(info.loaded_features.length > 0
              ? [`  loaded on demand: require "${info.loaded_features.join('", "')}"`]
              : []),
          ].join("\n"),
        );
      } catch (e) {
        return report(e, "Use search_classes to find a valid class or module name.");
      }
    },
  );

  server.tool(
    "list_methods",
    "List the methods of a class or module, grouped by visibility, with real parameter signatures.",
    {
      name: z.string().describe("Exact constant path, e.g. String, Hash, File"),
      kind: z.enum(["instance", "singleton"]).optional().describe("instance methods (default) or class/module methods."),
      visibility: z
        .enum(["all", "public", "protected", "private"])
        .optional()
        .describe("Restrict to one visibility (default all)."),
      include_inherited: z
        .boolean()
        .optional()
        .describe("Include methods from ancestors (default false: only methods defined here)."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(2000)
        .optional()
        .describe("Max methods shown per visibility group (default 500)."),
    },
    async ({ name, kind, visibility, include_inherited, limit }) => {
      try {
        const result = await introspect<MethodList>({
          op: "list_methods",
          name,
          kind: kind ?? "instance",
          visibility: visibility ?? "all",
          include_inherited: include_inherited ?? false,
          limit: limit ?? 500,
        });
        const groups = Object.entries(result.groups);
        if (result.total === 0) {
          return text(
            `${result.name} has no ${result.kind} methods matching that filter` +
              (include_inherited === true ? "." : " - try include_inherited: true."),
          );
        }
        const blocks = groups
          .filter(([, records]) => records.length > 0)
          .map(([visibilityName, records]) => {
            const lines = records.map((r) => `  ${r.signature}`);
            return `${visibilityName} (${records.length}):\n${lines.join("\n")}`;
          });
        const header =
          `${result.name} - ${result.total} ${result.kind} method(s)` +
          (include_inherited === true ? " including ancestors" : " defined here") +
          (result.shown < result.total ? `, showing ${result.shown}` : "");
        return text([header, "", blocks.join("\n\n")].join("\n"));
      } catch (e) {
        return report(e, "Use search_classes to find a valid class or module name.");
      }
    },
  );

  server.tool(
    "get_method_info",
    "Look up one method: exact signature, parameter list with kinds, arity, where it is defined, and its docs URL.",
    {
      class: z.string().describe("Class or module, e.g. String, Array, File"),
      method: z.string().describe("Method name, e.g. split, each_with_object, []"),
      kind: z
        .enum(["auto", "instance", "singleton"])
        .optional()
        .describe("Force instance or singleton lookup; auto (default) tries instance first."),
    },
    async ({ class: className, method, kind }) => {
      try {
        const record = await introspect<
          MethodRecord & { requested_class: string; method_defined_in_requested_class: boolean }
        >({ op: "method_info", class: className, method, kind: kind ?? "auto" });
        const origin = record.method_defined_in_requested_class
          ? `defined directly in ${record.requested_class}`
          : `inherited from ${record.owner}`;
        return text(`${formatMethodRecord(record)}\n  lookup: ${origin}`);
      } catch (e) {
        return report(e, `Use search_methods to find methods named like "${method}".`);
      }
    },
  );

  server.tool(
    "search_methods",
    "Search method names across every core and stdlib class, or inside one class, and get their real signatures.",
    {
      query: z.string().describe("Part of a method name, e.g. each_slice, to_json, glob"),
      class: z.string().optional().describe("Restrict the search to one class or module."),
      limit: z.number().int().min(1).max(100).optional().describe("Max matches (default 15)."),
      include_gems: z
        .boolean()
        .optional()
        .describe("Search installed gems as well (default false)."),
    },
    async ({ query, class: className, limit, include_gems }) => {
      try {
        const result = await introspect<MethodSearch>({
          op: "search_methods",
          query,
          class: className ?? "",
          limit: limit ?? 15,
          include_gems: include_gems ?? false,
        });
        if (result.matches.length === 0) {
          const where = result.class === null ? "core or stdlib" : result.class;
          return text(`No method in ${where} matches "${query}" (searched ${result.searched_classes} classes).`);
        }
        const lines = result.matches.map(
          (m) => `  ${m.signature}  [${m.owner}, ${m.visibility}, ${m.implementation}]`,
        );
        return text(
          `${result.matches.length} method(s) matching "${query}" (searched ${result.searched_classes} classes):\n${lines.join("\n")}`,
        );
      } catch (e) {
        return report(e);
      }
    },
  );

  server.tool(
    "get_constant",
    "Resolve a constant (class, module or plain value) and show what it actually is, plus where it is defined.",
    { path: z.string().describe("Constant path, e.g. RUBY_VERSION, Math::PI, File::SEPARATOR") },
    async ({ path }) => {
      try {
        const info = await introspect<ConstantInfo>({ op: "constant", path });
        const lines = [
          `${info.path} = ${info.inspect}`,
          `  type: ${info.type}`,
          `  frozen: ${info.frozen === null ? "unknown" : String(info.frozen)}`,
          `  defined in: ${
            info.source_location === null ? "the C core" : `${info.source_location[0]}:${info.source_location[1]}`
          }`,
        ];
        if (info.docs_url !== null) lines.push(`  docs: ${info.docs_url}`);
        return text(lines.join("\n"));
      } catch (e) {
        return report(e);
      }
    },
  );

  server.tool(
    "list_keywords",
    "List Ruby's reserved keywords (each one verified by the Ripper lexer at build time), optionally filtered by kind.",
    {
      kind: z
        .enum(["all", "keyword", "pseudo_variable"])
        .optional()
        .describe("keyword for reserved words, pseudo_variable for __FILE__/__LINE__/__ENCODING__."),
    },
    async ({ kind }) => {
      try {
        const wanted = kind ?? "all";
        const list = keywords().filter((k) => wanted === "all" || k.kind === wanted);
        if (list.length === 0) {
          return text(`No keywords of kind "${wanted}".`);
        }
        const groups = new Map<string, string[]>();
        for (const entry of list) {
          const bucket = groups.get(entry.kind) ?? [];
          bucket.push(entry.word);
          groups.set(entry.kind, bucket);
        }
        const blocks = [...groups.entries()].map(
          ([groupKind, words]) => `${groupKind} (${words.length}):\n  ${words.join(", ")}`,
        );
        return text(`${list.length} entries:\n\n${blocks.join("\n\n")}`);
      } catch (e) {
        return report(e);
      }
    },
  );

  server.tool(
    "get_operator_precedence",
    "Ruby's operator precedence table, tightest binding first, with the associativity notes that trip people up.",
    {},
    async () => {
      try {
        return text(formatOperatorTable());
      } catch (e) {
        return report(e);
      }
    },
  );

  server.tool(
    "list_samples",
    "List the bundled sample programs. Each one is executed during the build, so the stored output is real.",
    {},
    async () => {
      try {
        const list = samples();
        if (list.length === 0) return text("No samples in the bundled data.");
        const lines = list.map(
          (s) =>
            `  ${s.name.padEnd(24)} ${s.code.split("\n").length.toString().padStart(4)} lines  ${s.path}  (exit ${s.exit_code})`,
        );
        return text(`${list.length} runnable sample programs:\n${lines.join("\n")}`);
      } catch (e) {
        return report(e);
      }
    },
  );

  server.tool(
    "get_sample",
    "Return one sample program's source, plus the output it really produced when the data was built.",
    {
      name: z.string().describe("Sample name with or without .rb, e.g. 05_blocks or 05_blocks.rb"),
      include_output: z.boolean().optional().describe("Include the recorded stdout (default true)."),
    },
    async ({ name, include_output }) => {
      try {
        const sample = findSample(name);
        if (!sample) {
          return text(
            `No sample matches "${name}". Available: ${samples()
              .map((s) => s.name)
              .join(", ")}.`,
          );
        }
        const parts = [`${sample.name} (${sample.bytes} bytes, ${sample.code.split("\n").length} lines)`, "", "```ruby", sample.code.trimEnd(), "```"];
        if (include_output !== false) {
          parts.push("", `Recorded output (exit ${sample.exit_code}):`, "```", sample.stdout.trimEnd() || "(no output)", "```");
          if (sample.stderr.trim() !== "") {
            parts.push("stderr:", "```", sample.stderr.trimEnd(), "```");
          }
        }
        return text(parts.join("\n"));
      } catch (e) {
        return report(e);
      }
    },
  );

  server.tool(
    "compare_versions",
    "Compare two version strings the way Ruby's Gem::Version does, including prerelease suffixes and segment counts.",
    {
      a: z.string().describe("First version, e.g. 1.2.0"),
      b: z.string().describe("Second version, e.g. 1.10.0.pre"),
    },
    async ({ a, b }) => {
      try {
        const result = await introspect<VersionComparison>({ op: "compare_versions", a, b });
        const symbol = result.comparison === 0 ? "==" : result.comparison > 0 ? ">" : "<";
        return text(
          [
            `${result.a.input}  ${symbol}  ${result.b.input}`,
            `  a normalized: ${result.a.normalized} segments ${JSON.stringify(result.a.segments)}`,
            `  b normalized: ${result.b.normalized} segments ${JSON.stringify(result.b.segments)}`,
            `  result: ${result.comparison} (${result.relation})`,
            `  prerelease: a=${String(result.prerelease.a)} b=${String(result.prerelease.b)}`,
          ].join("\n"),
        );
      } catch (e) {
        return report(e);
      }
    },
  );

  server.tool(
    "check_syntax",
    "Parse Ruby source without running it. Returns whether it is valid and the exact error with line and column if not.",
    { code: z.string().min(1).describe("Ruby source to parse.") },
    async ({ code }) => {
      try {
        const result: RunResult = await runRubyFile({ code, checkOnly: true, timeoutMs: 10000 });
        return text(formatSyntaxResult(result));
      } catch (e) {
        return report(e);
      }
    },
  );

  server.tool(
    "run_code",
    "Run Ruby source with the locally installed interpreter in a temporary directory and return exit status, stdout and stderr. Requires Ruby (see toolchain_status). Times out after 10s by default.",
    {
      code: z.string().min(1).describe("Complete Ruby program to run."),
      args: z.array(z.string()).optional().describe("Arguments passed to the program as ARGV."),
      timeoutMs: z
        .number()
        .int()
        .min(100)
        .max(60000)
        .optional()
        .describe("Kill the process after this many milliseconds. Default 10000, max 60000."),
    },
    async ({ code, args, timeoutMs }) => {
      try {
        const result = await runRubyFile({
          code,
          ...(args ? { args } : {}),
          ...(timeoutMs !== undefined ? { timeoutMs } : {}),
        });
        return text(formatResult(result));
      } catch (e) {
        return report(e);
      }
    },
  );

  return server;
}
