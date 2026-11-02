import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { keywords, meta, operatorRows, samples } from "../dist/data.js";

const COMPILED_WITH = meta().ruby_version;
const rubyAvailable = spawnSync("ruby", ["-e", "print RUBY_VERSION"], { encoding: "utf8" }).status === 0;
const runningVersion = rubyAvailable
  ? spawnSync("ruby", ["-e", "print RUBY_VERSION"], { encoding: "utf8" }).stdout.trim()
  : null;

test("bundled keywords are real Ruby keywords", () => {
  const words = keywords().map((k) => k.word);
  assert.equal(words.length, meta().keywords);
  for (const expected of ["def", "end", "yield", "unless", "ensure", "self", "in", "defined?"]) {
    assert.ok(words.includes(expected), `missing keyword ${expected}`);
  }
  // Words that are definitely not Ruby keywords must not appear.
  for (const bogus of ["function", "fn", "let", "var", "elif", "new"]) {
    assert.ok(!words.includes(bogus), `bogus keyword ${bogus} present`);
  }
  const pseudo = keywords().filter((k) => k.kind === "pseudo_variable").map((k) => k.word);
  assert.deepEqual(pseudo.sort(), ["__ENCODING__", "__FILE__", "__LINE__"]);
});

test("operator table is ordered from tightest to loosest", () => {
  const rows = operatorRows();
  assert.equal(rows.length, meta().precedence_levels);
  assert.deepEqual(
    rows.map((r) => r.level),
    Array.from({ length: rows.length }, (_, i) => i + 1),
  );
  assert.ok(rows[1].operators.includes("**"), "level 2 should be exponentiation");
  assert.ok(rows.some((r) => r.operators.includes("&&")));
  assert.ok(rows.at(-1).operators.some((op) => op.includes("if")), "last level is modifier if");
  assert.ok(meta().operator_checks >= 10);
});

test("every bundled sample is real, runnable Ruby", () => {
  const list = samples();
  assert.equal(list.length, meta().samples);
  assert.equal(new Set(list.map((s) => s.name)).size, list.length, "sample names are unique");
  for (const sample of list) {
    assert.equal(sample.exit_code, 0, `${sample.name} recorded a non-zero exit`);
    assert.equal(sample.stderr, "", `${sample.name} recorded stderr`);
    assert.ok(sample.stdout.trim().length > 0, `${sample.name} recorded no output`);
    assert.ok(sample.code.length > 100, `${sample.name} looks too small to be a real program`);
  }
});

test("bundled samples still run on this machine", { skip: !rubyAvailable }, () => {
  for (const sample of samples()) {
    const result = spawnSync("ruby", ["-e", sample.code], { encoding: "utf8", timeout: 20000 });
    assert.equal(result.status, 0, `${sample.name} failed: ${result.stderr}`);
    assert.equal(result.stderr, "", `${sample.name} wrote to stderr: ${result.stderr}`);
    if (runningVersion === COMPILED_WITH) {
      assert.equal(result.stdout, sample.stdout, `${sample.name} output changed on this interpreter`);
    }
  }
});

/** Minimal MCP client used to exercise the shipped stdio server. */
async function withClient(run) {
  const transport = new StdioClientTransport({ command: "node", args: ["dist/index.js"] });
  const client = new Client({ name: "ruby-mcp-tests", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  try {
    return await run(client);
  } finally {
    await client.close();
  }
}

async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  const first = result.content?.[0];
  assert.ok(first && first.type === "text", `${name} returned no text content`);
  return { text: first.text, isError: result.isError === true };
}

test("server exposes the full tool set", async () => {
  await withClient(async (client) => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    assert.deepEqual(names, [
      "check_syntax",
      "compare_versions",
      "get_class_info",
      "get_constant",
      "get_method_info",
      "get_operator_precedence",
      "get_sample",
      "list_keywords",
      "list_methods",
      "list_samples",
      "overview",
      "ruby_version",
      "run_code",
      "search_classes",
      "search_methods",
      "toolchain_status",
    ]);
    for (const tool of tools) {
      assert.ok(tool.description && tool.description.length > 20, `${tool.name} needs a description`);
    }
  });
});

test("offline tools work without touching the interpreter", async () => {
  await withClient(async (client) => {
    const overview = await call(client, "overview");
    assert.equal(overview.isError, false);
    assert.match(overview.text, /keywords: 41/);
    assert.match(overview.text, /sample programs: 14/);

    const table = await call(client, "get_operator_precedence");
    assert.match(table.text, /tightest binding first/);
    assert.match(table.text, /\*\*/);

    const list = await call(client, "list_samples");
    assert.match(list.text, /14 runnable sample programs/);

    const sample = await call(client, "get_sample", { name: "05_blocks" });
    assert.match(sample.text, /```ruby/);
    assert.match(sample.text, /lambda/);
    assert.match(sample.text, /Recorded output/);

    const missing = await call(client, "get_sample", { name: "does_not_exist" });
    assert.match(missing.text, /No sample matches/);

    const filtered = await call(client, "list_keywords", { kind: "pseudo_variable" });
    assert.match(filtered.text, /__FILE__/);
    assert.ok(!filtered.text.includes(" begin,"), "filtered list should not include plain keywords");
  });
});

test("live introspection of the installed Ruby", { skip: !rubyAvailable }, async () => {
  await withClient(async (client) => {
    const version = await call(client, "ruby_version");
    assert.equal(version.isError, false);
    assert.match(version.text, /^Ruby \d+\.\d+/);
    assert.match(version.text, /core \+ stdlib modules discoverable: \d+/);

    const classes = await call(client, "search_classes", { query: "Enumer" });
    assert.match(classes.text, /Enumerable/);
    assert.match(classes.text, /Enumerator/);

    const info = await call(client, "get_class_info", { name: "Array" });
    assert.match(info.text, /class Array < Object/);
    assert.match(info.text, /included modules: .*Enumerable/);

    const method = await call(client, "get_method_info", { class: "String", method: "split" });
    assert.match(method.text, /String#split/);
    assert.match(method.text, /defined in: String/);
    assert.match(method.text, /arity: -1/);

    const singleton = await call(client, "get_method_info", { class: "File", method: "join", kind: "singleton" });
    assert.match(singleton.text, /File\.join/);

    const listed = await call(client, "list_methods", { name: "Hash", kind: "singleton", limit: 40 });
    assert.match(listed.text, /Hash - \d+ singleton method/);
    assert.match(listed.text, /Hash\.\[\]/);

    const inherited = await call(client, "list_methods", {
      name: "Hash",
      kind: "singleton",
      include_inherited: true,
      limit: 40,
    });
    assert.match(inherited.text, /including ancestors/);
    assert.match(inherited.text, /Hash\.\[/);

    // Hash.new comes from Class, so a singleton lookup has to walk the ancestry.
    const inheritedNew = await call(client, "get_method_info", { class: "Hash", method: "new", kind: "singleton" });
    assert.match(inheritedNew.text, /Hash\.new/);
    assert.match(inheritedNew.text, /inherited from Class/);

    const searched = await call(client, "search_methods", { query: "each_slice" });
    assert.match(searched.text, /Enumerable#each_slice/);

    // Namespaced stdlib needs its require first; the server does that on demand.
    const namespaced = await call(client, "get_class_info", { name: "Net::HTTP" });
    assert.match(namespaced.text, /class Net::HTTP < Net::Protocol/);
    assert.match(namespaced.text, /loaded on demand: require "net\/http"/);

    const partial = await call(client, "search_classes", { query: "Net::H" });
    assert.match(partial.text, /ask for the exact name instead/);

    const constant = await call(client, "get_constant", { path: "Math::PI" });
    assert.match(constant.text, /Math::PI = 3\.14/);
    assert.match(constant.text, /type: Float/);

    const compare = await call(client, "compare_versions", { a: "1.2.0", b: "1.10.0" });
    assert.match(compare.text, /1\.2\.0 {2}< {2}1\.10\.0/);
    assert.match(compare.text, /b is newer/);

    const prerelease = await call(client, "compare_versions", { a: "2.0.0.rc1", b: "1.9.9" });
    assert.match(prerelease.text, /a is newer/);
  });
});

test("lookup failures are answers, not crashes", { skip: !rubyAvailable }, async () => {
  await withClient(async (client) => {
    const noClass = await call(client, "get_class_info", { name: "NoSuchClassExists" });
    assert.match(noClass.text, /No constant NoSuchClassExists/);

    const noMethod = await call(client, "get_method_info", { class: "Array", method: "definitely_not_a_method" });
    assert.match(noMethod.text, /has no (?:instance |singleton )?method named definitely_not_a_method/);

    const badVersion = await call(client, "compare_versions", { a: "not-a-version", b: "1.0.0" });
    assert.match(badVersion.text, /not a valid Gem::Version/);
  });
});

test("code execution and syntax checking", { skip: !rubyAvailable }, async () => {
  await withClient(async (client) => {
    const ran = await call(client, "run_code", { code: "puts [1, 2, 3].sum" });
    assert.equal(ran.isError, false);
    assert.match(ran.text, /exit 0/);
    assert.match(ran.text, /stdout:\n6/);

    const withArgs = await call(client, "run_code", {
      code: "puts ARGV.inspect",
      args: ["a", "b"],
    });
    assert.match(withArgs.text, /\["a", "b"\]/);

    const failed = await call(client, "run_code", { code: "raise 'kaboom'" });
    assert.match(failed.text, /exit 1/);
    assert.match(failed.text, /kaboom/);

    const ok = await call(client, "check_syntax", { code: "def ok(a) = a + 1" });
    assert.equal(ok.isError, false);

    const broken = await call(client, "check_syntax", { code: "def broken(\n" });
    assert.match(broken.text, /Syntax error/);
    assert.match(broken.text, /main\.rb:1/);
  });
});
