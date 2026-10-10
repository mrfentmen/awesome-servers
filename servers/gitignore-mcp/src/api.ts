const BASE = 'https://www.toptal.com/developers/gitignore/api';
const UA = 'mrfentmen-gitignore-mcp/1.0';

export interface TemplateArgs {
  name: string;
}

export async function template(args: TemplateArgs): Promise<string> {
  const name = (args.name ?? '').trim().toLowerCase();
  if (!name) return 'Provide a template name like node.';
  const res = await fetch(`${BASE}/${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': UA, Accept: 'text/plain' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Toptal gitignore returned ${res.status}`);
  const text = await res.text();
  if (!text.trim() || text.includes('The specified template(s) were not found')) {
    return `No gitignore template "${name}". Try a name like node, python, or java.`;
  }
  const lines = text.split('\n').filter(Boolean);
  return `Gitignore template "${name}" (${lines.length} lines):\n\`\`\`\n${lines.slice(0, 60).join('\n')}\n${lines.length > 60 ? `\n... ${lines.length - 60} more lines` : ''}\n\`\`\``;
}

// ---- muxB tools:
async function rawTemplate(path: string): Promise<string> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { 'User-Agent': UA, Accept: 'text/plain' },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new Error(`Toptal gitignore returned 404 for ${path}`)
  if (!res.ok) throw new Error(`Toptal gitignore returned ${res.status}`)
  const body = await res.text()
  if (!body.trim() || body.includes('The specified template(s) were not found')) {
    throw new Error(`No gitignore template for "${path}". Use list_templates to see the names.`)
  }
  return body
}

