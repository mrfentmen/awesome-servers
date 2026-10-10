// Reusable probe: spawns the built server over stdio and runs the calls you
// pass as JSON. Run from inside the server directory.
//   node _probe.mjs '[["tool_name",{"arg":1}]]'
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

const calls = JSON.parse(process.argv[2] ?? "[]")

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: { ...process.env },
})
const client = new Client({ name: "tool-probe", version: "0.0.1" }, { capabilities: {} })
await client.connect(transport)

const listed = await client.listTools()
console.log(`  tools offered (${listed.tools.length}): ${listed.tools.map((t) => t.name).join(", ")}`)

for (const [name, args] of calls) {
  try {
    const result = await client.callTool({ name, arguments: args ?? {} })
    const text = (result.content ?? []).map((part) => part.text ?? "").join(" ").replace(/\s+/g, " ")
    console.log(`  ${name}\n    isError=${result.isError === true} ${JSON.stringify(text.slice(0, 240))}`)
  } catch (error) {
    console.log(`  ${name}\n    THREW ${error.message}`)
  }
}

await client.close()
